# backend/app/api/endpoints/classes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.models.class_model import Class, ClassEnrollment
from app.models.metrics import ClassSession, SessionAttendance, SessionStatus
from app.api.endpoints.auth import oauth2_scheme
from app.core.security import verify_token

router = APIRouter()

# ==================== HELPER FUNCTIONS ====================

async def get_current_user_from_token(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Obtener usuario actual desde el token"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# ==================== CLASS ENDPOINTS ====================

@router.get("/classes")
async def get_classes(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Obtener todas las clases del usuario"""
    if current_user.role == "teacher":
        # Profesor ve sus clases
        classes = db.query(Class).filter(
            Class.teacher_id == current_user.id,
            Class.is_active == True
        ).all()
    else:
        # Estudiante ve clases en las que está inscrito
        enrollments = db.query(ClassEnrollment).filter(
            ClassEnrollment.student_id == current_user.id,
            ClassEnrollment.is_active == True
        ).all()
        classes = [enrollment.class_obj for enrollment in enrollments]
    
    return {
        "total": len(classes),
        "classes": [
            {
                "id": str(c.id),
                "name": c.name,
                "subject": c.subject,
                "description": c.description,
                "schedule_day": c.schedule_day,
                "duration_minutes": c.duration_minutes,
                "teacher": {
                    "id": str(c.teacher.id),
                    "name": f"{c.teacher.first_name} {c.teacher.last_name}"
                } if c.teacher else None
            }
            for c in classes
        ]
    }

@router.get("/classes/{class_id}")
async def get_class_detail(
    class_id: UUID,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Obtener detalles de una clase específica"""
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verificar permisos
    if current_user.role == "teacher" and str(class_obj.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if current_user.role == "student":
        enrollment = db.query(ClassEnrollment).filter(
            ClassEnrollment.class_id == class_id,
            ClassEnrollment.student_id == current_user.id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this class")
    
    # Obtener estudiantes inscritos
    enrollments = db.query(ClassEnrollment).filter(
        ClassEnrollment.class_id == class_id,
        ClassEnrollment.is_active == True
    ).all()
    
    students = []
    for enrollment in enrollments:
        student = enrollment.student
        students.append({
            "id": str(student.id),
            "name": f"{student.first_name} {student.last_name}",
            "email": student.email
        })
    
    return {
        "id": str(class_obj.id),
        "name": class_obj.name,
        "subject": class_obj.subject,
        "description": class_obj.description,
        "schedule_day": class_obj.schedule_day,
        "duration_minutes": class_obj.duration_minutes,
        "teacher": {
            "id": str(class_obj.teacher.id),
            "name": f"{class_obj.teacher.first_name} {class_obj.teacher.last_name}"
        },
        "students": students,
        "total_students": len(students)
    }

# ==================== SESSION ENDPOINTS ====================

@router.post("/sessions/start")
async def start_session(
    class_id: UUID,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Iniciar una nueva sesión de clase (solo profesores)"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can start sessions")
    
    # Verificar que la clase existe y pertenece al profesor
    class_obj = db.query(Class).filter(
        Class.id == class_id,
        Class.teacher_id == current_user.id
    ).first()
    
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found or not authorized")
    
    # Verificar si ya hay una sesión activa
    active_session = db.query(ClassSession).filter(
        ClassSession.class_id == class_id,
        ClassSession.status == SessionStatus.ACTIVE
    ).first()
    
    if active_session:
        return {
            "message": "Session already active",
            "session_id": str(active_session.id),
            "started_at": active_session.started_at
        }
    
    # Crear nueva sesión
    new_session = ClassSession(
        class_id=class_id,
        started_at=datetime.utcnow(),
        status=SessionStatus.ACTIVE,
        total_students_present=0
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return {
        "message": "Session started successfully",
        "session_id": str(new_session.id),
        "class_id": str(class_id),
        "started_at": new_session.started_at
    }

@router.post("/sessions/{session_id}/end")
async def end_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Finalizar una sesión de clase (solo profesores)"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can end sessions")
    
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verificar que el profesor es el dueño de la clase
    if str(session.class_obj.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if session.status != SessionStatus.ACTIVE:
        return {"message": "Session already ended"}
    
    # Finalizar sesión
    session.ended_at = datetime.utcnow()
    session.status = SessionStatus.COMPLETED
    
    # Calcular duración
    if session.started_at:
        duration = session.ended_at - session.started_at
        session.duration_minutes = int(duration.total_seconds() / 60)
    
    # Calcular promedio de atención (lo haremos más adelante con métricas reales)
    from sqlalchemy import func
    from app.models.metrics import AttentionMetric
    
    avg_score = db.query(func.avg(AttentionMetric.attention_score)).filter(
        AttentionMetric.session_id == session_id
    ).scalar()
    
    if avg_score:
        session.average_attention_score = float(avg_score)
    
    # Finalizar asistencias de estudiantes
    attendances = db.query(SessionAttendance).filter(
        SessionAttendance.session_id == session_id,
        SessionAttendance.left_at.is_(None)
    ).all()
    
    for attendance in attendances:
        attendance.left_at = datetime.utcnow()
        if attendance.joined_at:
            duration = attendance.left_at - attendance.joined_at
            attendance.duration_minutes = int(duration.total_seconds() / 60)
    
    db.commit()
    db.refresh(session)
    
    return {
        "message": "Session ended successfully",
        "session_id": str(session.id),
        "duration_minutes": session.duration_minutes,
        "average_attention_score": session.average_attention_score
    }

@router.get("/sessions/active")
async def get_active_session(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Obtener sesión activa del usuario"""
    
    if current_user.role == "teacher":
        # Buscar sesión activa de alguna clase del profesor
        session = db.query(ClassSession).join(Class).filter(
            Class.teacher_id == current_user.id,
            ClassSession.status == SessionStatus.ACTIVE
        ).first()
    else:
        # CAMBIADO: Buscar sesión activa de las clases donde el estudiante está inscrito
        # Primero obtener las clases del estudiante
        enrollments = db.query(ClassEnrollment).filter(
            ClassEnrollment.student_id == current_user.id,
            ClassEnrollment.is_active == True
        ).all()
        
        if not enrollments:
            return {"session_id": None, "message": "No active session"}
        
        # Obtener los class_ids
        class_ids = [enrollment.class_id for enrollment in enrollments]
        
        # Buscar sesión activa en esas clases
        session = db.query(ClassSession).filter(
            ClassSession.class_id.in_(class_ids),
            ClassSession.status == SessionStatus.ACTIVE
        ).first()
    
    if not session:
        return {"session_id": None, "message": "No active session"}
    
    return {
        "session_id": str(session.id),
        "class_id": str(session.class_id),
        "class_name": session.class_obj.name,
        "started_at": session.started_at,
        "status": session.status.value  # CAMBIADO: Agregar .value para enum
    }

@router.post("/sessions/{session_id}/join")
async def join_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Unirse a una sesión (estudiantes)"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can join sessions")
    
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != SessionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Session is not active")
    
    # Verificar que el estudiante está inscrito en la clase
    enrollment = db.query(ClassEnrollment).filter(
        ClassEnrollment.class_id == session.class_id,
        ClassEnrollment.student_id == current_user.id,
        ClassEnrollment.is_active == True
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this class")
    
    # Verificar si ya está en la sesión
    existing_attendance = db.query(SessionAttendance).filter(
        SessionAttendance.session_id == session_id,
        SessionAttendance.student_id == current_user.id,
        SessionAttendance.left_at.is_(None)
    ).first()
    
    if existing_attendance:
        return {
            "message": "Already in session",
            "attendance_id": str(existing_attendance.id)
        }
    
    # Crear asistencia
    attendance = SessionAttendance(
        session_id=session_id,
        student_id=current_user.id,
        joined_at=datetime.utcnow()
    )
    
    db.add(attendance)
    
    # Actualizar contador de estudiantes
    session.total_students_present += 1
    
    db.commit()
    db.refresh(attendance)
    
    return {
        "message": "Joined session successfully",
        "attendance_id": str(attendance.id),
        "session_id": str(session_id)
    }

@router.get("/sessions/{session_id}")
async def get_session_detail(
    session_id: UUID,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Obtener detalles de una sesión"""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verificar permisos
    if current_user.role == "teacher" and str(session.class_obj.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
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
            "joined_at": attendance.joined_at,
            "left_at": attendance.left_at,
            "duration_minutes": attendance.duration_minutes,
            "average_attention_score": attendance.average_attention_score
        })
    
    return {
        "id": str(session.id),
        "class_id": str(session.class_id),
        "class_name": session.class_obj.name,
        "started_at": session.started_at,
        "ended_at": session.ended_at,
        "duration_minutes": session.duration_minutes,
        "status": session.status,
        "average_attention_score": session.average_attention_score,
        "total_students_present": session.total_students_present,
        "students": students
    }