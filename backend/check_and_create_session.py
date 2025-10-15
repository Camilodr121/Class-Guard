# backend/check_and_create_session.py
from app.db.session import SessionLocal
from app.models.metrics import ClassSession, SessionStatus
from app.models.class_model import Class
from datetime import datetime
import uuid

db = SessionLocal()

try:
    # Ver sesiones existentes
    sessions = db.query(ClassSession).all()
    print(f"\n📊 Total sesiones en BD: {len(sessions)}")
    
    active_sessions = db.query(ClassSession).filter(
        ClassSession.status == SessionStatus.ACTIVE
    ).all()
    
    print(f"✅ Sesiones activas: {len(active_sessions)}\n")
    
    if len(active_sessions) > 0:
        for s in active_sessions:
            print(f"  Session ID: {s.id}")
            print(f"  Clase: {s.class_obj.name if s.class_obj else 'N/A'}")
            print(f"  Estado: {s.status}")
        print("\n✅ Ya hay sesiones activas!")
    else:
        print("⚠️  No hay sesiones activas. Creando una...\n")
        
        # Buscar una clase
        clase = db.query(Class).filter(Class.is_active == True).first()
        
        if not clase:
            print("❌ No hay clases en la BD. Ejecuta: python create_simple_users.py")
            exit(1)
        
        # Crear sesión activa
        session = ClassSession(
            id=uuid.uuid4(),
            class_id=clase.id,
            started_at=datetime.utcnow(),
            status=SessionStatus.ACTIVE,
            total_students_present=0
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        print("✅ Sesión creada exitosamente!")
        print(f"\n  Session ID: {session.id}")
        print(f"  Clase: {clase.name}")
        print(f"  Profesor: {clase.teacher.first_name} {clase.teacher.last_name}")
        print("\n🎉 Ahora recarga el dashboard del estudiante (F5)")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()