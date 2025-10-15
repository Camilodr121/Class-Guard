// frontend/src/app/dashboard/teacher/subjects/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, BookOpen, Users, Edit, Trash2, X, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import classGuardAPI from '@/lib/analytics-api';

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  semester?: string;
  department?: string;
  total_groups: number;
  total_students: number;
  is_active: boolean;
}

export default function SubjectsManagementPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: 3,
    semester: '',
    department: ''
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [searchTerm, subjects]);

  const loadSubjects = async () => {
    try {
      setIsLoading(true);
      const data = await classGuardAPI.subjects.list({ limit: 100 });
      setSubjects(data);
      setFilteredSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSubjects = () => {
    if (!searchTerm.trim()) {
      setFilteredSubjects(subjects);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = subjects.filter(subject => 
      subject.name.toLowerCase().includes(term) ||
      subject.code.toLowerCase().includes(term) ||
      subject.department?.toLowerCase().includes(term)
    );
    setFilteredSubjects(filtered);
  };

  const handleOpenCreateModal = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      credits: 3,
      semester: '',
      department: ''
    });
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      credits: subject.credits,
      semester: subject.semester || '',
      department: subject.department || ''
    });
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingSubject(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSubject) {
        // Update
        await classGuardAPI.subjects.update(editingSubject.id, formData);
        alert('Asignatura actualizada exitosamente');
      } else {
        // Create
        await classGuardAPI.subjects.create(formData);
        alert('Asignatura creada exitosamente');
      }
      
      handleCloseModal();
      loadSubjects();
    } catch (error: any) {
      console.error('Error saving subject:', error);
      alert(error.response?.data?.detail || 'Error al guardar la asignatura');
    }
  };

  const handleDelete = async (subjectId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta asignatura?')) return;
    
    try {
      await classGuardAPI.subjects.delete(subjectId);
      alert('Asignatura eliminada exitosamente');
      loadSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Error al eliminar la asignatura');
    }
  };

  const handleViewDetails = (subjectId: string) => {
    router.push(`/dashboard/teacher/subjects/${subjectId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-800">Cargando asignaturas...</p>
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
                Gestión de Asignaturas
              </h1>
              <p className="text-gray-600 font-medium">
                {filteredSubjects.length} asignaturas activas
              </p>
            </div>
          </div>
          
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nueva Asignatura
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none focus:bg-white transition-all text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              {searchTerm ? 'No se encontraron asignaturas' : 'No hay asignaturas creadas'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
              >
                Crear Primera Asignatura
              </button>
            )}
          </div>
        ) : (
          filteredSubjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-2xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleViewDetails(subject.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{subject.name}</h3>
                        <p className="text-sm text-gray-600">{subject.code}</p>
                      </div>
                    </div>
                    
                    {subject.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {subject.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(subject)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(subject.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Créditos</p>
                    <p className="text-xl font-bold text-blue-600">{subject.credits}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Grupos</p>
                    <p className="text-xl font-bold text-purple-600">{subject.total_groups}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Estudiantes</p>
                    <p className="text-xl font-bold text-green-600">{subject.total_students}</p>
                  </div>
                </div>

                {(subject.semester || subject.department) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {subject.semester && (
                      <p className="text-xs text-gray-600">📅 {subject.semester}</p>
                    )}
                    {subject.department && (
                      <p className="text-xs text-gray-600">🏢 {subject.department}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSubject ? 'Editar Asignatura' : 'Nueva Asignatura'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="Matemáticas Avanzadas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="MAT-401"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Descripción de la asignatura..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Créditos *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="10"
                    value={formData.credits}
                    onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Semestre
                  </label>
                  <input
                    type="text"
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="2024-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="Matemáticas"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                >
                  {editingSubject ? 'Actualizar' : 'Crear'} Asignatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}