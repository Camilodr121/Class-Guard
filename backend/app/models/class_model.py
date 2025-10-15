# backend/app/models/class_model.py
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Time, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.session import Base

class Class(Base):
    __tablename__ = "classes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(200), nullable=False)
    description = Column(Text)
    subject = Column(String(100))
    schedule_day = Column(String(20))
    schedule_time = Column(Time)
    duration_minutes = Column(Integer, default=60)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    teacher = relationship("User", backref="classes_teaching")
    
    def __repr__(self):
        return f"<Class {self.name}>"

class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"))
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    class_obj = relationship("Class", backref="enrollments")
    student = relationship("User", backref="enrolled_classes")