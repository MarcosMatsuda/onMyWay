import { Arrival } from '@/types';

interface ArrivalsStatsProps {
  arrivals: Arrival[];
}

export default function ArrivalsStats({ arrivals }: ArrivalsStatsProps) {
  const totalArrivals = arrivals.length;
  const avgDuration =
    totalArrivals > 0
      ? Math.round(
          arrivals.reduce((sum, a) => sum + a.durationMinutes, 0) /
            totalArrivals,
        )
      : 0;
  const closestArrival =
    arrivals.length > 0
      ? Math.min(...arrivals.map((a) => a.durationMinutes))
      : 0;

  const stats = [
    { label: 'Total a caminho', value: totalArrivals },
    { label: 'Tempo médio', value: `${avgDuration} min` },
    { label: 'Próxima chegada', value: closestArrival > 0 ? `${closestArrival} min` : '—' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-lg shadow p-4 border border-gray-200"
        >
          <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
