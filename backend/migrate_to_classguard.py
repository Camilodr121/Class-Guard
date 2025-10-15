# backend/migrate_to_classguard.py
"""
Script de migración para actualizar la base de datos de Attention Monitor a Class Guard
Este script:
1. Crea las nuevas tablas (subjects, groups, group_memberships, academic_periods)
2. Migra los datos existentes de 'classes' al nuevo sistema
3. Actualiza las referencias en class_sessions
"""

import sys
import os
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine, SessionLocal
from app.models.user import Base as UserBase, User
from app.models.academic import Subject, Group, GroupMembership, AcademicPeriod
from app.models.metrics import ClassSession, SessionAttendance, AttentionMetric, Alert, ClassFeedback

print("=" * 80)
print("🚀 MIGRATION: Attention Monitor → Class Guard")
print("=" * 80)

def check_table_exists(table_name: str) -> bool:
    """Verifica si una tabla existe"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def migrate_database():
    """Ejecuta la migración completa"""
    db: Session = SessionLocal()
    
    try:
        print("\n📋 Paso 1: Verificando tablas existentes...")
        
        has_old_classes = check_table_exists('classes')
        has_subjects = check_table_exists('subjects')
        
        print(f"   - Tabla 'classes' existe: {has_old_classes}")
        print(f"   - Tabla 'subjects' existe: {has_subjects}")
        
        # Crear todas las tablas nuevas
        print("\n📋 Paso 2: Creando nuevas tablas...")
        
        # Importar TODOS los modelos para que SQLAlchemy los conozca
        from app.models import user, academic, metrics
        from app.db.session import Base
        
        Base.metadata.create_all(bind=engine)
        print("   ✅ Tablas creadas/verificadas exitosamente")
        
        # Si hay datos antiguos, migrarlos
        if has_old_classes and not has_subjects:
            print("\n📋 Paso 3: Migrando datos existentes...")
            migrate_old_data(db)
        else:
            print("\n📋 Paso 3: No hay datos antiguos para migrar")
        
        # Crear periodo académico actual si no existe
        print("\n📋 Paso 4: Creando periodo académico actual...")
        create_current_period(db)
        
        print("\n" + "=" * 80)
        print("✅ MIGRACIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 80)
        print("\nPróximos pasos:")
        print("1. Reinicia el backend")
        print("2. Accede al sistema con tu cuenta")
        print("3. Crea asignaturas y grupos desde el dashboard")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ ERROR durante la migración: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

def migrate_old_data(db: Session):
    """Migra datos del modelo antiguo 'classes' al nuevo sistema"""
    try:
        # Obtener todas las clases antiguas
        result = db.execute(text("SELECT * FROM classes WHERE is_active = true"))
        old_classes = result.fetchall()
        
        print(f"   - Encontradas {len(old_classes)} clases antiguas")
        
        for old_class in old_classes:
            # Crear Subject
            subject = Subject(
                id=old_class.id,  # Mantener el mismo ID
                name=old_class.name,
                code=f"SUB-{old_class.id.hex[:8].upper()}",
                description=old_class.description,
                teacher_id=old_class.teacher_id,
                semester="2024-2",  # Valor por defecto
                is_active=old_class.is_active
            )
            db.add(subject)
            
            # Crear un grupo por defecto para esta asignatura
            group = Group(
                name=f"Grupo A",
                code="A",
                subject_id=subject.id,
                schedule_day=old_class.schedule_day,
                schedule_time=old_class.schedule_time,
                duration_minutes=old_class.duration_minutes or 90,
                created_by=old_class.teacher_id,
                is_active=True
            )
            db.add(group)
            db.flush()  # Para obtener el ID del grupo
            
            # Migrar enrollments a group_memberships
            result = db.execute(
                text("SELECT * FROM class_enrollments WHERE class_id = :class_id AND is_active = true"),
                {"class_id": old_class.id}
            )
            enrollments = result.fetchall()
            
            for enrollment in enrollments:
                membership = GroupMembership(
                    group_id=group.id,
                    student_id=enrollment.student_id,
                    enrolled_at=enrollment.enrolled_at,
                    is_active=enrollment.is_active,
                    enrolled_by=old_class.teacher_id
                )
                db.add(membership)
            
            print(f"   ✅ Migrada: {old_class.name} → {subject.name} (Grupo {group.code})")
            print(f"      - {len(enrollments)} estudiantes matriculados")
        
        # Actualizar class_sessions para usar group_id
        print("\n   - Actualizando sesiones de clase...")
        
        # Primero, agregar columna group_id si no existe
        db.execute(text("ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS group_id UUID"))
        
        # Actualizar sesiones con el grupo correspondiente
        db.execute(text("""
            UPDATE class_sessions cs
            SET group_id = g.id
            FROM groups g
            JOIN subjects s ON g.subject_id = s.id
            WHERE cs.class_id = s.id
            AND cs.group_id IS NULL
        """))
        
        db.commit()
        print("   ✅ Datos migrados exitosamente")
        
    except Exception as e:
        print(f"   ❌ Error migrando datos: {e}")
        raise

def create_current_period(db: Session):
    """Crea el periodo académico actual si no existe"""
    from datetime import datetime, timedelta
    
    existing = db.query(AcademicPeriod).filter(AcademicPeriod.is_current == True).first()
    
    if not existing:
        now = datetime.utcnow()
        period = AcademicPeriod(
            name="Segundo Semestre 2024",
            code="2024-2",
            start_date=datetime(2024, 8, 1),
            end_date=datetime(2024, 12, 15),
            is_active=True,
            is_current=True
        )
        db.add(period)
        db.commit()
        print("   ✅ Periodo académico actual creado: 2024-2")
    else:
        print(f"   ℹ️  Periodo académico existente: {existing.name}")

if __name__ == "__main__":
    print("\n⚠️  ADVERTENCIA: Este script modificará la base de datos")
    print("   Asegúrate de tener un backup antes de continuar\n")
    
    response = input("¿Deseas continuar? (yes/no): ")
    
    if response.lower() in ['yes', 'y', 'si', 's']:
        migrate_database()
    else:
        print("Migración cancelada")