// frontend/src/app/dashboard/teacher/subjects/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Users, Edit, Trash2, X, Calendar, Clock, UserPlus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import classGuardAPI from '@/lib/analytics-api';

interface Group {
  id: string;
  name: string;
  code: string;
  schedule_day: string;
  schedule_time: string;
  duration_minutes: number;
  classroom: string;
  max_students: number;
  current_students_count: number;
  is_full: boolean;
}

export default function SubjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<any>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [groupForm, setGroupForm] = useState({
    name: '',
    code: '',
    schedule_day: '',
    schedule_time: '',
    duration_minutes: 90,
    classroom: '',
    max_students: 30
  });

  useEffect(() => {
    loadSubjectDetail();
    loadGroups();
  }, [subjectId]);

  const loadSubjectDetail = async () => {
    try {
      setIsLoading(true);
      const data = await classGuardAPI.subjects.get(subjectId);
      setSubject(data);
    } catch (error) {
      console.error('Error loading subject:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await classGuardAPI.groups.list({ subject_id: subjectId });
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleOpenGroupModal = () => {
    setEditingGroup(null);
    setGroupForm({
      name: '',
      code: '',
      schedule_day: '',
      schedule_time: '',
      duration_minutes: 90,
      classroom: '',
      max_students: 30
    });
    setShowGroupModal(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      code: group.code,
      schedule_day: group.schedule_day || '',
      schedule_time: group.schedule_time || '',
      duration_minutes: group.duration_minutes,
      classroom: group.classroom || '',
      max_students: group.max_students
    });
    setShowGroupModal(true);
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...groupForm,
        subject_id: subjectId
      };

      if (editingGroup) {
        // Update logic (no tenemos endpoint aún, pero lo dejaremos preparado)
        alert('Funcionalidad de edición pendiente');
      } else {
        await classGuardAPI.groups.create(data);
        alert('Grupo creado exitosamente');
      }

      setShowGroupModal(false);
      loadGroups();
      loadSubjectDetail();
    } catch (error: any) {
      console.error('Error saving group:', error);
      alert(error.response?.data?.detail || 'Error al guardar el grupo');
    }
  };

  const handleManageStudents = (groupId: string) => {
    router.push(`/dashboard/teacher/groups/${groupId}/students`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-800">Cargando asignatura...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <p className="text-xl font-bold text-gray-800">Asignatura no encontrada</p>
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
              onClick={() => router.push('/dashboard/teacher/subjects')}
              className="p-3 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {subject.name}
              </h1>
              <p className="text-gray-600 font-medium">{subject.code}</p>
            </div>
          </div>

          <button
            onClick={handleOpenGroupModal}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nuevo Grupo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Grupos</p>
            <p className="text-4xl font-black text-purple-600">{subject.total_groups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Estudiantes</p>
            <p className="text-4xl font-black text-green-600">{subject.total_students}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Créditos</p>
            <p className="text-4xl font-black text-blue-600">{subject.credits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Sesiones</p>
            <p className="text-4xl font-black text-orange-600">{subject.total_sessions || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Grupos de la Asignatura</CardTitle>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium mb-4">No hay grupos creados</p>
              <button
                onClick={handleOpenGroupModal}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold"
              >
                Crear Primer Grupo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-100 hover:border-purple-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {group.name} - Grupo {group.code}
                      </h3>
                      {group.classroom && (
                        <p className="text-sm text-gray-600">🏫 {group.classroom}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="p-2 hover:bg-purple-100 rounded-lg"
                      >
                        <Edit className="w-4 h-4 text-purple-600" />
                      </button>
                    </div>
                  </div>

                  {(group.schedule_day || group.schedule_time) && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      {group.schedule_day && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{group.schedule_day}</span>
                        </div>
                      )}
                      {group.schedule_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{group.schedule_time}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-purple-200">
                    <div>
                      <p className="text-sm text-gray-600">Estudiantes</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {group.current_students_count} / {group.max_students}
                      </p>
                      {group.is_full && (
                        <span className="text-xs text-red-600 font-semibold">Grupo lleno</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleManageStudents(group.id)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Gestionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'}
              </h2>
              <button
                onClick={() => setShowGroupModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitGroup} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del Grupo *
                  </label>
                  <input
                    type="text"
                    required
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="Grupo de mañana"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={groupForm.code}
                    onChange={(e) => setGroupForm({...groupForm, code: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="A, B, 101..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Día de la semana
                  </label>
                  <select
                    value={groupForm.schedule_day}
                    onChange={(e) => setGroupForm({...groupForm, schedule_day: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                    <option value="Sábado">Sábado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={groupForm.schedule_time}
                    onChange={(e) => setGroupForm({...groupForm, schedule_time: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={groupForm.duration_minutes}
                    onChange={(e) => setGroupForm({...groupForm, duration_minutes: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Aula/Salón
                  </label>
                  <input
                    type="text"
                    value={groupForm.classroom}
                    onChange={(e) => setGroupForm({...groupForm, classroom: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="A-201"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cupo máximo
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={groupForm.max_students}
                    onChange={(e) => setGroupForm({...groupForm, max_students: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                >
                  {editingGroup ? 'Actualizar' : 'Crear'} Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}