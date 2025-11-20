// frontend/src/app/dashboard/teacher/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, BookOpen, Calendar, AlertTriangle, 
  TrendingUp, Activity, Clock, Play, ChevronRight,
  Zap, Target, Award
} from 'lucide-react';
import { sessionsAPI, subjectsAPI, groupsAPI, dashboardAPI } from '@/lib/analytics-api';

interface DashboardStats {
  total_subjects: number;
  total_groups: number;
  total_students: number;
  total_sessions_today: number;
  active_sessions: number;
  alerts_today: number;
  average_attention_today: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  total_groups: number;
  total_students: number;
}

interface Group {
  id: string;
  name: string;
  code: string;
  subject_id: string;
  subject_code: string;
  student_count: number;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [startingSession, setStartingSession] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, subjectsData, groupsData] = await Promise.all([
        dashboardAPI.getTeacherStats(),
        subjectsAPI.list({ limit: 6 }),
        groupsAPI.list({ limit: 6 })
     ]);


      setStats(statsData);
      setSubjects(subjectsData);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (groupId: string) => {
  try {
    setStartingSession(groupId);
    const session = await sessionsAPI.start(groupId);

    // ✅ AGREGAR ESTE LOG
    console.log('Respuesta de /sessions/start:', session);
    console.log('session.id:', session.id);
    console.log('session.session_id:', session.session_id);
    
    router.push(`/dashboard/teacher/live/${session.session_id || session.id}`);  // ✅ Intentar ambos
  } catch (error: any) {
    console.error('Error starting session:', error);
    alert(error.response?.data?.detail || 'Error al iniciar sesión');
  } finally {
    setStartingSession(null);
  }
};


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Asignaturas',
      value: stats?.total_subjects || 0,
      icon: BookOpen,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      description: 'Materias activas',
      link: '/dashboard/teacher/subjects'
    },
    {
      title: 'Total Grupos',
      value: stats?.total_groups || 0,
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      description: 'Grupos activos',
      link: '/dashboard/teacher/grups'
    },
    {
      title: 'Total Estudiantes',
      value: stats?.total_students || 0,
      icon: Target,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      description: 'Estudiantes matriculados',
      link: '/dashboard/teacher/students'
    },
    {
      title: 'Alertas Hoy',
      value: stats?.alerts_today || 0,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-50 to-red-100',
      description: stats?.alerts_today && stats.alerts_today > 0 ? 'Requieren atención' : 'Todo bien',
      link: '/dashboard/teacher/alerts'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard del Profesor
          </h1>
          <p className="text-gray-600 text-lg">
            Sistema de gestión académica y monitoreo inteligente
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              onClick={() => router.push(stat.link)}
              className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 bg-gradient-to-br ${stat.bgGradient}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-16 -mt-16`}></div>
              
              <div className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                </div>
                
                <div className="mb-2">
                  <p className="text-5xl font-black text-gray-900">{stat.value}</p>
                </div>
                
                <h3 className="text-sm font-bold text-gray-700 mb-1">{stat.title}</h3>
                <p className="text-xs text-gray-600">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Today's Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Resumen de Hoy</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-700">Sesiones realizadas</span>
                </div>
                <span className="text-2xl font-black text-blue-600">
                  {stats?.total_sessions_today || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-700">Atención Promedio</span>
                </div>
                <span className="text-2xl font-black text-green-600">
                  {stats?.average_attention_today 
                    ? `${Math.round(stats.average_attention_today)}%` 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Accesos Rápidos</h2>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard/teacher/subjects')}
                className="w-full p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl text-left transition-all duration-200 border border-blue-200 hover:border-blue-300 transform hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-bold text-blue-900">📚 Gestionar Asignaturas</p>
                    <p className="text-xs text-blue-600">Crear, editar y ver asignaturas</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => router.push('/dashboard/teacher/students')}
                className="w-full p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl text-left transition-all duration-200 border border-green-200 hover:border-green-300 transform hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-bold text-green-900">👥 Ver Estudiantes</p>
                    <p className="text-xs text-green-600">Gestionar matrículas y métricas</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => router.push('/dashboard/teacher/analytics')}
                className="w-full p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl text-left transition-all duration-200 border border-purple-200 hover:border-purple-300 transform hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-bold text-purple-900">📊 Analytics</p>
                    <p className="text-xs text-purple-600">Ver reportes y estadísticas</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Mis Asignaturas</h2>
            <button
              onClick={() => router.push('/dashboard/teacher/subjects')}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 transition"
            >
              Ver todas <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <BookOpen className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-3">No tienes asignaturas creadas</p>
              <button
                onClick={() => router.push('/dashboard/teacher/subjects')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold transition"
              >
                Crear primera asignatura
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  onClick={() => router.push('/dashboard/teacher/subjects')}
                  className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-white to-gray-50 transform hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{subject.name}</h3>
                      <p className="text-sm text-gray-600 font-medium">{subject.code}</p>
                    </div>
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="flex gap-4 text-sm mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-gray-900">{subject.total_groups}</span>
                      <span className="text-gray-600">Grupos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-gray-900">{subject.total_students}</span>
                      <span className="text-gray-600">Estudiantes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Groups with Start Session Button */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Grupos Activos</h2>
            <button
              onClick={() => router.push('/dashboard/teacher/groups')}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 transition"
            >
              Ver todos <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Users className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-2">No tienes grupos creados</p>
              <p className="text-sm text-gray-500">Crea una asignatura primero, luego agrega grupos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-5 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all"
                >
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{group.name}</h3>
                    <p className="text-sm text-gray-600 font-medium">
                      {group.subject_code} - Grupo {group.code}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">
                        {group.student_count} estudiantes
                      </span>
                    </div>
                  </div>

                  {/* Start Session Button */}
                  <button
                    onClick={() => handleStartSession(group.id)}
                    disabled={startingSession === group.id}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {startingSession === group.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Iniciando...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Iniciar Sesión en Vivo
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <button
                      onClick={() => router.push(`/dashboard/teacher/analytics?group=${group.id}`)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold py-2 px-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    >
                      📊 Analytics
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/teacher/groups/${group.id}/students`)}
                      className="text-xs text-purple-600 hover:text-purple-800 font-semibold py-2 px-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                    >
                      👥 Alumnos
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/teacher/analytics?group=${group.id}`)}
                      className="text-xs text-gray-600 hover:text-gray-800 font-semibold py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      📅 Historial
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
