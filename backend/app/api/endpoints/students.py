# backend/app/api/endpoints/students.py

"""
Endpoints para gestión de estudiantes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from uuid import UUID

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.academic import Group, GroupMembership, Subject
from app.api.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/")
async def list_students(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar estudiantes (solo profesores)"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can access this")
    
    query = db.query(User).filter(User.role == UserRole.STUDENT, User.is_active == True)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )
    
    students = query.offset(skip).limit(limit).all()
    result = []
    
    for student in students:
        # Contar grupos activos
        active_groups = db.query(GroupMembership).filter(
            GroupMembership.student_id == student.id,
            GroupMembership.is_active == True
        ).count()
        
        result.append({
            "id": str(student.id),
            "first_name": student.first_name,
            "last_name": student.last_name,
            "email": student.email,
            "full_name": f"{student.first_name} {student.last_name}",
            "enrolled_groups": active_groups
        })
    
    return {
        "total": len(result),
        "students": result
    }


@router.get("/{student_id}")
async def get_student_detail(
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener detalles de un estudiante"""
    # Verificar permisos
    if current_user.role == UserRole.STUDENT and str(current_user.id) != str(student_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student = db.query(User).filter(
        User.id == student_id,
        User.role == UserRole.STUDENT
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Obtener grupos y asignaturas
    memberships = db.query(GroupMembership).filter(
        GroupMembership.student_id == student_id,
        GroupMembership.is_active == True
    ).all()
    
    groups = []
    subjects = []
    seen_subjects = set()
    
    for membership in memberships:
        group = membership.group
        subject = group.subject
        
        groups.append({
            "id": str(group.id),
            "name": group.name,
            "code": group.code,
            "subject_name": subject.name,
            "schedule_day": group.schedule_day,
            "schedule_time": str(group.schedule_time) if group.schedule_time else None
        })
        
        if str(subject.id) not in seen_subjects:
            subjects.append({
                "id": str(subject.id),
                "name": subject.name,
                "code": subject.code,
                "credits": subject.credits
            })
            seen_subjects.add(str(subject.id))
    
    return {
        "id": str(student.id),
        "first_name": student.first_name,
        "last_name": student.last_name,
        "email": student.email,
        "full_name": f"{student.first_name} {student.last_name}",
        "groups": groups,
        "subjects": subjects,
        "total_groups": len(groups),
        "total_subjects": len(subjects)
    }


@router.get("/{student_id}/enrollment")
async def get_student_enrollment_info(
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener información de matrícula completa del estudiante"""
    
    # Obtener estudiante primero
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Verificar permisos
    if current_user.role == UserRole.STUDENT and str(current_user.id) != str(student_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    elif current_user.role == UserRole.TEACHER:
        # Verificar que el estudiante esté en algún grupo del profesor
        has_access = db.query(GroupMembership).join(Group).join(Subject).filter(
            GroupMembership.student_id == student_id,
            Subject.teacher_id == current_user.id,
            GroupMembership.is_active == True
        ).first()
        
        # Si no tiene acceso, devolver datos limitados en vez de error 403
        if not has_access:
            return {
                "id": str(student.id),
                "name": f"{student.first_name} {student.last_name}",
                "email": student.email,
                "groups": [],
                "subjects": [],
                "sessions": [],
                "total_sessions": 0,
                "average_attention": 0
            }
    
    # Obtener información detallada
    memberships = db.query(GroupMembership).join(Group).join(Subject).filter(
        GroupMembership.student_id == student_id,
        GroupMembership.is_active == True
    ).all()
    
    groups_info = []
    subjects_info = {}
    
    for membership in memberships:
        group = membership.group
        subject = group.subject
        
        # Información del grupo
        groups_info.append({
            "id": str(group.id),
            "name": group.name,
            "code": group.code,
            "subject_id": str(subject.id),
            "subject_name": subject.name,
            "subject_code": subject.code,
            "schedule_day": group.schedule_day,
            "schedule_time": str(group.schedule_time) if group.schedule_time else None,
            "classroom": group.classroom,
            "enrolled_at": membership.enrolled_at
        })
        
        # Agregar subject si no existe
        if str(subject.id) not in subjects_info:
            subjects_info[str(subject.id)] = {
                "id": str(subject.id),
                "name": subject.name,
                "code": subject.code,
                "credits": subject.credits,
                "teacher_name": f"{subject.teacher.first_name} {subject.teacher.last_name}" if subject.teacher else None,
                "groups": []
            }
        
        subjects_info[str(subject.id)]["groups"].append(group.code)
    
    return {
        "id": str(student_id),
        "name": f"{student.first_name} {student.last_name}",
        "email": student.email,
        "groups": groups_info,
        "subjects": list(subjects_info.values()),
        "sessions": [],  # Por ahora vacío
        "total_sessions": 0,
        "average_attention": 0
    }
