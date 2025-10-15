# backend/app/api/endpoints/metrics.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID

from app.db.session import get_db
from app.models.metrics import (
    ClassSession, SessionAttendance, AttentionMetric, 
    Alert, AttentionLevel
)
from app.models.user import User
from app.schemas.metrics import (
    SessionResponse, AttendanceResponse, MetricResponse, 
    AlertResponse, MetricCreate
)
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

# ==================== STUDENT ENDPOINTS ====================

@router.get("/student/stats")
async def get_student_stats(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Obtener estadísticas generales del estudiante"""
    
    # Total de sesiones asistidas
    total_sessions = db.query(SessionAttendance).filter(
        SessionAttendance.student_id == current_user.id
    ).count()
    
    # Promedio de atención
    avg_attention = db.query(
        func.avg(SessionAttendance.average_attention_score)
    ).filter(
        SessionAttendance.student_id == current_user.id
    ).scalar() or 0
    
    # Total de minutos en clase
    total_minutes = db.query(
        func.sum(SessionAttendance.duration_minutes)
    ).filter(
        SessionAttendance.student_id == current_user.id
    ).scalar() or 0
    
    # Bostezos y pestañeos totales
    blinks_yawns = db.query(
        func.sum(SessionAttendance.total_blinks),
        func.sum(SessionAttendance.total_yawns)
    ).filter(
        SessionAttendance.student_id == current_user.id
    ).first()
    
    total_blinks = blinks_yawns[0] or 0
    total_yawns = blinks_yawns[1] or 0
    
    # Última sesión
    last_session = db.query(SessionAttendance).filter(
        SessionAttendance.student_id == current_user.id
    ).order_by(desc(SessionAttendance.joined_at)).first()
    
    last_session_date = last_session.joined_at if last_session else None
    
    # Tendencia de atención (últimas 7 sesiones)
    recent_sessions = db.query(SessionAttendance).filter(
        SessionAttendance.student_id == current_user.id,
        SessionAttendance.average_attention_score.isnot(None)
    ).order_by(desc(SessionAttendance.joined_at)).limit(7).all()
    
    trend = "stable"
    if len(recent_sessions) >= 3:
        recent_avg = sum(s.average_attention_score for s in recent_sessions[:3]) / 3
        older_avg = sum(s.average_attention_score for s in recent_sessions[3:]) / len(recent_sessions[3:])
        if recent_avg > older_avg + 5:
            trend = "improving"
        elif recent_avg < older_avg - 5:
            trend = "declining"
    
    return {
        "total_sessions": total_sessions,
        "average_attention_score": round(avg_attention, 2),
        "total_minutes": total_minutes,
        "total_hours": round(total_minutes / 60, 1),
        "total_blinks": total_blinks,
        "total_yawns": total_yawns,
        "last_session_date": last_session_date,
        "trend": trend
    }

@router.get("/student/history")
async def get_student_history(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Obtener historial de sesiones del estudiante"""
    
    attendances = db.query(SessionAttendance).filter(
        SessionAttendance.student_id == current_user.id
    ).order_by(desc(SessionAttendance.joined_at)).limit(limit).offset(offset).all()
    
    history = []
    for attendance in attendances:
        session = db.query(ClassSession).filter(
            ClassSession.id == attendance.session_id
        ).first()
        
        if session and session.class_obj:
            history.append({
                "id": str(attendance.id),
                "session_id": str(attendance.session_id),
                "class_name": session.class_obj.name,
                "subject": session.class_obj.subject,
                "date": attendance.joined_at,
                "duration_minutes": attendance.duration_minutes,
                "attention_score": attendance.average_attention_score,
                "blinks": attendance.total_blinks,
                "yawns": attendance.total_yawns,
                "status": session.status
            })
    
    return {
        "total": len(history),
        "history": history
    }

@router.get("/student/attention-timeline")
async def get_attention_timeline(
    days: int = Query(7, ge=1, le=30),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Obtener línea de tiempo de atención (últimos N días)"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    metrics = db.query(
        func.date(AttentionMetric.timestamp).label('date'),
        func.avg(AttentionMetric.attention_score).label('avg_score'),
        func.count(AttentionMetric.id).label('total_readings')
    ).filter(
        AttentionMetric.student_id == current_user.id,
        AttentionMetric.timestamp >= start_date
    ).group_by(
        func.date(AttentionMetric.timestamp)
    ).order_by('date').all()
    
    timeline = []
    for metric in metrics:
        timeline.append({
            "date": metric.date.isoformat(),
            "average_score": round(metric.avg_score, 2),
            "total_readings": metric.total_readings
        })
    
    return {
        "period_days": days,
        "timeline": timeline
    }

@router.get("/student/current-session")
async def get_current_session_metrics(
    session_id: UUID,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Obtener métricas de la sesión actual"""
    
    # Verificar que el estudiante esté en la sesión
    attendance = db.query(SessionAttendance).filter(
        SessionAttendance.session_id == session_id,
        SessionAttendance.student_id == current_user.id
    ).first()
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Not in this session")
    
    # Obtener métricas de la sesión
    metrics = db.query(AttentionMetric).filter(
        AttentionMetric.session_id == session_id,
        AttentionMetric.student_id == current_user.id
    ).order_by(desc(AttentionMetric.timestamp)).limit(100).all()
    
    if not metrics:
        return {
            "session_id": str(session_id),
            "current_score": 0,
            "average_score": 0,
            "total_readings": 0,
            "recent_metrics": []
        }
    
    current_score = metrics[0].attention_score if metrics else 0
    avg_score = sum(m.attention_score for m in metrics) / len(metrics)
    
    recent_metrics = []
    for m in metrics[:20]:
        recent_metrics.append({
            "timestamp": m.timestamp,
            "score": m.attention_score,
            "level": m.attention_level.value,
            "blink": m.blink_detected,
            "yawn": m.yawns_detected,
            "looking_away": m.looking_away
        })
    
    return {
        "session_id": str(session_id),
        "current_score": round(current_score, 2),
        "average_score": round(avg_score, 2),
        "total_readings": len(metrics),
        "recent_metrics": recent_metrics
    }

# ==================== TEACHER ENDPOINTS ====================

@router.get("/teacher/session/{session_id}/overview")
async def get_session_overview(
    session_id: UUID,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Obtener resumen de sesión para el profesor"""
    
    session = db.query(ClassSession).filter(
        ClassSession.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verificar que el profesor sea el dueño de la clase
    if str(session.class_obj.teacher_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Obtener estudiantes en la sesión
    attendances = db.query(SessionAttendance).filter(
        SessionAttendance.session_id == session_id
    ).all()
    
    students_data = []
    for attendance in attendances:
        student = attendance.student
        students_data.append({
            "id": str(student.id),
            "name": f"{student.first_name} {student.last_name}",
            "attention_score": attendance.average_attention_score or 0,
            "duration_minutes": attendance.duration_minutes or 0,
            "blinks": attendance.total_blinks,
            "yawns": attendance.total_yawns,
            "joined_at": attendance.joined_at
        })
    
    # Calcular promedios
    avg_attention = sum(s["attention_score"] for s in students_data) / len(students_data) if students_data else 0
    
    return {
        "session_id": str(session_id),
        "class_name": session.class_obj.name,
        "started_at": session.started_at,
        "status": session.status,
        "total_students": len(students_data),
        "average_attention": round(avg_attention, 2),
        "students": students_data
    }

@router.post("/metrics")
async def create_metric(
    metric: MetricCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Crear nueva métrica de atención"""
    
    db_metric = AttentionMetric(
        session_id=metric.session_id,
        student_id=metric.student_id,
        attention_level=metric.attention_level,
        attention_score=metric.attention_score,
        confidence=metric.confidence,
        ear=metric.ear,
        mar=metric.mar,
        blink_detected=metric.blink_detected,
        yawns_detected=metric.yawns_detected,
        looking_away=metric.looking_away,
        head_pose_pitch=metric.head_pose_pitch,
        head_pose_yaw=metric.head_pose_yaw,
        head_pose_roll=metric.head_pose_roll,
        prob_low=metric.prob_low,
        prob_medium=metric.prob_medium,
        prob_high=metric.prob_high,
        using_ml=metric.using_ml
    )
    
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    
    return {
        "id": str(db_metric.id),
        "message": "Metric created successfully"
    }