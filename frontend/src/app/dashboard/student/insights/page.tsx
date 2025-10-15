// frontend/src/app/dashboard/student/insights/page.tsx
'use client';

import { Trophy, Target, Flame, Star, TrendingUp, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

export default function InsightsPage() {
  const radarData = [
    { subject: 'Matemáticas', score: 85 },
    { subject: 'Programación', score: 92 },
    { subject: 'Física', score: 75 },
    { subject: 'Literatura', score: 88 },
    { subject: 'Historia', score: 80 },
    { subject: 'Química', score: 78 },
  ];

  const achievements = [
    {
      id: 1,
      icon: Flame,
      title: 'Racha de 7 días',
      description: 'Mantén tu atención alta por 7 días consecutivos',
      progress: 100,
      unlocked: true,
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 2,
      icon: Target,
      title: 'Enfoque Maestro',
      description: 'Mantén 90%+ de atención por 60 minutos',
      progress: 75,
      unlocked: false,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 3,
      icon: Star,
      title: 'Estudiante Estrella',
      description: 'Alcanza 100% de asistencia en un mes',
      progress: 87,
      unlocked: false,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 4,
      icon: Trophy,
      title: 'Campeón de Atención',
      description: 'Sé el estudiante con mejor promedio de la clase',
      progress: 60,
      unlocked: false,
      color: 'from-purple-500 to-purple-600'
    },
  ];

  const goals = [
    {
      id: 1,
      title: 'Mejorar Atención Matutina',
      current: 75,
      target: 85,
      deadline: '15 Oct 2025'
    },
    {
      id: 2,
      title: 'Reducir Bostezos',
      current: 8,
      target: 3,
      deadline: '20 Oct 2025',
      inverse: true
    },
    {
      id: 3,
      title: 'Aumentar Tiempo de Enfoque',
      current: 45,
      target: 60,
      deadline: '30 Oct 2025'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mi Progreso e Insights
        </h1>
        <p className="text-gray-600">
          Análisis detallado de tu rendimiento y logros
        </p>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((achievement) => (
          <Card key={achievement.id} className={`${achievement.unlocked ? 'border-2 border-green-500' : ''} hover:shadow-xl transition-all`}>
            <CardContent className="p-6">
              <div className={`w-16 h-16 bg-gradient-to-br ${achievement.color} rounded-full flex items-center justify-center mb-4 mx-auto ${!achievement.unlocked && 'opacity-50 grayscale'}`}>
                <achievement.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-center text-gray-900 mb-2">
                {achievement.title}
              </h3>
              <p className="text-xs text-gray-600 text-center mb-4">
                {achievement.description}
              </p>
              
              {/* Progress Bar */}
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {achievement.progress}%
                    </span>
                  </div>
                  {achievement.unlocked && (
                    <span className="text-xs font-semibold text-green-600">
                      ✓ Desbloqueado
                    </span>
                  )}
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${achievement.progress}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r ${achievement.color}`}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por Materia</CardTitle>
          <CardDescription>Análisis comparativo de tu atención en diferentes materias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
                <Radar
                  name="Atención"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Goals Section */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Metas</CardTitle>
          <CardDescription>Objetivos personales de mejora</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = goal.inverse 
                ? ((goal.current - goal.target) / goal.current) * 100
                : (goal.current / goal.target) * 100;
              
              return (
                <div key={goal.id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                      <p className="text-sm text-gray-600">
                        Meta: {goal.inverse ? 'Reducir a' : 'Alcanzar'} {goal.target}{goal.inverse ? '' : '%'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{goal.current}{goal.inverse ? '' : '%'}</p>
                      <p className="text-xs text-gray-500">{goal.deadline}</p>
                    </div>
                  </div>
                  
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-3 text-xs flex rounded-full bg-white">
                      <div
                        style={{ width: `${Math.min(100, progress)}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          progress >= 100 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-purple-600'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="mt-6 w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
            + Agregar Nueva Meta
          </button>
        </CardContent>
      </Card>

      {/* Motivational Quote */}
      <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white border-0">
        <CardContent className="p-8 text-center">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h3 className="text-2xl font-bold mb-4">
            "El éxito es la suma de pequeños esfuerzos repetidos día tras día"
          </h3>
          <p className="text-white/90">
            ¡Sigue así! Estás en el camino correcto hacia tus metas académicas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}