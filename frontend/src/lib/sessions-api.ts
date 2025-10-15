// frontend/src/lib/sessions-api.ts
import api from './api';

export interface Session {
  id: string;
  class_id: string;
  class_name: string;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  status: 'active' | 'completed' | 'scheduled' | 'cancelled';
  average_attention_score?: number;
  total_students_present: number;
}

export interface SessionDetail extends Session {
  students: Array<{
    id: string;
    name: string;
    joined_at: string;
    left_at?: string;
    duration_minutes?: number;
    average_attention_score?: number;
  }>;
}

export interface ActiveSessionResponse {
  session_id: string | null;
  class_id?: string;
  class_name?: string;
  started_at?: string;
  status?: string;
  message?: string;
}

export const sessionsAPI = {
  // Iniciar una sesión (profesor)
  startSession: async (classId: string): Promise<any> => {
    const response = await api.post(`/api/classes/sessions/start`, null, {
      params: { class_id: classId }
    });
    return response.data;
  },

  // Finalizar una sesión (profesor)
  endSession: async (sessionId: string): Promise<any> => {
    const response = await api.post(`/api/classes/sessions/${sessionId}/end`);
    return response.data;
  },

  // Obtener sesión activa
  getActiveSession: async (): Promise<ActiveSessionResponse> => {
    const response = await api.get('/api/classes/sessions/active');
    return response.data;
  },

  // Unirse a una sesión (estudiante)
  joinSession: async (sessionId: string): Promise<any> => {
    const response = await api.post(`/api/classes/sessions/${sessionId}/join`);
    return response.data;
  },

  // Obtener detalles de una sesión
  getSessionDetail: async (sessionId: string): Promise<SessionDetail> => {
    const response = await api.get(`/api/classes/sessions/${sessionId}`);
    return response.data;
  },

  // Obtener clases del usuario
  getClasses: async (): Promise<any> => {
    const response = await api.get('/api/classes/classes');
    return response.data;
  },

  // Obtener detalles de una clase
  getClassDetail: async (classId: string): Promise<any> => {
    const response = await api.get(`/api/classes/classes/${classId}`);
    return response.data;
  }
};

export default sessionsAPI;