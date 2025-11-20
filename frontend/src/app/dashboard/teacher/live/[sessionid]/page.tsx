//frontend/src/app/dashboard/teacher/live/[sessionid]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Users, Activity, AlertTriangle, TrendingUp, 
  Clock, Eye, Zap, AlertCircle, CheckCircle, Wifi, WifiOff 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { sessionsAPI, alertsAPI } from '@/lib/analytics-api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/store/authStore';

interface SessionDetail {
  id: string;
  group_name: string;
  subject_name: string;
  started_at: string;
  duration_minutes: number;
  status: string;
  average_attention_score: number;
  total_students_expected: number;
  total_students_present: number;
  students: StudentInSession[];
}

interface StudentInSession {
  id: string;
  name: string;
  email: string;
  joined_at: string;
  average_attention_score: number;
  total_blinks: number;
  total_yawns: number;
  current_attention?: number;
  is_looking_away?: boolean;
  last_update?: string;
}

interface Alert {
  id: string;
  student_id: string;
  alert_type: string;
  priority: string;
  message: string;
  created_at: string;
  is_acknowledged: boolean;
}

interface RealtimeMetric {
  student_id: string;
  attention_score: number;
  blinks: number;
  yawns: number; 
  is_looking_away: boolean;
  timestamp: string;
}

export default function LiveMonitoringPage() {
  const router = useRouter();
  const params = useParams();
  console.log('🔍 RAW params:', params);
  console.log('🔍 params.sessionId:', params.sessionId);
  console.log('🔍 typeof params.sessionId:', typeof params.sessionId);
  const sessionId = (params.sessionid || params.sessionId) as string; // ✅ Soporta ambos casos
  console.log('🔍 FINAL sessionId:', sessionId);


  // Obtener usuario del authStore
  const { user, fetchCurrentUser } = useAuthStore();

  const userId = user?.id || '';

 // Cargar usuario si no existe
  useEffect(() => {
    if (!user) {
      fetchCurrentUser();
    }
  }, [user, fetchCurrentUser]);


  console.log('👤 User:', user);
  console.log('🆔 userId:', userId);
  console.log('📍 sessionId:', sessionId);

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [realtimeStudents, setRealtimeStudents] = useState<Map<string, RealtimeMetric>>(new Map());

  // WebSocket para métricas en tiempo real
  const { 
    isConnected: wsConnected 
  } = useWebSocket(userId, sessionId || null, {
    onMessage: (message) => {
  console.log('📨 WebSocket message:', message);
  
  // ✅ ATENCIÓN MÉTRICAS DEL ESTUDIANTE
if (message.type === 'ATTENTION_UPDATE') {  
  console.log('📊 Métricas de estudiante recibidas:', message);
  
  const metric = {
    student_id: message.student_id,  
    attention_score: message.metrics?.attention_score || 0,
    blinks: message.metrics?.blinks || 0,  
    yawns: message.metrics?.yawns || 0,
    is_looking_away: message.metrics?.looking_away || false,
    timestamp: message.timestamp
  };
  
  setRealtimeStudents(prev => {
    const updated = new Map(prev);
    updated.set(metric.student_id, metric);
    console.log('✅ Métricas actualizadas para:', metric.student_id, metric);
    return updated;
  });
}

      // Nueva alerta
      if (message.type === 'new_alert') {
        setAlerts(prev => [message.alert, ...prev]);
        
        // Notificación del navegador
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⚠️ Nueva Alerta - Class Guard', {
            body: message.alert.message,
            icon: '/favicon.ico'
          });
        }
      }
      
      // Actualización de sesión
      if (message.type === 'session_update') {
        setSession(prev => prev ? { ...prev, ...message.session } : null);
      }
    },
    onConnect: () => {
      console.log('✅ WebSocket conectado a sesión:', sessionId);
    },
    onDisconnect: () => {
      console.log('🔌 WebSocket desconectado');
    },
    onError: (error) => {
      console.error('❌ WebSocket error:', error);
    }
  });

  // Solicitar permisos de notificación al montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (userId && sessionId) {
      loadSessionData();
      
      // Actualizar cada 30 segundos como respaldo del WebSocket
      const interval = setInterval(loadSessionData, 30000);
      return () => clearInterval(interval);
    }
  }, [sessionId, userId]);

  // Timer de sesión
  useEffect(() => {
    if (session?.started_at) {
      const interval = setInterval(() => {
        const start = new Date(session.started_at).getTime();
        const now = Date.now();
        const diff = now - start;
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [session?.started_at]);

  const loadSessionData = async () => {
  try {
    setIsLoading(true);
    const sessionData = await sessionsAPI.get(sessionId);
    setSession(sessionData);
    
    // ✅ HACER ESTO OPCIONAL - Si falla, no importa
    try {
      const alertsData = await alertsAPI.getSessionAlerts(sessionId);
      setAlerts(alertsData.alerts || []);
    } catch (alertError) {
      console.warn('No se pudieron cargar alertas:', alertError);
      setAlerts([]);  // ✅ Continuar sin alertas
    }
  } catch (error) {
    console.error('Error loading session:', error);
  } finally {
    setIsLoading(false);
  }
};

  const handleEndSession = async () => {
    if (!confirm('¿Estás seguro de finalizar la sesión?')) return;
    
    try {
     await sessionsAPI.end(sessionId);
      router.push('/dashboard/teacher');
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Error al finalizar la sesión');
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await alertsAPI.acknowledge(alertId);
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_acknowledged: true } : a
      ));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getAttentionColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const getAttentionLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 70) return 'Muy Bueno';
    if (score >= 60) return 'Bueno';
    if (score >= 50) return 'Regular';
    return 'Bajo';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return 'text-red-600 bg-red-50 border-red-300';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-300';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-300';
    }
  };

  // Combinar datos de sesión con métricas en tiempo real
  const getStudentWithRealtimeData = (student: StudentInSession): StudentInSession => {
    const realtimeData = realtimeStudents.get(student.id);
    if (realtimeData) {
      return {
        ...student,
        current_attention: realtimeData.attention_score,
        average_attention_score: realtimeData.attention_score,
        total_blinks: realtimeData.blinks,
        total_yawns: realtimeData.yawns,
        is_looking_away: realtimeData.is_looking_away,
        last_update: realtimeData.timestamp
      };
    }
    return student;
  };

  if (isLoading && !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Sesión no encontrada</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const unacknowledgedAlerts = alerts.filter(a => !a.is_acknowledged);
  const avgAttention = session.average_attention_score || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {session.subject_name} - {session.group_name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-sm">
                {wsConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-semibold">En vivo</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-orange-600" />
                    <span className="text-orange-600 font-semibold">Reconectando...</span>
                  </>
                )}
              </span>
              <span className="text-sm text-gray-600">
                Monitoreo en tiempo real
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleEndSession}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
        >
          Finalizar Sesión
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tiempo Transcurrido</p>
                <p className="text-2xl font-bold text-gray-900">{elapsedTime}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estudiantes Conectados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {session.total_students_present} / {session.total_students_expected}
                </p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Atención Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(avgAttention)}%</p>
                <p className="text-xs text-gray-500 mt-1">{getAttentionLabel(avgAttention)}</p>
              </div>
              <Activity className={`w-10 h-10 ${
                avgAttention >= 70 ? 'text-green-500' : 
                avgAttention >= 50 ? 'text-yellow-500' : 'text-red-500'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertas Activas</p>
                <p className="text-2xl font-bold text-gray-900">{unacknowledgedAlerts.length}</p>
                <p className="text-xs text-gray-500 mt-1">Sin atender</p>
              </div>
              <AlertTriangle className={`w-10 h-10 ${
                unacknowledgedAlerts.length > 0 ? 'text-red-500 animate-pulse' : 'text-gray-400'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {unacknowledgedAlerts.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Alertas Recientes ({unacknowledgedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {unacknowledgedAlerts.slice(0, 10).map(alert => {
                const student = session.students.find(s => s.id === alert.student_id);
                return (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${getPriorityColor(alert.priority)}`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{student?.name || 'Estudiante'}</p>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="ml-4 p-2 hover:bg-white rounded transition"
                      title="Marcar como atendida"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Grid */}
<Card>
  <CardHeader>
    <CardTitle>Monitoreo de Estudiantes ({session.students.length})</CardTitle>
  </CardHeader>
  <CardContent>
    {session.students.length === 0 ? (
      <div className="text-center py-12 text-gray-500">
        No hay estudiantes conectados
      </div>
    ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* ✅ FILTRAR DUPLICADOS: Mantener solo el último de cada estudiante */}
        {Array.from(
          session.students
            .reduce((map, student) => {
              // Mantener solo la entrada más reciente de cada estudiante
              const existing = map.get(student.id);
              if (!existing || new Date(student.joined_at) > new Date(existing.joined_at)) {
                map.set(student.id, student);
              }
              return map;
            }, new Map<string, StudentInSession>())
            .values()
        ).map(student => {
          const studentWithRealtime = getStudentWithRealtimeData(student);
          const score = studentWithRealtime.current_attention || studentWithRealtime.average_attention_score || 0;
          const isLive = realtimeStudents.has(student.id);

          return (
            <div
              key={student.id}  // Usar ID único
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                getAttentionColor(score)
              } hover:shadow-lg`}
              onClick={() => router.push(`/dashboard/students/${student.id}`)}
            >
              {/* Live Indicator */}
              {isLive && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-bold text-green-600">LIVE</span>
                </div>
              )}

              {/* Student Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{student.name}</h3>
                  <p className="text-sm opacity-75">{student.email}</p>
                </div>
                <div className={`text-3xl font-bold ${
                  score >= 70 ? 'text-green-600' :
                  score >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round(score)}
                </div>
              </div>

              {/* Looking Away Warning */}
              {studentWithRealtime.is_looking_away && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-orange-100 rounded text-orange-700 text-sm">
                  <Eye className="w-4 h-4" />
                  No está mirando la pantalla
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs opacity-75">Pestañeos</div>
                  <div className="font-bold text-lg">{studentWithRealtime.total_blinks || 0}</div>
                </div>
                <div>
                  <div className="text-xs opacity-75">Bostezos</div>
                  <div className="font-bold text-lg">{studentWithRealtime.total_yawns || 0}</div>
                </div>
                <div>
                  <div className="text-xs opacity-75">Nivel</div>
                  <div className="font-semibold text-sm">{getAttentionLabel(score)}</div>
                </div>
              </div>

              {/* Last Update */}
              {studentWithRealtime.last_update && (
                <div className="mt-3 text-xs text-center opacity-60">
                  Actualizado: {new Date(studentWithRealtime.last_update).toLocaleTimeString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </CardContent>
</Card>
    </div>
  );
}
