//frontend/src/app/dashboard/students/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Users, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { sessionsAPI, subjectsAPI, groupsAPI, dashboardAPI, studentsAPI, alertsAPI } from '@/lib/analytics-api';

interface Student {
  id: string;
  name: string;
  email: string;
  groups: any[];
  subjects: any[];
  sessions?: any[];
  total_sessions?: number;
  average_attention?: number;
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgAttention, setAvgAttention] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [attentiveSessions, setAttentiveSessions] = useState(0);

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const data = await studentsAPI.getEnrollmentInfo(studentId);
      setStudent(data);
      
      // Calcular totales solo si hay sesiones
      if (data.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
        const totals = data.sessions.reduce((acc: any, session: any) => {
          const sessionScore = session.average_attention_score || 0;
          const sessionDuration = session.duration_minutes || 0;
          
          return {
            count: acc.count + 1,
            attention: acc.attention + sessionScore,
            hours: acc.hours + (sessionDuration / 60),
            attentive: acc.attentive + (sessionScore >= 70 ? 1 : 0)
          };
        }, { count: 0, attention: 0, hours: 0, attentive: 0 });

        setTotalSessions(totals.count);
        setAvgAttention(totals.count > 0 ? totals.attention / totals.count : 0);
        setTotalHours(totals.hours);
        setAttentiveSessions(totals.attentive);
      } else {
        // Si no hay sesiones, dejar todo en 0
        setTotalSessions(0);
        setAvgAttention(0);
        setTotalHours(0);
        setAttentiveSessions(0);
      }
    } catch (error: any) {
      console.error('Error loading student:', error);
      
      // Si es error 403, mostrar mensaje y volver atrás
      if (error.response?.status === 403) {
        alert('No tienes permiso para ver este estudiante');
        router.back();
      } else {
        // Otros errores
        alert('Error al cargar información del estudiante');
      }
    } finally {
      setLoading(false);
    }
  };

  const getAttentionLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 70) return 'Muy Bueno';
    if (score >= 60) return 'Bueno';
    if (score >= 50) return 'Regular';
    return 'Bajo';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estudiante...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">Estudiante no encontrado</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
          <p className="text-gray-600">{student.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Grupos Inscritos</p>
              <p className="text-2xl font-bold">{student.groups.length}</p>
            </div>
            <Users className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sesiones Asistidas</p>
              <p className="text-2xl font-bold">{totalSessions}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Atención Promedio</p>
              <p className="text-2xl font-bold">
                {totalSessions > 0 ? Math.round(avgAttention) : 0}%
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Horas Totales</p>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
            </div>
            <BookOpen className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Asignaturas</h2>
        {student.subjects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No está inscrito en ninguna asignatura</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {student.subjects.map((subject: any) => (
              <div key={subject.id} className="p-4 border rounded-lg">
                <h3 className="font-bold">{subject.name}</h3>
                <p className="text-sm text-gray-600">{subject.code}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Groups */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Grupos</h2>
        {student.groups.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No está inscrito en ningún grupo</p>
        ) : (
          <div className="space-y-3">
            {student.groups.map((group: any) => (
              <div key={group.id} className="p-4 border rounded-lg">
                <h3 className="font-bold">{group.name}</h3>
                <p className="text-sm text-gray-600">
                  {group.subject_name} - {group.code}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
