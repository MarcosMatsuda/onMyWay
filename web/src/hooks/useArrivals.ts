import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Arrival } from '@/types';

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

export function useArrivals(
  schoolId: string,
  initialArrivals: Arrival[],
): {
  arrivals: Arrival[];
  isConnected: boolean;
  lastUpdatedAt: Date | null;
} {
  const [arrivals, setArrivals] = useState<Arrival[]>(
    [...initialArrivals].sort(
      (a, b) => a.durationMinutes - b.durationMinutes,
    ),
  );
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const socket: Socket = io(WS_URL, { autoConnect: true });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinSchool', { schoolId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('arrivals:updated', (updatedArrivals: Arrival[]) => {
      const sorted = [...updatedArrivals].sort(
        (a, b) => a.durationMinutes - b.durationMinutes,
      );
      setArrivals(sorted);
      setLastUpdatedAt(new Date());
    });

    return () => {
      socket.disconnect();
    };
  }, [schoolId]);

  return { arrivals, isConnected, lastUpdatedAt };
}
