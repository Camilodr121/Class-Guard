# backend/app/services/cv_service/attention_calculator.py
import numpy as np
from scipy.spatial import distance
from typing import Dict, Optional
from collections import deque
from dataclasses import dataclass
import cv2
import time

@dataclass
class AttentionMetrics:
    """Métricas de atención calculadas"""
    ear: float  # Eye Aspect Ratio
    mar: float  # Mouth Aspect Ratio
    head_pose: Dict[str, float]  # Pitch, Yaw, Roll
    blink_detected: bool
    yawn_detected: bool
    looking_away: bool
    timestamp: float

class AttentionCalculator:
    """
    Calcula métricas de atención basadas en landmarks faciales
    VERSIÓN CORREGIDA: Detección más precisa y sensible
    """
    
    def __init__(
        self,
        ear_threshold: float = 0.21,      # Umbral para pestañeos
        mar_threshold: float = 0.5,       # Umbral para bostezos
        ear_consec_frames: int = 2,       # 2 frames = ~100ms para confirmar pestañeo
        mar_consec_frames: int = 8,       # 8 frames = ~400ms para confirmar bostezo real
        head_pose_threshold: float = 40.0
    ):
        """
        Args:
            ear_threshold: Umbral para detección de pestañeo (0.15-0.25 típico)
            mar_threshold: Umbral para detección de bostezo (0.4-0.6 típico)
            ear_consec_frames: Frames consecutivos para confirmar pestañeo (2-3 recomendado)
            mar_consec_frames: Frames consecutivos para confirmar bostezo (8-15 recomendado)
            head_pose_threshold: Ángulo máximo de rotación de cabeza
        """
        self.ear_threshold = ear_threshold
        self.mar_threshold = mar_threshold
        self.ear_consec_frames = ear_consec_frames
        self.mar_consec_frames = mar_consec_frames
        self.head_pose_threshold = head_pose_threshold
        
        # Buffers para análisis temporal
        self.ear_buffer = deque(maxlen=30)
        self.mar_buffer = deque(maxlen=30)
        self.frame_counter = 0
        
        # Contador de pestañeos
        self.total_blinks = 0
        self.blink_frames = 0
        self.last_blink_time = 0
        self.blink_in_progress = False
        
        # Contador de bostezos
        self.total_yawns = 0
        self.yawn_frames = 0
        self.last_yawn_time = 0
        self.yawn_in_progress = False
        
        # Auto-calibración MEJORADA
        self.calibration_frames = 30
        self.is_calibrated = False
        self.baseline_ear = None
        self.baseline_mar = None
        
        print(f"✅ AttentionCalculator inicializado (VERSIÓN CORREGIDA):")
        print(f"   - EAR threshold: {self.ear_threshold} (más sensible)")
        print(f"   - MAR threshold: {self.mar_threshold} (más sensible)")
        print(f"   - Frames consecutivos EAR: {self.ear_consec_frames}")
        print(f"   - Frames consecutivos MAR: {self.mar_consec_frames}")
    
    def calculate_ear(self, eye_landmarks: np.ndarray) -> float:
        """
        Calcula Eye Aspect Ratio (EAR)
        """
        if len(eye_landmarks) < 6:
            return 0.0
        
        try:
            # Distancias verticales
            A = distance.euclidean(eye_landmarks[1][:2], eye_landmarks[5][:2])
            B = distance.euclidean(eye_landmarks[2][:2], eye_landmarks[4][:2])
            
            # Distancia horizontal
            C = distance.euclidean(eye_landmarks[0][:2], eye_landmarks[3][:2])
            
            if C == 0:
                return 0.0
            
            ear = (A + B) / (2.0 * C)
            return ear
            
        except Exception as e:
            return 0.0
    
    def calculate_mar(self, mouth_landmarks: np.ndarray) -> float:
        """
        Calcula Mouth Aspect Ratio (MAR)
        """
        if len(mouth_landmarks) < 8:
            return 0.0
        
        try:
            # Distancias verticales
            A = distance.euclidean(mouth_landmarks[1][:2], mouth_landmarks[7][:2])
            B = distance.euclidean(mouth_landmarks[2][:2], mouth_landmarks[6][:2])
            C = distance.euclidean(mouth_landmarks[3][:2], mouth_landmarks[5][:2])
            
            # Distancia horizontal
            D = distance.euclidean(mouth_landmarks[0][:2], mouth_landmarks[4][:2])
            
            if D == 0:
                return 0.0
            
            mar = (A + B + C) / (3.0 * D)
            return mar
            
        except Exception as e:
            return 0.0
    
    def auto_calibrate(self, ear: float, mar: float):
        """
        Auto-calibración MEJORADA durante los primeros frames
        """
        if self.is_calibrated:
            return
        
        # Solo calibrar con valores válidos (rostro detectado normalmente)
        if ear > 0.15 and ear < 0.35 and mar > 0.2 and mar < 0.8:
            self.ear_buffer.append(ear)
            self.mar_buffer.append(mar)
        
        if len(self.ear_buffer) >= self.calibration_frames:
            # Calcular baseline usando mediana (más robusto que promedio)
            ear_values = list(self.ear_buffer)
            mar_values = list(self.mar_buffer)
            
            self.baseline_ear = np.median(ear_values)
            self.baseline_mar = np.median(mar_values)
            
            # Ajustar thresholds de forma MÁS CONSERVADORA
            # EAR threshold = 70% del baseline (más sensible)
            adjusted_ear = self.baseline_ear * 0.70
            # No permitir que sea demasiado bajo o alto
            self.ear_threshold = max(0.18, min(0.25, adjusted_ear))
            
            # MAR threshold = baseline + 50% (más sensible)
            adjusted_mar = self.baseline_mar * 1.5
            # No permitir que sea demasiado bajo o alto
            self.mar_threshold = max(0.45, min(0.65, adjusted_mar))
            
            self.is_calibrated = True
            print(f"\n🎯 CALIBRACIÓN COMPLETADA:")
            print(f"   - Baseline EAR: {self.baseline_ear:.3f}")
            print(f"   - EAR Threshold ajustado: {self.ear_threshold:.3f}")
            print(f"   - Baseline MAR: {self.baseline_mar:.3f}")
            print(f"   - MAR Threshold ajustado: {self.mar_threshold:.3f}\n")
    
    def estimate_head_pose(self, landmarks: np.ndarray) -> Dict[str, float]:
        """
        Estima la pose de la cabeza
        """
        try:
            model_points = np.array([
                (0.0, 0.0, 0.0),
                (0.0, -330.0, -65.0),
                (-225.0, 170.0, -135.0),
                (225.0, 170.0, -135.0),
                (-150.0, -150.0, -125.0),
                (150.0, -150.0, -125.0)
            ])
            
            indices = [1, 152, 263, 33, 61, 291]
            image_points = landmarks[indices, :2].astype(np.float64)
            
            size = (640, 480)
            focal_length = size[1]
            center = (size[1] / 2, size[0] / 2)
            camera_matrix = np.array([
                [focal_length, 0, center[0]],
                [0, focal_length, center[1]],
                [0, 0, 1]
            ], dtype=np.float64)
            
            dist_coeffs = np.zeros((4, 1))
            
            success, rotation_vec, translation_vec = cv2.solvePnP(
                model_points,
                image_points,
                camera_matrix,
                dist_coeffs,
                flags=cv2.SOLVEPNP_ITERATIVE
            )
            
            if not success:
                return {'pitch': 0.0, 'yaw': 0.0, 'roll': 0.0}
            
            rotation_mat, _ = cv2.Rodrigues(rotation_vec)
            pose_mat = cv2.hconcat((rotation_mat, translation_vec))
            _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_mat)
            
            return {
                'pitch': float(euler_angles[0]),
                'yaw': float(euler_angles[1]),
                'roll': float(euler_angles[2])
            }
        except Exception as e:
            return {'pitch': 0.0, 'yaw': 0.0, 'roll': 0.0}
    
    def detect_blink(self, ear: float) -> bool:
        """
        Detecta pestañeo con lógica BALANCEADA (no tan sensible)
        """
        blink_detected = False
        current_time = time.time()
        
        # Detectar inicio de pestañeo (ojo cerrado)
        if ear < self.ear_threshold:
            if not self.blink_in_progress:
                # Iniciar nuevo pestañeo
                self.blink_in_progress = True
                self.blink_frames = 1
            else:
                # Continuar pestañeo
                self.blink_frames += 1
        else:
            # Ojo abierto - verificar si se completó un pestañeo
            if self.blink_in_progress and self.blink_frames >= self.ear_consec_frames:
                # Pestañeo válido completado
                # Anti-rebote: solo si pasó suficiente tiempo (150ms)
                if current_time - self.last_blink_time > 0.15:
                    self.total_blinks += 1
                    blink_detected = True
                    self.last_blink_time = current_time
                    print(f"      ✅ PESTAÑEO #{self.total_blinks} (duración: {self.blink_frames} frames)")
            
            # Resetear estado
            self.blink_in_progress = False
            self.blink_frames = 0
        
        return blink_detected
    
    def detect_yawn(self, mar: float) -> bool:
        """
        Detecta bostezo REALISTA (requiere boca abierta sostenida)
        """
        yawn_detected = False
        current_time = time.time()
        
        # Detectar boca abierta
        if mar > self.mar_threshold:
            if not self.yawn_in_progress:
                # Iniciar posible bostezo
                self.yawn_in_progress = True
                self.yawn_frames = 1
                print(f"      😮 Boca abierta - MAR: {mar:.3f} (1/{self.mar_consec_frames} frames)")
            else:
                # Continuar bostezo
                self.yawn_frames += 1
                if self.yawn_frames % 3 == 0:  # Log cada 3 frames
                    print(f"      🔵 Boca sigue abierta ({self.yawn_frames}/{self.mar_consec_frames} frames)")
            
            # Confirmar bostezo solo después de suficientes frames
            if self.yawn_frames == self.mar_consec_frames:
                time_since_last = current_time - self.last_yawn_time
                
                # Verificar que no sea demasiado seguido (2 segundos mínimo)
                if time_since_last > 2.0:
                    self.total_yawns += 1
                    yawn_detected = True
                    self.last_yawn_time = current_time
                    print(f"      ✅✅✅ BOSTEZO #{self.total_yawns} CONFIRMADO (boca abierta por {self.yawn_frames} frames = ~{self.yawn_frames * 50}ms)")
                else:
                    print(f"      ⏸️ Bostezo muy seguido ({time_since_last:.1f}s), ignorando")
        else:
            # Boca cerrada
            if self.yawn_in_progress and self.yawn_frames < self.mar_consec_frames:
                print(f"      ℹ️ Boca cerrada muy rápido ({self.yawn_frames}/{self.mar_consec_frames} frames)")
            
            self.yawn_in_progress = False
            self.yawn_frames = 0
        
        return yawn_detected
    
    def is_looking_away(self, head_pose: Dict[str, float]) -> bool:
        """
        Determina si está mirando hacia otro lado
        """
        pitch = abs(head_pose['pitch'])
        yaw = abs(head_pose['yaw'])
        
        return (pitch > self.head_pose_threshold or 
                yaw > self.head_pose_threshold)
    
    def calculate_metrics(
        self,
        landmarks: np.ndarray,
        left_eye_indices: list,
        right_eye_indices: list,
        mouth_indices: list
    ) -> AttentionMetrics:
        """
        Calcula todas las métricas
        """
        # Extraer landmarks
        left_eye = landmarks[left_eye_indices]
        right_eye = landmarks[right_eye_indices]
        mouth = landmarks[mouth_indices]
        
        # Calcular EAR
        left_ear = self.calculate_ear(left_eye)
        right_ear = self.calculate_ear(right_eye)
        ear = (left_ear + right_ear) / 2.0
        
        # Calcular MAR
        mar = self.calculate_mar(mouth)
        
        # Auto-calibración en primeros frames
        if not self.is_calibrated:
            self.auto_calibrate(ear, mar)
        
        # Solo imprimir cada 30 frames para reducir spam
        if self.frame_counter % 30 == 0:
            print(f"      📊 Frame #{self.frame_counter} - EAR: {ear:.3f} (threshold: {self.ear_threshold:.3f}) | MAR: {mar:.3f} (threshold: {self.mar_threshold:.3f})")
        
        # Detectar eventos
        blink_detected = self.detect_blink(ear)
        yawn_detected = self.detect_yawn(mar)
        
        # Estimar pose
        head_pose = self.estimate_head_pose(landmarks)
        looking_away = self.is_looking_away(head_pose)
        
        self.frame_counter += 1
        
        return AttentionMetrics(
            ear=ear,
            mar=mar,
            head_pose=head_pose,
            blink_detected=blink_detected,
            yawn_detected=yawn_detected,
            looking_away=looking_away,
            timestamp=time.time()
        )
    
    def get_blink_rate(self, time_window: float = 60.0) -> float:
        """
        Calcula frecuencia de pestañeos por minuto
        """
        if self.frame_counter == 0:
            return 0.0
        
        time_elapsed = self.frame_counter / 30.0  # Asumiendo 30 FPS
        if time_elapsed == 0:
            return 0.0
        
        blinks_per_minute = (self.total_blinks / time_elapsed) * 60.0
        return blinks_per_minute
    
    def reset_counters(self):
        """Reinicia contadores"""
        self.total_blinks = 0
        self.total_yawns = 0
        self.frame_counter = 0
        self.blink_frames = 0
        self.yawn_frames = 0
        self.blink_in_progress = False
        self.yawn_in_progress = False
        self.ear_buffer.clear()
        self.mar_buffer.clear()
        self.is_calibrated = False
        print("🔄 Contadores reiniciados (requiere nueva calibración)")