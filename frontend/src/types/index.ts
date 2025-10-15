// frontend/src/types/index.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'student' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'student';
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AttentionMetrics {
  studentId: string;
  attentionScore: number;
  attentionLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  blinks: number;
  yawns: number;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  subject: string;
  teacherId: string;
  scheduleDay: string;
  scheduleTime: string;
  durationMinutes: number;
}