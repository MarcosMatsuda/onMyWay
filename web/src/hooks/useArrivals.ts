import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Arrival } from '@/types';

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
  const base = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
  // Gateway uses /ws namespace
  return base.endsWith('/ws') ? base : `${base}/ws`;
}

interface GatewayArrival {
  parentId: string;
  parentName?: string;
  lat: number;
  lng: number;
  etaMinutes: number;
  distanceMeters: number;
  routePolyline?: string;
  calculatedAt?: string;
}

interface ArrivalsUpdatedPayload {
  schoolId: string;
  schoolName: string;
  totalCount: number;
  arrivals: GatewayArrival[];
  timestamp: string;
}

function mapGatewayArrivals(payload: ArrivalsUpdatedPayload): Arrival[] {
  return payload.arrivals.map((a) => ({
    parentId: a.parentId,
    distanceMeters: a.distanceMeters,
    durationMinutes: a.etaMinutes,
    routePolyline: a.routePolyline || '',
  }));
}

export function useArrivals(
  schoolId: string,
  initialArrivals: Arrival[],
  token: string,
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

  // WebSocket connection
  useEffect(() => {
    const secureUrl = getSecureWsUrl(getWsUrl());

    const socket: Socket = io(secureUrl, {
      autoConnect: true,
      auth: {
        token,
      },
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('school:join', { schoolId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('arrivals:updated', (payload: ArrivalsUpdatedPayload) => {
      const mapped = mapGatewayArrivals(payload);
      const sorted = [...mapped].sort(
        (a, b) => a.durationMinutes - b.durationMinutes,
      );
      setArrivals(sorted);
      setLastUpdatedAt(new Date());
    });

    return () => {
      socket.disconnect();
    };
  }, [schoolId, token]);

  // Clear stale arrivals when no update received within TTL (5 min)
  useEffect(() => {
    if (!lastUpdatedAt || arrivals.length === 0) return;

    const TTL_MS = 5 * 60 * 1000;
    const elapsed = Date.now() - lastUpdatedAt.getTime();
    const remaining = TTL_MS - elapsed;

    if (remaining <= 0) {
      setArrivals([]);
      return;
    }

    const timer = setTimeout(() => {
      setArrivals([]);
      setLastUpdatedAt(new Date());
    }, remaining);

    return () => clearTimeout(timer);
  }, [lastUpdatedAt, arrivals.length]);

  return { arrivals, isConnected, lastUpdatedAt };
}
