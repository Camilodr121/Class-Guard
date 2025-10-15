# backend/app/models/__init__.py
"""
Importar todos los modelos para que SQLAlchemy los detecte
"""

from app.models.user import User, UserRole
from app.models.academic import Subject, Group, GroupMembership, AcademicPeriod
from app.models.metrics import (
    ClassSession,
    SessionAttendance,
    AttentionMetric,
    Alert,
    ClassFeedback,
    SessionStatus,
    AttentionLevel
)

# Mantener compatibilidad con imports antiguos
from app.models.class_model import Class, ClassEnrollment

__all__ = [
    # User models
    "User",
    "UserRole",
    
    # Academic models (NEW)
    "Subject",
    "Group",
    "GroupMembership",
    "AcademicPeriod",
    
    # Metrics models
    "ClassSession",
    "SessionAttendance",
    "AttentionMetric",
    "Alert",
    "ClassFeedback",
    "SessionStatus",
    "AttentionLevel",
    
    # Legacy models (mantener por compatibilidad)
    "Class",
    "ClassEnrollment",
]