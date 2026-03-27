import { Arrival } from '@/types';

interface ArrivalsQueueProps {
  arrivals: Arrival[];
}

export default function ArrivalsQueue({ arrivals }: ArrivalsQueueProps) {
  if (arrivals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Nenhum pai a caminho no momento.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
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
    </div>
  );
}
