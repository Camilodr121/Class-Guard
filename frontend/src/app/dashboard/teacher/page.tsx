// frontend/src/app/dashboard/teacher/page.tsx (NUEVA VERSIÓN)
'use client';

import { useEffect, useState } from 'react';
import { 
  BookOpen, Users, Activity, TrendingUp, AlertCircle, 
  Plus, Wifi, WifiOff, GraduationCap, Calendar, Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import classGuardAPI from '@/lib/analytics-api';

interface DashboardStats {
  total_subjects: number;
  total_groups: number;
  total_students: number;
  active_sessions: number;
  average_attention_today: number | null;
  total_sessions_today: number;
  alerts_today: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  total_groups: number;
  total_students: number;
  is_active: boolean;
}

interface Group {
  id: string;
  name: string;
  code: string;
  subject_name: string;
  subject_code: string;
  current_students_count: number;
  schedule_day: string;
  is_active: boolean;
}

interface ActiveSession {
  session_id: string;
  group_id: string;
  group_name: string;
  subject_name: string;
  started_at: string;
  expected_students: number;
  present_students: number;
}

export default function TeacherDashboardNew() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    loadDashboardData();
    checkActiveSession();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar estadísticas
      const statsData = await classGuardAPI.dashboard.getTeacherStats();
      setStats(statsData);
      
      // Cargar asignaturas
      const subjectsData = await classGuardAPI.subjects.list({ limit: 10 });
      setSubjects(subjectsData);
      
      // Cargar grupos activos
      const groupsData = await classGuardAPI.groups.list({ is_active: true, limit: 20 });
      setGroups(groupsData);
      
      setIsConnected(true);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkActiveSession = async () => {
    try {
      const response = await classGuardAPI.sessions.getActive();
      if (response.session_id) {
        setActiveSession(response);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const handleStartSession = async (groupId: string) => {
    try {
      const response = await classGuardAPI.sessions.start(groupId);
      setActiveSession({
        session_id: response.session_id,
        group_id: groupId,
        group_name: response.group_name,
        subject_name: response.subject_name,
        started_at: response.started_at,
        expected_students: response.expected_students,
        present_students: 0
      });
      
      // Redirigir a vista de monitoreo en vivo
      router.push(`/dashboard/teacher/live/${response.session_id}`);
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Error al iniciar sesión');
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    
    try {
      await classGuardAPI.sessions.end(activeSession.session_id);
      setActiveSession(null);
      loadDashboardData();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-800">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Asignaturas',
      value: stats?.total_subjects || 0,
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      description: 'Materias activas',
      action: () => router.push('/dashboard/teacher/subjects')
    },
    {
      title: 'Grupos',
      value: stats?.total_groups || 0,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      description: 'Grupos creados',
      action: () => router.push('/dashboard/teacher/groups')
    },
    {
      title: 'Estudiantes',
      value: stats?.total_students || 0,
      icon: GraduationCap,
      color: 'from-green-500 to-green-600',
      description: 'Total matriculados'
    },
    {
      title: 'Alertas Hoy',
      value: stats?.alerts_today || 0,
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      description: stats?.alerts_today > 0 ? 'Requieren atención' : 'Todo bien',
      action: () => router.push('/dashboard/teacher/alerts')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Class Guard Dashboard
            </h1>
            <p className="text-gray-600 font-medium">
              Sistema de gestión académica y monitoreo inteligente
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl backdrop-blur-sm border transition-all ${
              isConnected 
                ? 'bg-green-50/80 border-green-200 text-green-700' 
                : 'bg-red-50/80 border-red-200 text-red-700'
            }`}>
              {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              <span className="text-sm font-bold">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            {/* Quick Actions */}
            <button
              onClick={() => router.push('/dashboard/teacher/subjects')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              Gestionar Asignaturas
            </button>
          </div>
        </div>
      </div>

      {/* Active Session Alert */}
      {activeSession && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-green-900 text-lg">Sesión Activa en Vivo</p>
                <p className="text-green-700">
                  {activeSession.subject_name} - {activeSession.group_name}
                </p>
                <p className="text-sm text-green-600">
                  {activeSession.present_students} / {activeSession.expected_students} estudiantes conectados
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/dashboard/teacher/live/${activeSession.session_id}`)}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
              >
                Ver Monitoreo
              </button>
              <button
                onClick={handleEndSession}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
              >
                Finalizar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card 
            key={stat.title} 
            className="hover:shadow-2xl transition-all cursor-pointer hover:scale-105"
            onClick={stat.action}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-4 bg-gradient-to-br ${stat.color} rounded-2xl shadow-lg`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">{stat.title}</p>
                <p className="text-4xl font-black text-gray-900 mb-2">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Summary */}
      {stats && stats.total_sessions_today > 0 && (
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold mb-2">Resumen de Hoy</p>
                <p className="text-indigo-100">
                  {stats.total_sessions_today} sesiones completadas
                </p>
              </div>
              {stats.average_attention_today && (
                <div className="text-center">
                  <div className="text-5xl font-black mb-1">
                    {Math.round(stats.average_attention_today)}%
                  </div>
                  <p className="text-indigo-100 text-sm">Atención Promedio</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subjects Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Mis Asignaturas</CardTitle>
              <CardDescription>Gestiona tus materias y grupos</CardDescription>
            </div>
            <button
              onClick={() => router.push('/dashboard/teacher/subjects')}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              Ver todas →
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium mb-4">No tienes asignaturas creadas</p>
              <button
                onClick={() => router.push('/dashboard/teacher/subjects')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
              >
                Ir a Gestión de Asignaturas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-100 hover:border-blue-300 transition-all cursor-pointer hover:shadow-lg"
                  onClick={() => router.push(`/dashboard/teacher/subjects/${subject.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{subject.name}</h3>
                        <p className="text-xs text-gray-600">{subject.code}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-200">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{subject.total_groups}</p>
                      <p className="text-xs text-gray-600">Grupos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{subject.total_students}</p>
                      <p className="text-xs text-gray-600">Estudiantes</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Groups Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Grupos Activos</CardTitle>
              <CardDescription>Inicia una sesión de clase</CardDescription>
            </div>
            <button
              onClick={() => router.push('/dashboard/teacher/groups')}
              className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
            >
              Ver todos →
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No tienes grupos creados</p>
              <p className="text-sm text-gray-400 mt-2">Crea una asignatura primero, luego agrega grupos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.slice(0, 6).map((group) => (
                <div
                  key={group.id}
                  className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-100 hover:border-purple-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {group.subject_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {group.subject_code} - Grupo {group.code}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {group.current_students_count}
                      </span>
                    </div>
                  </div>

                  {group.schedule_day && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>{group.schedule_day}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleStartSession(group.id)}
                    disabled={!!activeSession}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Activity className="w-5 h-5" />
                    Iniciar Clase
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-xl transition-all"
          onClick={() => router.push('/dashboard/teacher/analytics')}
        >
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="font-bold text-gray-900">Analytics</p>
            <p className="text-sm text-gray-600">Ver estadísticas</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-xl transition-all"
          onClick={() => router.push('/dashboard/teacher/students')}
        >
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <p className="font-bold text-gray-900">Estudiantes</p>
            <p className="text-sm text-gray-600">Gestionar matrículas</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-xl transition-all"
          onClick={() => router.push('/dashboard/teacher/history')}
        >
          <CardContent className="p-6 text-center">
            <Clock className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="font-bold text-gray-900">Historial</p>
            <p className="text-sm text-gray-600">Sesiones pasadas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}