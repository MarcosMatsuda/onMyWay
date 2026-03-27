import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Arrival } from '@/types';
import { getToken } from '@/lib/auth';

// Ensure secure WebSocket protocol in production
function getSecureWsUrl(url: string): string {
  if (typeof window === 'undefined') return url;

  // If explicitly using localhost, keep ws://
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return url;
  }

  // Otherwise, enforce wss:// for production
  return url.replace(/^ws:/, 'wss:').replace(/^http:/, 'wss:').replace(/^https:/, 'wss:');
}

function getWsUrl(): string {
  return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
}

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
    const token = getToken();
    const secureUrl = getSecureWsUrl(getWsUrl());

    const socket: Socket = io(secureUrl, {
      autoConnect: true,
      auth: {
        token,
      },
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinSchool', { schoolId, token });
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
