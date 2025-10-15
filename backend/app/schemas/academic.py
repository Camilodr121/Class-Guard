# backend/app/schemas/academic.py
"""
Schemas de Pydantic para el sistema académico
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, time
from uuid import UUID

# ==================== SUBJECT SCHEMAS ====================

class SubjectBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    code: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None
    credits: int = Field(default=3, ge=1, le=10)
    semester: Optional[str] = None
    department: Optional[str] = None

class SubjectCreate(SubjectBase):
    teacher_id: Optional[UUID] = None

class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    teacher_id: Optional[UUID] = None
    credits: Optional[int] = Field(None, ge=1, le=10)
    semester: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class SubjectResponse(SubjectBase):
    id: UUID
    teacher_id: Optional[UUID]
    teacher_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    total_groups: int = 0
    total_students: int = 0
    
    class Config:
        from_attributes = True

class SubjectWithStats(SubjectResponse):
    """Subject con estadísticas completas"""
    average_attention_score: Optional[float] = None
    total_sessions: int = 0
    active_sessions: int = 0

# ==================== GROUP SCHEMAS ====================

class GroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    schedule_day: Optional[str] = None
    schedule_time: Optional[time] = None
    duration_minutes: int = Field(default=90, ge=30, le=300)
    classroom: Optional[str] = None
    max_students: int = Field(default=30, ge=1, le=100)

class GroupCreate(GroupBase):
    subject_id: UUID

class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    schedule_day: Optional[str] = None
    schedule_time: Optional[time] = None
    duration_minutes: Optional[int] = Field(None, ge=30, le=300)
    classroom: Optional[str] = None
    max_students: Optional[int] = Field(None, ge=1, le=100)
    is_active: Optional[bool] = None

class GroupResponse(GroupBase):
    id: UUID
    subject_id: UUID
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    created_at: datetime
    created_by: Optional[UUID]
    is_active: bool
    current_students_count: int = 0
    is_full: bool = False
    
    class Config:
        from_attributes = True

class GroupWithStudents(GroupResponse):
    """Group con lista de estudiantes"""
    students: List[dict] = []

class GroupWithStats(GroupResponse):
    """Group con estadísticas"""
    average_attention_score: Optional[float] = None
    total_sessions: int = 0
    active_session_id: Optional[UUID] = None

# ==================== GROUP MEMBERSHIP SCHEMAS ====================

class GroupMembershipCreate(BaseModel):
    group_id: UUID
    student_id: UUID

class GroupMembershipBulkCreate(BaseModel):
    group_id: UUID
    student_ids: List[UUID] = Field(..., min_items=1)

class GroupMembershipResponse(BaseModel):
    id: UUID
    group_id: UUID
    student_id: UUID
    student_name: str
    student_email: str
    enrolled_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class StudentEnrollmentInfo(BaseModel):
    """Información de matrícula de un estudiante"""
    student_id: UUID
    student_name: str
    student_email: str
    groups: List[GroupResponse] = []
    subjects: List[SubjectResponse] = []

# ==================== ACADEMIC PERIOD SCHEMAS ====================

class AcademicPeriodBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    start_date: datetime
    end_date: datetime

    @validator('end_date')
    def validate_dates(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

class AcademicPeriodCreate(AcademicPeriodBase):
    is_current: bool = False

class AcademicPeriodUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    is_active: Optional[bool] = None
    is_current: Optional[bool] = None

class AcademicPeriodResponse(AcademicPeriodBase):
    id: UUID
    is_active: bool
    is_current: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== DASHBOARD SCHEMAS ====================

class TeacherDashboardStats(BaseModel):
    """Estadísticas para el dashboard del profesor"""
    total_subjects: int
    total_groups: int
    total_students: int
    active_sessions: int
    average_attention_today: Optional[float]
    total_sessions_today: int
    alerts_today: int

class StudentDashboardStats(BaseModel):
    """Estadísticas para el dashboard del estudiante"""
    enrolled_groups: int
    enrolled_subjects: int
    total_sessions_attended: int
    average_attention_score: Optional[float]
    total_hours: float
    last_session_date: Optional[datetime]
    current_streak: int = 0

class SubjectStatistics(BaseModel):
    """Estadísticas de una asignatura"""
    subject_id: UUID
    subject_name: str
    total_groups: int
    total_students: int
    total_sessions: int
    average_attention_score: Optional[float]
    attendance_rate: Optional[float]
    trend: str = "stable"

class GroupStatistics(BaseModel):
    """Estadísticas de un grupo"""
    group_id: UUID
    group_name: str
    total_students: int
    total_sessions: int
    average_attention_score: Optional[float]
    attendance_rate: Optional[float]
    most_attentive_students: List[dict] = []
    needs_attention_students: List[dict] = []