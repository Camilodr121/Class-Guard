# backend/app/models/metrics.py (ACTUALIZADO)
"""
Modelos de métricas actualizados para Class Guard
Conectados con el nuevo sistema de Grupos y Asignaturas
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.db.session import Base

class SessionStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class AttentionLevel(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class ClassSession(Base):
    """Sesión de clase (cada vez que se da una clase)"""
    __tablename__ = "class_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # NUEVO: Relación directa con Grupo (que ya está vinculado a Asignatura)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Fechas y duración
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    ended_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Métricas de la sesión
    average_attention_score = Column(Float, nullable=True)
    total_students_present = Column(Integer, default=0)
    total_students_expected = Column(Integer, default=0)  # NUEVO: Cuántos estudiantes hay en el grupo
    
    # Estado
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.SCHEDULED, index=True)
    
    # Metadata
    notes = Column(Text, nullable=True)  # NUEVO: Notas del profesor sobre la sesión
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group = relationship("Group", back_populates="sessions")
    attendances = relationship("SessionAttendance", back_populates="session", cascade="all, delete-orphan")
    metrics = relationship("AttentionMetric", back_populates="session", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="session", cascade="all, delete-orphan")
    feedback = relationship("ClassFeedback", back_populates="session", cascade="all, delete-orphan", uselist=False)
    
    @property
    def attendance_rate(self):
        """Porcentaje de asistencia"""
        if self.total_students_expected == 0:
            return 0
        return (self.total_students_present / self.total_students_expected) * 100
    
    @property
    def subject(self):
        """Acceso rápido a la asignatura"""
        return self.group.subject if self.group else None
    
    @property
    def teacher(self):
        """Acceso rápido al profesor"""
        return self.group.subject.teacher if self.group and self.group.subject else None
    
    def __repr__(self):
        return f"<ClassSession {self.id} - {self.status}>"


class SessionAttendance(Base):
    """Asistencia de estudiantes a sesiones"""
    __tablename__ = "session_attendance"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Fechas
    joined_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Métricas acumuladas
    average_attention_score = Column(Float, nullable=True)
    min_attention_score = Column(Float, nullable=True)  # NUEVO
    max_attention_score = Column(Float, nullable=True)  # NUEVO
    total_blinks = Column(Integer, default=0)
    total_yawns = Column(Integer, default=0)
    
    # NUEVO: Métricas adicionales
    time_looking_away_seconds = Column(Integer, default=0)
    total_low_attention_events = Column(Integer, default=0)  # Cuántas veces bajó de 40%
    
    # Relationships
    session = relationship("ClassSession", back_populates="attendances")
    student = relationship("User", backref="session_attendances")
    
    @property
    def was_attentive(self):
        """Determina si el estudiante estuvo atento (promedio >= 60%)"""
        return self.average_attention_score >= 60 if self.average_attention_score else False
    
    def __repr__(self):
        return f"<SessionAttendance {self.student_id} in {self.session_id}>"


class AttentionMetric(Base):
    """Métricas de atención en tiempo real"""
    __tablename__ = "attention_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    # Clasificación ML
    attention_level = Column(SQLEnum(AttentionLevel), nullable=False, index=True)
    attention_score = Column(Float, nullable=False)
    confidence = Column(Float, nullable=True)
    
    # Métricas CV
    ear = Column(Float, nullable=True)  # Eye Aspect Ratio
    mar = Column(Float, nullable=True)  # Mouth Aspect Ratio
    blink_detected = Column(Boolean, default=False)
    yawns_detected = Column(Boolean, default=False)
    looking_away = Column(Boolean, default=False)
    
    # Head pose
    head_pose_pitch = Column(Float, nullable=True)
    head_pose_yaw = Column(Float, nullable=True)
    head_pose_roll = Column(Float, nullable=True)
    
    # Probabilidades ML
    prob_low = Column(Float, nullable=True)
    prob_medium = Column(Float, nullable=True)
    prob_high = Column(Float, nullable=True)
    
    # Metadata
    using_ml = Column(Boolean, default=True)
    
    # Relationships
    session = relationship("ClassSession", back_populates="metrics")
    student = relationship("User", backref="attention_metrics")
    
    def __repr__(self):
        return f"<AttentionMetric {self.student_id} - {self.attention_level} @ {self.timestamp}>"


class Alert(Base):
    """Alertas generadas para el profesor"""
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    
    # Tipo y prioridad
    alert_type = Column(String(50), nullable=False, index=True)
    priority = Column(String(20), nullable=False, index=True)
    message = Column(Text, nullable=False)
    
    # Control
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    is_acknowledged = Column(Boolean, default=False)
    
    # Relationships
    session = relationship("ClassSession", back_populates="alerts")
    student = relationship("User", backref="alerts_received")
    
    def __repr__(self):
        return f"<Alert {self.priority} - {self.alert_type}>"


class ClassFeedback(Base):
    """Feedback de clase para el profesor"""
    __tablename__ = "class_feedback"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Métricas generales
    class_average_attention = Column(Float, nullable=True)
    attendance_rate = Column(Float, nullable=True)
    
    # Análisis
    trend = Column(String(20), nullable=True)  # "improving", "stable", "declining"
    insights = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)  # NUEVO: Recomendaciones automáticas
    
    # Control
    was_viewed = Column(Boolean, default=False)
    
    # Relationships
    session = relationship("ClassSession", back_populates="feedback")
    
    def __repr__(self):
        return f"<ClassFeedback for {self.session_id}>"