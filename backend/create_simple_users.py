# backend/create_simple_users.py
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.class_model import Class, ClassEnrollment
from app.models.metrics import ClassSession, SessionStatus
from app.core.security import get_password_hash
from datetime import datetime
import uuid

db = SessionLocal()

try:
    # Crear profesor
    teacher = User(
        id=uuid.uuid4(),
        email="teacher@test.com",
        password_hash=get_password_hash("password123"),
        first_name="Carlos",
        last_name="Profesor",
        role=UserRole.TEACHER,
        is_active=True
    )
    db.add(teacher)
    print("✅ Profesor: teacher@test.com / password123")
    
    # Crear estudiantes con emails simples
    students_data = [
        ("student1@test.com", "María", "García"),
        ("student2@test.com", "Juan", "Pérez"),
        ("student3@test.com", "Ana", "López"),
        ("student4@test.com", "Pedro", "Martínez"),
        ("student5@test.com", "Laura", "Rodríguez"),
    ]
    
    students = []
    for email, first_name, last_name in students_data:
        student = User(
            id=uuid.uuid4(),
            email=email,
            password_hash=get_password_hash("password123"),
            first_name=first_name,
            last_name=last_name,
            role=UserRole.STUDENT,
            is_active=True
        )
        students.append(student)
        db.add(student)
        print(f"✅ Estudiante: {email} / password123")
    
    db.commit()
    
    # Crear clase
    clase = Class(
        id=uuid.uuid4(),
        teacher_id=teacher.id,
        name="Matemáticas Avanzadas",
        description="Curso de cálculo diferencial e integral",
        subject="Matemáticas",
        schedule_day="Lunes",
        duration_minutes=90,
        is_active=True
    )
    db.add(clase)
    db.commit()
    print(f"\n✅ Clase creada: {clase.name}")
    
    # Inscribir estudiantes
    for student in students:
        enrollment = ClassEnrollment(
            id=uuid.uuid4(),
            class_id=clase.id,
            student_id=student.id,
            is_active=True
        )
        db.add(enrollment)
    db.commit()
    print(f"✅ {len(students)} estudiantes inscritos")
    
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
    print(f"\n✅ Sesión activa creada: {session.id}")
    
    print("\n" + "="*60)
    print("✅ SISTEMA CONFIGURADO")
    print("="*60)
    print("\n📧 CREDENCIALES:")
    print("\n👨‍🏫 PROFESOR:")
    print("   Email: teacher@test.com")
    print("   Password: password123")
    print("\n👨‍🎓 ESTUDIANTES:")
    for email, first, last in students_data:
        print(f"   Email: {email}")
        print(f"   Nombre: {first} {last}")
        print(f"   Password: password123\n")
    
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
    import traceback
    traceback.print_exc()
finally:
    db.close()