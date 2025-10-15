# backend/test_mediapipe.py
import cv2
import mediapipe as mp
import numpy as np

def test_mediapipe():
    print("🧪 Testing MediaPipe...")
    
    try:
        mp_face_mesh = mp.solutions.face_mesh
        face_mesh = mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Crear imagen de prueba (gris)
        test_image = np.ones((480, 640, 3), dtype=np.uint8) * 128
        
        # Procesar
        results = face_mesh.process(test_image)
        
        if results.multi_face_landmarks:
            print("✅ MediaPipe detectó rostro (falso positivo esperado)")
        else:
            print("✅ MediaPipe funcionando correctamente (no detectó rostro en imagen gris)")
        
        face_mesh.close()
        print("✅ MediaPipe instalado y funcional")
        return True
        
    except Exception as e:
        print(f"❌ Error con MediaPipe: {e}")
        return False

if __name__ == "__main__":
    test_mediapipe()