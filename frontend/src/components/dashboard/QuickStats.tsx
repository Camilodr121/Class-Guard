// frontend/src/components/dashboard/QuickStats.tsx
import { Eye, Cloud, Clock, Award, TrendingUp } from 'lucide-react';

interface QuickStatsProps {
  blinks: number;
  yawns: number;
  duration: number;
  streak: number;
}

export default function QuickStats({ blinks, yawns, duration, streak }: QuickStatsProps) {
  const stats = [
    {
      icon: Eye,
      label: 'Pestañeos',
      value: blinks,
      unit: 'total',
      color: 'from-blue-500 via-cyan-500 to-blue-600',
      bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      text: 'text-blue-600',
      iconBg: 'bg-blue-100',
      border: 'border-blue-200',
      glow: 'shadow-blue-500/20'
    },
    {
      icon: Cloud,
      label: 'Bostezos',
      value: yawns,
      unit: 'total',
      color: 'from-orange-500 via-amber-500 to-yellow-500',
      bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
      text: 'text-orange-600',
      iconBg: 'bg-orange-100',
      border: 'border-orange-200',
      glow: 'shadow-orange-500/20'
    },
    {
      icon: Clock,
      label: 'Tiempo Activo',
      value: duration,
      unit: 'min',
      color: 'from-purple-500 via-violet-500 to-purple-600',
      bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
      text: 'text-purple-600',
      iconBg: 'bg-purple-100',
      border: 'border-purple-200',
      glow: 'shadow-purple-500/20'
    },
    {
      icon: Award,
      label: 'Racha',
      value: streak,
      unit: 'días',
      color: 'from-green-500 via-emerald-500 to-teal-500',
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      text: 'text-green-600',
      iconBg: 'bg-green-100',
      border: 'border-green-200',
      glow: 'shadow-green-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={stat.label} 
          className={`${stat.bg} rounded-2xl shadow-xl ${stat.glow} p-6 border ${stat.border} border-opacity-50 backdrop-blur-sm hover:scale-105 transition-all duration-300 cursor-pointer group`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-14 h-14 ${stat.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-7 h-7 ${stat.text}`} />
            </div>
            <div className="text-right">
              <div className={`text-3xl font-black ${stat.text} mb-1`}>
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {stat.unit}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700">{stat.label}</p>
            <TrendingUp className={`w-4 h-4 ${stat.text} opacity-50 group-hover:opacity-100 transition-opacity`} />
          </div>

          {/* Barra de progreso decorativa */}
          <div className="mt-3 h-1.5 bg-white/50 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000`}
              style={{ 
                width: stat.label === 'Racha' 
                  ? '100%' 
                  : stat.label === 'Tiempo Activo' 
                    ? `${Math.min((duration / 60) * 100, 100)}%`
                    : `${Math.min((stat.value / 50) * 100, 100)}%`
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}