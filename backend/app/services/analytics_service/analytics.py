# backend/app/services/analytics_service/analytics.py
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from uuid import UUID
import numpy as np

from app.models.metrics import (
    ClassSession, SessionAttendance, AttentionMetric, 
    Alert, AttentionLevel, SessionStatus
)
from app.models.user import User
from app.models.class_model import Class

class AnalyticsService:
    """Servicio de análisis y generación de reportes"""
    
    @staticmethod
    def get_student_dashboard_stats(db: Session, student_id: UUID) -> Dict:
        """
        Obtiene estadísticas para el dashboard del estudiante
        """
        # Últimas 4 semanas
        since_date = datetime.utcnow() - timedelta(days=28)
        
        # Obtener asistencias
        attendances = db.query(SessionAttendance).filter(
            SessionAttendance.student_id == student_id,
            SessionAttendance.joined_at >= since_date
        ).all()
        
        if not attendances:
            return {
                'total_classes': 0,
                'total_hours': 0,
                'average_attention': 0,
                'total_blinks': 0,
                'total_yawns': 0,
                'streak_days': 0,
                'trend': 'stable',
                'weekly_performance': []
            }
        
        # Calcular estadísticas
        total_classes = len(attendances)
        total_minutes = sum(a.duration_minutes or 0 for a in attendances)
        total_hours = round(total_minutes / 60, 1)
        
        avg_attention = sum(a.average_attention_score or 0 for a in attendances) / total_classes
        total_blinks = sum(a.total_blinks for a in attendances)
        total_yawns = sum(a.total_yawns for a in attendances)
        
        # Calcular racha (días consecutivos con clases)
        streak_days = AnalyticsService._calculate_streak(attendances)
        
        # Calcular tendencia
        trend = AnalyticsService._calculate_trend_direction(attendances)
        
        # Performance semanal
        weekly_performance = AnalyticsService._get_weekly_performance(db, student_id)
        
        return {
            'total_classes': total_classes,
            'total_hours': total_hours,
            'average_attention': round(avg_attention, 1),
            'total_blinks': total_blinks,
            'total_yawns': total_yawns,
            'streak_days': streak_days,
            'trend': trend,
            'weekly_performance': weekly_performance
        }
    
    @staticmethod
    def get_teacher_dashboard_stats(db: Session, teacher_id: UUID) -> Dict:
        """
        Obtiene estadísticas para el dashboard del profesor
        """
        # Obtener clases del profesor
        classes = db.query(Class).filter(
            Class.teacher_id == teacher_id,
            Class.is_active == True
        ).all()
        
        class_ids = [c.id for c in classes]
        
        # Sesiones en las últimas 4 semanas
        since_date = datetime.utcnow() - timedelta(days=28)
        sessions = db.query(ClassSession).filter(
            ClassSession.class_id.in_(class_ids),
            ClassSession.started_at >= since_date
        ).all()
        
        if not sessions:
            return {
                'total_classes': len(classes),
                'total_sessions': 0,
                'total_students': 0,
                'average_attention': 0,
                'active_alerts': 0,
                'best_performing_class': None,
                'attention_distribution': {'high': 0, 'medium': 0, 'low': 0}
            }
        
        # Estudiantes únicos
        total_students = db.query(func.count(func.distinct(SessionAttendance.student_id))).filter(
            SessionAttendance.session_id.in_([s.id for s in sessions])
        ).scalar()
        
        # Promedio de atención
        avg_attention = sum(s.average_attention_score or 0 for s in sessions if s.average_attention_score) / len([s for s in sessions if s.average_attention_score])
        
        # Alertas activas (últimas 24 horas)
        yesterday = datetime.utcnow() - timedelta(days=1)
        active_alerts = db.query(func.count(Alert.id)).filter(
            Alert.session_id.in_([s.id for s in sessions]),
            Alert.created_at >= yesterday,
            Alert.is_acknowledged == False
        ).scalar()
        
        # Mejor clase
        best_class = AnalyticsService._get_best_performing_class(db, class_ids)
        
        # Distribución de atención
        attention_dist = AnalyticsService._get_attention_distribution(db, [s.id for s in sessions])
        
        return {
            'total_classes': len(classes),
            'total_sessions': len(sessions),
            'total_students': total_students or 0,
            'average_attention': round(avg_attention, 1),
            'active_alerts': active_alerts or 0,
            'best_performing_class': best_class,
            'attention_distribution': attention_dist
        }
    
    @staticmethod
    def get_session_detailed_report(db: Session, session_id: UUID) -> Dict:
        """
        Genera reporte detallado de una sesión específica
        """
        session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
        if not session:
            return {}
        
        # Asistencias
        attendances = db.query(SessionAttendance).filter(
            SessionAttendance.session_id == session_id
        ).all()
        
        # Métricas
        metrics = db.query(AttentionMetric).filter(
            AttentionMetric.session_id == session_id
        ).all()
        
        # Estadísticas por estudiante
        student_stats = []
        for attendance in attendances:
            student = db.query(User).filter(User.id == attendance.student_id).first()
            student_metrics = [m for m in metrics if m.student_id == attendance.student_id]
            
            if student_metrics:
                avg_score = sum(m.attention_score for m in student_metrics) / len(student_metrics)
                high_count = sum(1 for m in student_metrics if m.attention_level == AttentionLevel.HIGH)
                medium_count = sum(1 for m in student_metrics if m.attention_level == AttentionLevel.MEDIUM)
                low_count = sum(1 for m in student_metrics if m.attention_level == AttentionLevel.LOW)
                
                student_stats.append({
                    'student_id': str(attendance.student_id),
                    'student_name': f"{student.first_name} {student.last_name}" if student else "Unknown",
                    'duration_minutes': attendance.duration_minutes or 0,
                    'average_attention': round(avg_score, 1),
                    'total_blinks': attendance.total_blinks,
                    'total_yawns': attendance.total_yawns,
                    'attention_distribution': {
                        'high': high_count,
                        'medium': medium_count,
                        'low': low_count
                    }
                })
        
        # Timeline de atención (cada 5 minutos)
        timeline = AnalyticsService._generate_attention_timeline(metrics)
        
        # Alertas generadas
        alerts = db.query(Alert).filter(Alert.session_id == session_id).all()
        alert_summary = {
            'total': len(alerts),
            'critical': sum(1 for a in alerts if a.priority == 'CRITICAL'),
            'high': sum(1 for a in alerts if a.priority == 'HIGH'),
            'medium': sum(1 for a in alerts if a.priority == 'MEDIUM')
        }
        
        return {
            'session_id': str(session.id),
            'started_at': session.started_at.isoformat(),
            'ended_at': session.ended_at.isoformat() if session.ended_at else None,
            'duration_minutes': session.duration_minutes,
            'average_attention': session.average_attention_score,
            'total_students': session.total_students_present,
            'student_stats': sorted(student_stats, key=lambda x: x['average_attention'], reverse=True),
            'attention_timeline': timeline,
            'alert_summary': alert_summary
        }
    
    @staticmethod
    def get_class_progress_report(db: Session, class_id: UUID, weeks: int = 4) -> Dict:
        """
        Genera reporte de progreso de una clase
        """
        since_date = datetime.utcnow() - timedelta(weeks=weeks)
        
        sessions = db.query(ClassSession).filter(
            ClassSession.class_id == class_id,
            ClassSession.started_at >= since_date,
            ClassSession.status == SessionStatus.COMPLETED
        ).order_by(ClassSession.started_at.asc()).all()
        
        if not sessions:
            return {'error': 'No data available'}
        
        # Tendencia de atención por sesión
        session_trends = []
        for session in sessions:
            session_trends.append({
                'date': session.started_at.strftime('%Y-%m-%d'),
                'average_attention': session.average_attention_score or 0,
                'students_present': session.total_students_present
            })
        
        # Estudiantes más y menos participativos
        top_students = AnalyticsService._get_top_students(db, class_id, limit=5)
        struggling_students = AnalyticsService._get_struggling_students(db, class_id, limit=5)
        
        # Métricas generales
        avg_attention = sum(s.average_attention_score or 0 for s in sessions) / len(sessions)
        total_hours = sum(s.duration_minutes or 0 for s in sessions) / 60
        
        # Calcular mejora
        if len(sessions) >= 2:
            first_half = sessions[:len(sessions)//2]
            second_half = sessions[len(sessions)//2:]
            
            first_avg = sum(s.average_attention_score or 0 for s in first_half) / len(first_half)
            second_avg = sum(s.average_attention_score or 0 for s in second_half) / len(second_half)
            
            improvement = round(((second_avg - first_avg) / first_avg) * 100, 1)
        else:
            improvement = 0
        
        return {
            'total_sessions': len(sessions),
            'total_hours': round(total_hours, 1),
            'average_attention': round(avg_attention, 1),
            'improvement_percentage': improvement,
            'session_trends': session_trends,
            'top_students': top_students,
            'struggling_students': struggling_students
        }
    
    @staticmethod
    def get_student_detailed_report(db: Session, student_id: UUID, weeks: int = 4) -> Dict:
        """
        Genera reporte detallado de un estudiante
        """
        since_date = datetime.utcnow() - timedelta(weeks=weeks)
        
        attendances = db.query(SessionAttendance).filter(
            SessionAttendance.student_id == student_id,
            SessionAttendance.joined_at >= since_date
        ).all()
        
        if not attendances:
            return {'error': 'No data available'}
        
        # Obtener todas las métricas
        session_ids = [a.session_id for a in attendances]
        metrics = db.query(AttentionMetric).filter(
            AttentionMetric.student_id == student_id,
            AttentionMetric.session_id.in_(session_ids)
        ).all()
        
        # Análisis por hora del día
        hour_analysis = AnalyticsService._analyze_by_hour(metrics)
        
        # Análisis por día de la semana
        day_analysis = AnalyticsService._analyze_by_day(attendances)
        
        # Patrones de comportamiento
        patterns = {
            'avg_blinks_per_session': sum(a.total_blinks for a in attendances) / len(attendances),
            'avg_yawns_per_session': sum(a.total_yawns for a in attendances) / len(attendances),
            'most_attentive_hour': max(hour_analysis.items(), key=lambda x: x[1])[0] if hour_analysis else None,
            'best_day': max(day_analysis.items(), key=lambda x: x[1])[0] if day_analysis else None
        }
        
        # Recomendaciones personalizadas
        recommendations = AnalyticsService._generate_recommendations(attendances, metrics)
        
        return {
            'total_sessions': len(attendances),
            'total_hours': sum(a.duration_minutes or 0 for a in attendances) / 60,
            'average_attention': sum(a.average_attention_score or 0 for a in attendances) / len(attendances),
            'hour_analysis': hour_analysis,
            'day_analysis': day_analysis,
            'patterns': patterns,
            'recommendations': recommendations
        }
    
    # ==================== MÉTODOS AUXILIARES ====================
    
    @staticmethod
    def _calculate_streak(attendances: List[SessionAttendance]) -> int:
        """Calcula días consecutivos con clases"""
        if not attendances:
            return 0
        
        dates = sorted(set(a.joined_at.date() for a in attendances), reverse=True)
        streak = 0
        expected_date = datetime.utcnow().date()
        
        for date in dates:
            if date == expected_date:
                streak += 1
                expected_date -= timedelta(days=1)
            else:
                break
        
        return streak
    
    @staticmethod
    def _calculate_trend_direction(attendances: List[SessionAttendance]) -> str:
        """Calcula la tendencia de atención"""
        if len(attendances) < 2:
            return 'stable'
        
        scores = [a.average_attention_score for a in sorted(attendances, key=lambda x: x.joined_at) if a.average_attention_score]
        
        if len(scores) < 2:
            return 'stable'
        
        # Regresión lineal simple
        x = np.arange(len(scores))
        slope = np.polyfit(x, scores, 1)[0]
        
        if slope > 2:
            return 'improving'
        elif slope < -2:
            return 'declining'
        else:
            return 'stable'
    
    @staticmethod
    def _get_weekly_performance(db: Session, student_id: UUID) -> List[Dict]:
        """Obtiene performance semanal"""
        result = []
        
        for week in range(4):
            start_date = datetime.utcnow() - timedelta(weeks=week+1)
            end_date = datetime.utcnow() - timedelta(weeks=week)
            
            attendances = db.query(SessionAttendance).filter(
                SessionAttendance.student_id == student_id,
                SessionAttendance.joined_at >= start_date,
                SessionAttendance.joined_at < end_date
            ).all()
            
            if attendances:
                avg = sum(a.average_attention_score or 0 for a in attendances) / len(attendances)
            else:
                avg = 0
            
            result.append({
                'week': f'Week {4-week}',
                'average_attention': round(avg, 1),
                'sessions': len(attendances)
            })
        
        return list(reversed(result))
    
    @staticmethod
    def _get_best_performing_class(db: Session, class_ids: List[UUID]) -> Optional[Dict]:
        """Obtiene la clase con mejor performance"""
        if not class_ids:
            return None
        
        best_class = None
        best_score = 0
        
        for class_id in class_ids:
            sessions = db.query(ClassSession).filter(
                ClassSession.class_id == class_id,
                ClassSession.average_attention_score.isnot(None)
            ).all()
            
            if sessions:
                avg = sum(s.average_attention_score for s in sessions) / len(sessions)
                if avg > best_score:
                    best_score = avg
                    class_obj = db.query(Class).filter(Class.id == class_id).first()
                    if class_obj:
                        best_class = {
                            'class_name': class_obj.name,
                            'average_attention': round(avg, 1)
                        }
        
        return best_class
    
    @staticmethod
    def _get_attention_distribution(db: Session, session_ids: List[UUID]) -> Dict:
        """Obtiene distribución de niveles de atención"""
        if not session_ids:
            return {'high': 0, 'medium': 0, 'low': 0}
        
        metrics = db.query(AttentionMetric).filter(
            AttentionMetric.session_id.in_(session_ids)
        ).all()
        
        if not metrics:
            return {'high': 0, 'medium': 0, 'low': 0}
        
        total = len(metrics)
        high = sum(1 for m in metrics if m.attention_level == AttentionLevel.HIGH)
        medium = sum(1 for m in metrics if m.attention_level == AttentionLevel.MEDIUM)
        low = sum(1 for m in metrics if m.attention_level == AttentionLevel.LOW)
        
        return {
            'high': round((high / total) * 100, 1),
            'medium': round((medium / total) * 100, 1),
            'low': round((low / total) * 100, 1)
        }
    
    @staticmethod
    def _generate_attention_timeline(metrics: List[AttentionMetric]) -> List[Dict]:
        """Genera timeline de atención por intervalos de 5 minutos"""
        if not metrics:
            return []
        
        # Ordenar por timestamp
        sorted_metrics = sorted(metrics, key=lambda x: x.timestamp)
        
        # Agrupar por intervalos de 5 minutos
        timeline = []
        start_time = sorted_metrics[0].timestamp
        interval = timedelta(minutes=5)
        current_interval_end = start_time + interval
        current_interval_metrics = []
        
        for metric in sorted_metrics:
            if metric.timestamp < current_interval_end:
                current_interval_metrics.append(metric)
            else:
                if current_interval_metrics:
                    avg_score = sum(m.attention_score for m in current_interval_metrics) / len(current_interval_metrics)
                    timeline.append({
                        'time': start_time.strftime('%H:%M'),
                        'average_attention': round(avg_score, 1),
                        'sample_count': len(current_interval_metrics)
                    })
                
                start_time = current_interval_end
                current_interval_end = start_time + interval
                current_interval_metrics = [metric]
        
        # Agregar último intervalo
        if current_interval_metrics:
            avg_score = sum(m.attention_score for m in current_interval_metrics) / len(current_interval_metrics)
            timeline.append({
                'time': start_time.strftime('%H:%M'),
                'average_attention': round(avg_score, 1),
                'sample_count': len(current_interval_metrics)
            })
        
        return timeline
    
    @staticmethod
    def _get_top_students(db: Session, class_id: UUID, limit: int = 5) -> List[Dict]:
        """Obtiene los estudiantes con mejor performance"""
        # Obtener sesiones de la clase
        sessions = db.query(ClassSession).filter(
            ClassSession.class_id == class_id
        ).all()
        
        session_ids = [s.id for s in sessions]
        
        # Obtener asistencias agrupadas por estudiante
        student_stats = db.query(
            SessionAttendance.student_id,
            func.avg(SessionAttendance.average_attention_score).label('avg_attention'),
            func.count(SessionAttendance.id).label('sessions_count')
        ).filter(
            SessionAttendance.session_id.in_(session_ids),
            SessionAttendance.average_attention_score.isnot(None)
        ).group_by(
            SessionAttendance.student_id
        ).order_by(
            desc('avg_attention')
        ).limit(limit).all()
        
        result = []
        for stat in student_stats:
            student = db.query(User).filter(User.id == stat.student_id).first()
            if student:
                result.append({
                    'student_id': str(stat.student_id),
                    'student_name': f"{student.first_name} {student.last_name}",
                    'average_attention': round(stat.avg_attention, 1),
                    'sessions_count': stat.sessions_count
                })
        
        return result
    
    @staticmethod
    def _get_struggling_students(db: Session, class_id: UUID, limit: int = 5) -> List[Dict]:
        """Obtiene los estudiantes que necesitan más apoyo"""
        sessions = db.query(ClassSession).filter(
            ClassSession.class_id == class_id
        ).all()
        
        session_ids = [s.id for s in sessions]
        
        student_stats = db.query(
            SessionAttendance.student_id,
            func.avg(SessionAttendance.average_attention_score).label('avg_attention'),
            func.sum(SessionAttendance.total_yawns).label('total_yawns')
        ).filter(
            SessionAttendance.session_id.in_(session_ids),
            SessionAttendance.average_attention_score.isnot(None)
        ).group_by(
            SessionAttendance.student_id
        ).order_by(
            'avg_attention'
        ).limit(limit).all()
        
        result = []
        for stat in student_stats:
            student = db.query(User).filter(User.id == stat.student_id).first()
            if student:
                result.append({
                    'student_id': str(stat.student_id),
                    'student_name': f"{student.first_name} {student.last_name}",
                    'average_attention': round(stat.avg_attention, 1),
                    'total_yawns': stat.total_yawns or 0
                })
        
        return result
    
    @staticmethod
    def _analyze_by_hour(metrics: List[AttentionMetric]) -> Dict[int, float]:
        """Analiza atención por hora del día"""
        hour_scores = {}
        
        for metric in metrics:
            hour = metric.timestamp.hour
            if hour not in hour_scores:
                hour_scores[hour] = []
            hour_scores[hour].append(metric.attention_score)
        
        return {hour: round(sum(scores) / len(scores), 1) for hour, scores in hour_scores.items()}
    
    @staticmethod
    def _analyze_by_day(attendances: List[SessionAttendance]) -> Dict[str, float]:
        """Analiza atención por día de la semana"""
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_scores = {day: [] for day in days}
        
        for attendance in attendances:
            if attendance.average_attention_score:
                day_name = days[attendance.joined_at.weekday()]
                day_scores[day_name].append(attendance.average_attention_score)
        
        return {day: round(sum(scores) / len(scores), 1) for day, scores in day_scores.items() if scores}
    
    @staticmethod
    def _generate_recommendations(attendances: List[SessionAttendance], metrics: List[AttentionMetric]) -> List[str]:
        """Genera recomendaciones personalizadas"""
        recommendations = []
        
        if not attendances:
            return recommendations
        
        # Analizar bostezos
        avg_yawns = sum(a.total_yawns for a in attendances) / len(attendances)
        if avg_yawns > 5:
            recommendations.append("Considera mejorar tu horario de sueño. Los bostezos frecuentes indican fatiga.")
        
        # Analizar pestañeos
        avg_blinks = sum(a.total_blinks for a in attendances) / len(attendances)
        if avg_blinks > 200:
            recommendations.append("Toma descansos visuales cada 20 minutos para reducir la fatiga ocular.")
        
        # Analizar duración de sesiones
        avg_duration = sum(a.duration_minutes or 0 for a in attendances) / len(attendances)
        if avg_duration > 90:
            recommendations.append("Las sesiones largas pueden afectar tu atención. Usa la técnica Pomodoro (25min trabajo / 5min descanso).")
        
        # Analizar tendencia
        scores = [a.average_attention_score for a in sorted(attendances, key=lambda x: x.joined_at) if a.average_attention_score]
        if len(scores) >= 3:
            recent_avg = sum(scores[-3:]) / 3
            if recent_avg < 60:
                recommendations.append("Tu atención ha disminuido recientemente. Considera ajustar tu ambiente de estudio.")
        
        if not recommendations:
            recommendations.append("¡Excelente trabajo! Mantén tus buenos hábitos de estudio.")
        
        return recommendations

# Instancia global
analytics_service = AnalyticsService()