# backend/verify_migration.py
"""
Script de verificación post-migración
Verifica que todas las tablas, relaciones y datos estén correctos
"""

import sys
import os
from sqlalchemy import inspect, text
from tabulate import tabulate
from colorama import init, Fore, Style

# Inicializar colorama para colores en terminal
init(autoreset=True)

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine, SessionLocal
from app.models.user import User
from app.models.academic import Subject, Group, GroupMembership
from app.models.metrics import ClassSession, SessionAttendance

def print_header(text):
    """Imprimir header con estilo"""
    print("\n" + "=" * 80)
    print(f"{Fore.CYAN}{Style.BRIGHT}{text}{Style.RESET_ALL}")
    print("=" * 80)

def print_success(text):
    """Imprimir mensaje de éxito"""
    print(f"{Fore.GREEN}✅ {text}{Style.RESET_ALL}")

def print_error(text):
    """Imprimir mensaje de error"""
    print(f"{Fore.RED}❌ {text}{Style.RESET_ALL}")

def print_warning(text):
    """Imprimir advertencia"""
    print(f"{Fore.YELLOW}⚠️  {text}{Style.RESET_ALL}")

def print_info(text):
    """Imprimir información"""
    print(f"{Fore.BLUE}ℹ️  {text}{Style.RESET_ALL}")

def verify_tables():
    """Verificar que todas las tablas necesarias existen"""
    print_header("VERIFICANDO TABLAS")
    
    inspector = inspect(engine)
    all_tables = inspector.get_table_names()
    
    required_tables = [
        'users',
        'subjects',
        'groups',
        'group_memberships',
        'academic_periods',
        'class_sessions',
        'session_attendance',
        'attention_metrics',
        'alerts',
        'class_feedback'
    ]
    
    table_status = []
    all_exist = True
    
    for table in required_tables:
        exists = table in all_tables
        status = "✅" if exists else "❌"
        table_status.append([table, status])
        
        if not exists:
            all_exist = False
            print_error(f"Tabla '{table}' NO existe")
        else:
            print_success(f"Tabla '{table}' existe")
    
    print("\n" + tabulate(table_status, headers=["Tabla", "Estado"], tablefmt="grid"))
    
    return all_exist

def verify_columns():
    """Verificar columnas críticas"""
    print_header("VERIFICANDO COLUMNAS CRÍTICAS")
    
    inspector = inspect(engine)
    db = SessionLocal()
    
    checks = [
        {
            'table': 'class_sessions',
            'column': 'group_id',
            'description': 'Relación con grupos'
        },
        {
            'table': 'class_sessions',
            'column': 'total_students_expected',
            'description': 'Total de estudiantes esperados'
        },
        {
            'table': 'session_attendance',
            'column': 'min_attention_score',
            'description': 'Score mínimo de atención'
        },
        {
            'table': 'session_attendance',
            'column': 'max_attention_score',
            'description': 'Score máximo de atención'
        }
    ]
    
    all_ok = True
    
    for check in checks:
        try:
            columns = [col['name'] for col in inspector.get_columns(check['table'])]
            exists = check['column'] in columns
            
            if exists:
                print_success(f"{check['table']}.{check['column']} - {check['description']}")
            else:
                print_error(f"{check['table']}.{check['column']} - NO existe")
                all_ok = False
        except Exception as e:
            print_error(f"Error verificando {check['table']}: {e}")
            all_ok = False
    
    db.close()
    return all_ok

def verify_foreign_keys():
    """Verificar foreign keys"""
    print_header("VERIFICANDO FOREIGN KEYS")
    
    inspector = inspect(engine)
    
    critical_fks = [
        ('groups', 'subject_id', 'subjects'),
        ('group_memberships', 'group_id', 'groups'),
        ('group_memberships', 'student_id', 'users'),
        ('class_sessions', 'group_id', 'groups'),
        ('session_attendance', 'session_id', 'class_sessions'),
        ('attention_metrics', 'session_id', 'class_sessions')
    ]
    
    all_ok = True
    
    for table, fk_column, ref_table in critical_fks:
        try:
            fks = inspector.get_foreign_keys(table)
            fk_exists = any(
                fk_column in fk['constrained_columns'] and 
                fk['referred_table'] == ref_table 
                for fk in fks
            )
            
            if fk_exists:
                print_success(f"{table}.{fk_column} → {ref_table}")
            else:
                print_warning(f"{table}.{fk_column} → {ref_table} - No encontrada")
                all_ok = False
        except Exception as e:
            print_error(f"Error verificando FK en {table}: {e}")
            all_ok = False
    
    return all_ok

def verify_data():
    """Verificar datos migrados"""
    print_header("VERIFICANDO DATOS")
    
    db = SessionLocal()
    
    try:
        # Contar registros
        users_count = db.query(User).count()
        subjects_count = db.query(Subject).count()
        groups_count = db.query(Group).count()
        memberships_count = db.query(GroupMembership).count()
        sessions_count = db.query(ClassSession).count()
        
        data_summary = [
            ["Usuarios", users_count],
            ["Asignaturas", subjects_count],
            ["Grupos", groups_count],
            ["Matrículas", memberships_count],
            ["Sesiones", sessions_count]
        ]
        
        print("\n" + tabulate(data_summary, headers=["Tipo", "Cantidad"], tablefmt="grid"))
        
        if subjects_count > 0:
            print_success(f"Se migraron {subjects_count} asignaturas")
        else:
            print_warning("No hay asignaturas. Esto es normal si es una instalación nueva.")
        
        if groups_count > 0:
            print_success(f"Se crearon {groups_count} grupos")
        else:
            print_warning("No hay grupos. Debes crear grupos para las asignaturas.")
        
        # Verificar integridad referencial
        orphan_groups = db.query(Group).filter(
            ~Group.subject_id.in_(db.query(Subject.id))
        ).count()
        
        if orphan_groups > 0:
            print_error(f"¡ADVERTENCIA! {orphan_groups} grupos sin asignatura válida")
        else:
            print_success("Todos los grupos tienen asignaturas válidas")
        
        return True
        
    except Exception as e:
        print_error(f"Error verificando datos: {e}")
        return False
    finally:
        db.close()

def verify_indexes():
    """Verificar índices importantes"""
    print_header("VERIFICANDO ÍNDICES")
    
    inspector = inspect(engine)
    
    critical_indexes = [
        ('class_sessions', 'group_id'),
        ('class_sessions', 'started_at'),
        ('session_attendance', 'session_id'),
        ('session_attendance', 'student_id'),
        ('attention_metrics', 'session_id'),
        ('attention_metrics', 'student_id'),
        ('attention_metrics', 'timestamp')
    ]
    
    all_ok = True
    
    for table, column in critical_indexes:
        try:
            indexes = inspector.get_indexes(table)
            index_exists = any(column in idx['column_names'] for idx in indexes)
            
            if index_exists:
                print_success(f"Índice en {table}.{column}")
            else:
                print_info(f"Sin índice en {table}.{column} (recomendado agregarlo)")
        except Exception as e:
            print_error(f"Error verificando índice en {table}: {e}")
    
    return all_ok

def test_queries():
    """Probar queries críticas"""
    print_header("PROBANDO QUERIES")
    
    db = SessionLocal()
    
    try:
        # Query 1: Obtener asignaturas con grupos
        print_info("Query 1: Asignaturas con sus grupos...")
        subjects = db.query(Subject).limit(3).all()
        for subject in subjects:
            groups_count = len(subject.groups)
            print_success(f"  {subject.name} ({subject.code}) - {groups_count} grupos")
        
        # Query 2: Obtener grupos con estudiantes
        print_info("Query 2: Grupos con estudiantes...")
        groups = db.query(Group).limit(3).all()
        for group in groups:
            students_count = group.current_students_count
            print_success(f"  {group.name} - {students_count} estudiantes")
        
        # Query 3: Sesiones con métricas
        print_info("Query 3: Sesiones recientes...")
        sessions = db.query(ClassSession).order_by(
            ClassSession.started_at.desc()
        ).limit(3).all()
        
        for session in sessions:
            if session.group and session.group.subject:
                print_success(
                    f"  {session.group.subject.name} - "
                    f"{session.group.name} - "
                    f"{session.status.value}"
                )
        
        print_success("Todas las queries funcionan correctamente")
        return True
        
    except Exception as e:
        print_error(f"Error en queries: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def run_verification():
    """Ejecutar todas las verificaciones"""
    print("\n" + "=" * 80)
    print(f"{Fore.CYAN}{Style.BRIGHT}CLASS GUARD - VERIFICACIÓN POST-MIGRACIÓN{Style.RESET_ALL}")
    print("=" * 80)
    
    results = {
        "Tablas": verify_tables(),
        "Columnas": verify_columns(),
        "Foreign Keys": verify_foreign_keys(),
        "Datos": verify_data(),
        "Índices": verify_indexes(),
        "Queries": test_queries()
    }
    
    print_header("RESUMEN DE VERIFICACIÓN")
    
    summary = []
    all_passed = True
    
    for check, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        summary.append([check, status])
        if not passed:
            all_passed = False
    
    print("\n" + tabulate(summary, headers=["Verificación", "Estado"], tablefmt="grid"))
    
    print("\n" + "=" * 80)
    if all_passed:
        print(f"{Fore.GREEN}{Style.BRIGHT}✅ TODAS LAS VERIFICACIONES PASARON{Style.RESET_ALL}")
        print(f"{Fore.GREEN}La migración se completó exitosamente.{Style.RESET_ALL}")
        print(f"{Fore.GREEN}El sistema está listo para usar.{Style.RESET_ALL}")
    else:
        print(f"{Fore.RED}{Style.BRIGHT}❌ ALGUNAS VERIFICACIONES FALLARON{Style.RESET_ALL}")
        print(f"{Fore.RED}Revisa los errores arriba y corrige los problemas.{Style.RESET_ALL}")
    print("=" * 80 + "\n")
    
    return all_passed

if __name__ == "__main__":
    try:
        success = run_verification()
        sys.exit(0 if success else 1)
    except Exception as e:
        print_error(f"Error crítico durante la verificación: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)