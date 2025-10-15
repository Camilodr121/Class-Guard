// frontend/src/app/dashboard/teacher/groups/[id]/students/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, UserPlus, X, Search, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import classGuardAPI from '@/lib/analytics-api';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
  enrolled_groups: number;
}

interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  enrolled_at: string;
}

export default function GroupStudentsManagement() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<any>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGroupData();
    loadAvailableStudents();
  }, [groupId]);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, availableStudents]);

  const loadGroupData = async () => {
    try {
      setIsLoading(true);
      const data = await classGuardAPI.groups.get(groupId);
      setGroup(data);
      setEnrolledStudents(data.students || []);
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      const response = await classGuardAPI.students.list({ limit: 100 });
      setAvailableStudents(response.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const filterStudents = () => {
    // Filtrar estudiantes que NO están matriculados
    const enrolledIds = new Set(enrolledStudents.map(s => s.id));
    let filtered = availableStudents.filter(s => !enrolledIds.has(s.id));

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.full_name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleToggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleEnrollSelected = async () => {
    if (selectedStudents.size === 0) {
      alert('Selecciona al menos un estudiante');
      return;
    }

    try {
      await classGuardAPI.groups.enrollStudentsBulk(groupId, Array.from(selectedStudents));
      alert(`${selectedStudents.size} estudiante(s) matriculado(s) exitosamente`);
      setShowAddModal(false);
      setSelectedStudents(new Set());
      loadGroupData();
      loadAvailableStudents();
    } catch (error: any) {
      console.error('Error enrolling students:', error);
      alert(error.response?.data?.detail || 'Error al matricular estudiantes');
    }
  };

  const handleUnenroll = async (studentId: string) => {
    if (!confirm('¿Estás seguro de desmatricular este estudiante?')) return;

    try {
      await classGuardAPI.groups.unenrollStudent(groupId, studentId);
      alert('Estudiante desmatriculado exitosamente');
      loadGroupData();
      loadAvailableStudents();
    } catch (error) {
      console.error('Error unenrolling student:', error);
      alert('Error al desmatricular estudiante');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-800">Cargando grupo...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <p className="text-xl font-bold text-gray-800">Grupo no encontrado</p>
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
              onClick={() => router.back()}
              className="p-3 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {group.subject_name}
              </h1>
              <p className="text-gray-600 font-medium">
                {group.subject_code} - Grupo {group.code} • {enrolledStudents.length} / {group.max_students} estudiantes
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={group.is_full}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-5 h-5" />
            Agregar Estudiantes
          </button>
        </div>
      </div>

      {/* Enrolled Students */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Estudiantes Matriculados</CardTitle>
        </CardHeader>
        <CardContent>
          {enrolledStudents.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium mb-4">No hay estudiantes matriculados</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold"
              >
                Agregar Primeros Estudiantes
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-green-50 rounded-2xl border-2 border-green-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnenroll(student.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Students Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Agregar Estudiantes</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedStudents.size} seleccionado(s) • Cupo disponible: {group.max_students - enrolledStudents.length}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedStudents(new Set());
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar estudiantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Students List */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {searchTerm ? 'No se encontraron estudiantes' : 'Todos los estudiantes ya están matriculados'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleToggleStudent(student.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedStudents.has(student.id)
                          ? 'bg-green-50 border-green-500'
                          : 'bg-white border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            selectedStudents.has(student.id)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{student.full_name}</p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={() => {}}
                          className="w-5 h-5 text-green-600 rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedStudents(new Set());
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnrollSelected}
                disabled={selectedStudents.size === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50"
              >
                Matricular {selectedStudents.size > 0 && `(${selectedStudents.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}