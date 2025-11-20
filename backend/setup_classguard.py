# backend/setup_gmail.py
"""
Script para crear base de datos limpia de Class Guard
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine, Base
from app.models.user import User, UserRole
from app.models.academic import Subject, Group, GroupMembership, AcademicPeriod
from app.models.metrics import ClassSession, SessionAttendance, AttentionMetric, Alert, ClassFeedback
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.security import get_password_hash

print("=" * 80)
print("🚀 SETUP CLASS GUARD - Base de Datos Limpia")
print("=" * 80)

# Crear todas las tablas
print("\n📋 Creando tablas...")
Base.metadata.create_all(bind=engine)
print("✅ Tablas creadas exitosamente")

# Crear usuarios de prueba
print("\n👥 Creando usuarios de prueba...")

from app.db.session import SessionLocal
db = SessionLocal()

try:
    # Verificar si ya existen usuarios
    existing_users = db.query(User).count()
    
    if existing_users == 0:
        # Crear profesor
        teacher = User(
            email="profesor1@gmail.com",
            password_hash=get_password_hash("profe123"),
            first_name="Carlos",
            last_name="Martínez",
            role=UserRole.TEACHER,
            is_active=True
        )
        db.add(teacher)
        
        # Crear students
        students = [
            User(
                email="student1@gmail.com",
                password_hash=get_password_hash("student123"),
                first_name="Ana",
                last_name="García",
                role=UserRole.STUDENT,
                is_active=True
            ),
            User(
                email="student2@gmail.com",
                password_hash=get_password_hash("student123"),
                first_name="Luis",
                last_name="Rodríguez",
                role=UserRole.STUDENT,
                is_active=True
            ),
            User(
                email="student3@gmail.com",
                password_hash=get_password_hash("student123"),
                first_name="María",
                last_name="López",
                role=UserRole.STUDENT,
                is_active=True
            )
        ]
        
        for student in students:
            db.add(student)
        
        db.commit()
        print("✅ Usuarios de prueba creados:")
        print("   👨‍🏫 Profesor: profesor1@gmail.com / profesor123")
        print("   👨‍🎓 student 1: student1@gmail.com / student123")
        print("   👨‍🎓 student 2: student2@gmail.com / student123")
        print("   👨‍🎓 student 3: student3@gmail.com / student123")
    else:
        print(f"ℹ️  Ya existen {existing_users} usuarios en la base de datos")
    
    # Crear periodo académico
    existing_periods = db.query(AcademicPeriod).count()
    if existing_periods == 0:
        period = AcademicPeriod(
            name="Segundo Semestre 2025",
            code="2025-2",
            start_date=datetime(2025, 8, 1),
            end_date=datetime(2025, 12, 15),
            is_active=True,
            is_current=True
        )
        db.add(period)
        db.commit()
        print("✅ Periodo académico creado: 2025-2")
    else:
        print(f"ℹ️  Ya existen periodos académicos")
    
    print("\n" + "=" * 80)
    print("✅ SETUP COMPLETADO EXITOSAMENTE")
    print("=" * 80)
    print("\n📊 Estructura de base de datos:")
    print("   ✓ users")
    print("   ✓ subjects")
    print("   ✓ groups")
    print("   ✓ group_memberships")
    print("   ✓ class_sessions")
    print("   ✓ session_attendance")
    print("   ✓ attention_metrics")
    print("   ✓ alerts")
    print("   ✓ class_feedback")
    print("   ✓ academic_periods")
    
    print("\n🎯 Próximos pasos:")
    print("   1. Inicia el backend: uvicorn app.main:app --reload")
    print("   2. Inicia el frontend: npm run dev")
    print("   3. Login como profesor para crear asignaturas y grupos")
    print("   4. Matricula students en los grupos")
    print("   5. Inicia una sesión y comienza a monitorear")
    print("\n")

except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()