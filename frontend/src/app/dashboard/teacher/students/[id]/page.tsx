// frontend/src/app/dashboard/teacher/students/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Mail, BookOpen, Users, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import classGuardAPI from '@/lib/analytics-api';

interface StudentDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
  groups: Array<{
    id: string;
    name: string;
    code: string;
    subject_name: string;
    schedule_day: string;
    schedule_time: string;
  }>;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    credits: number;
  }>;
  total_groups: number;
  total_subjects: number;
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudentDetail();
  }, [studentId]);

  const loadStudentDetail = async () => {
    try {
      setIsLoading(true);
      const data = await classGuardAPI.students.getEnrollmentInfo(studentId);
      setStudent(data);
    } catch (error) {
      console.error('Error loading student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-800">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-800">Estudiante no encontrado</p>
          <button
            onClick={() => router.push('/dashboard/teacher/students')}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/teacher/students')}
              className="p-3 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-3xl">
                  {student.first_name[0]}{student.last_name[0]}
                </span>
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {student.full_name}
                </h1>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">{student.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Asignaturas</p>
                <p className="text-4xl font-black text-blue-600">{student.total_subjects}</p>
              </div>
              <div className="p-4 bg-blue-100 rounded-2xl">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Grupos</p>
                <p className="text-4xl font-black text-purple-600">{student.total_groups}</p>
              </div>
              <div className="p-4 bg-purple-100 rounded-2xl">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Créditos</p>
                <p className="text-4xl font-black text-green-600">{student.subjects.reduce((sum, s) => sum + s.credits, 0)}</p>
              </div>
              <div className="p-4 bg-green-100 rounded-2xl">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Asignaturas Inscritas</CardTitle>
        </CardHeader>
        <CardContent>
          {student.subjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No está inscrito en ninguna asignatura</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-100"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{subject.name}</h3>
                      <p className="text-sm text-gray-600">{subject.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{subject.credits}</p>
                      <p className="text-xs text-gray-500">Créditos</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Grupos Activos</CardTitle>
        </CardHeader>
        <CardContent>
          {student.groups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No está matriculado en ningún grupo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {student.groups.map((group) => (
                <div
                  key={group.id}
                  className="p-5 bg-gradient-to-r from-white to-purple-50 rounded-2xl border-2 border-purple-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {group.subject_name}
                      </h3>
                      <p className="text-sm text-gray-600">Grupo {group.code} - {group.name}</p>
                      {group.schedule_day && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                          <Calendar className="w-4 h-4" />
                          <span>{group.schedule_day}</span>
                          {group.schedule_time && <span>• {group.schedule_time}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}