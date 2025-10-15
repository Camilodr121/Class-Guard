# backend/app/api/endpoints/analytics.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.db.session import get_db
from app.services.analytics_service.analytics import analytics_service
from app.api.endpoints.auth import oauth2_scheme
from app.core.security import verify_token
from app.models.user import User

router = APIRouter()

async def get_current_user_from_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Obtiene el usuario actual desde el token"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.get("/student/dashboard")
async def get_student_dashboard(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Obtiene estadísticas para el dashboard del estudiante
    """
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    stats = analytics_service.get_student_dashboard_stats(db, current_user.id)
    return stats

@router.get("/teacher/dashboard")
async def get_teacher_dashboard(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Obtiene estadísticas para el dashboard del profesor
    """
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    stats = analytics_service.get_teacher_dashboard_stats(db, current_user.id)
    return stats

@router.get("/session/{session_id}/report")
async def get_session_report(
    session_id: UUID,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Obtiene reporte detallado de una sesión
    """
    report = analytics_service.get_session_detailed_report(db, session_id)
    
    if 'error' in report or not report:
        raise HTTPException(status_code=404, detail="Session not found or no data available")
    
    return report

@router.get("/class/{class_id}/progress")
async def get_class_progress(
    class_id: UUID,
    weeks: int = 4,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Obtiene reporte de progreso de una clase
    """
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    report = analytics_service.get_class_progress_report(db, class_id, weeks)
    
    if 'error' in report:
        raise HTTPException(status_code=404, detail=report['error'])
    
    return report

@router.get("/student/{student_id}/detailed-report")
async def get_student_detailed_report(
    student_id: UUID,
    weeks: int = 4,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Obtiene reporte detallado de un estudiante
    """
    # Verificar permisos
    if current_user.role == 'student' and str(current_user.id) != str(student_id):
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    report = analytics_service.get_student_detailed_report(db, student_id, weeks)
    
    if 'error' in report:
        raise HTTPException(status_code=404, detail=report['error'])
    
    return report

@router.get("/export/session/{session_id}/csv")
async def export_session_csv(
    session_id: UUID,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Exporta datos de sesión a CSV
    """
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    report = analytics_service.get_session_detailed_report(db, session_id)
    
    if 'error' in report or not report:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Crear CSV en memoria
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        'Student ID', 'Student Name', 'Duration (min)', 
        'Average Attention', 'Total Blinks', 'Total yawns',
        'High %', 'Medium %', 'Low %'
    ])
    
    # Data
    for student in report.get('student_stats', []):
        dist = student['attention_distribution']
        total_samples = dist['high'] + dist['medium'] + dist['low']
        
        writer.writerow([
            student['student_id'],
            student['student_name'],
            student['duration_minutes'],
            student['average_attention'],
            student['total_blinks'],
            student['total_yawns'],
            f"{(dist['high']/total_samples*100):.1f}%" if total_samples > 0 else "0%",
            f"{(dist['medium']/total_samples*100):.1f}%" if total_samples > 0 else "0%",
            f"{(dist['low']/total_samples*100):.1f}%" if total_samples > 0 else "0%"
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=session_{session_id}_report.csv"
        }
    )