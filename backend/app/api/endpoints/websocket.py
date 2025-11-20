# backend/app/api/endpoints/websocket.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import json
from datetime import datetime
from uuid import UUID

from app.websocket.manager import ws_manager
from app.db.session import get_db
from app.core.security import verify_token
from app.models.user import User
from app.models.metrics import ClassSession, SessionAttendance, SessionStatus, AttentionLevel
from app.services.persistence_service import persistence_service
from app.schemas.metrics import MetricCreate, AlertCreate, AttendanceCreate

router = APIRouter()

async def get_current_user_ws(token: str, db: Session) -> Optional[User]:
    """Obtiene el usuario actual desde el token (para WebSocket)"""
    try:
        payload = verify_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(...),
    session_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Endpoint principal de WebSocket"""
    # Verificar autenticación
    user = await get_current_user_ws(token, db)
    if not user or str(user.id) != user_id:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    # Conectar usuario
    await ws_manager.connect(websocket, user_id, user.role, session_id)
    
    # Si hay sesión y es estudiante, verificar o registrar asistencia
    attendance_id = None
    if session_id and user.role == "student":
        try:
            session_uuid = UUID(session_id)
        
            # ✅ VERIFICAR si ya existe asistencia activa
            existing_attendance = db.query(SessionAttendance).filter(
                SessionAttendance.session_id == session_uuid,
                SessionAttendance.student_id == user.id,
                SessionAttendance.left_at.is_(None)  # Aún activa
            ).first()
        
            if existing_attendance:
                # Ya existe una asistencia activa, reutilizarla
                attendance_id = str(existing_attendance.id)
                print(f"✅ Asistencia existente reutilizada: {attendance_id}")
            else:
                # No existe, crear una nueva
                attendance = persistence_service.record_attendance(
                    db,
                    AttendanceCreate(session_id=session_uuid, student_id=user.id)
                )
                attendance_id = str(attendance.id)
                print(f"✅ Nueva asistencia registrada: {attendance_id}")
        except Exception as e:
            print(f"⚠️ Error gestionando asistencia: {e}")
            
    try:
        await websocket.send_json({
            'type': 'CONNECTION_SUCCESS',
            'user_id': user_id,
            'role': user.role,
            'session_id': session_id,
            'attendance_id': attendance_id,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        while True:
            data = await websocket.receive_json()
            message_type = data.get('type')
            
            if message_type == 'HEARTBEAT':
                await websocket.send_json({
                    'type': 'PONG',
                    'timestamp': datetime.utcnow().isoformat()
                })
            
            elif message_type == 'ATTENTION_METRICS':
                print(f"\n🎯 RECIBIDO: ATTENTION_METRICS de {user_id}")
                print(f"   📦 Data completo: {data}")
                await process_attention_metrics(data, user_id, user.role, session_id, db)
            
            elif message_type == 'START_MONITORING':
                await websocket.send_json({
                    'type': 'MONITORING_STARTED',
                    'session_id': session_id,
                    'timestamp': datetime.utcnow().isoformat()
                })
            
            elif message_type == 'STOP_MONITORING':
                # Si es estudiante, finalizar asistencia
                if attendance_id and user.role == "student":
                    try:
                        persistence_service.end_attendance(db, UUID(attendance_id))
                        print(f"✅ Asistencia finalizada: {attendance_id}")
                    except Exception as e:
                        print(f"⚠️ Error finalizando asistencia: {e}")
                
                await websocket.send_json({
                    'type': 'MONITORING_STOPPED',
                    'timestamp': datetime.utcnow().isoformat()
                })
            
            elif message_type == 'REQUEST_CLASS_STATS':
                if user.role == 'teacher' and session_id:
                    stats = await get_class_statistics(session_id, db)
                    await websocket.send_json({
                        'type': 'CLASS_STATS',
                        'data': stats,
                        'timestamp': datetime.utcnow().isoformat()
                    })
            
            else:
                print(f"Unknown message type: {message_type}")
    
    except WebSocketDisconnect:
        # Finalizar asistencia si se desconecta
        if attendance_id and user.role == "student":
            try:
                persistence_service.end_attendance(db, UUID(attendance_id))
                print(f"✅ Asistencia finalizada por desconexión: {attendance_id}")
            except Exception as e:
                print(f"⚠️ Error finalizando asistencia: {e}")
        
        ws_manager.disconnect(websocket, user_id, session_id)
        
        if session_id:
            await ws_manager.broadcast_to_session(
                session_id,
                {
                    'type': 'USER_LEFT',
                    'user_id': user_id,
                    'timestamp': datetime.utcnow().isoformat()
                }
            )
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        import traceback
        traceback.print_exc()
        ws_manager.disconnect(websocket, user_id, session_id)


async def process_attention_metrics(data: dict, user_id: str, user_role: str, session_id: str, db: Session):
    """Procesa las métricas de atención recibidas del estudiante"""
    try:
        print(f"\n📊 Procesando métricas de atención para usuario: {user_id}")
        
        # ✅ CORRECCIÓN: Leer del objeto metrics correctamente
        metrics = data.get('metrics', {})
        score = metrics.get('attention_score', 75)
        level_map = {
            'LOW': AttentionLevel.LOW,
            'MEDIUM': AttentionLevel.MEDIUM,
            'HIGH': AttentionLevel.HIGH
        }
        level = level_map.get(metrics.get('attention_level', 'MEDIUM'), AttentionLevel.MEDIUM)
        
        print(f"   📥 Métricas recibidas: {metrics}")
        print(f"   📊 Score: {score}, Nivel: {level}")
        
        # ✅ Usar los nombres correctos
        processed_metrics = {
            'student_id': user_id,
            'attention_score': score,
            'attention_level': str(level.value) if hasattr(level, 'value') else str(level),
            'confidence': 0.8,
            'probabilities': {'low': 0.2, 'medium': 0.3, 'high': 0.5},
            'ear': metrics.get('ear', 0),
            'mar': metrics.get('mar', 0),
            'blinks': metrics.get('blinks', 0),  # ✅ CORREGIDO
            'yawns': metrics.get('yawns', 0),    # ✅ CORREGIDO
            'looking_away': metrics.get('looking_away', False),
            'head_pose': metrics.get('head_pose', {}),
            'using_ml': False
        }
        
        print(f"   ✅ Score calculado: {score}")
        
        # GUARDAR EN BASE DE DATOS
        if session_id and session_id != 'temp-session':
            try:
                session_uuid = UUID(session_id)
                user_uuid = UUID(user_id)
                
                # Crear objeto MetricCreate
                metric_data = MetricCreate(
                    session_id=session_uuid,
                    student_id=user_uuid,
                    attention_level=level,
                    attention_score=float(score),
                    confidence=0.8,
                    ear=metrics.get('ear'),
                    mar=metrics.get('mar'),
                    blink_detected=metrics.get('blink_detected', False),
                    yawns_detected=metrics.get('yawn_detected', False),
                    looking_away=metrics.get('looking_away', False),
                    head_pose_pitch=metrics.get('head_pose', {}).get('pitch'),
                    head_pose_yaw=metrics.get('head_pose', {}).get('yaw'),
                    head_pose_roll=metrics.get('head_pose', {}).get('roll'),
                    prob_low=0.2,
                    prob_medium=0.3,
                    prob_high=0.5,
                    using_ml=False
                )
                
                # Guardar métrica
                saved_metric = persistence_service.save_metric(db, metric_data)
                print(f"   💾 Métrica guardada en BD: {saved_metric.id}")
                
                # Actualizar totales en asistencia
                attendance = db.query(SessionAttendance).filter(
                    SessionAttendance.session_id == session_uuid,
                    SessionAttendance.student_id == user_uuid,
                    SessionAttendance.left_at.is_(None)
                ).first()
                
                if attendance:
                    # ✅ CORRECCIÓN: Actualizar con totales recibidos
                    total_blinks = metrics.get('blinks', 0)
                    total_yawns = metrics.get('yawns', 0)
                    
                    attendance.total_blinks = total_blinks
                    attendance.total_yawns = total_yawns
                    
                    # ✅ Actualizar score promedio acumulativo
                    if attendance.average_attention_score is None:
                        attendance.average_attention_score = float(score)
                    else:
                        # Promedio móvil
                        attendance.average_attention_score = (
                            attendance.average_attention_score * 0.9 + float(score) * 0.1
                        )
                    
                    db.commit()
                    print(f"   ✅ Totales actualizados: {attendance.total_blinks} pestañeos, {attendance.total_yawns} bostezos, Promedio: {attendance.average_attention_score:.2f}")
                
                # Generar alerta si la atención es baja
                if score < 40:
                    alert_data = AlertCreate(
                        session_id=session_uuid,
                        student_id=user_uuid,
                        alert_type="LOW_ATTENTION",
                        priority="HIGH",
                        message=f"Atención baja detectada: {score}%"
                    )
                    alert = persistence_service.save_alert(db, alert_data)
                    print(f"   🚨 Alerta generada: {alert.id}")
            
            except Exception as e:
                print(f"   ❌ Error guardando en BD: {e}")
                import traceback
                traceback.print_exc()
        else:
            print(f"   ℹ️ Modo demo: no se guarda en BD (session_id: {session_id})")
        
        # Obtener el profesor de la sesión
        teacher_id = None
        if session_id and session_id != 'temp-session':
            try:
                from sqlalchemy.orm import joinedload
                from app.models.academic import Group
                
                session = db.query(ClassSession).options(
                    joinedload(ClassSession.group).joinedload(Group.subject)
                ).filter(
                    ClassSession.id == UUID(session_id)
                ).first()
                
                if session and session.group and session.group.subject:
                    teacher_id = str(session.group.subject.teacher_id)
                    print(f"   👨‍🏫 Profesor encontrado: {teacher_id}")
                else:
                    print(f"   ⚠️ Sesión sin grupo/asignatura asignado")
            except Exception as e:
                print(f"   ⚠️ Error obteniendo profesor: {e}")
                import traceback
                traceback.print_exc()
        
        # Enviar actualización al profesor
        print(f"\n📤 Broadcasting métricas:")
        print(f"   👤 Estudiante: {user_id}")
        print(f"   📊 Score: {score}")
        print(f"   🎯 Sesión: {session_id}")
        
        if teacher_id:
            await ws_manager.send_attention_update(
                session_id or "demo-session",
                user_id,
                processed_metrics,
                teacher_id
            )
            print(f"   ✅ Enviado al profesor: {teacher_id}")
        
        print(f" ✅ Métricas enviadas via WebSocket al profesor {teacher_id}")
    
    except Exception as e:
        print(f"❌ Error processing attention metrics: {e}")
        import traceback
        traceback.print_exc()


async def get_class_statistics(session_id: str, db: Session) -> dict:
    """Obtiene estadísticas agregadas de la clase"""
    try:
        from sqlalchemy import func
        from app.models.metrics import AttentionMetric
        
        session_uuid = UUID(session_id)
        
        # Contar estudiantes por nivel de atención
        attention_counts = db.query(
            AttentionMetric.attention_level,
            func.count(func.distinct(AttentionMetric.student_id))
        ).filter(
            AttentionMetric.session_id == session_uuid
        ).group_by(AttentionMetric.attention_level).all()
        
        stats = {
            'HIGH': 0,
            'MEDIUM': 0,
            'LOW': 0
        }
        
        for level, count in attention_counts:
            stats[level.value] = count
        
        # Promedio general
        avg_score = db.query(func.avg(AttentionMetric.attention_score)).filter(
            AttentionMetric.session_id == session_uuid
        ).scalar() or 0
        
        # Total de estudiantes
        total_students = db.query(SessionAttendance).filter(
            SessionAttendance.session_id == session_uuid
        ).count()
        
        return {
            'session_id': session_id,
            'total_students': total_students,
            'average_attention': round(avg_score, 2),
            'students_high': stats['HIGH'],
            'students_medium': stats['MEDIUM'],
            'students_low': stats['LOW']
        }
    
    except Exception as e:
        print(f"Error getting stats: {e}")
        return {
            'session_id': session_id,
            'total_students': 0,
            'average_attention': 0,
            'students_high': 0,
            'students_medium': 0,
            'students_low': 0
        }


@router.get("/ws/stats")
async def get_websocket_stats():
    """Endpoint HTTP para obtener estadísticas del sistema WebSocket"""
    return ws_manager.get_stats()


@router.get("/ws/session/{session_id}/info")
async def get_session_info(session_id: str):
    """Obtiene información de una sesión activa"""
    return ws_manager.get_session_info(session_id)
