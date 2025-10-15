// frontend/src/app/dashboard/teacher/analytics/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock,
  Download,
  Calendar,
  Eye,
  Cloud,
  Target
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [selectedMetric, setSelectedMetric] = useState<'attention' | 'blinks' | 'yawns'>('attention');

  // Datos de ejemplo - Atención por hora
  const attentionOverTime = [
    { time: '09:00', score: 85, students: 12 },
    { time: '10:00', score: 78, students: 15 },
    { time: '11:00', score: 72, students: 14 },
    { time: '12:00', score: 65, students: 13 },
    { time: '13:00', score: 58, students: 10 },
    { time: '14:00', score: 70, students: 14 },
    { time: '15:00', score: 75, students: 16 },
    { time: '16:00', score: 80, students: 15 }
  ];

  // Datos de comparación entre estudiantes
  const studentComparison = [
    { name: 'Ana G.', attention: 85, blinks: 45, yawns: 2, sessions: 12 },
    { name: 'Carlos M.', attention: 65, blinks: 78, yawns: 5, sessions: 10 },
    { name: 'María R.', attention: 35, blinks: 120, yawns: 8, sessions: 8 },
    { name: 'Luis F.', attention: 90, blinks: 38, yawns: 1, sessions: 15 },
    { name: 'Sofia T.', attention: 72, blinks: 62, yawns: 3, sessions: 11 }
  ];

  // Distribución de niveles de atención
  const attentionDistribution = [
    { name: 'Alta (>70%)', value: 45, color: '#10b981' },
    { name: 'Media (40-70%)', value: 35, color: '#f59e0b' },
    { name: 'Baja (<40%)', value: 20, color: '#ef4444' }
  ];

  // Datos de radar para análisis multidimensional
  const radarData = [
    { metric: 'Atención', value: 78, fullMark: 100 },
    { metric: 'Participación', value: 85, fullMark: 100 },
    { metric: 'Constancia', value: 72, fullMark: 100 },
    { metric: 'Puntualidad', value: 90, fullMark: 100 },
    { metric: 'Rendimiento', value: 75, fullMark: 100 }
  ];

  // Tendencias semanales
  const weeklyTrends = [
    { day: 'Lun', attention: 75, engagement: 80 },
    { day: 'Mar', attention: 78, engagement: 82 },
    { day: 'Mié', attention: 72, engagement: 75 },
    { day: 'Jue', attention: 80, engagement: 85 },
    { day: 'Vie', attention: 70, engagement: 72 }
  ];

  // Estadísticas principales
  const mainStats = {
    avgAttention: 73,
    totalSessions: 48,
    activeStudents: 15,
    improvementRate: 12
  };

  const exportReport = () => {
    // Generar reporte CSV
    const csvData = [
      ['Reporte de Analíticas', `Período: ${timeRange}`],
      [''],
      ['Métrica', 'Valor'],
      ['Atención Promedio', `${mainStats.avgAttention}%`],
      ['Total Sesiones', mainStats.totalSessions],
      ['Estudiantes Activos', mainStats.activeStudents],
      ['Tasa de Mejora', `${mainStats.improvementRate}%`],
      [''],
      ['Comparación de Estudiantes'],
      ['Nombre', 'Atención', 'Pestañeos', 'Bostezos', 'Sesiones'],
      ...studentComparison.map(s => [s.name, s.attention, s.blinks, s.yawns, s.sessions])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analíticas</h1>
          <p className="text-gray-600">Análisis detallado del rendimiento y tendencias</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1">
            {(['day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range === 'day' ? 'Día' : range === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>

          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
          >
            <Download className="w-5 h-5" />
            Exportar Reporte
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-10 h-10 text-blue-600" />
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                +{mainStats.improvementRate}%
              </span>
            </div>
            <p className="text-sm font-medium text-blue-600 mb-1">Atención Promedio</p>
            <p className="text-4xl font-black text-blue-700">{mainStats.avgAttention}%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <Users className="w-10 h-10 text-green-600 mb-3" />
            <p className="text-sm font-medium text-green-600 mb-1">Estudiantes Activos</p>
            <p className="text-4xl font-black text-green-700">{mainStats.activeStudents}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <Clock className="w-10 h-10 text-purple-600 mb-3" />
            <p className="text-sm font-medium text-purple-600 mb-1">Total Sesiones</p>
            <p className="text-4xl font-black text-purple-700">{mainStats.totalSessions}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-6">
            <TrendingUp className="w-10 h-10 text-orange-600 mb-3" />
            <p className="text-sm font-medium text-orange-600 mb-1">Tasa de Mejora</p>
            <p className="text-4xl font-black text-orange-700">+{mainStats.improvementRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atención a lo largo del tiempo */}
        <Card>
          <CardHeader>
            <CardTitle>Atención a lo Largo del Tiempo</CardTitle>
            <CardDescription>Score promedio por hora del día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attentionOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    name="Score de Atención"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="students" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Estudiantes Activos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribución de Atención */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Niveles</CardTitle>
            <CardDescription>Porcentaje de estudiantes por nivel de atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attentionDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attentionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparación de Estudiantes */}
        <Card>
          <CardHeader>
            <CardTitle>Comparación entre Estudiantes</CardTitle>
            <CardDescription>Rendimiento individual por estudiante</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="attention" fill="#3b82f6" name="Atención %" />
                  <Bar dataKey="yawns" fill="#f59e0b" name="Bostezos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Análisis Multidimensional */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis Multidimensional</CardTitle>
            <CardDescription>Rendimiento general de la clase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" stroke="#6b7280" />
                  <PolarRadiusAxis stroke="#6b7280" />
                  <Radar 
                    name="Clase" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendencias Semanales */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencias Semanales</CardTitle>
          <CardDescription>Comparación de atención y participación por día</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px'
                  }}
                />
                <Legend />
                <Bar dataKey="attention" fill="#3b82f6" name="Atención" radius={[8, 8, 0, 0]} />
                <Bar dataKey="engagement" fill="#10b981" name="Participación" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Insights y Recomendaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl">
              <h4 className="font-bold text-green-700 mb-2">✅ Puntos Fuertes</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Atención promedio por encima del 70%</li>
                <li>• Mejora del 12% respecto a la semana anterior</li>
                <li>• 75% de estudiantes con alta participación</li>
              </ul>
            </div>
            
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl">
              <h4 className="font-bold text-orange-700 mb-2">⚠️ Áreas de Mejora</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 20% de estudiantes con atención crítica</li>
                <li>• Baja de atención después del mediodía</li>
                <li>• 3 estudiantes necesitan seguimiento individual</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}