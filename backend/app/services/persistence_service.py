# backend/app/services/persistence_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from uuid import UUID

from app.models.metrics import (
    ClassSession, SessionAttendance, AttentionMetric, 
    Alert, ClassFeedback, SessionStatus, AttentionLevel
)
from app.schemas.metrics import (
    SessionCreate, AttendanceCreate, MetricCreate, AlertCreate
)

class PersistenceService:
    """Servicio para persistir métricas en la base de datos"""
    
    @staticmethod
    def create_session(db: Session, session_data: SessionCreate) -> ClassSession:
        """Crea una nueva sesión de clase"""
        db_session = ClassSession(
            class_id=session_data.class_id,
            started_at=session_data.started_at or datetime.utcnow(),
            status=SessionStatus.ACTIVE
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        return db_session
    
    @staticmethod
    def end_session(db: Session, session_id: UUID) -> ClassSession:
        """Finaliza una sesión de clase"""
        session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
        if session:
            session.ended_at = datetime.utcnow()
            session.status = SessionStatus.COMPLETED
            
            # Calcular duración
            if session.started_at:
                duration = session.ended_at - session.started_at
                session.duration_minutes = int(duration.total_seconds() / 60)
            
            # Calcular promedio de atención
            avg_score = db.query(func.avg(AttentionMetric.attention_score)).filter(
                AttentionMetric.session_id == session_id
            ).scalar()
            session.average_attention_score = float(avg_score) if avg_score else None
            
            db.commit()
            db.refresh(session)
        return session
    
    @staticmethod
    def record_attendance(db: Session, attendance_data: AttendanceCreate) -> SessionAttendance:
        """Registra la asistencia de un estudiante"""
        attendance = SessionAttendance(
            session_id=attendance_data.session_id,
            student_id=attendance_data.student_id,
            joined_at=datetime.utcnow()
        )
        db.add(attendance)
        
        # Actualizar contador de estudiantes presentes
        session = db.query(ClassSession).filter(
            ClassSession.id == attendance_data.session_id
        ).first()
        if session:
            session.total_students_present += 1
        
        db.commit()
        db.refresh(attendance)
        return attendance
    
    @staticmethod
    def end_attendance(db: Session, attendance_id: UUID) -> SessionAttendance:
        """Finaliza la asistencia de un estudiante"""
        attendance = db.query(SessionAttendance).filter(
            SessionAttendance.id == attendance_id
        ).first()
        
        if attendance:
            attendance.left_at = datetime.utcnow()
            
            # Calcular duración
            if attendance.joined_at:
                duration = attendance.left_at - attendance.joined_at
                attendance.duration_minutes = int(duration.total_seconds() / 60)
            
            # Calcular métricas del estudiante
            metrics = db.query(AttentionMetric).filter(
                AttentionMetric.session_id == attendance.session_id,
                AttentionMetric.student_id == attendance.student_id
            ).all()
            
            if metrics:
                attendance.average_attention_score = sum(m.attention_score for m in metrics) / len(metrics)
                attendance.total_blinks = sum(1 for m in metrics if m.blink_detected)
                attendance.total_yawns = sum(1 for m in metrics if m.yawns_detected)
            
            db.commit()
            db.refresh(attendance)
        
        return attendance
    
    @staticmethod
    def save_metric(db: Session, metric_data: MetricCreate) -> AttentionMetric:
        """Guarda una métrica de atención"""
        metric = AttentionMetric(
            session_id=metric_data.session_id,
            student_id=metric_data.student_id,
            timestamp=datetime.utcnow(),
            attention_level=AttentionLevel[metric_data.attention_level],
            attention_score=metric_data.attention_score,
            confidence=metric_data.confidence,
            ear=metric_data.ear,
            mar=metric_data.mar,
            blink_detected=metric_data.blink_detected,
            yawns_detected=metric_data.yawns_detected,
            looking_away=metric_data.looking_away,
            head_pose_pitch=metric_data.head_pose_pitch,
            head_pose_yaw=metric_data.head_pose_yaw,
            head_pose_roll=metric_data.head_pose_roll,
            prob_low=metric_data.prob_low,
            prob_medium=metric_data.prob_medium,
            prob_high=metric_data.prob_high,
            using_ml=metric_data.using_ml
        )
        db.add(metric)
        db.commit()
        db.refresh(metric)
        return metric
    
    @staticmethod
    def save_alert(db: Session, alert_data: AlertCreate) -> Alert:
        """Guarda una alerta"""
        alert = Alert(
            session_id=alert_data.session_id,
            student_id=alert_data.student_id,
            alert_type=alert_data.alert_type,
            priority=alert_data.priority,
            message=alert_data.message,
            created_at=datetime.utcnow()
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert
    
    @staticmethod
    def get_session_metrics(
        db: Session, 
        session_id: UUID, 
        student_id: Optional[UUID] = None
    ) -> List[AttentionMetric]:
        """Obtiene métricas de una sesión"""
        query = db.query(AttentionMetric).filter(
            AttentionMetric.session_id == session_id
        )
        
        if student_id:
            query = query.filter(AttentionMetric.student_id == student_id)
        
        return query.order_by(AttentionMetric.timestamp.asc()).all()
    
    @staticmethod
    def get_student_history(
        db: Session,
        student_id: UUID,
        days: int = 30
    ) -> List[SessionAttendance]:
        """Obtiene historial de asistencias de un estudiante"""
        since_date = datetime.utcnow() - timedelta(days=days)
        
        return db.query(SessionAttendance).filter(
            SessionAttendance.student_id == student_id,
            SessionAttendance.joined_at >= since_date
        ).order_by(SessionAttendance.joined_at.desc()).all()
    
    @staticmethod
    def get_class_statistics(db: Session, class_id: UUID) -> Dict:
        """Obtiene estadísticas generales de una clase"""
        sessions = db.query(ClassSession).filter(
            ClassSession.class_id == class_id,
            ClassSession.status == SessionStatus.COMPLETED
        ).all()
        
        if not sessions:
            return {
                'total_sessions': 0,
                'average_attention': 0,
                'total_students': 0
            }
        
        avg_attention = sum(s.average_attention_score or 0 for s in sessions) / len(sessions)
        
        return {
            'total_sessions': len(sessions),
            'average_attention': avg_attention,
            'total_students': max(s.total_students_present for s in sessions)
        }

# Instancia global
persistence_service = PersistenceService()