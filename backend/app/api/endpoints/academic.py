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
from app.models.metrics import ClassSession, SessionAttendance, AttentionMetric, Alert, SessionStatus, AttentionLevel
from app.schemas.academic import (
    SubjectCreate, SubjectUpdate, SubjectResponse, SubjectWithStats,
    GroupCreate, GroupUpdate, GroupResponse, GroupWithStudents, GroupWithStats,
    GroupMembershipCreate, GroupMembershipBulkCreate, GroupMembershipResponse,
    StudentEnrollmentInfo, TeacherDashboardStats, GroupStatistics
)
from app.api.endpoints.auth import get_current_user

router = APIRouter()

# ==================== SUBJECTS ====================

@router.post("/subjects", response_model=SubjectResponse)
async def create_subject(
    subject: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear nueva asignatura (solo profesores)"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can create subjects")
    
    # Verificar si ya existe
    existing = db.query(Subject).filter(
        Subject.teacher_id == current_user.id,
        Subject.code == subject.code,
        Subject.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Subject with this code already exists")
    
    subject_data = subject.dict()
    db_subject = Subject(
       name=subject_data['name'],
       code=subject_data['code'],
       description=subject_data.get('description'),
       credits=subject_data.get('credits', 3),
       semester=subject_data.get('semester'),
       department=subject_data.get('department'),
       teacher_id=current_user.id
    )

    
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    
    return db_subject


@router.get("/subjects", response_model=List[SubjectWithStats])
async def list_subjects(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar asignaturas del profesor"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can access this")
    
    query = db.query(Subject).filter(Subject.teacher_id == current_user.id)

# CRÍTICO: Si no se especifica is_active, por defecto solo activos
    if is_active is None:
        query = query.filter(Subject.is_active == True)
    elif is_active is not None:
        query = query.filter(Subject.is_active == is_active)

    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Subject.name.ilike(search_term)) | (Subject.code.ilike(search_term))
        )
    
    subjects = query.offset(skip).limit(limit).all()
    
    result = []
    for subject in subjects:
        total_groups = db.query(Group).filter(
            Group.subject_id == subject.id,
            Group.is_active == True
        ).count()
        
        total_students = db.query(func.count(GroupMembership.id)).join(Group).filter(
            Group.subject_id == subject.id,
            Group.is_active == True,
            GroupMembership.is_active == True
        ).scalar() or 0
        
        result.append({
            **subject.__dict__,
            "total_groups": total_groups,
            "total_students": total_students
        })
    
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
    
    if current_user.role == UserRole.TEACHER and str(subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total_groups = db.query(Group).filter(
        Group.subject_id == subject.id,
        Group.is_active == True
    ).count()
    
    total_students = db.query(func.count(GroupMembership.id)).join(Group).filter(
        Group.subject_id == subject.id,
        Group.is_active == True,
        GroupMembership.is_active == True
    ).scalar() or 0
    
    return {
        **subject.__dict__,
        "total_groups": total_groups,
        "total_students": total_students
    }


@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: UUID,
    subject_update: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar asignatura"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can update subjects")
    
    if str(subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this subject")
    
    for field, value in subject_update.dict(exclude_unset=True).items():
        setattr(subject, field, value)
    
    db.commit()
    db.refresh(subject)
    
    return subject


@router.delete("/subjects/{subject_id}")
async def delete_subject(
    subject_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar asignatura (soft delete)"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Verificar permisos
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can delete subjects")
    
    # Verificar que sea el dueño
    if str(subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this subject")
    
    # Soft delete
    subject.is_active = False
    
    # También desactivar grupos
    groups = db.query(Group).filter(Group.subject_id == subject_id).all()
    for group in groups:
        group.is_active = False
    
    db.commit()
    
    return {"message": "Subject deleted successfully"}


# ==================== GROUPS ====================

@router.post("/groups", response_model=GroupResponse)
async def create_group(
    group: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear nuevo grupo"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can create groups")
    
    # Verificar que la asignatura existe y pertenece al profesor
    subject = db.query(Subject).filter(Subject.id == group.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    if str(subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verificar si ya existe un grupo con ese código
    existing = db.query(Group).filter(
        Group.subject_id == group.subject_id,
        Group.code == group.code,
        Group.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Group with this code already exists")
    
    group_data = group.dict()
    db_group = Group(
       name=group_data['name'],
       code=group_data['code'],
       subject_id=group_data['subject_id'],
       schedule_day=group_data.get('schedule_day'),
       schedule_time=group_data.get('schedule_time'),
       duration_minutes=group_data.get('duration_minutes', 90),
       classroom=group_data.get('classroom'),
       max_students=group_data.get('max_students', 30),
       created_by=current_user.id
    )

    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    return db_group


@router.get("/groups", response_model=List[GroupResponse])
async def list_groups(
    subject_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar grupos del profesor (solo activos por defecto)"""
    
    # Base query - JOIN con Subject para filtrar por teacher_id
    query = db.query(Group).join(
        Subject, Group.subject_id == Subject.id
    ).filter(
        Subject.teacher_id == current_user.id,  # ✅ FILTRAR POR PROFESOR VÍA SUBJECT
        Group.is_active == True  # ✅ SOLO GRUPOS ACTIVOS
    )
    
    # Filtro opcional por asignatura
    if subject_id:
        query = query.filter(Group.subject_id == subject_id)
    
    # Obtener grupos con info de estudiantes
    groups = query.offset(skip).limit(limit).all()
    
    # Agregar conteo de estudiantes
    result = []
    for group in groups:
        group_dict = {
            "id": group.id,
            "name": group.name,
            "code": group.code,
            "subject_id": group.subject_id,
            "subject_name": group.subject.name if group.subject else "",
            "subject_code": group.subject.code if group.subject else "",
            "max_students": group.max_students,
            "schedule_day": group.schedule_day,
            "schedule_time": group.schedule_time,
            "student_count": len([m for m in group.memberships if m.is_active]),
            "created_at": group.created_at,
            "created_by": group.created_by,
            "is_active": group.is_active
        }
        result.append(group_dict)
    
    return result

@router.get("/groups/{group_id}", response_model=GroupWithStudents)
async def get_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener detalles de un grupo con estudiantes"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Verificar permisos
    if current_user.role == UserRole.TEACHER:
        if str(group.subject.teacher_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized")
    
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
            "first_name": student.first_name,
            "last_name": student.last_name,
            "email": student.email,
            "enrolled_at": membership.enrolled_at
        })
    
    # ✅ CONVERTIR schedule_time A STRING ANTES DE DEVOLVER
    return {
        "id": group.id,
        "name": group.name,
        "code": group.code,
        "subject_id": group.subject_id,
        "subject_code": group.subject.code if group.subject else None,
        "schedule_day": group.schedule_day,
        "schedule_time": str(group.schedule_time) if group.schedule_time else None,  # ✅ AQUÍ ESTÁ EL FIX
        "max_students": group.max_students,
        "duration_minutes": group.duration_minutes,
        "classroom": group.classroom,
        "created_at": group.created_at,
        "created_by": group.created_by,
        "is_active": group.is_active,
        "students": students
    }


@router.put("/groups/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: UUID,
    group_update: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar grupo"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can update groups")
    
    if str(group.subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for field, value in group_update.dict(exclude_unset=True).items():
        setattr(group, field, value)
    
    db.commit()
    db.refresh(group)
    
    return group


@router.delete("/groups/{group_id}")
async def delete_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar grupo (soft delete)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Verificar permisos
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can delete groups")
    
    # Verificar que el profesor sea el dueño de la asignatura
    if str(group.subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Soft delete
    group.is_active = False
    db.commit()
    
    return {"message": "Group deleted successfully"}


# ==================== GROUP MEMBERSHIP ====================

@router.post("/groups/{group_id}/enroll", response_model=GroupMembershipResponse)
async def enroll_student(
    group_id: UUID,
    membership: GroupMembershipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Matricular estudiante en grupo"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can enroll students")
    
    # Verificar que el grupo existe
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Verificar permisos
    if str(group.subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # ✅ VERIFICACIÓN MEJORADA - Buscar CUALQUIER registro (activo o inactivo)
    existing_any = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.student_id == membership.student_id
    ).first()
    
    if existing_any:
        if existing_any.is_active:
            # Ya está matriculado activamente
            raise HTTPException(
                status_code=400, 
                detail="El estudiante ya está matriculado en este grupo"
            )
        else:
            # Estaba inactivo, reactivarlo
            existing_any.is_active = True
            existing_any.enrolled_at = datetime.now()
            existing_any.unenrolled_at = None
            
            try:
                db.commit()
                db.refresh(existing_any)
                
                # Obtener datos del estudiante
                student = db.query(User).filter(User.id == membership.student_id).first()
                
                # ✅ CONCATENAR NOMBRES CORRECTAMENTE
                student_name = f"{student.first_name} {student.last_name}" if student else "Unknown"
                
                return GroupMembershipResponse(
                    id=existing_any.id,
                    group_id=existing_any.group_id,
                    student_id=existing_any.student_id,
                    student_name=student_name,
                    student_email=student.email if student else "unknown@email.com",
                    enrolled_at=existing_any.enrolled_at,
                    unenrolled_at=existing_any.unenrolled_at,
                    is_active=existing_any.is_active
                )
            except Exception as e:
                db.rollback()
                print(f"❌ Error al reactivar matrícula: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    
    # ✅ Verificar cupo disponible
    current_count = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.is_active == True
    ).count()
    
    if current_count >= group.max_students:
        raise HTTPException(
            status_code=400,
            detail=f"El grupo está completo ({group.max_students}/{group.max_students})"
        )
    
    # ✅ Verificar que el estudiante existe
    student = db.query(User).filter(
        User.id == membership.student_id,
        User.role == UserRole.STUDENT
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Crear nueva matrícula
    db_membership = GroupMembership(
        group_id=group_id,
        student_id=membership.student_id
    )
    
    try:
        db.add(db_membership)
        db.commit()
        db.refresh(db_membership)
        
        # ✅ CONCATENAR NOMBRES CORRECTAMENTE
        student_name = f"{student.first_name} {student.last_name}"
        
        return GroupMembershipResponse(
            id=db_membership.id,
            group_id=db_membership.group_id,
            student_id=db_membership.student_id,
            student_name=student_name,
            student_email=student.email,
            enrolled_at=db_membership.enrolled_at,
            unenrolled_at=db_membership.unenrolled_at,
            is_active=db_membership.is_active
        )
    except Exception as e:
        db.rollback()
        print(f"❌ Error al crear matrícula: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al matricular estudiante: {str(e)}"
        )


@router.post("/groups/{group_id}/enroll-bulk")
async def enroll_students_bulk(
    group_id: UUID,
    data: GroupMembershipBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Matricular múltiples estudiantes"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can enroll students")
    
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if str(group.subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    enrolled = []
    for student_id in data.student_ids:
        existing = db.query(GroupMembership).filter(
            GroupMembership.group_id == group_id,
            GroupMembership.student_id == student_id,
            GroupMembership.is_active == True
        ).first()
        
        if not existing:
            membership = GroupMembership(
                group_id=group_id,
                student_id=student_id
            )
            db.add(membership)
            enrolled.append(str(student_id))
    
    db.commit()
    
    return {
        "message": f"Enrolled {len(enrolled)} students",
        "enrolled_ids": enrolled
    }


@router.delete("/groups/{group_id}/students/{student_id}")
async def unenroll_student(
    group_id: UUID,
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Desmatricular estudiante"""
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
        raise HTTPException(status_code=404, detail="Student not enrolled")
    
    membership.is_active = False
    db.commit()
    
    return {"message": "Student unenrolled successfully"}


# ==================== DASHBOARD ====================

@router.get("/dashboard/teacher/stats", response_model=TeacherDashboardStats)
async def get_teacher_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Estadísticas del dashboard del profesor"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can access this")
    
    # Total asignaturas
    total_subjects = db.query(Subject).filter(
        Subject.teacher_id == current_user.id,
        Subject.is_active == True
    ).count()
    
    # Total grupos
    total_groups = db.query(Group).join(Subject).filter(
        Subject.teacher_id == current_user.id,
        Group.is_active == True
    ).count()
    
    # Total estudiantes
    total_students = db.query(func.count(func.distinct(GroupMembership.student_id))).join(Group).join(Subject).filter(
        Subject.teacher_id == current_user.id,
        Group.is_active == True,
        GroupMembership.is_active == True
    ).scalar() or 0
    
    # Sesiones hoy
    today = datetime.now().date()
    total_sessions_today = db.query(ClassSession).join(Group).join(Subject).filter(
        Subject.teacher_id == current_user.id,
        func.date(ClassSession.started_at) == today
    ).count()

    
    # Sesiones activas
    active_sessions = db.query(ClassSession).join(Group).join(Subject).filter(
        Subject.teacher_id == current_user.id,
        ClassSession.status == SessionStatus.ACTIVE
    ).count()
    
    # Alertas hoy
    alerts_today = db.query(Alert).join(ClassSession).join(Group).join(Subject).filter(
        Subject.teacher_id == current_user.id,
        func.date(Alert.created_at) == today,
        Alert.is_acknowledged == False
    ).count()
    
    # Atención promedio hoy
    avg_attention = db.query(
        func.avg(AttentionMetric.attention_score)
    ).select_from(ClassSession).join(
        Group, Group.id == ClassSession.group_id
    ).join(
        Subject, Subject.id == Group.subject_id
    ).join(
        AttentionMetric, AttentionMetric.session_id == ClassSession.id
    ).filter(
        Subject.teacher_id == current_user.id,
        func.date(ClassSession.started_at) == today
    ).scalar()
    
    return {
        "total_subjects": total_subjects,
        "total_groups": total_groups,
        "total_students": total_students,
        "total_sessions_today": total_sessions_today,
        "active_sessions": active_sessions,
        "alerts_today": alerts_today,
        "average_attention_today": float(avg_attention) if avg_attention else 0.0
    }


@router.get("/groups/{group_id}/stats", response_model=GroupStatistics)
async def get_group_statistics(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Estadísticas de un grupo"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.role == UserRole.TEACHER:
        if str(group.subject.teacher_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Total estudiantes
    total_students = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.is_active == True
    ).count()
    
    # Total sesiones
    total_sessions = db.query(ClassSession).filter(
        ClassSession.group_id == group_id
    ).count()
    
    # Atención promedio
    avg_attention = db.query(func.avg(AttentionMetric.attention_score)).join(
        SessionAttendance
    ).join(ClassSession).filter(
        ClassSession.group_id == group_id
    ).scalar()
    
    return {
        "group_id": str(group_id),
        "total_students": total_students,
        "total_sessions": total_sessions,
        "average_attention": float(avg_attention) if avg_attention else 0.0,
        "active_students": total_students
    }
