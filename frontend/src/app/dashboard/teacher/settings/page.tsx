// frontend/src/app/dashboard/teacher/settings/page.tsx
'use client';

import { useState } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Sliders, 
  Shield,
  Save,
  RefreshCw,
  Eye,
  Cloud,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export default function SettingsPage() {
  // Profile Settings
  const [profile, setProfile] = useState({
    firstName: 'Camilo',
    lastName: 'Daza',
    email: 'camilodaza@gmail.com',
    phone: '+57 300 123 4567',
    school: 'Universidad Industrial de Santander',
    department: 'Ingeniería de Sistemas'
  });

  // Threshold Settings
  const [thresholds, setThresholds] = useState({
    lowAttentionScore: 40,
    criticalAttentionScore: 30,
    maxBlinks: 30,
    maxYawns: 5,
    distractedTime: 10
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    lowAttention: true,
    criticalAttention: true,
    studentOffline: true,
    sessionSummary: true,
    dailyReport: false,
    weeklyReport: true
  });

  // Session Settings
  const [sessionSettings, setSessionSettings] = useState({
    autoStartRecording: true,
    saveMetricsHistory: true,
    anonymizeData: false,
    dataRetentionDays: 90,
    frameCaptureRate: 20
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSaving(false);
    setSaveSuccess(true);
    
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (confirm('¿Estás seguro de restablecer todas las configuraciones por defecto?')) {
      setThresholds({
        lowAttentionScore: 40,
        criticalAttentionScore: 30,
        maxBlinks: 30,
        maxYawns: 5,
        distractedTime: 10
      });
      
      setNotifications({
        emailAlerts: true,
        pushNotifications: true,
        lowAttention: true,
        criticalAttention: true,
        studentOffline: true,
        sessionSummary: true,
        dailyReport: false,
        weeklyReport: true
      });
      
      setSessionSettings({
        autoStartRecording: true,
        saveMetricsHistory: true,
        anonymizeData: false,
        dataRetentionDays: 90,
        frameCaptureRate: 20
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
          <p className="text-gray-600">Personaliza el comportamiento del sistema</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Restablecer
          </button>
          
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <p className="text-green-800 font-semibold">¡Configuración guardada exitosamente!</p>
        </div>
      )}

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Información del Perfil</CardTitle>
              <CardDescription>Gestiona tu información personal</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Institución</label>
              <input
                type="text"
                value={profile.school}
                onChange={(e) => setProfile({ ...profile, school: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Departamento</label>
              <input
                type="text"
                value={profile.department}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threshold Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <Sliders className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Umbrales de Detección</CardTitle>
              <CardDescription>Ajusta los valores que activan las alertas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Low Attention Score */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  <AlertTriangle className="w-4 h-4 inline mr-2 text-yellow-600" />
                  Score de Atención Baja
                </label>
                <span className="text-2xl font-bold text-yellow-600">{thresholds.lowAttentionScore}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="60"
                value={thresholds.lowAttentionScore}
                onChange={(e) => setThresholds({ ...thresholds, lowAttentionScore: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-600"
              />
              <p className="text-xs text-gray-500 mt-2">Alertas cuando el score esté por debajo de este valor</p>
            </div>

            {/* Critical Attention Score */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  <AlertTriangle className="w-4 h-4 inline mr-2 text-red-600" />
                  Score de Atención Crítica
                </label>
                <span className="text-2xl font-bold text-red-600">{thresholds.criticalAttentionScore}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                value={thresholds.criticalAttentionScore}
                onChange={(e) => setThresholds({ ...thresholds, criticalAttentionScore: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <p className="text-xs text-gray-500 mt-2">Alertas críticas cuando el score esté por debajo de este valor</p>
            </div>

            {/* Max Blinks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  <Eye className="w-4 h-4 inline mr-2 text-blue-600" />
                  Máximo de Pestañeos por Minuto
                </label>
                <span className="text-2xl font-bold text-blue-600">{thresholds.maxBlinks}</span>
              </div>
              <input
                type="range"
                min="20"
                max="50"
                value={thresholds.maxBlinks}
                onChange={(e) => setThresholds({ ...thresholds, maxBlinks: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-gray-500 mt-2">Alertas cuando se exceda este número de pestañeos/min</p>
            </div>

            {/* Max Yawns */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  <Cloud className="w-4 h-4 inline mr-2 text-orange-600" />
                  Máximo de Bostezos
                </label>
                <span className="text-2xl font-bold text-orange-600">{thresholds.maxYawns}</span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                value={thresholds.maxYawns}
                onChange={(e) => setThresholds({ ...thresholds, maxYawns: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <p className="text-xs text-gray-500 mt-2">Alertas cuando se detecten más de este número de bostezos</p>
            </div>

            {/* Distracted Time */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  Tiempo Máximo Distraído (segundos)
                </label>
                <span className="text-2xl font-bold text-purple-600">{thresholds.distractedTime}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={thresholds.distractedTime}
                onChange={(e) => setThresholds({ ...thresholds, distractedTime: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <p className="text-xs text-gray-500 mt-2">Tiempo que puede estar mirando fuera antes de alertar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>Controla qué alertas quieres recibir</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Email and Push */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-all">
                <span className="font-semibold text-gray-700">Alertas por Email</span>
                <input
                  type="checkbox"
                  checked={notifications.emailAlerts}
                  onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-purple-50 rounded-xl cursor-pointer hover:bg-purple-100 transition-all">
                <span className="font-semibold text-gray-700">Notificaciones Push</span>
                <input
                  type="checkbox"
                  checked={notifications.pushNotifications}
                  onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
              </label>
            </div>

            {/* Alert Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl cursor-pointer hover:bg-yellow-100 transition-all">
                <span className="font-semibold text-gray-700">Atención Baja</span>
                <input
                  type="checkbox"
                  checked={notifications.lowAttention}
                  onChange={(e) => setNotifications({ ...notifications, lowAttention: e.target.checked })}
                  className="w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-red-50 rounded-xl cursor-pointer hover:bg-red-100 transition-all">
                <span className="font-semibold text-gray-700">Atención Crítica</span>
                <input
                  type="checkbox"
                  checked={notifications.criticalAttention}
                  onChange={(e) => setNotifications({ ...notifications, criticalAttention: e.target.checked })}
                  className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
                <span className="font-semibold text-gray-700">Estudiante Desconectado</span>
                <input
                  type="checkbox"
                  checked={notifications.studentOffline}
                  onChange={(e) => setNotifications({ ...notifications, studentOffline: e.target.checked })}
                  className="w-5 h-5 text-gray-600 rounded focus:ring-2 focus:ring-gray-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-green-50 rounded-xl cursor-pointer hover:bg-green-100 transition-all">
                <span className="font-semibold text-gray-700">Resumen de Sesión</span>
                <input
                  type="checkbox"
                  checked={notifications.sessionSummary}
                  onChange={(e) => setNotifications({ ...notifications, sessionSummary: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all">
                <span className="font-semibold text-gray-700">Reporte Diario</span>
                <input
                  type="checkbox"
                  checked={notifications.dailyReport}
                  onChange={(e) => setNotifications({ ...notifications, dailyReport: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-cyan-50 rounded-xl cursor-pointer hover:bg-cyan-100 transition-all">
                <span className="font-semibold text-gray-700">Reporte Semanal</span>
                <input
                  type="checkbox"
                  checked={notifications.weeklyReport}
                  onChange={(e) => setNotifications({ ...notifications, weeklyReport: e.target.checked })}
                  className="w-5 h-5 text-cyan-600 rounded focus:ring-2 focus:ring-cyan-500"
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Configuración de Sesiones</CardTitle>
              <CardDescription>Opciones avanzadas del sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Toggle Options */}
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-all">
                <div>
                  <span className="font-semibold text-gray-700 block">Iniciar Grabación Automática</span>
                  <span className="text-sm text-gray-600">Comenzar a capturar datos al iniciar la clase</span>
                </div>
                <input
                  type="checkbox"
                  checked={sessionSettings.autoStartRecording}
                  onChange={(e) => setSessionSettings({ ...sessionSettings, autoStartRecording: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-green-50 rounded-xl cursor-pointer hover:bg-green-100 transition-all">
                <div>
                  <span className="font-semibold text-gray-700 block">Guardar Historial de Métricas</span>
                  <span className="text-sm text-gray-600">Almacenar datos históricos para análisis</span>
                </div>
                <input
                  type="checkbox"
                  checked={sessionSettings.saveMetricsHistory}
                  onChange={(e) => setSessionSettings({ ...sessionSettings, saveMetricsHistory: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-purple-50 rounded-xl cursor-pointer hover:bg-purple-100 transition-all">
                <div>
                  <span className="font-semibold text-gray-700 block">Anonimizar Datos</span>
                  <span className="text-sm text-gray-600">Proteger identidad de estudiantes en reportes</span>
                </div>
                <input
                  type="checkbox"
                  checked={sessionSettings.anonymizeData}
                  onChange={(e) => setSessionSettings({ ...sessionSettings, anonymizeData: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
              </label>
            </div>

            {/* Data Retention */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Retención de Datos (días)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="30"
                  value={sessionSettings.dataRetentionDays}
                  onChange={(e) => setSessionSettings({ ...sessionSettings, dataRetentionDays: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-2xl font-bold text-indigo-600 w-20 text-center">
                  {sessionSettings.dataRetentionDays}d
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Los datos más antiguos se eliminarán automáticamente
              </p>
            </div>

            {/* Frame Capture Rate */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tasa de Captura de Frames (FPS)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="30"
                  value={sessionSettings.frameCaptureRate}
                  onChange={(e) => setSessionSettings({ ...sessionSettings, frameCaptureRate: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                />
                <span className="text-2xl font-bold text-cyan-600 w-20 text-center">
                  {sessionSettings.frameCaptureRate} FPS
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Mayor FPS = más precisión pero mayor consumo de recursos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Seguridad y Privacidad</CardTitle>
              <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <button className="w-full p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold transition-all text-left">
              Cambiar Contraseña
            </button>
            
            <button className="w-full p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-semibold transition-all text-left">
              Activar Autenticación de Dos Factores (2FA)
            </button>
            
            <button className="w-full p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-semibold transition-all text-left">
              Descargar Mis Datos
            </button>
            
            <button className="w-full p-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-semibold transition-all text-left">
              Eliminar Mi Cuenta
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Fixed at Bottom) */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Asegúrate de guardar los cambios antes de salir
          </p>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDefaults}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all"
            >
              Restablecer
            </button>
            
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}