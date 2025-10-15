// frontend/src/store/websocketStore.ts
import { create } from 'zustand';

interface AttentionMetrics {
  studentId: string;
  attentionScore: number;
  attentionLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  blinks?: number;
  yawns?: number;
}

interface Alert {
  id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  studentId: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface ClassMetrics {
  averageAttention: number;
  totalStudents: number;
  studentsHigh: number;
  studentsMedium: number;
  studentsLow: number;
}

interface WebSocketState {
  // Connection
  isConnected: boolean;
  connectionStatus: string;
  
  // Metrics
  studentMetrics: Map<string, AttentionMetrics>;
  classMetrics: ClassMetrics | null;
  
  // Alerts
  alerts: Alert[];
  unreadAlerts: number;
  
  // Actions
  setConnected: (status: boolean) => void;
  setConnectionStatus: (status: string) => void;
  updateStudentMetrics: (metrics: AttentionMetrics) => void;
  updateClassMetrics: (metrics: ClassMetrics) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
  isConnected: false,
  connectionStatus: 'disconnected',
  studentMetrics: new Map(),
  classMetrics: null,
  alerts: [],
  unreadAlerts: 0,

  setConnected: (status) => set({ isConnected: status }),
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  updateStudentMetrics: (metrics) => set((state) => {
    const newMetrics = new Map(state.studentMetrics);
    newMetrics.set(metrics.studentId, metrics);
    return { studentMetrics: newMetrics };
  }),
  
  updateClassMetrics: (metrics) => set({ classMetrics: metrics }),
  
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts],
    unreadAlerts: state.unreadAlerts + 1
  })),
  
  acknowledgeAlert: (alertId) => set((state) => ({
    alerts: state.alerts.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ),
    unreadAlerts: Math.max(0, state.unreadAlerts - 1)
  })),
  
  clearAlerts: () => set({ alerts: [], unreadAlerts: 0 })
}));