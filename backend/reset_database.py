# backend/reset_database.py
from app.db.session import SessionLocal, Base, engine
from app.models.user import User
from app.models.class_model import Class, ClassEnrollment
from app.models.metrics import (
    ClassSession, SessionAttendance, AttentionMetric, 
    Alert, ClassFeedback
)

print("=" * 60)
print("🗑️  LIMPIANDO BASE DE DATOS")
print("=" * 60)

# Confirmar acción
response = input("\n⚠️  Esto BORRARÁ TODOS los datos. ¿Continuar? (si/no): ")
if response.lower() != 'si':
    print("❌ Cancelado")
    exit(0)

try:
    print("\n🔄 Eliminando todas las tablas...")
    Base.metadata.drop_all(bind=engine)
    print("✅ Tablas eliminadas")
    
    print("\n🔄 Recreando tablas...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas recreadas")
    
    print("\n" + "=" * 60)
    print("✅ BASE DE DATOS LIMPIA")
    print("=" * 60)
    print("\nAhora ejecuta: python create_simple_users.py")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()