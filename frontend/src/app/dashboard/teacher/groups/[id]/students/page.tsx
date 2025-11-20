'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import analyticsApi from '@/lib/analytics-api';

interface Student {
  id: string;
  student_code: string;
  full_name: string;
  email: string;
  enrollment_date?: string;
}

interface Group {
  id: string;
  name: string;
  code: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  max_students: number;
  schedule_day?: string;
  schedule_time?: string;
  student_count: number;
  students: Student[];
}

export default function GroupStudentsManagement() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Cargando grupo ID:', groupId);
      
      // Obtener información del grupo
      const groupData = await analyticsApi.groups.get(groupId);
      console.log('✅ Grupo cargado:', groupData);
      setGroup(groupData);
      setEnrolledStudents(groupData.students || []);

      // Obtener lista de todos los estudiantes
      console.log('🔄 Cargando estudiantes...');
      const allStudentsResponse = await analyticsApi.students.list();
      console.log('📦 Respuesta de estudiantes:', allStudentsResponse);
      console.log('📦 Tipo de respuesta:', typeof allStudentsResponse);
      console.log('📦 Es array?:', Array.isArray(allStudentsResponse));
      
      // ✅ FIX: Manejar diferentes formatos de respuesta
      let allStudents: Student[] = [];
      
      if (Array.isArray(allStudentsResponse)) {
        allStudents = allStudentsResponse;
      } else if (allStudentsResponse && typeof allStudentsResponse === 'object') {
        // Si la respuesta es un objeto con una propiedad "data" o "students"
        allStudents = allStudentsResponse.data || allStudentsResponse.students || [];
      }
      
      console.log('✅ Estudiantes procesados:', allStudents);
      console.log('✅ Total estudiantes:', allStudents.length);
      
      // Filtrar estudiantes que NO están en el grupo
      const enrolledIds = new Set((groupData.students || []).map((s: Student) => s.id));
      const available = allStudents.filter((s: Student) => !enrolledIds.has(s.id));
      console.log('✅ Estudiantes disponibles:', available.length);
      console.log('✅ Estudiantes matriculados:', enrolledIds.size);
      
      setAvailableStudents(available);
    } catch (error) {
      console.error('❌ Error al cargar datos del grupo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredAvailableStudents.length) {
      setSelectedStudents(new Set());
    } else {
      const allIds = new Set(filteredAvailableStudents.map(s => s.id));
      setSelectedStudents(allIds);
    }
  };

  const handleEnrollSelected = async () => {
    if (selectedStudents.size === 0 || !group) return;

    const availableCapacity = group.max_students - enrolledStudents.length;
    if (selectedStudents.size > availableCapacity) {
      alert(`⚠️ Solo hay ${availableCapacity} cupo(s) disponible(s).`);
      return;
    }

    try {
      setEnrolling(true);

      for (const studentId of selectedStudents) {
        await analyticsApi.groups.enrollStudent(groupId, studentId);
      }

      await loadGroupData();
      setSelectedStudents(new Set());
      alert(`✅ ${selectedStudents.size} estudiante(s) matriculado(s) exitosamente.`);
    } catch (error) {
      console.error('Error al matricular estudiantes:', error);
      alert('❌ Error al matricular estudiantes. Por favor, intenta de nuevo.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    if (!confirm('¿Estás seguro de desmatricular este estudiante?')) return;

    try {
      await analyticsApi.groups.unenrollStudent(groupId, studentId);
      await loadGroupData();
      alert('✅ Estudiante desmatriculado exitosamente.');
    } catch (error) {
      console.error('Error al desmatricular estudiante:', error);
      alert('❌ Error al desmatricular estudiante.');
    }
  };

  const filteredAvailableStudents = availableStudents.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const occupancyPercentage = group ? Math.round((enrolledStudents.length / group.max_students) * 100) : 0;
  const isNearCapacity = occupancyPercentage >= 80;
  const isFull = enrolledStudents.length >= (group?.max_students || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative inline-flex">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-lg font-semibold text-gray-800 animate-pulse">Cargando grupo...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Grupo no encontrado</h2>
          <p className="text-gray-600 mb-8">El grupo que buscas no existe o fue eliminado</p>
          <button
            onClick={() => router.push('/dashboard/teacher/groups')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Volver a grupos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/teacher/groups')}
            className="group inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold mb-6 transition-all"
          >
            <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a grupos
          </button>

          {/* Card de información del grupo - SIN NEGRO */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full opacity-10 transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full opacity-10 transform -translate-x-24 translate-y-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center bg-white bg-opacity-25 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                    <span className="text-sm font-bold text-white">{group.subject_code}</span>
                  </div>
                  <h1 className="text-4xl font-bold mb-3 drop-shadow-lg">{group.name}</h1>
                  <div className="flex items-center gap-4 text-white/90">
                    <span className="flex items-center font-medium">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      Grupo {group.code}
                    </span>
                    {group.schedule_day && group.schedule_time && (
                      <span className="flex items-center font-medium">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {group.schedule_day} {group.schedule_time}
                      </span>
                    )}
                  </div>
                </div>

                {/* Indicador de capacidad circular */}
                <div className="relative w-32 h-32">
                  <svg className="transform -rotate-90" width="128" height="128">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8"/>
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="56" 
                      fill="none" 
                      stroke="white" 
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - occupancyPercentage / 100)}`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold drop-shadow">{enrolledStudents.length}</span>
                    <span className="text-sm opacity-90">de {group.max_students}</span>
                  </div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold">Ocupación del grupo</span>
                  <span className="font-bold text-lg">{occupancyPercentage}%</span>
                </div>
                <div className="h-3 bg-white bg-opacity-25 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-red-300' : isNearCapacity ? 'bg-yellow-300' : 'bg-green-300'
                    }`}
                    style={{ width: `${occupancyPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estudiantes Matriculados */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-100 p-6 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Matriculados</h2>
                  <p className="text-sm font-medium text-gray-600">{enrolledStudents.length} estudiantes</p>
                </div>
              </div>
            </div>

            {enrolledStudents.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-semibold mb-2">Sin estudiantes</p>
                <p className="text-sm text-gray-500">Aún no hay estudiantes matriculados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {enrolledStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className="group relative bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 border-2 border-green-200 hover:border-green-400 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg">
                          {(student.full_name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{student.full_name || 'Sin nombre'}</p>
                          <p className="text-sm font-medium text-gray-700">{student.email || 'Sin email'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnenrollStudent(student.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 p-2.5 text-red-600 hover:bg-red-100 rounded-lg font-medium"
                        title="Desmatricular"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matricular Estudiantes */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-100 p-6 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Matricular</h2>
                  <p className="text-sm font-medium text-gray-600">
                    {selectedStudents.size > 0 ? `${selectedStudents.size} seleccionado(s)` : 'Selecciona estudiantes'}
                  </p>
                </div>
              </div>

              {selectedStudents.size > 0 && !isFull && (
                <button
                  onClick={handleEnrollSelected}
                  disabled={enrolling}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center"
                >
                  {enrolling ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Matriculando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Matricular {selectedStudents.size}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* ✅ Barra de búsqueda con TEXTO OSCURO VISIBLE */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre, email o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all bg-purple-50/50 focus:bg-white text-gray-900 font-medium placeholder-gray-600"
                style={{ color: '#111827' }}
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Información de cupo */}
            {!isFull && (
              <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl border-2 border-blue-300">
                <span className="text-sm font-bold text-gray-800">Cupo disponible:</span>
                <span className="text-2xl font-bold text-purple-700">{group.max_students - enrolledStudents.length}</span>
              </div>
            )}

            {isFull ? (
              <div className="text-center py-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl border-2 border-orange-300">
                <div className="w-20 h-20 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-orange-900 mb-1">Grupo completo</p>
                <p className="text-sm font-medium text-orange-800">No hay cupos disponibles</p>
              </div>
            ) : filteredAvailableStudents.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-semibold mb-1">
                  {searchTerm ? 'Sin resultados' : 'Todos matriculados'}
                </p>
                <p className="text-sm text-gray-500">
                  {searchTerm ? 'Intenta con otro término' : 'Todos los estudiantes ya están matriculados'}
                </p>
                {/* DEBUG INFO */}
                <p className="text-xs text-gray-400 mt-4">Total disponibles: {availableStudents.length}</p>
              </div>
            ) : (
              <>
                {/* Botón seleccionar todos */}
                <button
                  onClick={handleSelectAll}
                  className="w-full mb-3 py-2.5 text-sm font-bold text-purple-700 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors border-2 border-purple-200"
                >
                  {selectedStudents.size === filteredAvailableStudents.length ? '❌ Deseleccionar todos' : '✅ Seleccionar todos'}
                </button>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredAvailableStudents.map((student, index) => (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student.id)}
                      className={`group cursor-pointer rounded-xl p-4 transition-all duration-300 border-2 ${
                        selectedStudents.has(student.id)
                          ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-purple-500 shadow-lg scale-105'
                          : 'bg-blue-50/50 border-blue-200 hover:border-purple-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={() => {}}
                          className="w-5 h-5 text-purple-600 rounded-lg focus:ring-purple-500 border-purple-300 mr-4"
                        />
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3 shadow-lg">
                          {(student.full_name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{student.full_name || 'Sin nombre'}</p>
                          <p className="text-sm font-medium text-gray-700">{student.email || 'Sin email'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Estilos para scrollbar personalizado */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a78bfa, #ec4899);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
