# backend/app/models/academic.py
"""
Modelos para el sistema académico de Class Guard
Incluye: Asignaturas (Subjects), Grupos (Groups), Matriculación
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, UniqueConstraint, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.session import Base

class Subject(Base):
    """Asignaturas/Materias del sistema"""
    __tablename__ = "subjects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Profesor responsable de la asignatura
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Información académica
    credits = Column(Integer, default=3)
    semester = Column(String(20), nullable=True)  # "2024-1", "2024-2", etc.
    department = Column(String(100), nullable=True)
    
    # Control
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    teacher = relationship("User", backref="subjects_teaching", foreign_keys=[teacher_id])
    groups = relationship("Group", back_populates="subject", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Subject {self.code} - {self.name}>"


class Group(Base):
    """Grupos de estudiantes para una asignatura"""
    __tablename__ = "groups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False, index=True)  # "A", "B", "101", etc.
    
    # Relación con asignatura
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    
    # Horario
    schedule_day = Column(String(20), nullable=True)  # "Lunes", "Martes", etc.
    schedule_time = Column(Time, nullable=True)
    duration_minutes = Column(Integer, default=90)
    classroom = Column(String(50), nullable=True)
    
    # Capacidad
    max_students = Column(Integer, default=30)
    
    # Control
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Constraint para código único por asignatura
    __table_args__ = (
        UniqueConstraint('subject_id', 'code', name='uq_subject_group_code'),
    )
    
    # Relationships
    subject = relationship("Subject", back_populates="groups")
    creator = relationship("User", foreign_keys=[created_by])
    memberships = relationship("GroupMembership", back_populates="group", cascade="all, delete-orphan")
    sessions = relationship("ClassSession", back_populates="group", cascade="all, delete-orphan")
    
    @property
    def current_students_count(self):
        """Número actual de estudiantes en el grupo"""
        return len([m for m in self.memberships if m.is_active])
    
    @property
    def is_full(self):
        """Verifica si el grupo está lleno"""
        return self.current_students_count >= self.max_students
    
    def __repr__(self):
        return f"<Group {self.code} - {self.name}>"


class GroupMembership(Base):
    """Membresía de estudiantes en grupos"""
    __tablename__ = "group_memberships"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relaciones
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Fechas
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    unenrolled_at = Column(DateTime, nullable=True)
    
    # Control
    is_active = Column(Boolean, default=True)
    enrolled_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Constraint para evitar duplicados
    __table_args__ = (
        UniqueConstraint('group_id', 'student_id', name='uq_group_student'),
    )
    
    # Relationships
    group = relationship("Group", back_populates="memberships")
    student = relationship("User", foreign_keys=[student_id], backref="group_memberships")
    enrolling_user = relationship("User", foreign_keys=[enrolled_by])
    
    def __repr__(self):
        return f"<GroupMembership {self.student_id} in {self.group_id}>"


class AcademicPeriod(Base):
    """Periodos académicos (semestres, trimestres, etc.)"""
    __tablename__ = "academic_periods"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)  # "2024-1", "Primer Semestre 2024"
    code = Column(String(20), nullable=False, unique=True, index=True)  # "2024-1"
    
    # Fechas
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    # Control
    is_active = Column(Boolean, default=True)
    is_current = Column(Boolean, default=False)  # Solo un periodo puede ser el actual
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<AcademicPeriod {self.name}>"