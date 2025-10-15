# backend/app/schemas/metrics.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime
from uuid import UUID

class SessionCreate(BaseModel):
    class_id: UUID
    started_at: Optional[datetime] = None

class SessionResponse(BaseModel):
    id: UUID
    class_id: UUID
    started_at: datetime
    ended_at: Optional[datetime]
    duration_minutes: Optional[int]
    average_attention_score: Optional[float]
    total_students_present: int
    status: str
    
    class Config:
        from_attributes = True

class AttendanceCreate(BaseModel):
    session_id: UUID
    student_id: UUID

class AttendanceResponse(BaseModel):
    id: UUID
    session_id: UUID
    student_id: UUID
    joined_at: datetime
    left_at: Optional[datetime]
    duration_minutes: Optional[int]
    average_attention_score: Optional[float]
    total_blinks: int
    total_yawns: int
    
    class Config:
        from_attributes = True

class MetricCreate(BaseModel):
    session_id: UUID
    student_id: UUID
    attention_level: str
    attention_score: float
    confidence: Optional[float] = None
    ear: Optional[float] = None
    mar: Optional[float] = None
    blink_detected: bool = False
    yawns_detected: bool = False
    looking_away: bool = False
    head_pose_pitch: Optional[float] = None
    head_pose_yaw: Optional[float] = None
    head_pose_roll: Optional[float] = None
    prob_low: Optional[float] = None
    prob_medium: Optional[float] = None
    prob_high: Optional[float] = None
    using_ml: bool = True

class MetricResponse(BaseModel):
    id: UUID
    session_id: UUID
    student_id: UUID
    timestamp: datetime
    attention_level: str
    attention_score: float
    confidence: Optional[float]
    
    class Config:
        from_attributes = True

class AlertCreate(BaseModel):
    session_id: UUID
    student_id: Optional[UUID] = None
    alert_type: str
    priority: str
    message: str

class AlertResponse(BaseModel):
    id: UUID
    session_id: UUID
    student_id: Optional[UUID]
    alert_type: str
    priority: str
    message: str
    created_at: datetime
    acknowledged_at: Optional[datetime]
    is_acknowledged: bool
    
    class Config:
        from_attributes = True