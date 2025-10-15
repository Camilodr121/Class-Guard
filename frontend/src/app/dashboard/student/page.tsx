//frontend/src/app/dashboard/student/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import EnergyMeter from '@/components/dashboard/EnergyMeter';
import VideoPreview from '@/components/dashboard/VideoPreview';
import AttentionChart from '@/components/dashboard/AttentionChart';
import QuickStats from '@/components/dashboard/QuickStats';
import { Play, Pause, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { analyticsAPI } from '@/lib/analytics-api';

export default function StudentDashboard() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [attentionScore, setAttentionScore] = useState(75);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  const [stats, setStats] = useState({
    blinks: 0,
    yawns: 0,
    duration: 0,
    streak: 5
  });
  
  const [scoreFactors, setScoreFactors] = useState({
    blinkRate: 0,
    yawnCount: 0,
    lookingAway: false,
    message: ''
  });
  
  const [chartData, setChartData] = useState<Array<{ time: string; score: number }>>([
    { time: '0:00', score: 75 }
  ]);

  const blinkRateRef = useRef(0);
  const yawnCountRef = useRef(0);
  const lookingAwayTimeRef = useRef(0);
  const lastFaceDetectedRef = useRef(true);
  const scoreUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== NUEVO: CARGAR MÉTRICAS HISTÓRICAS ====================
  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        setIsLoadingHistory(true);
        
        // Cargar estadísticas generales
        const statsData = await analyticsAPI.getStudentStats();
        
        console.log('📊 Estadísticas cargadas:', statsData);
        
        // Actualizar stats con datos históricos
        setStats({
          blinks: statsData.total_blinks || 0,
          yawns: statsData.total_yawns || 0,
          duration: statsData.total_minutes || 0,
          streak: 5 // Mantener valor por defecto
        });
        
        // Actualizar score con el promedio histórico
        setAttentionScore(statsData.average_attention_score || 75);
        
        // Cargar timeline de atención (últimos 7 días)
        const timelineData = await analyticsAPI.getAttentionTimeline(7);
        
        console.log('📈 Timeline cargado:', timelineData);
        
        // Convertir timeline a formato del gráfico
if (timelineData.timeline && timelineData.timeline.length > 0) {
  const formattedData = timelineData.timeline.map((point: any) => {
    const date = new Date(point.date);
    return {
      time: `${date.getDate()}/${date.getMonth() + 1}`,
      score: point.average_score
    };
  });
  
  setChartData(formattedData);
}
        console.log('✅ Datos históricos cargados exitosamente');
        
      } catch (error) {
        console.error('❌ Error cargando datos históricos:', error);
        // Mantener valores por defecto en caso de error
      } finally {
        setIsLoadingHistory(false);
      }
    };

    // Solo cargar si tenemos userId
    if (userId) {
      loadHistoricalData();
    }
  }, [userId]);

  // Obtener user ID y sesión al cargar
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && !userId) {
      fetch('http://localhost:8000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          console.log('✅ Usuario obtenido:', data.id);
          setUserId(data.id);
          return fetch('http://localhost:8000/api/classes/sessions/active', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        })
        .then(res => {
          if (res && res.ok) {
            return res.json();
          }
          console.log('⚠️ No hay sesión activa, usando sesión temporal');
          return { session_id: null };
        })
        .then(data => {
          if (data.session_id) {
            setSessionId(data.session_id);
            console.log('✅ Sesión activa encontrada:', data.session_id);
          } else {
            setSessionId('temp-session');
            console.log('ℹ️ Usando sesión temporal');
          }
        })
        .catch(err => {
          console.error('Error:', err);
          setSessionId('temp-session');
        });
    }
  }, [userId]);

  const calculateRealisticScore = useCallback(() => {
    let score = 100;
    const blinkRate = blinkRateRef.current;
    
    if (blinkRate > 35) {
      score -= 20;
    } else if (blinkRate > 28) {
      score -= 12;
    } else if (blinkRate > 22) {
      score -= 5;
    } else if (blinkRate < 8 && blinkRate > 0) {
      score -= 8;
    }

    const yawnCount = yawnCountRef.current;
    if (yawnCount > 0) {
      score -= Math.min(yawnCount * 15, 45);
    }

    const lookingAwayTime = lookingAwayTimeRef.current;
    if (lookingAwayTime > 5) {
      const extraTime = lookingAwayTime - 5;
      score -= Math.min(extraTime * 2, 25);
    }

    if (!lastFaceDetectedRef.current && lookingAwayTime > 10) {
      score -= 15;
    }

    if (yawnCount === 0 && blinkRate >= 10 && blinkRate <= 22) {
      score = Math.min(100, score + 5);
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }, []);

  useEffect(() => {
    if (!isMonitoring) {
      if (scoreUpdateIntervalRef.current) {
        clearInterval(scoreUpdateIntervalRef.current);
        scoreUpdateIntervalRef.current = null;
      }
      return;
    }

    scoreUpdateIntervalRef.current = setInterval(() => {
      const newScore = calculateRealisticScore();
      setAttentionScore(newScore);

      const blinkRate = blinkRateRef.current;
      const yawnCount = yawnCountRef.current;
      const lookingAway = lookingAwayTimeRef.current > 5;
      
      let message = '';
      if (yawnCount > 2) {
        message = '😴 Muchos bostezos - Considera descansar';
      } else if (blinkRate > 28) {
        message = '👁️ Pestañeo frecuente - Posible fatiga';
      } else if (lookingAway) {
        message = '👀 Mirando fuera - Vuelve a la pantalla';
      } else if (blinkRate >= 10 && blinkRate <= 22 && yawnCount === 0) {
        message = '✨ Excelente - Mantén el enfoque';
      } else {
        message = '👍 Buen nivel de atención';
      }

      setScoreFactors({ blinkRate, yawnCount, lookingAway, message });

      const now = new Date();
      const timeStr = `${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      setChartData(prev => {
        const newData = [...prev, { time: timeStr, score: newScore }];
        return newData.slice(-20);
      });
    }, 2000);

    return () => {
      if (scoreUpdateIntervalRef.current) {
        clearInterval(scoreUpdateIntervalRef.current);
      }
    };
  }, [isMonitoring, calculateRealisticScore]);

  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'SELF_ATTENTION_UPDATE':
        const metrics = message.metrics;
        
        setStats(prev => ({
          ...prev,
          blinks: metrics.blinks || prev.blinks,
          yawns: metrics.yawns || prev.yawns
        }));
        break;
      
      case 'CONNECTION_SUCCESS':
        console.log('✅ Conexión WebSocket confirmada');
        break;
      
      case 'MONITORING_STARTED':
        console.log('📹 Monitoreo iniciado');
        break;
    }
  }, []);

  const { isConnected, sendMessage } = useWebSocket(
    userId,
    isMonitoring ? (sessionId || 'temp-session') : null,
    {
      onMessage: handleWebSocketMessage,
    }
  );

  const handleMetricsDetected = useCallback((cvMetrics: any) => {
    if (!isConnected || !isMonitoring) return;

    blinkRateRef.current = cvMetrics.blink_rate || 0;
    yawnCountRef.current = cvMetrics.total_yawns || 0;
    lastFaceDetectedRef.current = cvMetrics.face_detected;

    if (!cvMetrics.face_detected || cvMetrics.looking_away) {
      lookingAwayTimeRef.current += 0.05;
    } else {
      lookingAwayTimeRef.current = Math.max(0, lookingAwayTimeRef.current - 0.15);
    }

    setStats(prev => ({
      ...prev,
      blinks: cvMetrics.total_blinks || prev.blinks,
      yawns: cvMetrics.total_yawns || prev.yawns
    }));

    const currentScore = calculateRealisticScore();
    const attentionLevel = currentScore >= 70 ? 'HIGH' : currentScore >= 40 ? 'MEDIUM' : 'LOW';

    const now = Date.now();
    const lastSent = (window as any).__lastMetricsSent || 0;
    if (now - lastSent > 2000) {
      (window as any).__lastMetricsSent = now;
      
      sendMessage({
        type: 'ATTENTION_METRICS',
        metrics: {
          attention_score: currentScore,
          attention_level: attentionLevel,
          ear: cvMetrics.ear,
          mar: cvMetrics.mar,
          blinks: cvMetrics.total_blinks,
          yawns: cvMetrics.total_yawns,
          looking_away: cvMetrics.looking_away || !cvMetrics.face_detected,
          head_pose: cvMetrics.head_pose,
          blink_rate: cvMetrics.blink_rate
        }
      });
    }
  }, [isConnected, isMonitoring, sendMessage, calculateRealisticScore]);

  const handleStartStop = () => {
    if (!userId) {
      alert('Esperando autenticación...');
      return;
    }

    if (!isMonitoring) {
      console.log('▶️ INICIANDO MONITOREO');
      sendMessage({ type: 'START_MONITORING' });
      
      blinkRateRef.current = 0;
      yawnCountRef.current = 0;
      lookingAwayTimeRef.current = 0;
      lastFaceDetectedRef.current = true;
      
      // NO resetear stats aquí, mantener los valores históricos
      setAttentionScore(100);
      setChartData([{ time: '0:00', score: 100 }]);
      setIsMonitoring(true);
    } else {
      console.log('⏹️ DETENIENDO MONITOREO');
      sendMessage({ type: 'STOP_MONITORING' });
      setIsMonitoring(false);
    }
  };

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        duration: prev.duration + 1
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Mostrar loader mientras carga datos históricos
  if (isLoadingHistory && userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-800">Cargando tu historial...</p>
          <p className="text-gray-600 mt-2">Obteniendo métricas guardadas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Mi Sesión en Vivo
            </h1>
            <p className="text-gray-600 font-medium">
              Monitoreo inteligente de atención en tiempo real
            </p>
          </div>
          
          <div className="flex items-center gap-4">
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

            <button
              onClick={handleStartStop}
              disabled={!userId}
              className={`
                flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                ${isMonitoring 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                }
              `}
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-6 h-6" />
                  Detener Monitoreo
                </>
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  Iniciar Monitoreo
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {!userId && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-4 shadow-lg">
          <p className="text-yellow-800 font-semibold">
            ⏳ Cargando información del usuario...
          </p>
        </div>
      )}

      {!isConnected && userId && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 shadow-lg">
          <p className="text-red-800 font-semibold">
            ⚠️ Sin conexión al servidor. Verifica que el backend esté activo.
          </p>
        </div>
      )}

      {!isMonitoring && isConnected && userId && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4 shadow-lg">
          <p className="text-blue-800 font-semibold">
            💡 Presiona "Iniciar Monitoreo" para comenzar el análisis de atención
          </p>
        </div>
      )}

      {/* Factor Indicator */}
      {isMonitoring && scoreFactors.message && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-indigo-800 font-semibold text-lg">
              {scoreFactors.message}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 bg-white/70 rounded-full font-semibold">
                Pestañeos: {scoreFactors.blinkRate.toFixed(0)}/min
              </span>
              <span className="px-3 py-1 bg-white/70 rounded-full font-semibold">
                Bostezos: {scoreFactors.yawnCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats - Ahora muestra datos históricos */}
      <QuickStats 
        blinks={stats.blinks}
        yawns={stats.yawns}
        duration={stats.duration}
        streak={stats.streak}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnergyMeter attentionScore={attentionScore} />
        <VideoPreview 
          isActive={isMonitoring} 
          onMetricsDetected={handleMetricsDetected}
        />
      </div>

      {/* Attention Chart - Ahora muestra datos históricos */}
      <AttentionChart data={chartData} />
    </div>
  );
}