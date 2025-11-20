# backend/app/websocket/manager.py

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, Optional
from datetime import datetime
import json
import asyncio
from collections import defaultdict

class ConnectionManager:
    def __init__(self):
        # {user_id: Set[WebSocket]}
        self.active_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        
        # {class_id: Set[user_id]}
        self.class_participants: Dict[str, Set[str]] = defaultdict(set)
        
        # {session_id: Dict[user_id, WebSocket]}
        self.session_connections: Dict[str, Dict[str, WebSocket]] = defaultdict(dict)
        
        # Statistics
        self.connection_count = 0
        self.message_count = 0
    
    async def connect(
        self, 
        websocket: WebSocket, 
        user_id: str,
        user_role: str,
        session_id: Optional[str] = None
    ):
        """Conecta un usuario al sistema WebSocket"""
        await websocket.accept()
        self.active_connections[user_id].add(websocket)
        self.connection_count += 1
        
        if session_id:
            self.class_participants[session_id].add(user_id)
            self.session_connections[session_id][user_id] = websocket
            
            await self.broadcast_to_session(
                session_id,
                {
                    'type': 'USER_JOINED',
                    'user_id': user_id,
                    'user_role': user_role,
                    'timestamp': datetime.utcnow().isoformat(),
                    'total_participants': len(self.class_participants[session_id])
                },
                exclude_user=user_id
            )
        
        print(f"✅ User {user_id} ({user_role}) connected. Total connections: {self.connection_count}")
        
        await websocket.send_json({
            'type': 'CONNECTION_SUCCESS',
            'user_id': user_id,
            'session_id': session_id,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    def disconnect(self, websocket: WebSocket, user_id: str, session_id: Optional[str] = None):
        """Desconecta un usuario"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            self.connection_count -= 1
        
        if session_id:
            if session_id in self.class_participants:
                self.class_participants[session_id].discard(user_id)
            
            if session_id in self.session_connections and user_id in self.session_connections[session_id]:
                del self.session_connections[session_id][user_id]
        
        print(f"❌ User {user_id} disconnected. Total connections: {self.connection_count}")
    
    async def send_personal_message(self, user_id: str, message: dict):
        """Envía mensaje a un usuario específico"""
        if user_id in self.active_connections:
            dead_connections = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                    self.message_count += 1
                except Exception as e:
                    print(f"Error sending to {user_id}: {e}")
                    dead_connections.add(connection)
            
            # Limpiar conexiones muertas
            self.active_connections[user_id] -= dead_connections
    
    async def send_to_user(self, user_id: str, message: dict):
        """
        Alias de send_personal_message para consistencia con websocket.py
        ✅ NUEVO MÉTODO AGREGADO
        """
        await self.send_personal_message(user_id, message)
    
    async def broadcast_to_session(
        self,
        session_id: str,
        message: dict,
        exclude_user: Optional[str] = None
    ):
        """Broadcast a todos los participantes de una sesión"""
        if session_id not in self.class_participants:
            return
        
        for user_id in self.class_participants[session_id]:
            if user_id != exclude_user:
                await self.send_personal_message(user_id, message)
    
    async def send_attention_update(self, session_id: str, student_id: str, metrics: dict, teacher_id: str = None):
        """Envía actualización de métricas del estudiante al profesor"""
        print(f"\n📤 Broadcasting métricas:")
        print(f"   👤 Estudiante: {student_id}")
        print(f"   📊 Score: {metrics.get('attention_score')}")
        print(f"   🎯 Sesión: {session_id}")
    
        message = {
            'type': 'STUDENT_ATTENTION_UPDATE',
            'user_id': student_id,
            'metrics': metrics,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    # Enviar solo al profesor
        if teacher_id:
            await self.send_to_user(teacher_id, message)
            print(f"   ✅ Enviado al profesor: {teacher_id}")
        else:
            print(f"   ⚠️ No se encontró teacher_id para la sesión")

        """
        Envía actualización de atención en tiempo real
        """
        print(f"\n📤 Enviando actualización de atención:")
        print(f"   Session: {session_id}")
        print(f"   Student: {student_id}")
        print(f"   Metrics Score: {metrics.get('attention_score')}")
        
        # Mensaje para el estudiante (su propia métrica)
        student_message = {
            'type': 'SELF_ATTENTION_UPDATE',
            'metrics': metrics,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        print(f"   📨 Enviando a estudiante {student_id}...")
        await self.send_personal_message(student_id, student_message)
        
        # Mensaje para el profesor
        teacher_message = {
            'type': 'ATTENTION_UPDATE',
            'student_id': student_id,
            'metrics': metrics,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        print(f"   📨 Enviando a profesor {teacher_id}...")
        await self.send_personal_message(teacher_id, teacher_message)
        
        print(f"   ✅ Mensajes enviados exitosamente")
    
    async def send_alert(self, teacher_id: str, alert_data: dict):
        """Envía alerta al profesor"""
        alert_message = {
            'type': 'ALERT',
            'priority': alert_data.get('priority', 'MEDIUM'),
            'data': alert_data,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        await self.send_personal_message(teacher_id, alert_message)
    
    def get_session_info(self, session_id: str) -> dict:
        """Obtiene información de una sesión activa"""
        return {
            'session_id': session_id,
            'active_participants': len(self.class_participants.get(session_id, set())),
            'participant_ids': list(self.class_participants.get(session_id, set()))
        }
    
    def get_stats(self) -> dict:
        """Obtiene estadísticas del sistema WebSocket"""
        return {
            'total_connections': self.connection_count,
            'total_messages': self.message_count,
            'active_users': len(self.active_connections),
            'active_sessions': len(self.class_participants)
        }

# Instancia global
ws_manager = ConnectionManager()
