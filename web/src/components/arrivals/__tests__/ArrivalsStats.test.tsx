import React from 'react';
import { render, screen } from '@testing-library/react';
import ArrivalsStats from '../ArrivalsStats';
import { Arrival } from '@/types';

describe('ArrivalsStats', () => {
  it('shows zero stats when no arrivals', () => {
    render(<ArrivalsStats arrivals={[]} />);
    expect(screen.getByText('Total a caminho')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0 min')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('calculates total arrivals correctly', () => {
    const arrivals: Arrival[] = [
      { parentId: 'p-1', distanceMeters: 100, durationMinutes: 5, routePolyline: '' },
      { parentId: 'p-2', distanceMeters: 200, durationMinutes: 10, routePolyline: '' },
      { parentId: 'p-3', distanceMeters: 300, durationMinutes: 15, routePolyline: '' },
    ];
    render(<ArrivalsStats arrivals={arrivals} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calculates average duration correctly', () => {
    const arrivals: Arrival[] = [
      { parentId: 'p-1', distanceMeters: 100, durationMinutes: 6, routePolyline: '' },
      { parentId: 'p-2', distanceMeters: 200, durationMinutes: 9, routePolyline: '' },
      { parentId: 'p-3', distanceMeters: 300, durationMinutes: 15, routePolyline: '' },
    ];
    render(<ArrivalsStats arrivals={arrivals} />);
    expect(screen.getByText('10 min')).toBeInTheDocument();
  });

  it('shows closest arrival time', () => {
    const arrivals: Arrival[] = [
      { parentId: 'p-1', distanceMeters: 100, durationMinutes: 3, routePolyline: '' },
      { parentId: 'p-2', distanceMeters: 200, durationMinutes: 7, routePolyline: '' },
      { parentId: 'p-3', distanceMeters: 300, durationMinutes: 12, routePolyline: '' },
    ];
    render(<ArrivalsStats arrivals={arrivals} />);
    expect(screen.getByText('3 min')).toBeInTheDocument();
  });

  it('renders all three stat cards', () => {
    render(<ArrivalsStats arrivals={[]} />);
    expect(screen.getByText('Total a caminho')).toBeInTheDocument();
    expect(screen.getByText('Tempo médio')).toBeInTheDocument();
    expect(screen.getByText('Próxima chegada')).toBeInTheDocument();
  });

  it('shows single arrival stats correctly', () => {
    const arrivals: Arrival[] = [
      { parentId: 'p-1', distanceMeters: 300, durationMinutes: 8, routePolyline: '' },
    ];
    render(<ArrivalsStats arrivals={arrivals} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    // avg duration and closest arrival are both 8 min for a single arrival
    expect(screen.getAllByText('8 min')).toHaveLength(2);
  });

  it('rounds average duration to nearest integer', () => {
    const arrivals: Arrival[] = [
      { parentId: 'p-1', distanceMeters: 100, durationMinutes: 1, routePolyline: '' },
      { parentId: 'p-2', distanceMeters: 200, durationMinutes: 2, routePolyline: '' },
    ];
    render(<ArrivalsStats arrivals={arrivals} />);
    // average = 1.5 → rounds to 2
    expect(screen.getByText('2 min')).toBeInTheDocument();
  });
});
