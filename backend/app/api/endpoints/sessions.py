# backend/app/api/endpoints/sessions.py
"""
Endpoints actualizados para gestión de sesiones
Ahora integrados con el sistema de Grupos y Asignaturas
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.academic import Subject, Group, GroupMembership
from app.models.metrics import (
    ClassSession, SessionAttendance, AttentionMetric, 
    Alert, SessionStatus, AttentionLevel
)
from app.api.endpoints.auth import get_current_user

router = APIRouter()

# ==================== SESSION MANAGEMENT ====================

@router.post("/sessions/start")
async def start_session(
    group_id: UUID,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Iniciar una nueva sesión de clase (solo profesores)"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can start sessions")
    
    # Verificar que el grupo existe y pertenece al profesor
    group = db.query(Group).join(Subject).filter(
        Group.id == group_id,
        Subject.teacher_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found or not authorized")
    
    # Verificar si ya hay una sesión activa para este grupo
    active_session = db.query(ClassSession).filter(
        ClassSession.group_id == group_id,
        ClassSession.status == SessionStatus.ACTIVE
    ).first()
    
    if active_session:
        return {
            "message": "Session already active",
            "session_id": str(active_session.id),
            "group_id": str(group_id),
            "subject_name": group.subject.name,
            "group_name": group.name,
            "started_at": active_session.started_at
        }
    
    # Contar estudiantes esperados
    expected_students = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.is_active == True
    ).count()
    
    # Crear nueva sesión
    new_session = ClassSession(
        group_id=group_id,
        started_at=datetime.utcnow(),
        status=SessionStatus.ACTIVE,
        total_students_present=0,
        total_students_expected=expected_students,
        notes=notes
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return {
        "message": "Session started successfully",
        "session_id": str(new_session.id),
        "group_id": str(group_id),
        "subject_name": group.subject.name,
        "group_name": group.name,
        "started_at": new_session.started_at,
        "expected_students": expected_students
    }

@router.post("/sessions/{session_id}/end")
async def end_session(
    session_id: UUID,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Finalizar una sesión de clase (solo profesores)"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can end sessions")
    
    session = db.query(ClassSession).join(Group).join(Subject).filter(
        ClassSession.id == session_id,
        Subject.teacher_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or not authorized")
    
    if session.status != SessionStatus.ACTIVE:
        return {
            "message": "Session already ended",
            "session_id": str(session_id)
        }
    
    # Finalizar sesión
    session.ended_at = datetime.utcnow()
    session.status = SessionStatus.COMPLETED
    
    # Calcular duración
    if session.started_at:
        duration = session.ended_at - session.started_at
        session.duration_minutes = int(duration.total_seconds() / 60)
    
    # Calcular promedio de atención de la sesión
    avg_score = db.query(func.avg(AttentionMetric.attention_score)).filter(
        AttentionMetric.session_id == session_id
    ).scalar()
    
    if avg_score:
        session.average_attention_score = float(avg_score)
    
    # Agregar notas adicionales si se proporcionaron
    if notes:
        session.notes = f"{session.notes}\n\n{notes}" if session.notes else notes
    
    # Finalizar asistencias activas
    active_attendances = db.query(SessionAttendance).filter(
        SessionAttendance.session_id == session_id,
        SessionAttendance.left_at.is_(None)
    ).all()
    
    for attendance in active_attendances:
        attendance.left_at = datetime.utcnow()
        
        if attendance.joined_at:
            duration = attendance.left_at - attendance.joined_at
            attendance.duration_minutes = int(duration.total_seconds() / 60)
        
        # Calcular métricas del estudiante
        metrics = db.query(AttentionMetric).filter(
            AttentionMetric.session_id == session_id,
            AttentionMetric.student_id == attendance.student_id
        ).all()
        
        if metrics:
            scores = [m.attention_score for m in metrics]
            attendance.average_attention_score = sum(scores) / len(scores)
            attendance.min_attention_score = min(scores)
            attendance.max_attention_score = max(scores)
            attendance.total_blinks = sum(1 for m in metrics if m.blink_detected)
            attendance.total_yawns = sum(1 for m in metrics if m.yawns_detected)
            attendance.total_low_attention_events = sum(1 for m in metrics if m.attention_score < 40)
            attendance.time_looking_away_seconds = sum(1 for m in metrics if m.looking_away) * 2  # Aprox
    
    db.commit()
    db.refresh(session)
    
    return {
        "message": "Session ended successfully",
        "session_id": str(session.id),
        "group_id": str(session.group_id),
        "duration_minutes": session.duration_minutes,
        "average_attention_score": session.average_attention_score,
        "students_present": session.total_students_present,
        "attendance_rate": session.attendance_rate
    }

@router.get("/sessions/active")
async def get_active_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener sesión activa del usuario"""
    
    if current_user.role == UserRole.TEACHER:
        # Buscar sesión activa de algún grupo del profesor
        session = db.query(ClassSession).join(Group).join(Subject).filter(
            Subject.teacher_id == current_user.id,
            ClassSession.status == SessionStatus.ACTIVE
        ).first()
    else:
        # Buscar sesión activa de los grupos donde el estudiante está inscrito
        session = db.query(ClassSession).join(Group).join(GroupMembership).filter(
            GroupMembership.student_id == current_user.id,
            GroupMembership.is_active == True,
            ClassSession.status == SessionStatus.ACTIVE
        ).first()
    
    if not session:
        return {
            "session_id": None,
            "message": "No active session"
        }
    
    return {
        "session_id": str(session.id),
        "group_id": str(session.group_id),
        "group_name": session.group.name,
        "subject_id": str(session.group.subject_id),
        "subject_name": session.group.subject.name,
        "started_at": session.started_at,
        "status": session.status.value,
        "expected_students": session.total_students_expected,
        "present_students": session.total_students_present
    }

@router.post("/sessions/{session_id}/join")
async def join_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unirse a una sesión (estudiantes)"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can join sessions")
    
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != SessionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Session is not active")
    
    # Verificar que el estudiante está matriculado en el grupo
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == session.group_id,
        GroupMembership.student_id == current_user.id,
        GroupMembership.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not enrolled in this group")
    
    # Verificar si ya está en la sesión
    existing_attendance = db.query(SessionAttendance).filter(
        SessionAttendance.session_id == session_id,
        SessionAttendance.student_id == current_user.id,
        SessionAttendance.left_at.is_(None)
    ).first()
    
    if existing_attendance:
        return {
            "message": "Already in session",
            "attendance_id": str(existing_attendance.id),
            "joined_at": existing_attendance.joined_at
        }
    
    # Crear asistencia
    attendance = SessionAttendance(
        session_id=session_id,
        student_id=current_user.id,
        joined_at=datetime.utcnow()
    )
    
    db.add(attendance)
    
    # Actualizar contador de estudiantes presentes
    session.total_students_present += 1
    
    db.commit()
    db.refresh(attendance)
    
    return {
        "message": "Joined session successfully",
        "attendance_id": str(attendance.id),
        "session_id": str(session_id),
        "joined_at": attendance.joined_at
    }

@router.get("/sessions/{session_id}")
async def get_session_detail(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener detalles completos de una sesión"""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verificar permisos
    if current_user.role == UserRole.TEACHER:
        if str(session.group.subject.teacher_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.STUDENT:
        membership = db.query(GroupMembership).filter(
            GroupMembership.group_id == session.group_id,
            GroupMembership.student_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Not enrolled in this group")
    
    # Obtener asistencias
    attendances = db.query(SessionAttendance).filter(
        SessionAttendance.session_id == session_id
    ).all()
    
    students = []
    for attendance in attendances:
        student = attendance.student
        students.append({
            "id": str(student.id),
            "name": f"{student.first_name} {student.last_name}",
            "email": student.email,
            "joined_at": attendance.joined_at,
            "left_at": attendance.left_at,
            "duration_minutes": attendance.duration_minutes,
            "average_attention_score": attendance.average_attention_score,
            "min_attention_score": attendance.min_attention_score,
            "max_attention_score": attendance.max_attention_score,
            "total_blinks": attendance.total_blinks,
            "total_yawns": attendance.total_yawns,
            "was_attentive": attendance.was_attentive
        })
    
    return {
        "id": str(session.id),
        "group_id": str(session.group_id),
        "group_name": session.group.name,
        "subject_id": str(session.group.subject_id),
        "subject_name": session.group.subject.name,
        "subject_code": session.group.subject.code,
        "teacher": {
            "id": str(session.group.subject.teacher.id),
            "name": f"{session.group.subject.teacher.first_name} {session.group.subject.teacher.last_name}"
        } if session.group.subject.teacher else None,
        "started_at": session.started_at,
        "ended_at": session.ended_at,
        "duration_minutes": session.duration_minutes,
        "status": session.status.value,
        "average_attention_score": session.average_attention_score,
        "total_students_expected": session.total_students_expected,
        "total_students_present": session.total_students_present,
        "attendance_rate": session.attendance_rate,
        "notes": session.notes,
        "students": students
    }

# ==================== HISTORY ENDPOINTS ====================

@router.get("/sessions/history/teacher")
async def get_teacher_session_history(
    subject_id: Optional[UUID] = None,
    group_id: Optional[UUID] = None,
    days: int = 30,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener historial de sesiones del profesor"""
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can access this")
    
    since_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(ClassSession).join(Group).join(Subject).filter(
        Subject.teacher_id == current_user.id,
        ClassSession.started_at >= since_date
    )
    
    if subject_id:
        query = query.filter(Group.subject_id == subject_id)
    
    if group_id:
        query = query.filter(ClassSession.group_id == group_id)
    
    sessions = query.order_by(ClassSession.started_at.desc()).offset(skip).limit(limit).all()
    
    history = []
    for session in sessions:
        history.append({
            "id": str(session.id),
            "group_id": str(session.group_id),
            "group_name": session.group.name,
            "subject_id": str(session.group.subject_id),
            "subject_name": session.group.subject.name,
            "date": session.started_at,
            "duration_minutes": session.duration_minutes,
            "status": session.status.value,
            "average_attention_score": session.average_attention_score,
            "students_present": session.total_students_present,
            "students_expected": session.total_students_expected,
            "attendance_rate": session.attendance_rate
        })
    
    return {
        "total": len(history),
        "sessions": history
    }

@router.get("/sessions/history/student")
async def get_student_session_history(
    subject_id: Optional[UUID] = None,
    days: int = 30,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener historial de sesiones del estudiante"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this")
    
    since_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(SessionAttendance).join(ClassSession).join(Group).join(Subject).filter(
        SessionAttendance.student_id == current_user.id,
        SessionAttendance.joined_at >= since_date
    )
    
    if subject_id:
        query = query.filter(Group.subject_id == subject_id)
    
    attendances = query.order_by(SessionAttendance.joined_at.desc()).offset(skip).limit(limit).all()
    
    history = []
    for attendance in attendances:
        session = attendance.session
        history.append({
            "id": str(attendance.id),
            "session_id": str(session.id),
            "group_id": str(session.group_id),
            "group_name": session.group.name,
            "subject_id": str(session.group.subject_id),
            "subject_name": session.group.subject.name,
            "subject_code": session.group.subject.code,
            "date": attendance.joined_at,
            "duration_minutes": attendance.duration_minutes,
            "average_attention_score": attendance.average_attention_score,
            "min_attention_score": attendance.min_attention_score,
            "max_attention_score": attendance.max_attention_score,
            "blinks": attendance.total_blinks,
            "yawns": attendance.total_yawns,
            "was_attentive": attendance.was_attentive,
            "status": session.status.value
        })
    
    return {
        "total": len(history),
        "sessions": history
    }

@router.get("/sessions/stats/subject/{subject_id}")
async def get_subject_session_stats(
    subject_id: UUID,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener estadísticas de sesiones por asignatura"""
    
    # Verificar permisos
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    if current_user.role == UserRole.TEACHER and str(subject.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    since_date = datetime.utcnow() - timedelta(days=days)
    
    # Obtener todas las sesiones completadas
    sessions = db.query(ClassSession).join(Group).filter(
        Group.subject_id == subject_id,
        ClassSession.status == SessionStatus.COMPLETED,
        ClassSession.started_at >= since_date
    ).all()
    
    if not sessions:
        return {
            "subject_id": str(subject_id),
            "subject_name": subject.name,
            "total_sessions": 0,
            "average_attention": None,
            "average_attendance_rate": None,
            "total_students": 0
        }
    
    total_sessions = len(sessions)
    avg_attention = sum(s.average_attention_score or 0 for s in sessions) / total_sessions
    avg_attendance = sum(s.attendance_rate for s in sessions) / total_sessions
    
    # Contar estudiantes únicos
    unique_students = db.query(func.count(func.distinct(GroupMembership.student_id))).join(Group).filter(
        Group.subject_id == subject_id,
        GroupMembership.is_active == True
    ).scalar() or 0
    
    return {
        "subject_id": str(subject_id),
        "subject_name": subject.name,
        "period_days": days,
        "total_sessions": total_sessions,
        "average_attention": round(avg_attention, 2),
        "average_attendance_rate": round(avg_attendance, 2),
        "total_students": unique_students
    }