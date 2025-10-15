// frontend/src/components/dashboard/CVMetricsPanel.tsx
import { Camera } from 'lucide-react';

interface CVMetricsPanelProps {
  metrics: {
    ear: number;
    mar: number;
    blinks: number;
    yawns: number;
    headYaw: number;
    headPitch: number;
    lookingAway: boolean;
    processingTime: number;
  };
}

export default function CVMetricsPanel({ metrics }: CVMetricsPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Camera className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Vista con CV</h2>
          <p className="text-sm text-gray-600">Rostro detectado</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* EAR y MAR */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">EAR</p>
            <p className="text-lg font-bold text-gray-900">
              {metrics.ear.toFixed(3)}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">MAR</p>
            <p className="text-lg font-bold text-gray-900">
              {metrics.mar.toFixed(3)}
            </p>
          </div>
        </div>

        {/* Pestañeos y Bostezos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Pestañeos</p>
            <p className="text-lg font-bold text-gray-900">{metrics.blinks}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Bostezos</p>
            <p className="text-lg font-bold text-gray-900">{metrics.yawns}</p>
          </div>
        </div>

        {/* Head Pose */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Head Yaw</p>
            <p className="text-lg font-bold text-gray-900">
              {metrics.headYaw.toFixed(1)}°
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Head Pitch</p>
            <p className="text-lg font-bold text-gray-900">
              {metrics.headPitch.toFixed(1)}°
            </p>
          </div>
        </div>

        {/* Looking Away Status */}
        <div className={`p-4 rounded-lg ${
          metrics.lookingAway ? 'bg-orange-50' : 'bg-green-50'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              metrics.lookingAway ? 'bg-orange-500' : 'bg-green-500'
            }`} />
            <p className="text-sm font-medium">
              {metrics.lookingAway 
                ? '👀 Mirando Hacia Otro Lado' 
                : '✅ Mirando a la Pantalla'}
            </p>
          </div>
        </div>

        {/* Processing Time */}
        {metrics.processingTime > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 Tip: Mantén tu rostro bien iluminado y centrado. 
              Último procesamiento: {metrics.processingTime}ms
            </p>
          </div>
        )}
      </div>
    </div>
  );
  
}
