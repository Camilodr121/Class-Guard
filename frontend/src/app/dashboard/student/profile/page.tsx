'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Calendar, TrendingUp, TrendingDown, Minus, Clock, Eye, Activity, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { analyticsAPI, StudentStats, SessionHistory } from '@/lib/analytics-api';

export default function StudentProfile() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsData, historyData] = await Promise.all([
        analyticsAPI.getStudentStats(),
        analyticsAPI.getStudentHistory(5, 0)
      ]);

      setStats(statsData);
      setHistory(historyData.history);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.response?.data?.detail || 'Error al cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = () => {
    if (!stats) return <Minus className="w-5 h-5" />;
    
    switch (stats.trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendText = () => {
    if (!stats) return 'Sin datos';
    
    switch (stats.trend) {
      case 'improving':
        return 'Mejorando';
      case 'declining':
        return 'Descendiendo';
      default:
        return 'Estable';
    }
  };

  const getAttentionColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-800">⚠️ {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
          <p className="text-gray-600">Información personal y estadísticas</p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>Datos de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h2>
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Rol</p>
                  <p className="font-semibold capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Miembro desde</p>
                  <p className="font-semibold">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', { 
                      month: 'short', 
                      year: 'numeric' 
                    }) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sessions */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium mb-1">Sesiones Totales</p>
                <p className="text-3xl font-bold text-blue-900">{stats?.total_sessions || 0}</p>
              </div>
              <Activity className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Average Attention */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium mb-1">Atención Promedio</p>
                <p className="text-3xl font-bold text-green-900">
                  {stats?.average_attention_score.toFixed(1) || 0}%
                </p>
              </div>
              <Eye className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Total Hours */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium mb-1">Horas en Clase</p>
                <p className="text-3xl font-bold text-purple-900">
                  {stats?.total_hours.toFixed(1) || 0}h
                </p>
              </div>
              <Clock className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Trend */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium mb-1">Tendencia</p>
                <p className="text-2xl font-bold text-orange-900 flex items-center gap-2">
                  {getTrendIcon()}
                  {getTrendText()}
                </p>
              </div>
              <Award className="w-12 h-12 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas Detalladas</CardTitle>
          <CardDescription>Métricas adicionales de tu desempeño</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">{stats?.total_blinks || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total Pestañeos</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">{stats?.total_yawns || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total Bostezos</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">{stats?.total_minutes || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Minutos Totales</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600 mb-1">Última Sesión</p>
              <p className="text-xs text-gray-500">
                {stats?.last_session_date 
                  ? new Date(stats.last_session_date).toLocaleDateString('es-ES')
                  : 'Sin sesiones'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial Reciente</CardTitle>
          <CardDescription>Últimas 5 sesiones de clase</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay sesiones registradas aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{session.class_name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {session.duration_minutes || 0} min
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Atención</p>
                      <p className={`text-lg font-bold px-3 py-1 rounded-lg border ${getAttentionColor(session.attention_score)}`}>
                        {session.attention_score.toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-center px-3">
                      <p className="text-xs text-gray-500">Bostezos</p>
                      <p className="text-sm font-semibold text-gray-700">{session.yawns}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Perspectiva de Rendimiento</h3>
              <div className="space-y-2">
                {stats?.trend === 'improving' && (
                  <p className="text-gray-700">
                    ✨ <strong>¡Excelente trabajo!</strong> Tu nivel de atención ha mejorado en las últimas sesiones. 
                    Continúa con esta tendencia positiva.
                  </p>
                )}
                {stats?.trend === 'declining' && (
                  <p className="text-gray-700">
                    ⚠️ <strong>Atención:</strong> Tu nivel de concentración ha disminuido recientemente. 
                    Considera descansar más antes de las clases y eliminar distracciones.
                  </p>
                )}
                {stats?.trend === 'stable' && (
                  <p className="text-gray-700">
                    📊 Tu rendimiento se mantiene estable. Continúa monitoreando tu atención para identificar 
                    áreas de mejora.
                  </p>
                )}
                
                {stats && stats.average_attention_score >= 70 && (
                  <p className="text-green-700 font-medium">
                    🎯 Mantén un promedio de atención excelente ({stats.average_attention_score.toFixed(1)}%)
                  </p>
                )}
                {stats && stats.average_attention_score < 70 && stats.average_attention_score >= 40 && (
                  <p className="text-yellow-700 font-medium">
                    💡 Tu promedio de atención es bueno ({stats.average_attention_score.toFixed(1)}%), 
                    pero hay espacio para mejorar.
                  </p>
                )}
                {stats && stats.average_attention_score < 40 && (
                  <p className="text-red-700 font-medium">
                    🚨 Tu promedio de atención necesita mejorar ({stats.average_attention_score.toFixed(1)}%). 
                    Considera ajustar tu entorno de estudio.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}