# backend/test_cv_simple.py
import cv2
import numpy as np
from app.services.cv_service.processor import cv_processor

def test_cv_basic():
    """Test básico de CV sin webcam"""
    print("🧪 Test básico de Computer Vision")
    
    # Crear imagen de prueba (negro)
    test_image = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # Intentar procesar
    result = cv_processor.process_frame(test_image)
    
    if result is None:
        print("✅ CV funcionando correctamente (no detectó rostro en imagen negra)")
    else:
        print("❌ Resultado inesperado")
    
    print("\n📊 Estadísticas del procesador:")
    stats = cv_processor.get_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")

if __name__ == "__main__":
    test_cv_basic()