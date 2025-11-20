# backend/app/main.py
"""
FastAPI Application - Class Guard
Sistema de monitoreo inteligente de atención en clases virtuales
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.session import engine, Base

# Importar TODOS los modelos para que SQLAlchemy los conozca
from app.models import user, academic, metrics
from app.api.endpoints import students
from app.api.endpoints import auth, cv, metrics, sessions, academic, students, websocket, analytics, alerts
# Importar routers
from app.api.endpoints import (
    auth,
    websocket,
    academic as academic_router,
    sessions as sessions_router,
    metrics as metrics_router,
    analytics,
    students,
    cv,
    classes
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager para la aplicación
    Se ejecuta al inicio y al final de la aplicación
    """
    # Startup
    print("=" * 80)
    print("🚀 CLASS GUARD - Starting Application")
    print("=" * 80)
    
    # Crear tablas si no existen
    print("📋 Verificando base de datos...")
    Base.metadata.create_all(bind=engine)
    print("✅ Base de datos lista")
    
    print("\n🌐 Servidor disponible en:")
    print(f"   - API: http://localhost:8000")
    print(f"   - Docs: http://localhost:8000/docs")
    print(f"   - WebSocket: ws://localhost:8000/api/ws/{{user_id}}")
    print("\n" + "=" * 80 + "\n")
    
    yield
    
    # Shutdown
    print("\n" + "=" * 80)
    print("🛑 CLASS GUARD - Shutting Down")
    print("=" * 80)

# Crear aplicación
app = FastAPI(
    title="Class Guard API",
    description="Sistema de monitoreo inteligente de atención en clases virtuales",
    version="2.0.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],  # ✅ Lista hardcodeada directamente
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== HEALTH CHECK ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "app": "Class Guard",
        "version": "2.0.0",
        "status": "running",
        "message": "Sistema de monitoreo de atención en clases virtuales"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "websocket": "available"
    }

# ==================== REGISTER ROUTERS ====================

# Auth endpoints
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"]
)

# WebSocket endpoints
app.include_router(
    websocket.router,
    prefix="/api",
    tags=["WebSocket"]
)

# Academic endpoints (NEW - Subjects & Groups)
app.include_router(
    academic_router.router,
    prefix="/api/academic",
    tags=["Academic Management"]
)

# Sessions endpoints (UPDATED)
app.include_router(
    sessions_router.router,
    prefix="/api/sessions",
    tags=["Class Sessions"]
)

app.include_router(
    students.router, 
    prefix="/api/students", 
    tags=["students"]
)


# Metrics endpoints
app.include_router(
    metrics_router.router,
    prefix="/api/metrics",
    tags=["Attention Metrics"]
)

# Analytics endpoints
app.include_router(
    analytics.router,
    prefix="/api/analytics",
    tags=["Analytics"]
)

app.include_router(
    alerts.router, 
    prefix="/api/alerts", 
    tags=["alerts"]
)


# Students endpoints
app.include_router(
    students.router,
    prefix="/api/students",
    tags=["Students"]
)

# CV endpoints
app.include_router(
    cv.router,
    prefix="/api/cv",
    tags=["Computer Vision"]
)

# Classes endpoints (legacy)
app.include_router(
    classes.router, 
    prefix="/api/classes", 
    tags=["Classes"]
)

# ==================== ERROR HANDLERS ====================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handler para errores 404"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "El recurso solicitado no existe",
            "status_code": 404
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handler para errores 500"""
    import traceback
    print("=" * 80)
    print("❌ ERROR 500:")
    traceback.print_exc()
    print("=" * 80)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "Ha ocurrido un error interno en el servidor",
            "status_code": 500
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )