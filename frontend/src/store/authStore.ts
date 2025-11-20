// frontend/src/store/authStore.ts

import { create } from 'zustand';
import { User } from '@/types';
import { authAPI } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;  // ✅ AGREGADO
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,  // ✅ AGREGADO
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await authAPI.login({ email, password });
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
      
      const user = await authAPI.getCurrentUser();
      
      // ✅ AGREGADO: Guardar token en el estado
      set({ 
        user, 
        token: tokens.access_token,  // ✅ AGREGADO
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Login failed',
        isLoading: false
      });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.register(data);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Registration failed',
        isLoading: false
      });
      throw error;
    }
  },

  logout: () => {
    authAPI.logout();
    set({ 
      user: null, 
      token: null,  // ✅ AGREGADO
      isAuthenticated: false 
    });
  },

  fetchCurrentUser: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    set({ isLoading: true });
    try {
      const user = await authAPI.getCurrentUser();
      
      // ✅ AGREGADO: Guardar token en el estado
      set({ 
        user, 
        token,  // ✅ AGREGADO
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false, token: null });  // ✅ MODIFICADO
      authAPI.logout();
    }
  },
}));
