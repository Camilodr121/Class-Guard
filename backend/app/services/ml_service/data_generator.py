# backend/app/services/ml_service/data_generator.py
import numpy as np
from typing import Tuple

class SyntheticDataGenerator:
    """
    Genera datos sintéticos para entrenar el modelo inicial
    """
    
    @staticmethod
    def generate_training_data(n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
        """
        Genera datos sintéticos de entrenamiento
        
        Args:
            n_samples: Número de muestras a generar
            
        Returns:
            Tuple (X, y) donde:
            - X: Features (n_samples, 21)
            - y: Labels (n_samples,) - 0: LOW, 1: MEDIUM, 2: HIGH
        """
        np.random.seed(42)
        
        samples_per_class = n_samples // 3
        X_list = []
        y_list = []
        
        # Generar datos para clase HIGH (atención alta)
        X_high = SyntheticDataGenerator._generate_high_attention(samples_per_class)
        y_high = np.full(samples_per_class, 2)  # Label 2 = HIGH
        
        # Generar datos para clase MEDIUM (atención media)
        X_medium = SyntheticDataGenerator._generate_medium_attention(samples_per_class)
        y_medium = np.full(samples_per_class, 1)  # Label 1 = MEDIUM
        
        # Generar datos para clase LOW (atención baja)
        X_low = SyntheticDataGenerator._generate_low_attention(samples_per_class)
        y_low = np.full(samples_per_class, 0)  # Label 0 = LOW
        
        # Combinar
        X = np.vstack([X_high, X_medium, X_low])
        y = np.concatenate([y_high, y_medium, y_low])
        
        # Mezclar
        indices = np.random.permutation(len(X))
        X = X[indices]
        y = y[indices]
        
        return X, y
    
    @staticmethod
    def _generate_high_attention(n: int) -> np.ndarray:
        """Genera features para atención ALTA"""
        features = []
        
        for _ in range(n):
            sample = [
                # EAR statistics (ojos bien abiertos)
                np.random.normal(0.30, 0.02),  # ear_mean
                np.random.uniform(0.01, 0.03), # ear_std
                np.random.uniform(0.25, 0.28), # ear_min
                np.random.uniform(0.32, 0.35), # ear_max
                np.random.uniform(0.05, 0.10), # ear_range
                
                # MAR statistics (boca cerrada)
                np.random.normal(0.15, 0.05),  # mar_mean
                np.random.uniform(0.02, 0.05), # mar_std
                np.random.uniform(0.20, 0.30), # mar_max
                
                # Event rates (pocos eventos)
                np.random.uniform(0.10, 0.20), # blink_rate
                np.random.uniform(0.00, 0.05), # yawns_rate
                np.random.uniform(0.00, 0.10), # looking_away_rate
                
                # Head pose (mirando al frente)
                np.random.normal(0, 5),        # head_yaw_mean
                np.random.uniform(2, 5),       # head_yaw_std
                np.random.normal(0, 5),        # head_pitch_mean
                np.random.uniform(2, 5),       # head_pitch_std
                
                # Trends (estables)
                np.random.uniform(-0.001, 0.001), # ear_trend
                np.random.uniform(-0.001, 0.001), # mar_trend
                
                # Variability (baja)
                np.random.uniform(0.05, 0.15), # ear_variability
                np.random.uniform(0.10, 0.30), # head_movement_variability
                
                # Consecutive events (pocos)
                np.random.randint(0, 2),       # consecutive_blinks
                np.random.randint(0, 1)        # consecutive_yawns
            ]
            features.append(sample)
        
        return np.array(features)
    
    @staticmethod
    def _generate_medium_attention(n: int) -> np.ndarray:
        """Genera features para atención MEDIA"""
        features = []
        
        for _ in range(n):
            sample = [
                # EAR statistics (ojos parcialmente abiertos)
                np.random.normal(0.25, 0.03),  # ear_mean
                np.random.uniform(0.03, 0.06), # ear_std
                np.random.uniform(0.20, 0.23), # ear_min
                np.random.uniform(0.28, 0.32), # ear_max
                np.random.uniform(0.08, 0.12), # ear_range
                
                # MAR statistics (boca ocasionalmente abierta)
                np.random.normal(0.25, 0.08),  # mar_mean
                np.random.uniform(0.05, 0.10), # mar_std
                np.random.uniform(0.35, 0.50), # mar_max
                
                # Event rates (moderados)
                np.random.uniform(0.20, 0.35), # blink_rate
                np.random.uniform(0.05, 0.15), # yawns_rate
                np.random.uniform(0.10, 0.25), # looking_away_rate
                
                # Head pose (ligeramente desviado)
                np.random.normal(0, 15),       # head_yaw_mean
                np.random.uniform(5, 10),      # head_yaw_std
                np.random.normal(0, 10),       # head_pitch_mean
                np.random.uniform(5, 10),      # head_pitch_std
                
                # Trends (ligera disminución)
                np.random.uniform(-0.005, 0.000), # ear_trend
                np.random.uniform(0.000, 0.003),  # mar_trend
                
                # Variability (media)
                np.random.uniform(0.15, 0.30), # ear_variability
                np.random.uniform(0.30, 0.60), # head_movement_variability
                
                # Consecutive events (moderados)
                np.random.randint(2, 4),       # consecutive_blinks
                np.random.randint(1, 2)        # consecutive_yawns
            ]
            features.append(sample)
        
        return np.array(features)
    
    @staticmethod
    def _generate_low_attention(n: int) -> np.ndarray:
        """Genera features para atención BAJA"""
        features = []
        
        for _ in range(n):
            sample = [
                # EAR statistics (ojos semi-cerrados)
                np.random.normal(0.20, 0.04),  # ear_mean
                np.random.uniform(0.05, 0.10), # ear_std
                np.random.uniform(0.15, 0.18), # ear_min
                np.random.uniform(0.23, 0.27), # ear_max
                np.random.uniform(0.08, 0.15), # ear_range
                
                # MAR statistics (bostezos frecuentes)
                np.random.normal(0.40, 0.15),  # mar_mean
                np.random.uniform(0.10, 0.20), # mar_std
                np.random.uniform(0.60, 0.80), # mar_max
                
                # Event rates (altos)
                np.random.uniform(0.35, 0.50), # blink_rate
                np.random.uniform(0.15, 0.35), # yawns_rate
                np.random.uniform(0.25, 0.50), # looking_away_rate
                
                # Head pose (muy desviado)
                np.random.normal(0, 25),       # head_yaw_mean
                np.random.uniform(10, 20),     # head_yaw_std
                np.random.normal(0, 20),       # head_pitch_mean
                np.random.uniform(10, 20),     # head_pitch_std
                
                # Trends (caída pronunciada)
                np.random.uniform(-0.010, -0.003), # ear_trend
                np.random.uniform(0.003, 0.010),   # mar_trend
                
                # Variability (alta)
                np.random.uniform(0.30, 0.50), # ear_variability
                np.random.uniform(0.60, 1.00), # head_movement_variability
                
                # Consecutive events (muchos)
                np.random.randint(4, 8),       # consecutive_blinks
                np.random.randint(2, 5)        # consecutive_yawns
            ]
            features.append(sample)
        
        return np.array(features)