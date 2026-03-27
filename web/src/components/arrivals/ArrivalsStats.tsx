import { SchoolStats } from '@/types';

interface ArrivalsStatsProps {
  stats: SchoolStats | null;
}

export default function ArrivalsStats({ stats }: ArrivalsStatsProps) {
  if (stats === null) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow p-4 border border-gray-200 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    { label: 'Pais a caminho', value: stats.totalParents },
    { label: 'Tempo médio', value: `${stats.avgETA} min` },
    { label: 'menos de 5 min', value: stats.etaLessThan5Min },
    { label: '5 a 15 min', value: stats.eta5To15Min },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
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
