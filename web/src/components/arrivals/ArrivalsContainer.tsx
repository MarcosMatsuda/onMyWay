'use client';

import { Arrival } from '@/types';
import { useArrivals } from '@/hooks/useArrivals';

interface ArrivalsContainerProps {
  schoolId: string;
  schoolName: string;
  initialArrivals: Arrival[];
}

export default function ArrivalsContainer({
  schoolId,
  schoolName,
  initialArrivals,
}: ArrivalsContainerProps) {
  const { arrivals, isConnected, lastUpdatedAt } = useArrivals(
    schoolId,
    initialArrivals,
  );

  const formatTime = (date: Date | null): string => {
    if (!date) return 'Atualizando...';
    return `Atualizado às ${date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{schoolName}</h1>

      <div className="mb-6 flex items-center gap-4">
        <span className="text-sm font-medium">
          {isConnected ? '🟢 Ao vivo' : '🔴 Desconectado'}
        </span>
        <span className="text-sm text-gray-600">{formatTime(lastUpdatedAt)}</span>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {arrivals.length === 0 ? (
          <p className="text-gray-500">Nenhum pai a caminho no momento.</p>
        ) : (
          <ul className="space-y-4">
            {arrivals.map((arrival, index) => (
              <li
                key={`${arrival.parentId}-${index}`}
                className="border-b pb-3 last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      Parent ID: {arrival.parentId}
                    </p>
                    <p className="text-sm text-gray-600">
                      {arrival.durationMinutes} min · {arrival.distanceMeters} m
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
