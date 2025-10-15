// frontend/src/components/dashboard/VideoPreview.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Video, VideoOff, Camera, AlertCircle } from 'lucide-react';
import { useVideoCapture } from '@/hooks/useVideoCapture';

interface VideoPreviewProps {
  onMetricsDetected?: (metrics: any) => void;
  isActive: boolean;
}

export default function VideoPreview({ onMetricsDetected, isActive }: VideoPreviewProps) {
  const [cvMetrics, setCvMetrics] = useState<any>(null);
  const [lastProcessTime, setLastProcessTime] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');
  const processingRef = useRef(false);
  const frameQueueRef = useRef<string[]>([]);

  // Obtener session_id al montar
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    let userId = 'anonymous';
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub || 'anonymous';
      } catch (e) {
        console.warn('⚠️ No se pudo extraer user_id del token');
      }
    }

    const sid = `user-${userId}`;
    setSessionId(sid);
    console.log(`🔑 Session ID inicializado: ${sid}`);
  }, []);

  // Procesar frame en el backend
  const processFrame = useCallback(async (imageData: string) => {
    if (processingRef.current) {
      // Si ya está procesando, agregar a la cola (máximo 2 frames en cola)
      if (frameQueueRef.current.length < 2) {
        frameQueueRef.current.push(imageData);
      }
      return;
    }

    processingRef.current = true;
    const startTime = performance.now();

    try {
      const response = await fetch('http://localhost:8000/api/cv/process-frame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const metrics = await response.json();
      
      setCvMetrics(metrics);
      setFrameCount(prev => prev + 1);

      const endTime = performance.now();
      const processTime = endTime - startTime;
      setLastProcessTime(Math.round(processTime));

      // Solo logear cada 30 frames para reducir spam
      if (frameCount % 30 === 0) {
        console.log(`📊 Frame #${frameCount} - Time: ${processTime.toFixed(0)}ms - Blinks: ${metrics.total_blinks}, Yawns: ${metrics.total_yawns}`);
      }

      // Notificar al componente padre
      if (onMetricsDetected && metrics.face_detected) {
        const metricsWithTime = {
          ...metrics,
          processing_time: Math.round(processTime)
        };
        onMetricsDetected(metricsWithTime);
      }

    } catch (error: any) {
      console.error('❌ Error procesando frame:', error.message);
    } finally {
      processingRef.current = false;
      
      // Procesar siguiente frame en cola si existe
      if (frameQueueRef.current.length > 0) {
        const nextFrame = frameQueueRef.current.shift();
        if (nextFrame) {
          setTimeout(() => processFrame(nextFrame), 10);
        }
      }
    }
  }, [sessionId, onMetricsDetected, frameCount]);

  // Callback cuando se captura un frame
  const handleFrame = useCallback((imageData: string) => {
    if (!isActive || !sessionId) return;
    processFrame(imageData);
  }, [isActive, sessionId, processFrame]);

  // Hook de captura de video optimizado
  const {
    videoRef,
    canvasRef,
    isCapturing,
    error,
    actualFPS,
    startCapture,
    stopCapture
  } = useVideoCapture({
    targetFPS: 20,        // 20 FPS para detección precisa
    quality: 0.7,         // Calidad media para mejor performance
    width: 640,
    height: 480,
    onFrame: handleFrame  // Callback cuando hay nuevo frame
  });

  // Controlar captura según estado de monitoreo
  useEffect(() => {
    if (isActive && sessionId) {
      console.log('▶️ Iniciando captura de video a 20 FPS');
      startCapture();
      setFrameCount(0);
    } else {
      console.log('⏹️ Deteniendo captura de video');
      stopCapture();
      setCvMetrics(null);
    }

    return () => {
      stopCapture();
    };
  }, [isActive, sessionId, startCapture, stopCapture]);

  const getAttentionColor = () => {
    if (!cvMetrics || !cvMetrics.face_detected) return 'gray';
    
    if (cvMetrics.looking_away) return 'orange';
    if (cvMetrics.yawn_detected) return 'red';
    if (cvMetrics.blink_rate > 30) return 'yellow';
    
    return 'green';
  };

  const attentionColor = getAttentionColor();

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Vista en Tiempo Real</h3>
            <p className="text-sm text-gray-600">
              {isCapturing ? (
                cvMetrics?.face_detected ? '✅ Rostro detectado' : '🔍 Buscando rostro...'
              ) : '⏸️ Cámara pausada'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {actualFPS > 0 && (
            <div className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
              {actualFPS} FPS
            </div>
          )}
          {frameCount > 0 && (
            <div className="text-xs text-gray-600">
              {frameCount} frames
            </div>
          )}
        </div>
      </div>

      {/* Video Container */}
      <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-white font-medium mb-2">Error de Cámara</p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <button
              onClick={startCapture}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform scale-x-[-1] ${
                isCapturing ? 'opacity-100' : 'opacity-0'
              }`}
            />
            
            <canvas ref={canvasRef} className="hidden" />

            {!isCapturing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Camera className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-gray-400 font-medium">Cámara desactivada</p>
                <p className="text-gray-500 text-sm mt-2">
                  {isActive ? 'Iniciando cámara...' : 'Inicia el monitoreo para activar'}
                </p>
              </div>
            )}

            {/* Overlay Info */}
            {isCapturing && (
              <>
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      attentionColor === 'green' ? 'bg-green-500' :
                      attentionColor === 'yellow' ? 'bg-yellow-500' :
                      attentionColor === 'orange' ? 'bg-orange-500' :
                      attentionColor === 'red' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-white text-sm font-medium">
                      {cvMetrics?.face_detected ? 'DETECTANDO' : 'BUSCANDO'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                      <span className="text-white text-xs font-medium">
                        {actualFPS} FPS
                      </span>
                    </div>
                    <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                      <span className="text-white text-xs font-medium">
                        {lastProcessTime}ms
                      </span>
                    </div>
                  </div>
                </div>

                {/* Face Detection Overlay */}
                {cvMetrics?.face_detected && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 rounded-full ${
                      attentionColor === 'green' ? 'border-green-400' :
                      attentionColor === 'yellow' ? 'border-yellow-400' :
                      attentionColor === 'orange' ? 'border-orange-400' :
                      attentionColor === 'red' ? 'border-red-400' :
                      'border-gray-400'
                    } animate-pulse`}></div>
                  </div>
                )}

                {/* CV Metrics Overlay */}
                {cvMetrics?.face_detected && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
                    <div className="grid grid-cols-3 gap-3 text-white text-xs">
                      <div>
                        <p className="text-gray-400">EAR</p>
                        <p className="font-bold">{cvMetrics.ear.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">MAR</p>
                        <p className="font-bold text-yellow-400">{cvMetrics.mar.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Pestañeos</p>
                        <p className="font-bold text-blue-400">{cvMetrics.total_blinks}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Bostezos</p>
                        <p className="font-bold text-red-400">{cvMetrics.total_yawns || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Head Yaw</p>
                        <p className="font-bold">{cvMetrics.head_pose?.yaw?.toFixed(1) || 0}°</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Head Pitch</p>
                        <p className="font-bold">{cvMetrics.head_pose?.pitch?.toFixed(1) || 0}°</p>
                      </div>
                    </div>

                    {/* Alerts */}
                    <div className="mt-2 space-y-1">
                      {cvMetrics.yawn_detected && (
                        <div className="px-2 py-1 bg-red-500/80 rounded text-center animate-pulse">
                          <p className="font-semibold text-xs">😴 BOSTEZO DETECTADO</p>
                        </div>
                      )}
                      {cvMetrics.blink_detected && (
                        <div className="px-2 py-1 bg-blue-500/80 rounded text-center">
                          <p className="font-semibold text-xs">👁️ Pestañeo</p>
                        </div>
                      )}
                      {cvMetrics.looking_away && (
                        <div className="px-2 py-1 bg-orange-500/80 rounded text-center">
                          <p className="font-semibold text-xs">👀 Mirando Afuera</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="font-semibold text-blue-800">💡 Procesamiento:</span>
            <span className="text-blue-700 ml-2">
              {actualFPS} FPS real | {lastProcessTime}ms latencia
            </span>
          </div>
          {frameCount > 0 && (
            <div className="text-blue-700">
              <span className="font-mono">{frameCount}</span> frames procesados
            </div>
          )}
        </div>
      </div>
    </div>
  );
}