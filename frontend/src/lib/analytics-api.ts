// frontend/src/lib/analytics-api.ts
/**
 * API Client para Class Guard - Sistema de Análisis y Métricas
 * Integrado con el nuevo sistema de Asignaturas y Grupos
 */

import api from './api';

const API_BASE = '/api';

// ==================== SUBJECTS API ====================

export const subjectsAPI = {
  /**
   * Crear nueva asignatura
   */
  create: async (data: {
    name: string;
    code: string;
    description?: string;
    credits?: number;
    semester?: string;
    department?: string;
  }) => {
    const response = await api.post(`${API_BASE}/academic/subjects`, data);
    return response.data;
  },

  /**
   * Listar asignaturas
   */
  list: async (filters?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
    search?: string;
  }) => {
    const response = await api.get(`${API_BASE}/academic/subjects`, { params: filters });
    return response.data;
  },

  /**
   * Obtener detalles de una asignatura
   */
  get: async (subjectId: string) => {
    const response = await api.get(`${API_BASE}/academic/subjects/${subjectId}`);
    return response.data;
  },

  /**
   * Actualizar asignatura
   */
  update: async (subjectId: string, data: any) => {
    const response = await api.put(`${API_BASE}/academic/subjects/${subjectId}`, data);
    return response.data;
  },

  /**
   * Eliminar asignatura
   */
  delete: async (subjectId: string) => {
    const response = await api.delete(`${API_BASE}/academic/subjects/${subjectId}`);
    return response.data;
  },
};

// ==================== GROUPS API ====================

export const groupsAPI = {
  /**
   * Crear nuevo grupo
   */
  create: async (data: {
    name: string;
    code: string;
    subject_id: string;
    schedule_day?: string;
    schedule_time?: string;
    duration_minutes?: number;
    classroom?: string;
    max_students?: number;
  }) => {
    const response = await api.post(`${API_BASE}/academic/groups`, data);
    return response.data;
  },

  /**
   * Listar grupos
   */
  list: async (filters?: {
    subject_id?: string;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }) => {
    const response = await api.get(`${API_BASE}/academic/groups`, { params: filters });
    return response.data;
  },

  /**
   * Obtener detalles de un grupo con estudiantes
   */
  get: async (groupId: string) => {
    const response = await api.get(`${API_BASE}/academic/groups/${groupId}`);
    return response.data;
  },

  /**
   * Obtener estadísticas de un grupo
   */
  getStats: async (groupId: string) => {
    const response = await api.get(`${API_BASE}/academic/groups/${groupId}/stats`);
    return response.data;
  },

  /**
   * Matricular un estudiante en un grupo
   */
  enrollStudent: async (groupId: string, studentId: string) => {
    const response = await api.post(`${API_BASE}/academic/groups/${groupId}/enroll`, {
      group_id: groupId,
      student_id: studentId,
    });
    return response.data;
  },

  /**
   * Matricular múltiples estudiantes
   */
  enrollStudentsBulk: async (groupId: string, studentIds: string[]) => {
    const response = await api.post(`${API_BASE}/academic/groups/${groupId}/enroll-bulk`, {
      group_id: groupId,
      student_ids: studentIds,
    });
    return response.data;
  },

  /**
   * Desmatricular un estudiante
   */
  unenrollStudent: async (groupId: string, studentId: string) => {
    const response = await api.delete(
      `${API_BASE}/academic/groups/${groupId}/students/${studentId}`
    );
    return response.data;
  },
};

// ==================== SESSIONS API ====================

export const sessionsAPI = {
  /**
   * Iniciar una nueva sesión de clase
   */
  start: async (groupId: string, notes?: string) => {
    const response = await api.post(`${API_BASE}/sessions/start`, null, {
      params: { group_id: groupId, notes },
    });
    return response.data;
  },

  /**
   * Finalizar sesión activa
   */
  end: async (sessionId: string, notes?: string) => {
    const response = await api.post(`${API_BASE}/sessions/${sessionId}/end`, { notes });
    return response.data;
  },

  /**
   * Obtener sesión activa
   */
  getActive: async () => {
    const response = await api.get(`${API_BASE}/sessions/active`);
    return response.data;
  },

  /**
   * Unirse a una sesión (estudiantes)
   */
  join: async (sessionId: string) => {
    const response = await api.post(`${API_BASE}/sessions/${sessionId}/join`);
    return response.data;
  },

  /**
   * Obtener detalles de una sesión
   */
  get: async (sessionId: string) => {
    const response = await api.get(`${API_BASE}/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Historial de sesiones del profesor
   */
  getTeacherHistory: async (filters?: {
    subject_id?: string;
    group_id?: string;
    days?: number;
    skip?: number;
    limit?: number;
  }) => {
    const response = await api.get(`${API_BASE}/sessions/history/teacher`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Historial de sesiones del estudiante
   */
  getStudentHistory: async (filters?: {
    subject_id?: string;
    days?: number;
    skip?: number;
    limit?: number;
  }) => {
    const response = await api.get(`${API_BASE}/sessions/history/student`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Estadísticas de sesiones por asignatura
   */
  getSubjectStats: async (subjectId: string, days: number = 30) => {
    const response = await api.get(`${API_BASE}/sessions/stats/subject/${subjectId}`, {
      params: { days },
    });
    return response.data;
  },
};

// ==================== ANALYTICS API (Mantener existente) ====================

export const analyticsAPI = {
  /**
   * Obtener estadísticas generales del estudiante
   */
  getStudentStats: async () => {
    const response = await api.get(`${API_BASE}/metrics/student/stats`);
    return response.data;
  },

  /**
   * Obtener historial de atención del estudiante
   */
  getStudentHistory: async (limit: number = 10, offset: number = 0) => {
    const response = await api.get(`${API_BASE}/metrics/student/history`, {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Obtener línea de tiempo de atención
   */
  getAttentionTimeline: async (days: number = 7) => {
    const response = await api.get(`${API_BASE}/metrics/student/attention-timeline`, {
      params: { days },
    });
    return response.data;
  },

  /**
   * Obtener métricas de sesión actual del estudiante
   */
  getCurrentSessionMetrics: async (sessionId: string) => {
    const response = await api.get(`${API_BASE}/metrics/student/current-session`, {
      params: { session_id: sessionId },
    });
    return response.data;
  },

  /**
   * Obtener resumen de sesión para el profesor
   */
  getSessionOverview: async (sessionId: string) => {
    const response = await api.get(`${API_BASE}/metrics/teacher/session/${sessionId}/overview`);
    return response.data;
  },
};

// ==================== DASHBOARD API ====================

export const dashboardAPI = {
  /**
   * Obtener estadísticas del dashboard del profesor
   */
  getTeacherStats: async () => {
    const response = await api.get(`${API_BASE}/academic/dashboard/teacher/stats`);
    return response.data;
  },

  /**
   * Obtener estadísticas del dashboard del estudiante
   */
  getStudentStats: async () => {
    const response = await api.get(`${API_BASE}/metrics/student/stats`);
    return response.data;
  },
};

// ==================== ALERTS API ====================

export const alertsAPI = {
  /**
   * Obtener alertas de una sesión
   */
  getSessionAlerts: async (sessionId: string) => {
    const response = await api.get(`${API_BASE}/alerts/session/${sessionId}`);
    return response.data;
  },

  /**
   * Marcar alerta como leída
   */
  acknowledge: async (alertId: string) => {
    const response = await api.put(`${API_BASE}/alerts/${alertId}/acknowledge`);
    return response.data;
  },

  /**
   * Obtener todas las alertas del profesor
   */
  getTeacherAlerts: async (filters?: {
    is_acknowledged?: boolean;
    priority?: string;
    days?: number;
  }) => {
    const response = await api.get(`${API_BASE}/alerts/teacher`, { params: filters });
    return response.data;
  },
};

// ==================== STUDENTS API ====================

export const studentsAPI = {
  /**
   * Listar todos los estudiantes
   */
  list: async (filters?: {
    search?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await api.get(`${API_BASE}/students`, { params: filters });
    return response.data;
  },

  /**
   * Obtener información de matrícula de un estudiante
   */
  getEnrollmentInfo: async (studentId: string) => {
    const response = await api.get(`${API_BASE}/students/${studentId}/enrollment`);
    return response.data;
  },
};

// Exportar todo junto
export default {
  subjects: subjectsAPI,
  groups: groupsAPI,
  sessions: sessionsAPI,
  analytics: analyticsAPI,
  dashboard: dashboardAPI,
  alerts: alertsAPI,
  students: studentsAPI,
};