'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Arrival, SchoolStats } from '@/types';
import { useArrivals } from '@/hooks/useArrivals';
import ConnectionHeader from './ConnectionHeader';
import ArrivalsStats from './ArrivalsStats';
import ArrivalsQueue from './ArrivalsQueue';

const ArrivalsMap = dynamic(() => import('@/components/map/ArrivalsMap'), {
  ssr: false,
});

export interface ArrivalsContainerProps {
  schoolId: string;
  schoolName: string;
  schoolLat: number;
  schoolLng: number;
  initialArrivals: Arrival[];
  stats: SchoolStats | null;
  token: string;
}

export default function ArrivalsContainer({
  schoolId,
  schoolName,
  schoolLat,
  schoolLng,
  initialArrivals,
  stats,
  token,
}: ArrivalsContainerProps) {
  const { arrivals, isConnected, lastUpdatedAt } = useArrivals(
    schoolId,
    initialArrivals,
    token,
  );

  const liveStats = useMemo<SchoolStats | null>(() => {
    if (arrivals.length === 0 && !lastUpdatedAt) return stats;
    const totalParents = arrivals.length;
    const etaValues = arrivals.map((a) => a.durationMinutes);
    const avgETA = totalParents > 0 ? Math.round(etaValues.reduce((s, v) => s + v, 0) / totalParents) : 0;
    return {
      totalParents,
      avgETA,
      etaLessThan5Min: etaValues.filter((v) => v < 5).length,
      eta5To15Min: etaValues.filter((v) => v >= 5 && v <= 15).length,
      etaGreaterThan15Min: etaValues.filter((v) => v > 15).length,
    };
  }, [arrivals, stats, lastUpdatedAt]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{schoolName}</h1>

      <ConnectionHeader isConnected={isConnected} lastUpdatedAt={lastUpdatedAt} />

      <ArrivalsMap
        schoolLat={schoolLat}
        schoolLng={schoolLng}
        schoolName={schoolName}
        arrivals={arrivals}
      />

      <ArrivalsStats stats={liveStats} />

      <ArrivalsQueue arrivals={arrivals} />
    </div>
  );
}
