// frontend/src/components/dashboard/EnergyMeter.tsx
'use client';

import { useEffect, useState } from 'react';
import { Zap, Battery, BatteryWarning, BatteryLow, AlertTriangle } from 'lucide-react';

interface EnergyMeterProps {
  attentionScore: number;
  onChange?: (score: number) => void;
}

export default function EnergyMeter({ attentionScore, onChange }: EnergyMeterProps) {
  const [animatedScore, setAnimatedScore] = useState(attentionScore);

  useEffect(() => {
    // Animación suave hacia el nuevo score
    const interval = setInterval(() => {
      setAnimatedScore((prev) => {
        const diff = attentionScore - prev;
        if (Math.abs(diff) < 0.5) return attentionScore;
        // Movimiento más rápido si la diferencia es grande
        const step = Math.abs(diff) > 10 ? 2 : 0.5;
        return prev + (diff > 0 ? step : -step);
      });
    }, 30);

    return () => clearInterval(interval);
  }, [attentionScore]);

  const getEnergyLevel = (score: number) => {
    if (score >= 80) return { 
      level: 'Excelente', 
      color: 'from-emerald-400 via-green-500 to-teal-600', 
      icon: Battery, 
      text: 'text-green-600', 
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      glow: 'shadow-green-500/20'
    };
    if (score >= 60) return { 
      level: 'Bueno', 
      color: 'from-blue-400 via-cyan-500 to-blue-600', 
      icon: Battery, 
      text: 'text-blue-600', 
      bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      glow: 'shadow-blue-500/20'
    };
    if (score >= 40) return { 
      level: 'Regular', 
      color: 'from-yellow-400 via-amber-500 to-orange-500', 
      icon: BatteryWarning, 
      text: 'text-orange-600', 
      bg: 'bg-gradient-to-br from-yellow-50 to-orange-50',
      glow: 'shadow-orange-500/20'
    };
    return { 
      level: 'Crítico', 
      color: 'from-red-400 via-rose-500 to-red-600', 
      icon: AlertTriangle, 
      text: 'text-red-600', 
      bg: 'bg-gradient-to-br from-red-50 to-rose-50',
      glow: 'shadow-red-500/20'
    };
  };

  const energy = getEnergyLevel(animatedScore);
  const Icon = energy.icon;

  // Calcular circunferencia para el círculo de progreso
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;

  return (
    <div className={`${energy.bg} rounded-3xl shadow-2xl ${energy.glow} p-8 border border-white/50 backdrop-blur-sm transition-all duration-500`}>
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-lg ${energy.glow}`}>
          <Icon className={`w-10 h-10 ${energy.text}`} />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Nivel de Atención</h3>
        <p className="text-gray-600 font-medium">Monitoreo en tiempo real</p>
      </div>

      {/* Circular Progress con efecto de glassmorphism */}
      <div className="relative w-64 h-64 mx-auto mb-6">
        {/* Círculo de fondo con efecto de sombra interna */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-md rounded-full shadow-inner"></div>
        
        <svg className="transform -rotate-90 w-full h-full relative z-10">
          {/* Background Circle */}
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="16"
            fill="none"
            className="text-gray-200/50"
          />
          {/* Progress Circle con gradiente animado */}
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="url(#gradient)"
            strokeWidth="16"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out drop-shadow-lg"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={animatedScore >= 80 ? '#10b981' : animatedScore >= 60 ? '#3b82f6' : animatedScore >= 40 ? '#f59e0b' : '#ef4444'} />
              <stop offset="100%" stopColor={animatedScore >= 80 ? '#14b8a6' : animatedScore >= 60 ? '#06b6d4' : animatedScore >= 40 ? '#f97316' : '#dc2626'} />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center Text con efecto de brillo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-7xl font-black bg-gradient-to-r ${energy.color} bg-clip-text text-transparent drop-shadow-sm`}>
            {Math.round(animatedScore)}
          </div>
          <div className="text-3xl font-bold text-gray-400">%</div>
          <div className={`text-lg font-bold ${energy.text} mt-2 px-4 py-1 bg-white/80 rounded-full shadow-md`}>
            {energy.level}
          </div>
        </div>

        {/* Partículas decorativas */}
        {animatedScore >= 80 && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 right-8 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-8 left-4 w-2 h-2 bg-emerald-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-12 left-12 w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
        )}
      </div>

      {/* Status Messages con mejor diseño */}
      <div className={`p-5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 ${energy.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
            <Zap className={`w-6 h-6 ${energy.text}`} />
          </div>
          <div className="flex-1">
            <p className={`font-bold ${energy.text} text-lg mb-1`}>
              {animatedScore >= 80 && '🎯 ¡Concentración Perfecta!'}
              {animatedScore >= 60 && animatedScore < 80 && '✨ ¡Bien! Mantén el ritmo'}
              {animatedScore >= 40 && animatedScore < 60 && '⚡ Atención moderada'}
              {animatedScore < 40 && '⚠️ Nivel crítico de atención'}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {animatedScore >= 80 && 'Estás completamente enfocado. ¡Excelente trabajo!'}
              {animatedScore >= 60 && animatedScore < 80 && 'Tu nivel de atención es bueno, continúa así'}
              {animatedScore >= 40 && animatedScore < 60 && 'Intenta reducir las distracciones'}
              {animatedScore < 40 && 'Considera tomar un breve descanso de 5 minutos'}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de progreso adicional */}
      <div className="mt-4">
        <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className={`h-full bg-gradient-to-r ${energy.color} transition-all duration-1000 ease-out rounded-full`}
            style={{ width: `${animatedScore}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}