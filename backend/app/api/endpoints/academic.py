# backend/app/api/endpoints/academic.py
"""
Endpoints API para gestión académica (Asignaturas y Grupos)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.academic import Subject, Group, GroupMembership
from app.models.metrics import ClassSession, SessionAttendance, AttentionMetric, SessionStatus
from app.schemas.academic import (
    SubjectCreate, SubjectUpdate, SubjectResponse, SubjectWithStats,
    GroupCreate, GroupUpdate, GroupResponse, GroupWithStudents, GroupWithStats,
    GroupMembershipCreate, GroupMembershipBulkCreate, GroupMembershipResponse,
    StudentEnrollmentInfo, TeacherDashboardStats, GroupStatistics
)
from app.api.endpoints.auth import get_current_user

router = APIRouter()

# ==================== SUBJECT ENDPOINTS ====================

@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    subject_data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear nueva asignatura (solo profesores)"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can create subjects")
    
    # Verificar que el código no exista
    existing = db.query(Subject).filter(Subject.code == subject_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Subject with code {subject_data.code} already exists")
    
    # Si no se especifica teacher_id, asignar al usuario actual
    if not subject_data.teacher_id:
        subject_data.teacher_id = current_user.id
    
    subject = Subject(**subject_data.dict())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    
    return SubjectResponse(
        **subject.__dict__,
        teacher_name=f"{subject.teacher.first_name} {subject.teacher.last_name}" if subject.teacher else None,
        total_groups=0,
        total_students=0
    )

@router.get("/subjects", response_model=List[SubjectResponse])
async def list_subjects(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    teacher_id: Optional[UUID] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar asignaturas con filtros"""
    query = db.query(Subject)
    
    # Filtros
    if is_active is not None:
        query = query.filter(Subject.is_active == is_active)
    
    if teacher_id:
        query = query.filter(Subject.teacher_id == teacher_id)
    elif current_user.role == UserRole.TEACHER:
        # Profesores solo ven sus asignaturas
        query = query.filter(Subject.teacher_id == current_user.id)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Subject.name.ilike(search_term)) | 
            (Subject.code.ilike(search_term))
        )
    
    subjects = query.offset(skip).limit(limit).all()
    
    # Enriquecer con estadísticas
    result = []
    for subject in subjects:
        total_groups = len(subject.groups)
        total_students = sum(g.current_students_count for g in subject.groups)
        
        result.append(SubjectResponse(
            **subject.__dict__,
            teacher_name=f"{subject.teacher.first_name} {subject.teacher.last_name}" if subject.teacher else None,
            total_groups=total_groups,
            total_students=total_students
        ))
    
    return result

@router.get("/subjects/{subject_id}", response_model=SubjectWithStats)
async def get_subject(
    subject_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener detalles de una asignatura"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Verificar permisos
    if current_user.role == UserRole.TEACHER and str(subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calcular estadísticas
    total_groups = len(subject.groups)
    total_students = sum(g.current_students_count for g in subject.groups)
    
    # Sesiones completadas
    sessions = db.query(ClassSession).join(Group).filter(
        Group.subject_id == subject_id,
        ClassSession.status == SessionStatus.COMPLETED
    ).all()
    
    total_sessions = len(sessions)
    avg_attention = sum(s.average_attention_score or 0 for s in sessions) / total_sessions if total_sessions > 0 else None
    
    # Sesiones activas
    active_sessions = db.query(ClassSession).join(Group).filter(
        Group.subject_id == subject_id,
        ClassSession.status == SessionStatus.ACTIVE
    ).count()
    
    return SubjectWithStats(
        **subject.__dict__,
        teacher_name=f"{subject.teacher.first_name} {subject.teacher.last_name}" if subject.teacher else None,
        total_groups=total_groups,
        total_students=total_students,
        average_attention_score=avg_attention,
        total_sessions=total_sessions,
        active_sessions=active_sessions
    )

@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: UUID,
    subject_data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar asignatura"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    if current_user.role != UserRole.TEACHER or str(subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Actualizar campos
    for field, value in subject_data.dict(exclude_unset=True).items():
        setattr(subject, field, value)
    
    subject.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(subject)
    
    return SubjectResponse(
        **subject.__dict__,
        teacher_name=f"{subject.teacher.first_name} {subject.teacher.last_name}" if subject.teacher else None,
        total_groups=len(subject.groups),
        total_students=sum(g.current_students_count for g in subject.groups)
    )

@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar asignatura (soft delete)"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    if current_user.role != UserRole.TEACHER or str(subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    subject.is_active = False
    db.commit()

# ==================== GROUP ENDPOINTS ====================

@router.post("/groups", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear nuevo grupo (solo profesores)"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can create groups")
    
    # Verificar que la asignatura existe y pertenece al profesor
    subject = db.query(Subject).filter(Subject.id == group_data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    if str(subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized for this subject")
    
    # Verificar que el código no exista en esta asignatura
    existing = db.query(Group).filter(
        Group.subject_id == group_data.subject_id,
        Group.code == group_data.code
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Group with code {group_data.code} already exists in this subject")
    
    group = Group(
        **group_data.dict(),
        created_by=current_user.id
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    
    return GroupResponse(
        **group.__dict__,
        subject_name=subject.name,
        subject_code=subject.code,
        current_students_count=0,
        is_full=False
    )

@router.get("/groups", response_model=List[GroupResponse])
async def list_groups(
    subject_id: Optional[UUID] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar grupos con filtros"""
    query = db.query(Group).join(Subject)
    
    # Filtros
    if subject_id:
        query = query.filter(Group.subject_id == subject_id)
    
    if is_active is not None:
        query = query.filter(Group.is_active == is_active)
    
    # Profesores solo ven sus grupos
    if current_user.role == UserRole.TEACHER:
        query = query.filter(Subject.teacher_id == current_user.id)
    elif current_user.role == UserRole.STUDENT:
        # Estudiantes solo ven grupos en los que están matriculados
        query = query.join(GroupMembership).filter(
            GroupMembership.student_id == current_user.id,
            GroupMembership.is_active == True
        )
    
    groups = query.offset(skip).limit(limit).all()
    
    result = []
    for group in groups:
        result.append(GroupResponse(
            **group.__dict__,
            subject_name=group.subject.name,
            subject_code=group.subject.code,
            current_students_count=group.current_students_count,
            is_full=group.is_full
        ))
    
    return result

@router.get("/groups/{group_id}", response_model=GroupWithStudents)
async def get_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener detalles de un grupo con lista de estudiantes"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Verificar permisos
    if current_user.role == UserRole.TEACHER:
        if str(group.subject.teacher_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.STUDENT:
        membership = db.query(GroupMembership).filter(
            GroupMembership.group_id == group_id,
            GroupMembership.student_id == current_user.id,
            GroupMembership.is_active == True
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Not enrolled in this group")
    
    # Obtener estudiantes
    memberships = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.is_active == True
    ).all()
    
    students = []
    for membership in memberships:
        student = membership.student
        students.append({
            "id": str(student.id),
            "name": f"{student.first_name} {student.last_name}",
            "email": student.email,
            "enrolled_at": membership.enrolled_at
        })
    
    return GroupWithStudents(
        **group.__dict__,
        subject_name=group.subject.name,
        subject_code=group.subject.code,
        current_students_count=len(students),
        is_full=group.is_full,
        students=students
    )

@router.get("/groups/{group_id}/stats", response_model=GroupStatistics)
async def get_group_statistics(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener estadísticas de un grupo"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Verificar permisos
    if current_user.role == UserRole.TEACHER and str(group.subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Estadísticas generales
    total_students = group.current_students_count
    
    sessions = db.query(ClassSession).filter(
        ClassSession.group_id == group_id,
        ClassSession.status == SessionStatus.COMPLETED
    ).all()
    
    total_sessions = len(sessions)
    avg_attention = sum(s.average_attention_score or 0 for s in sessions) / total_sessions if total_sessions > 0 else None
    
    # Tasa de asistencia
    if total_sessions > 0:
        total_attendance = sum(s.total_students_present for s in sessions)
        expected_attendance = total_sessions * total_students
        attendance_rate = (total_attendance / expected_attendance * 100) if expected_attendance > 0 else 0
    else:
        attendance_rate = 0
    
    # Estudiantes más atentos
    most_attentive = db.query(
        User.id,
        User.first_name,
        User.last_name,
        func.avg(SessionAttendance.average_attention_score).label('avg_score')
    ).join(SessionAttendance).join(ClassSession).filter(
        ClassSession.group_id == group_id,
        SessionAttendance.average_attention_score.isnot(None)
    ).group_by(User.id, User.first_name, User.last_name).order_by(
        func.avg(SessionAttendance.average_attention_score).desc()
    ).limit(5).all()
    
    most_attentive_students = [
        {
            "id": str(student.id),
            "name": f"{student.first_name} {student.last_name}",
            "average_score": round(student.avg_score, 2)
        }
        for student in most_attentive
    ]
    
    # Estudiantes que necesitan atención
    needs_attention = db.query(
        User.id,
        User.first_name,
        User.last_name,
        func.avg(SessionAttendance.average_attention_score).label('avg_score')
    ).join(SessionAttendance).join(ClassSession).filter(
        ClassSession.group_id == group_id,
        SessionAttendance.average_attention_score.isnot(None)
    ).group_by(User.id, User.first_name, User.last_name).having(
        func.avg(SessionAttendance.average_attention_score) < 60
    ).order_by(
        func.avg(SessionAttendance.average_attention_score).asc()
    ).limit(5).all()
    
    needs_attention_students = [
        {
            "id": str(student.id),
            "name": f"{student.first_name} {student.last_name}",
            "average_score": round(student.avg_score, 2)
        }
        for student in needs_attention
    ]
    
    return GroupStatistics(
        group_id=group_id,
        group_name=group.name,
        total_students=total_students,
        total_sessions=total_sessions,
        average_attention_score=avg_attention,
        attendance_rate=attendance_rate,
        most_attentive_students=most_attentive_students,
        needs_attention_students=needs_attention_students
    )

# ==================== GROUP MEMBERSHIP ENDPOINTS ====================

@router.post("/groups/{group_id}/enroll", response_model=GroupMembershipResponse, status_code=status.HTTP_201_CREATED)
async def enroll_student(
    group_id: UUID,
    membership_data: GroupMembershipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Matricular un estudiante en un grupo"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can enroll students")
    
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if str(group.subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verificar que el estudiante existe
    student = db.query(User).filter(User.id == membership_data.student_id, User.role == UserRole.STUDENT).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Verificar si ya está matriculado
    existing = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.student_id == membership_data.student_id
    ).first()
    
    if existing and existing.is_active:
        raise HTTPException(status_code=400, detail="Student already enrolled in this group")
    
    # Verificar capacidad
    if group.is_full:
        raise HTTPException(status_code=400, detail="Group is full")
    
    # Crear o reactivar membresía
    if existing:
        existing.is_active = True
        existing.enrolled_at = datetime.utcnow()
        existing.unenrolled_at = None
        membership = existing
    else:
        membership = GroupMembership(
            group_id=group_id,
            student_id=membership_data.student_id,
            enrolled_by=current_user.id
        )
        db.add(membership)
    
    db.commit()
    db.refresh(membership)
    
    return GroupMembershipResponse(
        **membership.__dict__,
        student_name=f"{student.first_name} {student.last_name}",
        student_email=student.email
    )

@router.post("/groups/{group_id}/enroll-bulk", status_code=status.HTTP_201_CREATED)
async def enroll_students_bulk(
    group_id: UUID,
    membership_data: GroupMembershipBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Matricular múltiples estudiantes en un grupo"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can enroll students")
    
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if str(group.subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    enrolled = []
    errors = []
    
    for student_id in membership_data.student_ids:
        try:
            student = db.query(User).filter(User.id == student_id, User.role == UserRole.STUDENT).first()
            if not student:
                errors.append({"student_id": str(student_id), "error": "Student not found"})
                continue
            
            existing = db.query(GroupMembership).filter(
                GroupMembership.group_id == group_id,
                GroupMembership.student_id == student_id
            ).first()
            
            if existing and existing.is_active:
                errors.append({"student_id": str(student_id), "error": "Already enrolled"})
                continue
            
            if group.is_full:
                errors.append({"student_id": str(student_id), "error": "Group is full"})
                continue
            
            if existing:
                existing.is_active = True
                existing.enrolled_at = datetime.utcnow()
                existing.unenrolled_at = None
            else:
                membership = GroupMembership(
                    group_id=group_id,
                    student_id=student_id,
                    enrolled_by=current_user.id
                )
                db.add(membership)
            
            enrolled.append(str(student_id))
            
        except Exception as e:
            errors.append({"student_id": str(student_id), "error": str(e)})
    
    db.commit()
    
    return {
        "enrolled_count": len(enrolled),
        "enrolled_students": enrolled,
        "errors": errors
    }

@router.delete("/groups/{group_id}/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unenroll_student(
    group_id: UUID,
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Desmatricular un estudiante de un grupo"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can unenroll students")
    
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if str(group.subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.student_id == student_id,
        GroupMembership.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Student not enrolled in this group")
    
    membership.is_active = False
    membership.unenrolled_at = datetime.utcnow()
    db.commit()

# ==================== DASHBOARD STATS ====================

@router.get("/dashboard/teacher/stats", response_model=TeacherDashboardStats)
async def get_teacher_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener estadísticas del dashboard del profesor"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can access this")
    
    # Contar asignaturas
    total_subjects = db.query(Subject).filter(
        Subject.teacher_id == current_user.id,
        Subject.is_active == True
    ).count()
    
    # Contar grupos
    total_groups = db.query(Group).join(Subject).filter(
        Subject.teacher_id == current_user.id,
        Group.is_active == True
    ).count()
    
    # Contar estudiantes únicos
    total_students = db.query(func.count(func.distinct(GroupMembership.student_id))).join(Group).join(Subject).filter(
        Subject.teacher_id == current_user.id,
        GroupMembership.is_active == True
    ).scalar() or 0
    
    # Sesiones activas
    active_sessions = db.query(ClassSession).join(Group).join(Subject).filter(
        Subject.teacher_id == current_user.id,
        ClassSession.status == SessionStatus.ACTIVE
    ).count()
    
    # Atención promedio hoy
    today = datetime.utcnow().date()
    today_sessions = db.query(ClassSession).join(Group).join(Subject).filter(
        Subject.teacher_id == current_user.id,
        func.date(ClassSession.started_at) == today,
        ClassSession.average_attention_score.isnot(None)
    ).all()
    
    average_attention_today = sum(s.average_attention_score for s in today_sessions) / len(today_sessions) if today_sessions else None
    total_sessions_today = len(today_sessions)
    
    # Alertas hoy
    alerts_today = db.query(Alert).join(ClassSession).join(Group).join(Subject).filter(
        Subject.teacher_id == current_user.id,
        func.date(Alert.created_at) == today,
        Alert.is_acknowledged == False
    ).count()
    
    return TeacherDashboardStats(
        total_subjects=total_subjects,
        total_groups=total_groups,
        total_students=total_students,
        active_sessions=active_sessions,
        average_attention_today=average_attention_today,
        total_sessions_today=total_sessions_today,
        alerts_today=alerts_today
    )