# backend/app/api/endpoints/alerts.py

"""
Endpoints para gestión de alertas en tiempo real
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.academic import Group, Subject
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.metrics import Alert, ClassSession
from app.api.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/session/{session_id}")
async def get_session_alerts(
    session_id: UUID,
    priority: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener alertas de una sesión específica"""
    
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if current_user.role == UserRole.TEACHER:
        if session.group.subject.teacher_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
    
    query = db.query(Alert).filter(Alert.session_id == session_id)
    
    if priority:
        query = query.filter(Alert.priority == priority.upper())
    
    alerts = query.order_by(desc(Alert.created_at)).limit(limit).all()
    
    alerts_data = []
    for alert in alerts:
        alerts_data.append({
            "id": str(alert.id),
            "session_id": str(alert.session_id),
            "student_id": str(alert.student_id) if alert.student_id else None,
            "student_name": alert.student.full_name if alert.student else None,
            "alert_type": alert.alert_type,
            "priority": alert.priority,
            "message": alert.message,
            "is_resolved": alert.is_resolved,
            "created_at": alert.created_at.isoformat()
        })
    
    return {
        "session_id": str(session_id),
        "total_alerts": len(alerts_data),
        "alerts": alerts_data
    }


@router.get("/unresolved")
async def get_unresolved_alerts(
    session_id: Optional[UUID] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener alertas no resueltas - Solo profesores"""
    
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access alerts"
        )
    
    query = db.query(Alert).filter(Alert.is_resolved == False)
    
    query = query.join(Alert.session).join(ClassSession.group).join(Group.subject).filter(
        Subject.teacher_id == current_user.id
    )
    
    if session_id:
        query = query.filter(Alert.session_id == session_id)
    
    alerts = query.order_by(desc(Alert.created_at)).limit(limit).all()
    
    alerts_data = []
    for alert in alerts:
        alerts_data.append({
            "id": str(alert.id),
            "session_id": str(alert.session_id),
            "student_id": str(alert.student_id) if alert.student_id else None,
            "student_name": alert.student.full_name if alert.student else None,
            "alert_type": alert.alert_type,
            "priority": alert.priority,
            "message": alert.message,
            "created_at": alert.created_at.isoformat()
        })
    
    return {
        "total_unresolved": len(alerts_data),
        "alerts": alerts_data
    }


@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marcar una alerta como resuelta"""
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    if current_user.role == UserRole.TEACHER:
        session = alert.session
        if session.group.subject.teacher_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
    
    alert.is_resolved = True
    alert.resolved_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": "Alert resolved successfully",
        "alert_id": str(alert_id)
    }
