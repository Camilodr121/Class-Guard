'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, User, Mail, BookOpen, Activity, 
  TrendingUp, Clock, Eye, AlertCircle, Calendar 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { sessionsAPI, subjectsAPI, groupsAPI, dashboardAPI, studentsAPI, alertsAPI } from '@/lib/analytics-api';

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  groups: Group[];
  subjects: Subject[];
}

interface Group {
  id: string;
  name: string;
  code: string;
  subject_name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface SessionHistory {
  id: string;
  session_id: string;
  subject_name: string;
  group_name: string;
  date: string;
  duration_minutes: number;
  average_attention_score: number;
  blinks: number;
  yawns: number;
  was_attentive: boolean;
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar información del estudiante
      const enrollmentInfo = await studentsAPI.getEnrollmentInfo(studentId);
      setStudent(enrollmentInfo);
      
      // Cargar historial de sesiones (esto requeriría un nuevo endpoint)
      // Por ahora simulamos con datos vacíos
      // En producción: const history = await classGuardAPI.analytics.getStudentSessionHistory(studentId);
      setSessionHistory([]);
      
    } catch (error) {
      console.error('Error loading student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAttentionColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAttentionLabel = (score: number) => {
    if (score >= 70) return 'Alta';
    if (score >= 50) return 'Media';
    return 'Baja';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-800">Cargando estudiante...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-800">Estudiante no encontrado</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Calcular estadísticas del historial
  const totalSessions = sessionHistory.length;
  const avgAttention = totalSessions > 0 
    ? sessionHistory.reduce((sum, s) => sum + s.average_attention_score, 0) / totalSessions 
    : 0;
  const totalHours = totalSessions > 0
    ? sessionHistory.reduce((sum, s) => sum + s.duration_minutes, 0) / 60
    : 0;
  const attentiveSessions = sessionHistory.filter(s => s.was_attentive).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {student.name}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="font-medium">{student.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-medium">ID: {student.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Grupos Inscritos</p>
            <p className="text-4xl font-black text-blue-600">{student.groups.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Sesiones Asistidas</p>
            <p className="text-4xl font-black text-purple-600">{totalSessions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Atención Promedio</p>
            <p className="text-4xl font-black text-green-600">
              {totalSessions > 0 ? Math.round(avgAttention) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Horas Totales</p>
            <p className="text-4xl font-black text-orange-600">
              {totalHours.toFixed(1)}h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Asignaturas</CardTitle>
            <CardDescription>Materias en las que está inscrito</CardDescription>
          </CardHeader>
          <CardContent>
            {student.subjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No está inscrito en ninguna asignatura</p>
              </div>
            ) : (
              <div className="space-y-3">
                {student.subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100"
                  >
                    <h3 className="font-bold text-gray-900">{subject.name}</h3>
                    <p className="text-sm text-gray-600">{subject.code}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Grupos</CardTitle>
            <CardDescription>Grupos activos del estudiante</CardDescription>
          </CardHeader>
          <CardContent>
            {student.groups.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No está inscrito en ningún grupo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {student.groups.map((group) => (
                  <div
                    key={group.id}
                    className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100"
                  >
                    <h3 className="font-bold text-gray-900">
                      {group.subject_name} - Grupo {group.code}
                    </h3>
                    <p className="text-sm text-gray-600">{group.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Historial de Sesiones</CardTitle>
          <CardDescription>Últimas clases asistidas</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionHistory.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No hay historial de sesiones</p>
              <p className="text-sm text-gray-400 mt-2">
                El historial aparecerá cuando el estudiante asista a clases
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessionHistory.map((session) => (
                <div
                  key={session.id}
                  className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {session.subject_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {session.group_name} - {new Date(session.date).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {session.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {session.blinks} pestañeos
                        </span>
                        <span>😴 {session.yawns} bostezos</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl mb-2 ${getAttentionColor(session.average_attention_score)}`}>
                        {Math.round(session.average_attention_score)}
                      </div>
                      <p className="text-xs text-gray-600">
                        {getAttentionLabel(session.average_attention_score)}
                      </p>
                    </div>
                  </div>

                  {session.was_attentive ? (
                    <div className="mt-3 pt-3 border-t border-gray-300 flex items-center gap-2 text-green-600">
                      <Activity className="w-4 h-4" />
                      <span className="text-sm font-semibold">Estuvo atento</span>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-gray-300 flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-semibold">Necesita mejorar atención</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      {totalSessions > 0 && (
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <h3 className="text-2xl font-bold mb-4">Resumen de Desempeño</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-indigo-100 text-sm mb-1">Sesiones Atentas</p>
                <p className="text-4xl font-black">
                  {attentiveSessions} / {totalSessions}
                </p>
                <p className="text-indigo-100 text-sm mt-1">
                  {totalSessions > 0 ? Math.round((attentiveSessions / totalSessions) * 100) : 0}% de efectividad
                </p>
              </div>
              <div>
                <p className="text-indigo-100 text-sm mb-1">Promedio Global</p>
                <p className="text-4xl font-black">{Math.round(avgAttention)}%</p>
                <p className="text-indigo-100 text-sm mt-1">
                  {avgAttention >= 70 ? 'Excelente' : avgAttention >= 50 ? 'Bueno' : 'Necesita mejorar'}
                </p>
              </div>
              <div>
                <p className="text-indigo-100 text-sm mb-1">Tiempo Dedicado</p>
                <p className="text-4xl font-black">{totalHours.toFixed(1)}</p>
                <p className="text-indigo-100 text-sm mt-1">horas de clase</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}