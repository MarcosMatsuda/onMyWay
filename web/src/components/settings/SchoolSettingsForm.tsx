'use client';

import { useState, FormEvent } from 'react';
import { updateSchoolConfigAction } from '@/app/actions/update-school-config.action';

interface SchoolSettingsFormProps {
  schoolId: string;
  initialGeofenceRadius: number;
  initialNotificationThreshold: number;
}

export function SchoolSettingsForm({
  schoolId,
  initialGeofenceRadius,
  initialNotificationThreshold,
}: SchoolSettingsFormProps) {
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState<string>(String(initialGeofenceRadius));
  const [notificationThresholdMeters, setNotificationThresholdMeters] = useState<string>(String(initialNotificationThreshold));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateInputs = (): boolean => {
    const geofence = Number(geofenceRadiusMeters);
    const notification = Number(notificationThresholdMeters);

    if (isNaN(geofence) || geofence < 100 || geofence > 5000) {
      setValidationError('Raio do geofence deve estar entre 100 e 5000 metros');
      return false;
    }

    if (isNaN(notification) || notification < 100 || notification > 2000) {
      setValidationError('Distância de notificação deve estar entre 100 e 2000 metros');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    const result = await updateSchoolConfigAction(schoolId, {
      geofenceRadiusMeters: Number(geofenceRadiusMeters),
      notificationThresholdMeters: Number(notificationThresholdMeters),
    });

    setIsLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Erro ao atualizar configurações');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-lg">
      <div>
        <label htmlFor="geofenceRadius" className="block text-sm font-medium text-gray-700 mb-2">
          Raio do Geofence (metros)
        </label>
        <input
          id="geofenceRadius"
          type="number"
          min="100"
          max="5000"
          step="1"
          value={geofenceRadiusMeters}
          onChange={(e) => setGeofenceRadiusMeters(e.target.value)}
          disabled={isLoading}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">Intervalo: 100-5000 metros</p>
      </div>

      <div>
        <label htmlFor="notificationThreshold" className="block text-sm font-medium text-gray-700 mb-2">
          Distância para Notificação (metros)
        </label>
        <input
          id="notificationThreshold"
          type="number"
          min="100"
          max="2000"
          step="1"
          value={notificationThresholdMeters}
          onChange={(e) => setNotificationThresholdMeters(e.target.value)}
          disabled={isLoading}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">Intervalo: 100-2000 metros</p>
      </div>

      {validationError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {validationError}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          Configurações atualizadas com sucesso!
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </form>
  );
}
