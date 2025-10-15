// frontend/src/components/dashboard/AttentionChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface AttentionChartProps {
  data: Array<{ time: string; score: number }>;
}

export default function AttentionChart({ data }: AttentionChartProps) {
  const currentScore = data.length > 0 ? data[data.length - 1].score : 0;
  const previousScore = data.length > 1 ? data[data.length - 2].score : 0;
  const trend = currentScore - previousScore;
  
  // Calcular promedio
  const avgScore = data.length > 0 
    ? data.reduce((sum, d) => sum + d.score, 0) / data.length 
    : 0;

  // Determinar color del gradiente según score promedio
  const getGradientColors = () => {
    if (avgScore >= 70) return { start: '#10b981', end: '#059669' }; // Verde
    if (avgScore >= 40) return { start: '#f59e0b', end: '#d97706' }; // Naranja
    return { start: '#ef4444', end: '#dc2626' }; // Rojo
  };

  const gradientColors = getGradientColors();

  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
            <Activity className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-800 mb-1">
              Línea de Atención
            </h3>
            <p className="text-sm text-gray-600 font-medium">
              Últimos {data.length} registros
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Promedio */}
          <div className="text-center px-6 py-3 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Promedio</p>
            <p className="text-3xl font-black text-gray-800">{avgScore.toFixed(0)}%</p>
          </div>

          {/* Tendencia */}
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-sm shadow-lg ${
            trend >= 0 
              ? 'bg-green-50/80 border border-green-200' 
              : 'bg-red-50/80 border border-red-200'
          }`}>
            {trend >= 0 ? (
              <TrendingUp className="w-6 h-6 text-green-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-600" />
            )}
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Tendencia</p>
              <span className={`text-2xl font-black ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico con estilo mejorado */}
      <div className="h-80 bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-inner">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientColors.start} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={gradientColors.end} stopOpacity={0.05}/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: '600' }}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: '600' }}
              domain={[0, 100]}
              tick={{ fill: '#6b7280' }}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: '12px 16px'
              }}
              labelStyle={{ 
                fontWeight: 'bold', 
                color: '#1f2937',
                marginBottom: '4px'
              }}
              formatter={(value: number) => [
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {value.toFixed(1)}%
                </span>, 
                'Atención'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke={gradientColors.start}
              strokeWidth={3}
              fill="url(#colorScore)"
              filter="url(#glow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend mejorada */}
      <div className="mt-6 flex items-center justify-center gap-8 flex-wrap">
        <div className="flex items-center gap-3 px-4 py-2 bg-green-50/80 backdrop-blur-sm rounded-xl border border-green-200">
          <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-lg"></div>
          <span className="text-sm font-bold text-green-700">Excelente (80-100%)</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-lg"></div>
          <span className="text-sm font-bold text-blue-700">Bueno (60-79%)</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-yellow-50/80 backdrop-blur-sm rounded-xl border border-yellow-200">
          <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg"></div>
          <span className="text-sm font-bold text-orange-700">Regular (40-59%)</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-red-50/80 backdrop-blur-sm rounded-xl border border-red-200">
          <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-red-600 rounded-full shadow-lg"></div>
          <span className="text-sm font-bold text-red-700">Crítico (&lt;40%)</span>
        </div>
      </div>
    </div>
  );
}