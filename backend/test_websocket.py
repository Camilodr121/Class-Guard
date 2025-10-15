# backend/test_websocket.py
import asyncio
import websockets
import json

async def test_websocket():
    # Usar el token y user_id real de tu sesión
    token = "TU_TOKEN_AQUI"  # Obténlo del localStorage del navegador
    user_id = "ba9d7d3c-4375-46c7-82c8-48640dba1392"  # Tu user_id
    
    uri = f"ws://localhost:8000/api/ws/{user_id}?token={token}&session_id=demo-session-123"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Conectado al WebSocket")
            
            # Esperar mensaje de conexión
            message = await websocket.recv()
            print(f"📨 Recibido: {message}")
            
            # Enviar métricas de prueba
            test_metrics = {
                'type': 'ATTENTION_METRICS',
                'metrics': {
                    'attention_score': 85,
                    'attention_level': 'HIGH',
                    'ear': 0.30,
                    'mar': 0.20,
                    'blinks': 5,
                    'yawns': 1,
                    'looking_away': False,
                    'head_pose': {'pitch': 0, 'yaw': 0, 'roll': 0}
                }
            }
            
            print(f"📤 Enviando métricas de prueba...")
            await websocket.send(json.dumps(test_metrics))
            
            # Esperar respuesta
            response = await websocket.recv()
            print(f"📨 Respuesta: {response}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())