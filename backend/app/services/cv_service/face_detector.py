# backend/app/services/cv_service/face_detector.py
import cv2
import mediapipe as mp
import numpy as np
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class FaceLandmarks:
    """Estructura para almacenar landmarks faciales"""
    landmarks: np.ndarray
    left_eye_indices: List[int]
    right_eye_indices: List[int]
    mouth_indices: List[int]
    face_oval_indices: List[int]

class FaceDetector:
    """
    Detector de rostros y landmarks faciales usando MediaPipe
    """
    
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Inicializar Face Mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # ====================================================================
        # ÍNDICES CORREGIDOS - 6 puntos clave para EAR
        # ====================================================================
        
        # Ojo DERECHO (del usuario, izquierdo en imagen) - 6 puntos para EAR
        # Formato: [outer_corner, top1, top2, inner_corner, bottom2, bottom1]
        self.RIGHT_EYE = [33, 160, 158, 133, 153, 144]
        
        # Ojo IZQUIERDO (del usuario, derecho en imagen) - 6 puntos para EAR
        # Formato: [outer_corner, top1, top2, inner_corner, bottom2, bottom1]
        self.LEFT_EYE = [362, 385, 387, 263, 373, 380]
        
        # Puntos completos para dibujo (opcional)
        self.RIGHT_EYE_FULL = [
            33, 7, 163, 144, 145, 153, 154, 155, 133, 173,
            157, 158, 159, 160, 161, 246
        ]
        
        self.LEFT_EYE_FULL = [
            362, 382, 381, 380, 374, 373, 390, 249, 263, 466,
            388, 387, 386, 385, 384, 398
        ]
        
        # Boca - 8 puntos clave para MAR
        # Formato: [left_corner, top1, top2, top3, right_corner, bottom3, bottom2, bottom1]
        self.MOUTH = [61, 39, 0, 17, 291, 405, 314, 84]
        
        # Boca completa para dibujo
        self.MOUTH_FULL = [
            61, 146, 91, 181, 84, 17, 314, 405, 321, 375,
            291, 409, 270, 269, 267, 0, 37, 39, 40, 185
        ]
        
        # Contorno de la cara
        self.FACE_OVAL = [
            10, 338, 297, 332, 284, 251, 389, 356, 454, 323,
            361, 288, 397, 365, 379, 378, 400, 377, 152, 148,
            176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
            162, 21, 54, 103, 67, 109
        ]
        
        print("✅ FaceDetector inicializado con índices corregidos")
        print(f"   - RIGHT_EYE: {len(self.RIGHT_EYE)} puntos")
        print(f"   - LEFT_EYE: {len(self.LEFT_EYE)} puntos")
        print(f"   - MOUTH: {len(self.MOUTH)} puntos")
    
    def detect_face(self, image: np.ndarray) -> Optional[FaceLandmarks]:
        """
        Detecta rostro y extrae landmarks
        
        Args:
            image: Imagen BGR de OpenCV
            
        Returns:
            FaceLandmarks si se detecta rostro, None si no
        """
        # Convertir BGR a RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Procesar imagen
        results = self.face_mesh.process(image_rgb)
        
        if not results.multi_face_landmarks:
            return None
        
        # Obtener landmarks del primer rostro detectado
        face_landmarks = results.multi_face_landmarks[0]
        
        # Convertir landmarks a numpy array
        h, w, _ = image.shape
        landmarks_array = np.array([
            [landmark.x * w, landmark.y * h, landmark.z]
            for landmark in face_landmarks.landmark
        ])
        
        return FaceLandmarks(
            landmarks=landmarks_array,
            left_eye_indices=self.LEFT_EYE,      # 6 puntos para EAR
            right_eye_indices=self.RIGHT_EYE,    # 6 puntos para EAR
            mouth_indices=self.MOUTH,            # 8 puntos para MAR
            face_oval_indices=self.FACE_OVAL
        )
    
    def draw_landmarks(
        self, 
        image: np.ndarray, 
        landmarks: FaceLandmarks,
        draw_eyes: bool = True,
        draw_mouth: bool = True,
        draw_face_oval: bool = False
    ) -> np.ndarray:
        """
        Dibuja landmarks en la imagen
        
        Args:
            image: Imagen BGR
            landmarks: Landmarks detectados
            draw_eyes: Dibujar ojos
            draw_mouth: Dibujar boca
            draw_face_oval: Dibujar contorno facial
            
        Returns:
            Imagen con landmarks dibujados
        """
        output = image.copy()
        points = landmarks.landmarks[:, :2].astype(np.int32)
        
        if draw_eyes:
            # Dibujar ojo izquierdo (usar puntos completos si están disponibles)
            try:
                left_eye_points = points[self.LEFT_EYE_FULL]
                cv2.polylines(output, [left_eye_points], True, (0, 255, 0), 1)
            except:
                left_eye_points = points[landmarks.left_eye_indices]
                cv2.polylines(output, [left_eye_points], True, (0, 255, 0), 1)
            
            # Dibujar ojo derecho
            try:
                right_eye_points = points[self.RIGHT_EYE_FULL]
                cv2.polylines(output, [right_eye_points], True, (0, 255, 0), 1)
            except:
                right_eye_points = points[landmarks.right_eye_indices]
                cv2.polylines(output, [right_eye_points], True, (0, 255, 0), 1)
        
        if draw_mouth:
            # Dibujar boca
            try:
                mouth_points = points[self.MOUTH_FULL]
                cv2.polylines(output, [mouth_points], True, (0, 0, 255), 1)
            except:
                mouth_points = points[landmarks.mouth_indices]
                cv2.polylines(output, [mouth_points], True, (0, 0, 255), 1)
        
        if draw_face_oval:
            # Dibujar contorno facial
            face_points = points[landmarks.face_oval_indices]
            cv2.polylines(output, [face_points], True, (255, 0, 0), 1)
        
        return output
    
    def close(self):
        """Liberar recursos"""
        self.face_mesh.close()