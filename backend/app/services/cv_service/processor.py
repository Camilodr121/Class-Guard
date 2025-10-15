# backend/app/services/cv_service/processor.py
import cv2
import numpy as np
from typing import Dict, Optional, Tuple
import base64
from io import BytesIO
from PIL import Image

from .face_detector import FaceDetector
from .attention_calculator import AttentionCalculator, AttentionMetrics

class CVProcessor:
    """
    Procesador principal de Computer Vision
    Coordina detección facial y cálculo de métricas
    MODIFICADO: Soporta múltiples sesiones simultáneas
    """
    
    def __init__(self):
        # UN SOLO detector de rostros (compartido)
        self.face_detector = FaceDetector()
        
        # MÚLTIPLES calculadores de atención (uno por sesión)
        self.session_calculators = {}
        
        # Configuración por defecto para calculadores
        self.default_config = {
            'ear_threshold': 0.21,
            'mar_threshold': 0.5,          # CAMBIO CRÍTICO
            'ear_consec_frames': 2,        # CAMBIO CRÍTICO
            'mar_consec_frames': 6,        # CAMBIO CRÍTICO
            'head_pose_threshold': 40.0
        }
        
        # Estadísticas globales
        self.frames_processed = 0
        self.faces_detected = 0
        
        print("✅ CVProcessor inicializado con soporte multi-sesión")
    
    def get_or_create_calculator(self, session_id: str) -> AttentionCalculator:
        """
        Obtiene o crea un calculador de atención para una sesión
        
        Args:
            session_id: Identificador único de la sesión
            
        Returns:
            AttentionCalculator para la sesión
        """
        if session_id not in self.session_calculators:
            print(f"📊 Creando nuevo calculator para sesión: {session_id}")
            self.session_calculators[session_id] = AttentionCalculator(
                **self.default_config
            )
        
        return self.session_calculators[session_id]
    
    def process_frame(
        self, 
        frame: np.ndarray, 
        session_id: str = "default"
    ) -> Optional[Dict]:
        """
        Procesa un frame de video completo con manejo robusto de errores
        """
        self.frames_processed += 1
        
        try:
            # Obtener calculador para esta sesión
            attention_calculator = self.get_or_create_calculator(session_id)
            
            # Detectar rostro y landmarks
            face_landmarks = self.face_detector.detect_face(frame)
            
            if face_landmarks is None:
                # NO imprimir log para evitar spam
                return {
                    'face_detected': False,
                    'ear': 0.0,
                    'mar': 0.0,
                    'total_blinks': attention_calculator.total_blinks,
                    'total_yawns': attention_calculator.total_yawns,
                    'blink_detected': False,
                    'yawn_detected': False,
                    'looking_away': False,
                    'head_pose': {'pitch': 0, 'yaw': 0, 'roll': 0},
                    'blink_rate': 0
                }
            
            self.faces_detected += 1
            
            # Calcular métricas de atención
            metrics = attention_calculator.calculate_metrics(
                landmarks=face_landmarks.landmarks,
                left_eye_indices=face_landmarks.left_eye_indices,
                right_eye_indices=face_landmarks.right_eye_indices,
                mouth_indices=face_landmarks.mouth_indices
            )
            
            # Preparar respuesta
            result = {
                'face_detected': True,
                'ear': float(metrics.ear),
                'mar': float(metrics.mar),
                'head_pose': {
                    'pitch': float(metrics.head_pose['pitch']),
                    'yaw': float(metrics.head_pose['yaw']),
                    'roll': float(metrics.head_pose['roll'])
                },
                'blink_detected': bool(metrics.blink_detected),
                'yawn_detected': bool(metrics.yawn_detected),
                'looking_away': bool(metrics.looking_away),
                'total_blinks': int(attention_calculator.total_blinks),
                'total_yawns': int(attention_calculator.total_yawns),
                'blink_rate': float(attention_calculator.get_blink_rate()),
                'timestamp': float(metrics.timestamp)
            }
            
            return result
            
        except Exception as e:
            print(f"⚠️ Error en process_frame: {e}")
            # Retornar valores por defecto en lugar de None
            attention_calculator = self.get_or_create_calculator(session_id)
            return {
                'face_detected': False,
                'ear': 0.0,
                'mar': 0.0,
                'total_blinks': attention_calculator.total_blinks,
                'total_yawns': attention_calculator.total_yawns,
                'blink_detected': False,
                'yawn_detected': False,
                'looking_away': False,
                'head_pose': {'pitch': 0, 'yaw': 0, 'roll': 0},
                'blink_rate': 0
            }
    
    def process_base64_image(
        self, 
        base64_image: str,
        session_id: str = "default"
    ) -> Optional[Dict]:
        """
        Procesa una imagen en formato base64
        
        Args:
            base64_image: Imagen codificada en base64
            session_id: Identificador de sesión
            
        Returns:
            Dict con métricas o None
        """
        try:
            # Decodificar base64
            image_data = base64.b64decode(
                base64_image.split(',')[1] if ',' in base64_image else base64_image
            )
            
            # Convertir a imagen PIL
            pil_image = Image.open(BytesIO(image_data))
            
            # Convertir a numpy array (RGB)
            image_rgb = np.array(pil_image)
            
            # Convertir RGB a BGR para OpenCV
            image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
            
            # Procesar frame con session_id
            return self.process_frame(image_bgr, session_id=session_id)
            
        except Exception as e:
            print(f"❌ Error processing base64 image: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def draw_debug_info(
        self,
        frame: np.ndarray,
        metrics: Optional[Dict] = None
    ) -> np.ndarray:
        """
        Dibuja información de debug en el frame
        
        Args:
            frame: Imagen BGR
            metrics: Métricas calculadas
            
        Returns:
            Imagen con información dibujada
        """
        output = frame.copy()
        
        if metrics is None or not metrics.get('face_detected', False):
            cv2.putText(
                output,
                "No face detected",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                2
            )
            return output
        
        # Dibujar métricas
        y_offset = 30
        line_height = 30
        
        texts = [
            f"EAR: {metrics['ear']:.3f}",
            f"MAR: {metrics['mar']:.3f}",
            f"Blinks: {metrics['total_blinks']}",
            f"Yawns: {metrics['total_yawns']}",
            f"Blink Rate: {metrics['blink_rate']:.1f}/min",
            f"Head Yaw: {metrics['head_pose']['yaw']:.1f}°",
            f"Head Pitch: {metrics['head_pose']['pitch']:.1f}°"
        ]
        
        for i, text in enumerate(texts):
            color = (0, 255, 0)  # Verde
            
            # Cambiar color según alertas
            if "Blink" in text and metrics.get('blink_detected', False):
                color = (0, 255, 255)  # Amarillo
            elif "Yawn" in text and metrics.get('yawn_detected', False):
                color = (0, 0, 255)  # Rojo
            elif metrics.get('looking_away', False):
                color = (0, 165, 255)  # Naranja
            
            cv2.putText(
                output,
                text,
                (10, y_offset + i * line_height),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color,
                2
            )
        
        # Detectar rostro y dibujar landmarks
        face_landmarks = self.face_detector.detect_face(frame)
        if face_landmarks:
            output = self.face_detector.draw_landmarks(
                output,
                face_landmarks,
                draw_eyes=True,
                draw_mouth=True,
                draw_face_oval=False
            )
        
        return output
    
    def get_stats(self, session_id: str = "default") -> Dict:
        """
        Obtiene estadísticas del procesador para una sesión
        
        Args:
            session_id: Identificador de sesión
            
        Returns:
            Dict con estadísticas
        """
        calculator = self.get_or_create_calculator(session_id)
        
        return {
            'frames_processed': self.frames_processed,
            'faces_detected': self.faces_detected,
            'detection_rate': (
                self.faces_detected / self.frames_processed 
                if self.frames_processed > 0 else 0
            ),
            'total_blinks': calculator.total_blinks,
            'total_yawns': calculator.total_yawns,  # CORREGIDO
            'active_sessions': len(self.session_calculators)
        }
    
    def reset_session(self, session_id: str = "default"):
        """
        Reinicia contadores de una sesión específica
        
        Args:
            session_id: Identificador de sesión a reiniciar
        """
        if session_id in self.session_calculators:
            print(f"🔄 Reiniciando sesión: {session_id}")
            self.session_calculators[session_id].reset_counters()
    
    def remove_session(self, session_id: str):
        """
        Elimina una sesión y libera recursos
        
        Args:
            session_id: Identificador de sesión a eliminar
        """
        if session_id in self.session_calculators:
            print(f"🗑️ Eliminando sesión: {session_id}")
            del self.session_calculators[session_id]
    
    def reset(self):
        """Reinicia el procesador completamente"""
        self.frames_processed = 0
        self.faces_detected = 0
        self.session_calculators.clear()
        print("🔄 Procesador reiniciado completamente")
    
    def close(self):
        """Libera recursos"""
        self.face_detector.close()
        self.session_calculators.clear()

# Instancia global
cv_processor = CVProcessor()