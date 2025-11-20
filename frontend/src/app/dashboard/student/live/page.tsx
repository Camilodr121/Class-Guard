// frontend/src/app/dashboard/student/live/page.tsx

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Video, VideoOff, Wifi, WifiOff, Activity, Eye, 
  Zap, TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  Clock, BarChart3, Brain, Coffee
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useVideoCapture } from '@/hooks/useVideoCapture';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/store/authStore';

interface CVMetrics {
  ear: number;
  mar: number;
  head_pose: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  blink_detected: boolean;
  yawn_detected: boolean;
  looking_away: boolean;
  total_blinks: number;
  total_yawns: number;
  blink_rate: number;
  face_detected: boolean;
  timestamp: number;
}

interface AttentionScore {
  score: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  timestamp: number;
}

export default function StudentLivePage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  
  // Estados principales
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [cvMetrics, setCvMetrics] = useState<CVMetrics | null>(null);
  const [attentionScore, setAttentionScore] = useState<AttentionScore>({
    score: 100,
    level: 'HIGH',
    timestamp: Date.now()
  });
  const [attentionHistory, setAttentionHistory] = useState<number[]>([100]);
  
  // Estados de conexión
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Estadísticas de sesión
  const [sessionStats, setSessionStats] = useState({
    totalBlinks: 0,
    totalYawns: 0,
    avgAttention: 100,
    duration: 0,
    framesProcessed: 0
  });

  const sessionStartTime = useRef<number>(Date.now());
  const metricsBuffer = useRef<CVMetrics[]>([]);
  const lastMetricsSent = useRef<number>(Date.now());

  // ✅ VALIDACIÓN: Redirigir si no hay autenticación
  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
    }
  }, [user, token, router]);

  // Cargar sesión activa al montar
  useEffect(() => {
    if (user?.id && token) {
      loadActiveSession();
    }
  }, [user, token]);

  // Actualizar duración cada segundo
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      setSessionStats(prev => ({ ...prev, duration }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Manejar captura de frames
  async function handleFrameCapture(imageData: string) {
    if (!isSessionActive || !activeSession || isProcessing || !token) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cv/process-frame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image: imageData,
          student_id: user?.id,
          session_id: activeSession.id
        })
      });

      if (response.ok) {
        const metrics: CVMetrics = await response.json();
        setCvMetrics(metrics);
        
        setSessionStats(prev => ({
          ...prev,
          totalBlinks: metrics.total_blinks,
          totalYawns: metrics.total_yawns,
          framesProcessed: prev.framesProcessed + 1
        }));

        const score = calculateAttentionScore(metrics);
        const newAttentionScore: AttentionScore = {
          score,
          level: getAttentionLevel(score),
          timestamp: Date.now()
        };
        setAttentionScore(newAttentionScore);

        setAttentionHistory(prev => {
          const updated = [...prev, score];
          return updated.slice(-60);
        });

        metricsBuffer.current.push(metrics);

        const timeSinceLastSend = Date.now() - lastMetricsSent.current;
        if (timeSinceLastSend >= 2000 || metricsBuffer.current.length >= 10) {
          await sendMetricsToBackend(metricsBuffer.current, newAttentionScore);
          metricsBuffer.current = [];
          lastMetricsSent.current = Date.now();
        }

        setErrorMessage('');
      } else {
        const errorData = await response.json();
        console.error('Error procesando frame:', errorData);
      }
    } catch (error) {
      console.error('Error en handleFrameCapture:', error);
    } finally {
      setIsProcessing(false);
    }
  }

  // Configurar captura de video
  const { 
    videoRef, 
    isCapturing, 
    error: captureError, 
    startCapture, 
    stopCapture,
    actualFPS 
  } = useVideoCapture({
    onFrame: handleFrameCapture,
    targetFPS: 15,
    width: 640,
    height: 480,
    quality: 0.8
  });

  // Configurar WebSocket
  const { 
    isConnected: wsConnected, 
    sendMessage, 
    lastMessage,
    connectionStatus 
  } = useWebSocket(
    user?.id || '',
    activeSession?.id || null,
    {
      onMessage: handleWebSocketMessage,
      onConnect: () => {
        console.log('✅ WebSocket conectado');
        setSuccessMessage('Conectado al servidor en tiempo real');
        setTimeout(() => setSuccessMessage(''), 3000);
      },
      onDisconnect: () => {
        console.log('❌ WebSocket desconectado');
        setErrorMessage('Desconectado del servidor');
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
        setErrorMessage('Error en la conexión');
      }
    }
  );

  // Cargar sesión activa del estudiante
async function loadActiveSession() {
  if (!token) {
    setErrorMessage('No estás autenticado');
    router.push('/login');
    return;
  }

  try {
    // ✅ CORRECCIÓN: Cambiar /api/sessions/student/active a /api/sessions/active
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/active`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // ✅ VERIFICAR: Si no hay sesión activa
      if (!data.session_id) {
        setErrorMessage('No hay sesión activa. Espera a que el profesor inicie una clase.');
        setIsSessionActive(false);
        return;
      }

      // ✅ Mapear los datos correctamente
      const session = {
        id: data.session_id,
        group_id: data.group_id,
        group_name: data.group_name,
        subject_id: data.subject_id,
        subject_name: data.subject_name,
        started_at: data.started_at,
        status: data.status
      };

      setActiveSession(session);
      setIsSessionActive(true);
      sessionStartTime.current = new Date(session.started_at).getTime();
      console.log('✅ Sesión activa encontrada:', session);
      setSuccessMessage('Sesión activa encontrada. Puedes iniciar el monitoreo.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      const errorData = await response.json();
      console.error('Error cargando sesión:', errorData);
      setErrorMessage('No hay sesión activa. Espera a que el profesor inicie una clase.');
      setIsSessionActive(false);
    }
  } catch (error) {
    console.error('Error cargando sesión:', error);
    setErrorMessage('Error al conectar con el servidor');
    setIsSessionActive(false);
  }
}

  // Enviar métricas al backend vía WebSocket
  async function sendMetricsToBackend(metrics: CVMetrics[], currentScore: AttentionScore) {
    if (!wsConnected || metrics.length === 0) return;

    try {
      const avgMetrics = {
        ear: metrics.reduce((sum, m) => sum + m.ear, 0) / metrics.length,
        mar: metrics.reduce((sum, m) => sum + m.mar, 0) / metrics.length,
        blink_rate: metrics.reduce((sum, m) => sum + m.blink_rate, 0) / metrics.length,
        total_blinks: metrics[metrics.length - 1].total_blinks,
        total_yawns: metrics[metrics.length - 1].total_yawns,
        looking_away: metrics.some(m => m.looking_away),
        face_detected: metrics.every(m => m.face_detected)
      };

      sendMessage({
        type: 'ATTENTION_METRICS',
        student_id: user?.id,
        session_id: activeSession.id,
        metrics: avgMetrics,
        attention_score: currentScore.score,
        attention_level: currentScore.level,
        timestamp: Date.now()
      });

      console.log('📤 Métricas enviadas:', avgMetrics);
    } catch (error) {
      console.error('Error enviando métricas:', error);
    }
  }

  // Calcular score de atención basado en métricas
  function calculateAttentionScore(metrics: CVMetrics): number {
    if (!metrics.face_detected) return 0;

    let score = 100;

    if (metrics.blink_rate > 20) {
      score -= Math.min(20, (metrics.blink_rate - 20) * 2);
    }

    if (metrics.yawn_detected) {
      score -= 15;
    }

    if (metrics.looking_away) {
      score -= 25;
    }

    if (metrics.ear < 0.2) {
      score -= 20;
    }

    const { pitch, yaw } = metrics.head_pose;
    if (Math.abs(pitch) > 30 || Math.abs(yaw) > 30) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  // Obtener nivel de atención
  function getAttentionLevel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL' {
    if (score >= 70) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    if (score >= 30) return 'LOW';
    return 'CRITICAL';
  }

  // Manejar mensajes WebSocket
  function handleWebSocketMessage(message: any) {
    console.log('📨 Mensaje recibido:', message);

    switch (message.type) {
      case 'SESSION_STARTED':
        setActiveSession(message.session);
        setIsSessionActive(true);
        sessionStartTime.current = Date.now();
        setSuccessMessage('¡Clase iniciada!');
        setTimeout(() => setSuccessMessage(''), 3000);
        break;

      case 'SESSION_ENDED':
        handleSessionEnd();
        break;

      case 'ALERT':
        if (message.student_id === user?.id) {
          setErrorMessage(`Alerta: ${message.message}`);
          setTimeout(() => setErrorMessage(''), 5000);
        }
        break;
    }
  }

  // Manejar fin de sesión
  function handleSessionEnd() {
    setIsSessionActive(false);
    stopCapture();
    setSuccessMessage('Clase finalizada. Gracias por tu participación.');
    
    setTimeout(() => {
      router.push('/dashboard/student/history');
    }, 3000);
  }

  // Iniciar/detener captura
  async function toggleCapture() {
    if (isCapturing) {
      stopCapture();
    } else {
      if (!isSessionActive) {
        setErrorMessage('No hay sesión activa');
        return;
      }
      await startCapture();
    }
  }

  // Formatear duración
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Obtener color según nivel de atención
  function getAttentionColor(level: string): string {
    switch (level) {
      case 'HIGH': return 'text-green-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'LOW': return 'text-orange-500';
      case 'CRITICAL': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }

  function getAttentionBgColor(level: string): string {
    switch (level) {
      case 'HIGH': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-orange-500';
      case 'CRITICAL': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  // ✅ PROTECCIÓN: No renderizar si no hay autenticación
  if (!user || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p>Redirigiendo al login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clase en Vivo</h1>
          <p className="text-gray-600 mt-1">
            {activeSession ? `${activeSession.subject_name} - ${activeSession.group_name}` : 'Sin sesión activa'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {wsConnected ? (
              <>
                <Wifi className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-600">Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-600">Desconectado</span>
              </>
            )}
          </div>

          {isSessionActive && (
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-600">
                {formatDuration(sessionStats.duration)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mensajes */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Video y controles */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Tu Cámara
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {!isCapturing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-center text-white">
                      <VideoOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Cámara desactivada</p>
                      <p className="text-sm opacity-75 mt-2">
                        Haz clic en &quot;Iniciar Monitoreo&quot; para comenzar
                      </p>
                    </div>
                  </div>
                )}

                {isCapturing && cvMetrics && (
                  <div className="absolute top-4 left-4 space-y-2">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                      cvMetrics.face_detected ? 'bg-green-500' : 'bg-red-500'
                    } bg-opacity-90 text-white text-sm`}>
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      {cvMetrics.face_detected ? 'Rostro detectado' : 'Sin rostro'}
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500 bg-opacity-90 text-white text-sm">
                      <Activity className="w-3 h-3" />
                      {actualFPS} FPS
                    </div>
                  </div>
                )}

                {isCapturing && (
                  <div className="absolute top-4 right-4">
                    <div className={`px-4 py-2 rounded-lg ${getAttentionBgColor(attentionScore.level)} bg-opacity-90 text-white`}>
                      <div className="text-3xl font-bold">{Math.round(attentionScore.score)}</div>
                      <div className="text-xs">Atención</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={toggleCapture}
                  disabled={!isSessionActive}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    isCapturing
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
                  }`}
                >
                  {isCapturing ? (
                    <>
                      <VideoOff className="w-5 h-5 inline mr-2" />
                      Detener Monitoreo
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5 inline mr-2" />
                      Iniciar Monitoreo
                    </>
                  )}
                </button>
              </div>

              {captureError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {captureError}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Métricas de CV */}
          {isCapturing && cvMetrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Análisis en Tiempo Real
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Eye className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{cvMetrics.total_blinks}</div>
                    <div className="text-xs text-gray-600">Parpadeos</div>
                  </div>

                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Coffee className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{cvMetrics.total_yawns}</div>
                    <div className="text-xs text-gray-600">Bostezos</div>
                  </div>

                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{cvMetrics.blink_rate.toFixed(1)}</div>
                    <div className="text-xs text-gray-600">Parpadeos/min</div>
                  </div>

                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">{sessionStats.framesProcessed}</div>
                    <div className="text-xs text-gray-600">Frames</div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {cvMetrics.yawn_detected && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      <AlertCircle className="w-4 h-4" />
                      <span>Bostezo detectado - ¿Necesitas un descanso?</span>
                    </div>
                  )}
                  
                  {cvMetrics.looking_away && (
                    <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                      <AlertCircle className="w-4 h-4" />
                      <span>Mirando fuera de la pantalla</span>
                    </div>
                  )}

                  {attentionScore.level === 'CRITICAL' && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <AlertCircle className="w-4 h-4" />
                      <span>¡Atención crítica! Intenta concentrarte más</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna derecha - Medidor */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Tu Nivel de Atención
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-48 h-48 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 80}`}
                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - attentionScore.score / 100)}`}
                    className={`transition-all duration-500 ${
                      attentionScore.level === 'HIGH' ? 'text-green-500' :
                      attentionScore.level === 'MEDIUM' ? 'text-yellow-500' :
                      attentionScore.level === 'LOW' ? 'text-orange-500' :
                      'text-red-500'
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-5xl font-bold ${getAttentionColor(attentionScore.level)}`}>
                    {Math.round(attentionScore.score)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{attentionScore.level}</div>
                </div>
              </div>

              <div className="text-center space-y-2">
                {attentionScore.level === 'HIGH' && (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">¡Excelente concentración!</span>
                  </div>
                )}
                {attentionScore.level === 'MEDIUM' && (
                  <div className="flex items-center justify-center gap-2 text-yellow-600">
                    <Activity className="w-5 h-5" />
                    <span className="font-medium">Buena atención</span>
                  </div>
                )}
                {attentionScore.level === 'LOW' && (
                  <div className="flex items-center justify-center gap-2 text-orange-600">
                    <TrendingDown className="w-5 h-5" />
                    <span className="font-medium">Atención baja</span>
                  </div>
                )}
                {attentionScore.level === 'CRITICAL' && (
                  <div className="flex items-center justify-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">¡Requiere atención!</span>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="text-sm text-gray-600 mb-2">Últimos 60 segundos</div>
                <div className="flex items-end gap-1 h-16">
                  {attentionHistory.map((score, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 rounded-t transition-all ${
                        score >= 70 ? 'bg-green-500' :
                        score >= 50 ? 'bg-yellow-500' :
                        score >= 30 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ height: `${score}%` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Sesión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Frames Procesados</span>
                <span className="font-medium">{sessionStats.framesProcessed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Parpadeos</span>
                <span className="font-medium">{sessionStats.totalBlinks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Bostezos</span>
                <span className="font-medium">{sessionStats.totalYawns}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tiempo Activo</span>
                <span className="font-medium">{formatDuration(sessionStats.duration)}</span>
              </div>
            </CardContent>
          </Card>

          {attentionScore.level !== 'HIGH' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">💡 Tips para mejorar</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700 space-y-2">
                {attentionScore.score < 50 && (
                  <>
                    <p>• Toma un respiro profundo</p>
                    <p>• Ajusta tu postura</p>
                    <p>• Toma un sorbo de agua</p>
                  </>
                )}
                {cvMetrics?.looking_away && (
                  <p>• Mantén tu mirada en la pantalla</p>
                )}
                {cvMetrics && cvMetrics.blink_rate > 20 && (
                  <p>• Descansa tus ojos 20 segundos</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
