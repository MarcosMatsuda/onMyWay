'use client';

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

      <ArrivalsStats stats={stats} />

      <ArrivalsQueue arrivals={arrivals} />
    </div>
  );
}
