"""
Script COMPLETO para sincronizar TODAS las columnas faltantes
"""
import sys
from sqlalchemy import text
from app.db.session import SessionLocal

def fix_missing_columns():
    """Agrega todas las columnas faltantes a todas las tablas"""
    db = SessionLocal()
    
    # TODAS las columnas que pueden faltar en cada tabla
    missing_columns = {
        'class_sessions': [
            ('total_students_expected', 'INTEGER DEFAULT 0')
        ],
        'alerts': [
            ('priority', "VARCHAR(20) DEFAULT 'medium'"),
            ('acknowledged_at', 'TIMESTAMP'),
            ('is_acknowledged', 'BOOLEAN DEFAULT false')
        ],
        'session_attendance': [
            ('min_attention_score', 'FLOAT'),
            ('max_attention_score', 'FLOAT'),
            ('time_looking_away_seconds', 'INTEGER DEFAULT 0'),
            ('total_low_attention_events', 'INTEGER DEFAULT 0')
        ],
        'attention_metrics': [
            ('confidence', 'FLOAT'),
            ('ear', 'FLOAT'),
            ('mar', 'FLOAT'),
            ('blink_detected', 'BOOLEAN DEFAULT false'),
            ('yawns_detected', 'BOOLEAN DEFAULT false'),
            ('looking_away', 'BOOLEAN DEFAULT false'),
            ('head_pose_pitch', 'FLOAT'),
            ('head_pose_yaw', 'FLOAT'),
            ('head_pose_roll', 'FLOAT'),
            ('prob_low', 'FLOAT'),
            ('prob_medium', 'FLOAT'),
            ('prob_high', 'FLOAT'),
            ('using_ml', 'BOOLEAN DEFAULT true')
        ],
        'class_feedback': [
            ('trend', 'VARCHAR(20)'),
            ('insights', 'JSON'),
            ('recommendations', 'JSON'),
            ('was_viewed', 'BOOLEAN DEFAULT false')
        ]
    }
    
    try:
        print("🔍 Verificando TODAS las columnas en TODAS las tablas...")
        print("=" * 70)
        
        columns_added = 0
        errors = []
        
        for table_name, columns in missing_columns.items():
            print(f"\n📋 Tabla: {table_name}")
            
            for column_name, column_type in columns:
                # Verificar si existe
                check_query = text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='{table_name}' 
                    AND column_name='{column_name}'
                """)
                
                result = db.execute(check_query).fetchone()
                
                if result:
                    print(f"  ✅ {column_name} - Ya existe")
                else:
                    print(f"  ⚠️  {column_name} - NO existe. Agregando...", end="")
                    
                    try:
                        alter_query = text(f"""
                            ALTER TABLE {table_name} 
                            ADD COLUMN {column_name} {column_type}
                        """)
                        
                        db.execute(alter_query)
                        db.commit()
                        
                        print(" ✅ AGREGADA")
                        columns_added += 1
                        
                    except Exception as e:
                        error_msg = f"{table_name}.{column_name}: {str(e)}"
                        errors.append(error_msg)
                        print(f" ❌ ERROR")
                        print(f"     {str(e)[:100]}")
                        db.rollback()
        
        # Actualizar valores predeterminados
        if columns_added > 0:
            print("\n" + "=" * 70)
            print("📊 Actualizando valores predeterminados...")
            
            updates = [
                {
                    'name': 'class_sessions.total_students_expected',
                    'query': """
                        UPDATE class_sessions cs
                        SET total_students_expected = (
                            SELECT COUNT(*)
                            FROM group_memberships gm
                            WHERE gm.group_id = cs.group_id
                            AND gm.is_active = true
                        )
                        WHERE cs.total_students_expected = 0 OR cs.total_students_expected IS NULL
                    """
                },
                {
                    'name': 'alerts.priority',
                    'query': """
                        UPDATE alerts
                        SET priority = 'medium'
                        WHERE priority IS NULL
                    """
                },
                {
                    'name': 'alerts.is_acknowledged',
                    'query': """
                        UPDATE alerts
                        SET is_acknowledged = false
                        WHERE is_acknowledged IS NULL
                    """
                }
            ]
            
            for update in updates:
                try:
                    db.execute(text(update['query']))
                    db.commit()
                    print(f"  ✅ {update['name']}")
                except Exception as e:
                    print(f"  ⚠️  {update['name']}: {str(e)[:80]}")
        
        print("\n" + "=" * 70)
        print(f"✅ COMPLETADO: {columns_added} columnas agregadas")
        
        if errors:
            print(f"⚠️  {len(errors)} errores encontrados:")
            for error in errors[:5]:  # Mostrar solo los primeros 5
                print(f"  - {error}")
        
        print("=" * 70)
        return len(errors) == 0
        
    except Exception as e:
        print(f"\n❌ ERROR CRÍTICO: {str(e)}")
        db.rollback()
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 70)
    print("🔧 SINCRONIZADOR DE BASE DE DATOS - Class Guard")
    print("=" * 70)
    
    success = fix_missing_columns()
    
    print("\n" + "=" * 70)
    if success:
        print("✅ ¡ÉXITO! Base de datos sincronizada")
        print("🔄 REINICIA el servidor FastAPI ahora")
    else:
        print("⚠️  Proceso completado con advertencias")
        print("🔄 REINICIA el servidor FastAPI de todas formas")
    print("=" * 70)
    
    sys.exit(0 if success else 1)
