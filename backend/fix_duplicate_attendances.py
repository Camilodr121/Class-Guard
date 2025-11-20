# backend/fix_duplicate_attendances.py
from app.db.session import get_db
from app.models.metrics import SessionAttendance
from sqlalchemy import func

def fix_duplicate_attendances():
    """Elimina asistencias duplicadas manteniendo solo la más reciente"""
    db = next(get_db())
    
    try:
        # Encontrar duplicados (sesión + estudiante con múltiples registros activos)
        duplicates = db.query(
            SessionAttendance.session_id,
            SessionAttendance.student_id,
            func.count(SessionAttendance.id).label('count')
        ).filter(
            SessionAttendance.left_at.is_(None)
        ).group_by(
            SessionAttendance.session_id,
            SessionAttendance.student_id
        ).having(
            func.count(SessionAttendance.id) > 1
        ).all()
        
        print(f"🔍 Encontradas {len(duplicates)} combinaciones duplicadas")
        
        for dup in duplicates:
            # Obtener todas las asistencias de esta combinación
            attendances = db.query(SessionAttendance).filter(
                SessionAttendance.session_id == dup.session_id,
                SessionAttendance.student_id == dup.student_id,
                SessionAttendance.left_at.is_(None)
            ).order_by(SessionAttendance.joined_at.desc()).all()
            
            # Mantener solo la más reciente
            keep = attendances[0]
            to_delete = attendances[1:]
            
            print(f"\n📌 Sesión: {dup.session_id}, Estudiante: {dup.student_id}")
            print(f"   ✅ Manteniendo: {keep.id} (joined: {keep.joined_at})")
            
            for att in to_delete:
                print(f"   🗑️  Eliminando: {att.id} (joined: {att.joined_at})")
                db.delete(att)
            
            db.commit()
        
        print(f"\n✅ Limpieza completada. {len(duplicates)} duplicados eliminados.")
    
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_duplicate_attendances()
