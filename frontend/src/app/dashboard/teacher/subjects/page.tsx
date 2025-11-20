//frontend/src/app/dashboard/teacher/subjects/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Users, BookOpen, ArrowLeft } from 'lucide-react';
import { sessionsAPI, subjectsAPI, groupsAPI, dashboardAPI, studentsAPI, alertsAPI } from '@/lib/analytics-api';

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits?: number;
  semester?: string;
  department?: string;
  total_groups: number;
  total_students: number;
}

interface Group {
  id: string;
  name: string;
  code: string;
  subject_id: string;
  subject_code: string;
  schedule_day?: string;
  schedule_time?: string;
  classroom?: string;
  student_count: number;
}

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [showEditSubject, setShowEditSubject] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);

  // Forms
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    description: '',
    credits: 0,
    semester: '',
    department: ''
  });

  const [editSubject, setEditSubject] = useState<Subject | null>(null);

  const [newGroup, setNewGroup] = useState({
    name: '',
    code: '',
    subject_id: '',
    schedule_day: '',
    schedule_time: '',
    classroom: '',
    max_students: 30
  });

  const [editGroup, setEditGroup] = useState<Group | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjectsData, groupsData] = await Promise.all([
        subjectsAPI.list(),
        groupsAPI.list()
      ]);
      setSubjects(subjectsData);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    try {
      await subjectsAPI.create(newSubject);
      setShowCreateSubject(false);
      setNewSubject({ name: '', code: '', description: '', credits: 0, semester: '', department: '' });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al crear asignatura');
    }
  };

  const handleUpdateSubject = async () => {
    if (!editSubject) return;
    try {
      await subjectsAPI.update(editSubject.id, editSubject);
      setShowEditSubject(false);
      setEditSubject(null);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al actualizar asignatura');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta asignatura?')) return;
    try {
      await subjectsAPI.delete(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al eliminar asignatura');
    }
  };

  const handleCreateGroup = async () => {
    try {
      await groupsAPI.create(newGroup);
      setShowCreateGroup(false);
      setNewGroup({ name: '', code: '', subject_id: '', schedule_day: '', schedule_time: '', classroom: '', max_students: 30 });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al crear grupo');
    }
  };

  const handleUpdateGroup = async () => {
    if (!editGroup) return;
    try {
      await groupsAPI.update(editGroup.id, {
        name: editGroup.name,
        code: editGroup.code,
        schedule_day: editGroup.schedule_day,
        schedule_time: editGroup.schedule_time,
        classroom: editGroup.classroom
      });
      setShowEditGroup(false);
      setEditGroup(null);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al actualizar grupo');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este grupo?')) return;
    try {
      await groupsAPI.delete(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al eliminar grupo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Asignaturas</h1>
        </div>
        <button
          onClick={() => setShowCreateSubject(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Asignatura
        </button>
      </div>

      {/* Subjects List */}
      <div className="space-y-6">
        {subjects.map((subject) => (
          <div key={subject.id} className="bg-white rounded-xl shadow p-6">
            {/* Subject Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{subject.name}</h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {subject.code}
                  </span>
                </div>
                {subject.description && (
                  <p className="text-gray-600">{subject.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditSubject(subject);
                    setShowEditSubject(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteSubject(subject.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subject Stats */}
            <div className="flex gap-4 mb-4 text-sm">
              {subject.credits && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 font-medium">{subject.credits} Créditos</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 font-medium">{subject.total_groups} Grupos</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 font-medium">{subject.total_students} Estudiantes</span>
              </div>
              {subject.semester && <span className="text-gray-600">📅 {subject.semester}</span>}
              {subject.department && <span className="text-gray-600">🏢 {subject.department}</span>}
            </div>

            {/* Groups */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Grupos</h3>
                <button
                  onClick={() => {
                    setNewGroup({ 
                      name: '', 
                      code: '', 
                      subject_id: subject.id,
                      schedule_day: '', 
                      schedule_time: '', 
                      classroom: '', 
                      max_students: 30 
                    });
                    setShowCreateGroup(true);
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Grupo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groups
                  .filter((g) => g.subject_id === subject.id)
                  .map((group) => (
                    <div
                      key={group.id}
                      className="p-4 border rounded-lg hover:shadow-md transition cursor-pointer"
                      onClick={() => router.push(`/dashboard/teacher/groups/${group.id}/students`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900">{group.name}</h4>
                          <p className="text-sm text-gray-600">
                            {group.subject_code} - {group.code}
                          </p>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditGroup(group);
                              setShowEditGroup(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {group.schedule_day && group.schedule_time && (
                          <div>📅 {group.schedule_day} {group.schedule_time}</div>
                        )}
                        {group.classroom && <div>🚪 {group.classroom}</div>}
                        <div className="mt-1 font-medium text-gray-700">
                          {group.student_count} estudiantes
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}

        {subjects.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-4">No tienes asignaturas creadas</p>
            <button
              onClick={() => setShowCreateSubject(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crear primera asignatura
            </button>
          </div>
        )}
      </div>

      {/* Modal: Create Subject */}
      {showCreateSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Nueva Asignatura</h2>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              
              <input
                type="text"
                placeholder="Código"
                value={newSubject.code}
                onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              
              <textarea
                placeholder="Descripción"
                value={newSubject.description}
                onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
                rows={3}
              />
              
              <input
                type="number"
                placeholder="Créditos"
                value={newSubject.credits}
                onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              
              <input
                type="text"
                placeholder="Semestre (ej. 2025-2)"
                value={newSubject.semester}
                onChange={(e) => setNewSubject({ ...newSubject, semester: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              
              <input
                type="text"
                placeholder="Departamento"
                value={newSubject.department}
                onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateSubject(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSubject}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Subject */}
      {showEditSubject && editSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Editar Asignatura</h2>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={editSubject.name}
                onChange={(e) => setEditSubject({ ...editSubject, name: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              
              <input
                type="text"
                placeholder="Código"
                value={editSubject.code}
                onChange={(e) => setEditSubject({ ...editSubject, code: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              
              <textarea
                placeholder="Descripción"
                value={editSubject.description || ''}
                onChange={(e) => setEditSubject({ ...editSubject, description: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
                rows={3}
              />
              
              <input
                type="number"
                placeholder="Créditos"
                value={editSubject.credits || 0}
                onChange={(e) => setEditSubject({ ...editSubject, credits: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              
              <input
                type="text"
                placeholder="Semestre"
                value={editSubject.semester || ''}
                onChange={(e) => setEditSubject({ ...editSubject, semester: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              
              <input
                type="text"
                placeholder="Departamento"
                value={editSubject.department || ''}
                onChange={(e) => setEditSubject({ ...editSubject, department: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditSubject(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateSubject}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Group */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Nuevo Grupo</h2>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del grupo"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              
              <input
                type="text"
                placeholder="Código del grupo"
                value={newGroup.code}
                onChange={(e) => setNewGroup({ ...newGroup, code: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              
              <select
                value={newGroup.schedule_day}
                onChange={(e) => setNewGroup({ ...newGroup, schedule_day: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900"
              >
                <option value="">Día de la semana</option>
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
              </select>
              
              <input
                type="time"
                value={newGroup.schedule_time}
                onChange={(e) => setNewGroup({ ...newGroup, schedule_time: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900"
              />
              
              <input
                type="text"
                placeholder="Salón"
                value={newGroup.classroom}
                onChange={(e) => setNewGroup({ ...newGroup, classroom: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              
              <input
                type="number"
                placeholder="Máximo de estudiantes"
                value={newGroup.max_students}
                onChange={(e) => setNewGroup({ ...newGroup, max_students: parseInt(e.target.value) || 30 })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGroup}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Group */}
      {showEditGroup && editGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Editar Grupo</h2>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del grupo"
                value={editGroup.name}
                onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              
              <input
                type="text"
                placeholder="Código del grupo"
                value={editGroup.code}
                onChange={(e) => setEditGroup({ ...editGroup, code: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              
              <select
                value={editGroup.schedule_day || ''}
                onChange={(e) => setEditGroup({ ...editGroup, schedule_day: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900"
              >
                <option value="">Día de la semana</option>
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
              </select>
              
              <input
                type="time"
                value={editGroup.schedule_time || ''}
                onChange={(e) => setEditGroup({ ...editGroup, schedule_time: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900"
              />
              
              <input
                type="text"
                placeholder="Salón"
                value={editGroup.classroom || ''}
                onChange={(e) => setEditGroup({ ...editGroup, classroom: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditGroup(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateGroup}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
