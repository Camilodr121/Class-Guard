// frontend/src/hooks/useVideoCapture.ts
import { useRef, useEffect, useState, useCallback } from 'react';

interface VideoCaptureOptions {
  onFrame?: (imageData: string) => void;
  targetFPS?: number; // FPS objetivo (frames por segundo)
  width?: number;
  height?: number;
  quality?: number; // Calidad JPEG 0.0 - 1.0
}

export function useVideoCapture(options: VideoCaptureOptions = {}) {
  const {
    onFrame,
    targetFPS = 20, // 20 FPS por defecto (era 1 FPS antes!)
    width = 640,
    height = 480,
    quality = 0.7 // Reducir calidad para mejor performance
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastCaptureTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsCounterRef = useRef<number>(0);

  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string>('');
  const [actualFPS, setActualFPS] = useState<number>(0);

  // Calcular intervalo mínimo entre frames
  const frameInterval = 1000 / targetFPS; // ms entre frames

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user',
          frameRate: { ideal: targetFPS, max: 30 } // Solicitar FPS específico
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
        setError('');
        console.log(`✅ Cámara iniciada - Target: ${targetFPS} FPS`);
      }
    } catch (err: any) {
      setError('No se pudo acceder a la cámara: ' + err.message);
      console.error('❌ Error accessing camera:', err);
    }
  }, [width, height, targetFPS]);

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCapturing(false);
    console.log('🛑 Captura detenida');
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCapturing) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return null;
    }

    // Ajustar tamaño del canvas SOLO si cambió
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Dibujar frame actual
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a base64 con calidad reducida para mejor performance
    const imageData = canvas.toDataURL('image/jpeg', quality);
    
    return imageData;
  }, [isCapturing, quality]);

  // Loop de captura usando requestAnimationFrame (más eficiente)
  const captureLoop = useCallback((timestamp: number) => {
    if (!isCapturing) return;

    // Calcular si es momento de capturar (throttling manual)
    const elapsed = timestamp - lastCaptureTimeRef.current;
    
    if (elapsed >= frameInterval) {
      // Capturar frame
      const frameData = captureFrame();
      
      if (frameData && onFrame) {
        onFrame(frameData);
        frameCountRef.current++;
      }
      
      lastCaptureTimeRef.current = timestamp;
      
      // Calcular FPS real cada segundo
      fpsCounterRef.current++;
      if (frameCountRef.current % targetFPS === 0) {
        setActualFPS(Math.round(fpsCounterRef.current));
        fpsCounterRef.current = 0;
      }
    }

    // Continuar loop
    animationFrameRef.current = requestAnimationFrame(captureLoop);
  }, [isCapturing, captureFrame, onFrame, frameInterval, targetFPS]);

  // Efecto para iniciar/detener el loop de captura
  useEffect(() => {
    if (!isCapturing || !onFrame) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    console.log(`🎥 Iniciando captura a ${targetFPS} FPS`);
    lastCaptureTimeRef.current = performance.now();
    frameCountRef.current = 0;
    fpsCounterRef.current = 0;
    
    // Iniciar loop
    animationFrameRef.current = requestAnimationFrame(captureLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isCapturing, onFrame, captureLoop, targetFPS]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    videoRef,
    canvasRef,
    isCapturing,
    error,
    actualFPS, // FPS real alcanzado
    startCapture,
    stopCapture,
    captureFrame
  };
}