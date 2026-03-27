'use client';

import { Arrival, SchoolStats } from '@/types';
import { useArrivals } from '@/hooks/useArrivals';
import ConnectionHeader from './ConnectionHeader';
import ArrivalsStats from './ArrivalsStats';
import ArrivalsQueue from './ArrivalsQueue';

interface ArrivalsContainerProps {
  schoolId: string;
  schoolName: string;
  initialArrivals: Arrival[];
  stats: SchoolStats | null;
}

export default function ArrivalsContainer({
  schoolId,
  schoolName,
  initialArrivals,
  stats,
}: ArrivalsContainerProps) {
  const { arrivals, isConnected, lastUpdatedAt } = useArrivals(
    schoolId,
    initialArrivals,
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{schoolName}</h1>

      <ConnectionHeader isConnected={isConnected} lastUpdatedAt={lastUpdatedAt} />

      <ArrivalsStats stats={stats} />

      <ArrivalsQueue arrivals={arrivals} />
    </div>
  );
}
