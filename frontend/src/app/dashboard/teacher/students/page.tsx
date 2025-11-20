// frontend/src/app/dashboard/teacher/students/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, UserPlus, Users, Mail, BookOpen, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { sessionsAPI, subjectsAPI, groupsAPI, dashboardAPI, studentsAPI, alertsAPI } from '@/lib/analytics-api';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
  enrolled_groups: number;
}

export default function TeacherStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, students]);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const response = await studentsAPI.list({ limit: 100 });
      setStudents(response.students || []);
      setFilteredStudents(response.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = students.filter(student => 
      student.full_name.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      student.first_name.toLowerCase().includes(term) ||
      student.last_name.toLowerCase().includes(term)
    );
    setFilteredStudents(filtered);
  };

  const handleViewStudent = (studentId: string) => {
    router.push(`/dashboard/teacher/students/${studentId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-800">Cargando estudiantes...</p>
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
              onClick={() => router.push('/dashboard/teacher')}
              className="p-3 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Gestión de Estudiantes
              </h1>
              <p className="text-gray-600 font-medium">
                {filteredStudents.length} estudiantes registrados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none focus:bg-white transition-all text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Lista de Estudiantes</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes registrados'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleViewStudent(student.id)}
                  className="p-5 bg-gradient-to-r from-white to-blue-50 rounded-2xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {student.first_name[0]}{student.last_name[0]}
                        </span>
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {student.full_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{student.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Groups Count */}
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-blue-600 font-semibold">
                        <BookOpen className="w-5 h-5" />
                        <span>{student.enrolled_groups}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Grupos</p>
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