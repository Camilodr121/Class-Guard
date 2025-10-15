# backend/app/api/endpoints/cv.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import cv2
import numpy as np
from io import BytesIO

from app.services.cv_service.processor import cv_processor

router = APIRouter()

class Base64ImageRequest(BaseModel):
    """Request con imagen en base64"""
    image: str
    student_id: Optional[str] = None
    session_id: Optional[str] = None

class CVMetricsResponse(BaseModel):
    """Response con métricas de CV"""
    ear: float
    mar: float
    head_pose: dict
    blink_detected: bool
    yawn_detected: bool  # Cambiado de yawns_detected para consistencia
    looking_away: bool
    total_blinks: int
    total_yawns: int  # Cambiado de total_yawns para consistencia
    blink_rate: float
    face_detected: bool
    timestamp: float

@router.post("/process-frame", response_model=CVMetricsResponse)
async def process_frame(
    request: Base64ImageRequest,
    user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Procesa un frame de video y retorna métricas de atención
    
    Ejemplo de uso:
    POST /api/cv/process-frame
    {
        "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
        "student_id": "uuid",
        "session_id": "uuid"
    }
    """
    try:
        # Determinar session_id (prioridad: request > user_id header > default)
        session_id = request.session_id
        
        if not session_id and request.student_id:
            session_id = f"student-{request.student_id}"
        elif not session_id and user_id:
            session_id = f"user-{user_id}"
        elif not session_id:
            session_id = "default"
        
        print(f"\n📸 [CV Endpoint] Procesando frame para sesión: {session_id}")
        
        # Procesar frame CON session_id
        metrics = cv_processor.process_base64_image(
            request.image, 
            session_id=session_id
        )
        
        if metrics is None:
            print(f"⚠️ [CV Endpoint] No se pudo procesar la imagen")
            return CVMetricsResponse(
                ear=0.0,
                mar=0.0,
                head_pose={'pitch': 0.0, 'yaw': 0.0, 'roll': 0.0},
                blink_detected=False,
                yawn_detected=False,
                looking_away=False,
                total_blinks=0,
                total_yawns=0,
                blink_rate=0.0,
                face_detected=False,
                timestamp=0.0
            )
        
        print(f"✅ [CV Endpoint] Métricas obtenidas - Blinks: {metrics['total_blinks']}, Yawns: {metrics['total_yawns']}")
        
        return CVMetricsResponse(**metrics)
    
    except Exception as e:
        print(f"❌ [CV Endpoint] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing frame: {str(e)}")

@router.post("/upload-frame")
async def upload_frame(
    file: UploadFile = File(...),
    session_id: Optional[str] = None
):
    """
    Procesa un archivo de imagen subido
    """
    try:
        # Leer archivo
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Usar session_id o default
        sid = session_id or "default"
        
        # Procesar frame CON session_id
        metrics = cv_processor.process_frame(image, session_id=sid)
        
        if metrics is None:
            raise HTTPException(status_code=400, detail="No face detected in image")
        
        return metrics
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing uploaded frame: {str(e)}")

@router.get("/stats")
async def get_cv_stats(
    session_id: str = "default",
    user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Obtiene estadísticas del procesador de CV para una sesión
    """
    # Si hay user_id, usarlo
    if user_id and session_id == "default":
        session_id = f"user-{user_id}"
    
    return cv_processor.get_stats(session_id)

@router.post("/reset")
async def reset_cv_processor(
    session_id: str = "default",
    user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Reinicia el procesador de CV para una sesión
    """
    # Si hay user_id, usarlo
    if user_id and session_id == "default":
        session_id = f"user-{user_id}"
    
    cv_processor.reset_session(session_id)
    return {
        "message": f"CV processor reset successfully for session {session_id}",
        "session_id": session_id
    }

@router.delete("/session/{session_id}")
async def remove_session(session_id: str):
    """
    Elimina una sesión y libera recursos
    """
    cv_processor.remove_session(session_id)
    return {
        "message": f"Session {session_id} removed successfully"
    }

@router.get("/health")
async def cv_health_check():
    """
    Verifica que el servicio de CV esté funcionando
    """
    stats = cv_processor.get_stats()
    
    return {
        "status": "healthy",
        "service": "computer_vision",
        "mediapipe_available": True,
        "opencv_available": True,
        "active_sessions": stats.get('active_sessions', 0),
        "frames_processed": stats.get('frames_processed', 0)
    }