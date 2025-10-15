// frontend/src/app/dashboard/student/history/page.tsx
'use client';

import { useState } from 'react';
import { Calendar, Clock, TrendingUp, TrendingDown, Award, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function HistoryPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Datos simulados
  const weeklyData = [
    { day: 'Lun', average: 78, high: 92, low: 65 },
    { day: 'Mar', average: 82, high: 95, low: 70 },
    { day: 'Mié', average: 75, high: 88, low: 60 },
    { day: 'Jue', average: 85, high: 96, low: 75 },
    { day: 'Vie', average: 80, high: 90, low: 68 },
    { day: 'Sáb', average: 88, high: 98, low: 78 },
    { day: 'Dom', average: 72, high: 85, low: 58 },
  ];

  const sessions = [
    {
      id: 1,
      className: 'Matemáticas Avanzadas',
      date: '2025-10-08',
      time: '09:00 AM',
      duration: 90,
      avgAttention: 85,
      blinks: 234,
      yawns: 3,
      trend: 'up'
    },
    {
      id: 2,
      className: 'Programación Web',
      date: '2025-10-07',
      time: '02:00 PM',
      duration: 120,
      avgAttention: 78,
      blinks: 312,
      yawns: 5,
      trend: 'up'
    },
    {
      id: 3,
      className: 'Física Cuántica',
      date: '2025-10-06',
      time: '11:00 AM',
      duration: 75,
      avgAttention: 72,
      blinks: 198,
      yawns: 8,
      trend: 'down'
    },
    {
      id: 4,
      className: 'Literatura Contemporánea',
      date: '2025-10-05',
      time: '04:00 PM',
      duration: 60,
      avgAttention: 88,
      blinks: 156,
      yawns: 2,
      trend: 'up'
    },
  ];

  const weeklyStats = {
    totalClasses: 12,
    totalHours: 18,
    averageAttention: 81,
    bestDay: 'Sábado',
    improvement: 7
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Historial de Atención
        </h1>
        <p className="text-gray-600">
          Revisa tu rendimiento y evolución en el tiempo
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {['week', 'month', 'semester'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedPeriod === period
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {period === 'week' && 'Esta Semana'}
            {period === 'month' && 'Este Mes'}
            {period === 'semester' && 'Este Semestre'}
          </button>
        ))}
      </div>

      {/* Weekly Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <Calendar className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{weeklyStats.totalClasses}</p>
            <p className="text-blue-100 text-sm">Clases Asistidas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <Clock className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{weeklyStats.totalHours}h</p>
            <p className="text-purple-100 text-sm">Horas Totales</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-6">
            <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{weeklyStats.averageAttention}%</p>
            <p className="text-green-100 text-sm">Atención Promedio</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-6">
            <Award className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{weeklyStats.bestDay}</p>
            <p className="text-orange-100 text-sm">Mejor Día</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0">
          <CardContent className="p-6">
            <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">+{weeklyStats.improvement}%</p>
            <p className="text-pink-100 text-sm">Mejora Semanal</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento Semanal</CardTitle>
          <CardDescription>Promedio de atención por día</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="high" fill="#22c55e" name="Máximo" radius={[8, 8, 0, 0]} />
                <Bar dataKey="average" fill="#3b82f6" name="Promedio" radius={[8, 8, 0, 0]} />
                <Bar dataKey="low" fill="#ef4444" name="Mínimo" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Sesiones Recientes</CardTitle>
          <CardDescription>Detalle de tus últimas clases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div 
                key={session.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{session.className}</h4>
                    {session.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {session.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {session.time}
                    </span>
                    <span>{session.duration} min</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Attention Score */}
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      session.avgAttention >= 70 ? 'text-green-600' :
                      session.avgAttention >= 40 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {session.avgAttention}%
                    </div>
                    <p className="text-xs text-gray-500">Atención</p>
                  </div>

                  {/* Blinks */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-blue-600">
                      <Eye className="w-4 h-4" />
                      <span className="font-semibold">{session.blinks}</span>
                    </div>
                    <p className="text-xs text-gray-500">Pestañeos</p>
                  </div>

                  {/* yawns */}
                  <div className="text-center">
                    <div className="text-orange-600 font-semibold">
                      😴 {session.yawns}
                    </div>
                    <p className="text-xs text-gray-500">Bostezos</p>
                  </div>

                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights Card */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">📊 Insights Personalizados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">🎯 Tu Mejor Horario</p>
              <p className="text-sm text-white/90">
                Tienes mejor rendimiento entre las 9:00 AM - 12:00 PM
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">📈 Tendencia Positiva</p>
              <p className="text-sm text-white/90">
                Has mejorado un 7% en las últimas 2 semanas
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">⚠️ Área de Mejora</p>
              <p className="text-sm text-white/90">
                Tu atención baja después de 60 minutos. Considera descansos.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="font-semibold mb-2">🏆 Logro Desbloqueado</p>
              <p className="text-sm text-white/90">
                5 días consecutivos con atención superior al 75%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}