// frontend/src/app/dashboard/teacher/alerts/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { 
  Bell, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  CheckCircle,
  X,
  Filter,
  Search,
  Download,
  Trash2,
  Eye,
  Cloud,
  UserX,
  Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

interface Alert {
  id: string;
  type: 'low_attention' | 'yawn' | 'offline' | 'distracted' | 'info';
  priority: 'critical' | 'high' | 'medium' | 'low';
  studentId: string;
  studentName: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  details: {
    attentionScore?: number;
    yawns?: number;
    blinks?: number;
    duration?: string;
  };
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'low_attention',
      priority: 'critical',
      studentId: 'std-1',
      studentName: 'María Rodriguez',
      message: 'Nivel de atención crítico detectado',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      acknowledged: false,
      details: { attentionScore: 25, yawns: 8, blinks: 120 }
    },
    {
      id: '2',
      type: 'yawn',
      priority: 'high',
      studentId: 'std-2',
      studentName: 'Carlos Mendoza',
      message: 'Múltiples bostezos detectados',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      acknowledged: false,
      details: { yawns: 5, attentionScore: 65 }
    },
    {
      id: '3',
      type: 'distracted',
      priority: 'medium',
      studentId: 'std-3',
      studentName: 'Ana García',
      message: 'Estudiante mirando fuera de la pantalla',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      acknowledged: false,
      details: { duration: '2 minutos', attentionScore: 72 }
    },
    {
      id: '4',
      type: 'offline',
      priority: 'high',
      studentId: 'std-4',
      studentName: 'Luis Fernández',
      message: 'Estudiante se desconectó de la sesión',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      acknowledged: true,
      details: { duration: '20 minutos' }
    },
    {
      id: '5',
      type: 'info',
      priority: 'low',
      studentId: 'std-5',
      studentName: 'Sofia Torres',
      message: 'Nivel de atención ha mejorado',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      acknowledged: true,
      details: { attentionScore: 85 }
    }
  ]);

  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar alertas
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (filterType !== 'all' && alert.type !== filterType) return false;
      if (filterPriority !== 'all' && alert.priority !== filterPriority) return false;
      if (!showAcknowledged && alert.acknowledged) return false;
      if (searchTerm && !alert.studentName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [alerts, filterType, filterPriority, showAcknowledged, searchTerm]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = alerts.length;
    const unread = alerts.filter(a => !a.acknowledged).length;
    const critical = alerts.filter(a => a.priority === 'critical' && !a.acknowledged).length;
    const resolved = alerts.filter(a => a.acknowledged).length;

    return { total, unread, critical, resolved };
  }, [alerts]);

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const acknowledgeAll = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, acknowledged: true })));
  };

  const clearAcknowledged = () => {
    setAlerts(prev => prev.filter(alert => !alert.acknowledged));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_attention': return AlertTriangle;
      case 'yawn': return Cloud;
      case 'offline': return UserX;
      case 'distracted': return Eye;
      case 'info': return Info;
      default: return AlertCircle;
    }
  };

  const getAlertColor = (priority: string, acknowledged: boolean) => {
    if (acknowledged) return 'bg-gray-50 border-gray-200 text-gray-600';
    
    switch (priority) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-700';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white'
    };
    
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const exportAlerts = () => {
    const csvContent = [
      ['ID', 'Tipo', 'Prioridad', 'Estudiante', 'Mensaje', 'Fecha', 'Estado'].join(','),
      ...alerts.map(a => [
        a.id,
        a.type,
        a.priority,
        a.studentName,
        a.message,
        new Date(a.timestamp).toLocaleString(),
        a.acknowledged ? 'Leída' : 'Pendiente'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alertas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Alertas</h1>
          <p className="text-gray-600">Notificaciones en tiempo real del sistema</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={acknowledgeAll}
            disabled={stats.unread === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Marcar Todas Leídas
          </button>
          
          <button
            onClick={clearAcknowledged}
            disabled={stats.resolved === 0}
            className="px-4 py-2 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Limpiar Leídas
          </button>

          <button
            onClick={exportAlerts}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
          >
            <Download className="w-5 h-5" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Total Alertas</p>
                <p className="text-4xl font-black text-purple-700">{stats.total}</p>
              </div>
              <Bell className="w-12 h-12 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Sin Leer</p>
                <p className="text-4xl font-black text-orange-700">{stats.unread}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Críticas</p>
                <p className="text-4xl font-black text-red-700">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Resueltas</p>
                <p className="text-4xl font-black text-green-700">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por estudiante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">Todos los tipos</option>
              <option value="low_attention">Atención baja</option>
              <option value="yawn">Bostezos</option>
              <option value="distracted">Distraído</option>
              <option value="offline">Desconectado</option>
              <option value="info">Información</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">Todas las prioridades</option>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>

            {/* Show Acknowledged */}
            <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl bg-white cursor-pointer">
              <input
                type="checkbox"
                checked={showAcknowledged}
                onChange={(e) => setShowAcknowledged(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Mostrar leídas</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alertas ({filteredAlerts.length})</CardTitle>
          <CardDescription>Notificaciones ordenadas por más reciente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No hay alertas que mostrar</p>
                <p className="text-sm text-gray-400 mt-2">
                  {!showAcknowledged ? 'Todas las alertas están leídas' : 'Ajusta los filtros para ver más alertas'}
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                const colorClasses = getAlertColor(alert.priority, alert.acknowledged);
                
                return (
                  <div
                    key={alert.id}
                    className={`p-5 rounded-xl border-2 ${colorClasses} transition-all hover:shadow-lg ${
                      !alert.acknowledged ? 'animate-pulse-slow' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Icon & Content */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          alert.acknowledged ? 'bg-gray-200' :
                          alert.priority === 'critical' ? 'bg-red-100' :
                          alert.priority === 'high' ? 'bg-orange-100' :
                          alert.priority === 'medium' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            alert.acknowledged ? 'text-gray-500' :
                            alert.priority === 'critical' ? 'text-red-600' :
                            alert.priority === 'high' ? 'text-orange-600' :
                            alert.priority === 'medium' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900">{alert.studentName}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getPriorityBadge(alert.priority)}`}>
                              {alert.priority}
                            </span>
                            {alert.acknowledged && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                ✓ Leída
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-700 font-medium mb-3">{alert.message}</p>
                          
                          {/* Details */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(alert.timestamp).toLocaleString('es-ES')}</span>
                            </div>
                            
                            {alert.details.attentionScore !== undefined && (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-gray-700">Score:</span>
                                <span className={`font-bold ${
                                  alert.details.attentionScore >= 70 ? 'text-green-600' :
                                  alert.details.attentionScore >= 40 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {alert.details.attentionScore}%
                                </span>
                              </div>
                            )}
                            
                            {alert.details.yawns !== undefined && (
                              <div className="flex items-center gap-1">
                                <Cloud className="w-4 h-4 text-orange-600" />
                                <span className="font-semibold text-orange-600">{alert.details.yawns} bostezos</span>
                              </div>
                            )}
                            
                            {alert.details.duration && (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-gray-700">Duración:</span>
                                <span className="text-gray-600">{alert.details.duration}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!alert.acknowledged && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
                          >
                            Marcar Leída
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}