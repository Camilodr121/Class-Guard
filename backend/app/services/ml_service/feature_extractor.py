# backend/app/services/ml_service/feature_extractor.py
import numpy as np
from typing import Dict, List
from collections import deque
from dataclasses import dataclass

@dataclass
class FeatureVector:
    """Vector de características para clasificación"""
    features: np.ndarray
    feature_names: List[str]
    timestamp: float

class FeatureExtractor:
    """
    Extrae features de las métricas de CV para alimentar el modelo ML
    """
    
    def __init__(self, window_size: int = 30):
        """
        Args:
            window_size: Tamaño de ventana temporal (en segundos)
        """
        self.window_size = window_size
        
        # Buffers para análisis temporal
        self.ear_buffer = deque(maxlen=window_size)
        self.mar_buffer = deque(maxlen=window_size)
        self.blink_buffer = deque(maxlen=window_size)
        self.yawns_buffer = deque(maxlen=window_size)
        self.head_pose_buffer = deque(maxlen=window_size)
        self.looking_away_buffer = deque(maxlen=window_size)
        
        # Nombres de features
        self.feature_names = [
            # Estadísticas de EAR (Eye Aspect Ratio)
            'ear_mean',
            'ear_std',
            'ear_min',
            'ear_max',
            'ear_range',
            
            # Estadísticas de MAR (Mouth Aspect Ratio)
            'mar_mean',
            'mar_std',
            'mar_max',
            
            # Frecuencias de eventos
            'blink_rate',
            'yawns_rate',
            'looking_away_rate',
            
            # Estadísticas de Head Pose
            'head_yaw_mean',
            'head_yaw_std',
            'head_pitch_mean',
            'head_pitch_std',
            
            # Tendencias temporales
            'ear_trend',
            'mar_trend',
            
            # Variabilidad
            'ear_variability',
            'head_movement_variability',
            
            # Patrones
            'consecutive_blinks',
            'consecutive_yawns'
        ]
    
    def add_observation(self, cv_metrics: Dict):
        """
        Agrega una nueva observación de métricas de CV
        
        Args:
            cv_metrics: Dict con métricas de Computer Vision
        """
        self.ear_buffer.append(cv_metrics.get('ear', 0.0))
        self.mar_buffer.append(cv_metrics.get('mar', 0.0))
        self.blink_buffer.append(1 if cv_metrics.get('blink_detected', False) else 0)
        self.yawns_buffer.append(1 if cv_metrics.get('yawns_detected', False) else 0)
        self.looking_away_buffer.append(1 if cv_metrics.get('looking_away', False) else 0)
        
        head_pose = cv_metrics.get('head_pose', {'yaw': 0, 'pitch': 0, 'roll': 0})
        self.head_pose_buffer.append({
            'yaw': head_pose.get('yaw', 0),
            'pitch': head_pose.get('pitch', 0),
            'roll': head_pose.get('roll', 0)
        })
    
    def extract_features(self) -> FeatureVector:
        """
        Extrae vector de características de la ventana temporal actual
        
        Returns:
            FeatureVector con todas las características calculadas
        """
        if len(self.ear_buffer) < 5:
            # No hay suficientes datos
            return FeatureVector(
                features=np.zeros(len(self.feature_names)),
                feature_names=self.feature_names,
                timestamp=0.0
            )
        
        features = []
        
        # Características de EAR
        ear_array = np.array(list(self.ear_buffer))
        features.extend([
            np.mean(ear_array),           # ear_mean
            np.std(ear_array),            # ear_std
            np.min(ear_array),            # ear_min
            np.max(ear_array),            # ear_max
            np.ptp(ear_array)             # ear_range (peak-to-peak)
        ])
        
        # Características de MAR
        mar_array = np.array(list(self.mar_buffer))
        features.extend([
            np.mean(mar_array),           # mar_mean
            np.std(mar_array),            # mar_std
            np.max(mar_array)             # mar_max
        ])
        
        # Frecuencias de eventos
        blink_array = np.array(list(self.blink_buffer))
        yawns_array = np.array(list(self.yawns_buffer))
        looking_away_array = np.array(list(self.looking_away_buffer))
        
        features.extend([
            np.sum(blink_array) / len(blink_array),              # blink_rate
            np.sum(yawns_array) / len(yawns_array),                # yawns_rate
            np.sum(looking_away_array) / len(looking_away_array) # looking_away_rate
        ])
        
        # Estadísticas de Head Pose
        head_poses = list(self.head_pose_buffer)
        yaws = [p['yaw'] for p in head_poses]
        pitches = [p['pitch'] for p in head_poses]
        
        features.extend([
            np.mean(yaws),                # head_yaw_mean
            np.std(yaws),                 # head_yaw_std
            np.mean(pitches),             # head_pitch_mean
            np.std(pitches)               # head_pitch_std
        ])
        
        # Tendencias temporales (regresión lineal simple)
        features.extend([
            self._calculate_trend(ear_array),  # ear_trend
            self._calculate_trend(mar_array)   # mar_trend
        ])
        
        # Variabilidad
        features.extend([
            self._calculate_variability(ear_array),           # ear_variability
            self._calculate_variability(np.array(yaws))       # head_movement_variability
        ])
        
        # Patrones consecutivos
        features.extend([
            self._count_consecutive_events(blink_array),  # consecutive_blinks
            self._count_consecutive_events(yawns_array)    # consecutive_yawns
        ])
        
        return FeatureVector(
            features=np.array(features),
            feature_names=self.feature_names,
            timestamp=np.mean([i for i in range(len(ear_array))])
        )
    
    def _calculate_trend(self, data: np.ndarray) -> float:
        """
        Calcula la tendencia (pendiente) de los datos usando regresión lineal
        """
        if len(data) < 2:
            return 0.0
        
        x = np.arange(len(data))
        # Regresión lineal simple: y = mx + b
        slope = np.polyfit(x, data, 1)[0]
        return float(slope)
    
    def _calculate_variability(self, data: np.ndarray) -> float:
        """
        Calcula el coeficiente de variación (CV) = std / mean
        """
        mean = np.mean(data)
        if mean == 0:
            return 0.0
        std = np.std(data)
        return float(std / mean)
    
    def _count_consecutive_events(self, events: np.ndarray) -> int:
        """
        Cuenta el número máximo de eventos consecutivos
        """
        max_consecutive = 0
        current_consecutive = 0
        
        for event in events:
            if event == 1:
                current_consecutive += 1
                max_consecutive = max(max_consecutive, current_consecutive)
            else:
                current_consecutive = 0
        
        return max_consecutive
    
    def reset(self):
        """Reinicia todos los buffers"""
        self.ear_buffer.clear()
        self.mar_buffer.clear()
        self.blink_buffer.clear()
        self.yawns_buffer.clear()
        self.head_pose_buffer.clear()
        self.looking_away_buffer.clear()