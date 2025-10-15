# backend/app/services/ml_service/classifier.py
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix
from typing import Dict, Tuple, Optional, List
import os
from datetime import datetime
import json

class AttentionClassifier:
    """
    Clasificador de nivel de atención usando Machine Learning
    """
    
    def __init__(self, model_path: str = "models"):
        self.model_path = model_path
        self.model = None
        self.scaler = StandardScaler()
        self.classes = ['LOW', 'MEDIUM', 'HIGH']
        self.feature_names = []
        
        # Crear directorio de modelos si no existe
        os.makedirs(model_path, exist_ok=True)
        
        # Intentar cargar modelo existente
        self.load_model()
    
    def train(
        self, 
        X: np.ndarray, 
        y: np.ndarray,
        model_type: str = 'random_forest'
    ) -> Dict:
        """
        Entrena el modelo de clasificación
        
        Args:
            X: Features (n_samples, n_features)
            y: Labels (n_samples,) - 0: LOW, 1: MEDIUM, 2: HIGH
            model_type: Tipo de modelo ('random_forest' o 'gradient_boosting')
            
        Returns:
            Dict con métricas de entrenamiento
        """
        print(f"🎓 Entrenando modelo con {len(X)} muestras...")
        
        # Dividir datos
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Escalar features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Crear modelo
        if model_type == 'random_forest':
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                class_weight='balanced'
            )
        elif model_type == 'gradient_boosting':
            self.model = GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        # Entrenar
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluar
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X_train_scaled, y_train, cv=5)
        
        # Predicciones
        y_pred = self.model.predict(X_test_scaled)
        
        # Reporte de clasificación
        report = classification_report(
            y_test, 
            y_pred, 
            target_names=self.classes,
            output_dict=True
        )
        
        # Matriz de confusión
        conf_matrix = confusion_matrix(y_test, y_pred)
        
        metrics = {
            'train_accuracy': float(train_score),
            'test_accuracy': float(test_score),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'classification_report': report,
            'confusion_matrix': conf_matrix.tolist(),
            'n_samples': len(X),
            'n_features': X.shape[1],
            'model_type': model_type,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        print(f"✅ Modelo entrenado - Test Accuracy: {test_score:.3f}")
        print(f"   CV Score: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")
        
        # Guardar modelo
        self.save_model()
        self._save_metrics(metrics)
        
        return metrics
    
    def predict(self, features: np.ndarray) -> Dict:
        """
        Predice el nivel de atención
        
        Args:
            features: Vector de características (n_features,)
            
        Returns:
            Dict con predicción y probabilidades
        """
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        # Asegurar que sea 2D
        if features.ndim == 1:
            features = features.reshape(1, -1)
        
        # Escalar
        features_scaled = self.scaler.transform(features)
        
        # Predecir
        prediction = self.model.predict(features_scaled)[0]
        probabilities = self.model.predict_proba(features_scaled)[0]
        
        # Calcular score de confianza
        confidence = float(np.max(probabilities))
        
        # Mapear predicción a etiqueta
        predicted_class = self.classes[prediction]
        
        # Calcular score numérico (0-100)
        attention_score = self._calculate_attention_score(probabilities)
        
        return {
            'attention_level': predicted_class,
            'attention_score': attention_score,
            'confidence': confidence,
            'probabilities': {
                'low': float(probabilities[0]),
                'medium': float(probabilities[1]),
                'high': float(probabilities[2])
            }
        }
    
    def _calculate_attention_score(self, probabilities: np.ndarray) -> float:
        """
        Calcula score de atención numérico (0-100) basado en probabilidades
        """
        # Ponderación: LOW=20, MEDIUM=60, HIGH=100
        weights = np.array([20, 60, 100])
        score = np.dot(probabilities, weights)
        return float(score)
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Obtiene la importancia de cada feature
        """
        if self.model is None or not hasattr(self.model, 'feature_importances_'):
            return {}
        
        importances = self.model.feature_importances_
        
        return {
            name: float(importance)
            for name, importance in zip(self.feature_names, importances)
        }
    
    def save_model(self):
        """Guarda el modelo y scaler en disco"""
        model_file = os.path.join(self.model_path, 'attention_classifier.pkl')
        scaler_file = os.path.join(self.model_path, 'scaler.pkl')
        
        joblib.dump(self.model, model_file)
        joblib.dump(self.scaler, scaler_file)
        
        print(f"💾 Modelo guardado en {model_file}")
    
    def load_model(self) -> bool:
        """
        Carga el modelo desde disco
        
        Returns:
            True si se cargó exitosamente, False si no
        """
        model_file = os.path.join(self.model_path, 'attention_classifier.pkl')
        scaler_file = os.path.join(self.model_path, 'scaler.pkl')
        
        if os.path.exists(model_file) and os.path.exists(scaler_file):
            self.model = joblib.load(model_file)
            self.scaler = joblib.load(scaler_file)
            print(f"✅ Modelo cargado desde {model_file}")
            return True
        else:
            print(f"⚠️ No se encontró modelo pre-entrenado")
            return False
    
    def _save_metrics(self, metrics: Dict):
        """Guarda métricas de entrenamiento"""
        metrics_file = os.path.join(self.model_path, 'training_metrics.json')
        
        with open(metrics_file, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        print(f"📊 Métricas guardadas en {metrics_file}")

# Instancia global
attention_classifier = AttentionClassifier()