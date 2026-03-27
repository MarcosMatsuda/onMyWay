import React from 'react';
import { render, screen } from '@testing-library/react';
import ArrivalsQueue from '../ArrivalsQueue';
import { Arrival } from '@/types';

describe('ArrivalsQueue', () => {
  const sampleArrivals: Arrival[] = [
    { parentId: 'parent-1', distanceMeters: 500, durationMinutes: 10, routePolyline: '' },
    { parentId: 'parent-2', distanceMeters: 200, durationMinutes: 3, routePolyline: '' },
  ];

  it('shows empty state when no arrivals', () => {
    render(<ArrivalsQueue arrivals={[]} />);
    expect(screen.getByText('Nenhum pai a caminho no momento.')).toBeInTheDocument();
  });

  it('renders arrival list when arrivals present', () => {
    render(<ArrivalsQueue arrivals={sampleArrivals} />);
    expect(screen.getByText('Parent ID: parent-1')).toBeInTheDocument();
    expect(screen.getByText('Parent ID: parent-2')).toBeInTheDocument();
  });

  it('displays ETA and distance for each arrival', () => {
    render(<ArrivalsQueue arrivals={sampleArrivals} />);
    expect(screen.getByText('10 min · 500 m')).toBeInTheDocument();
    expect(screen.getByText('3 min · 200 m')).toBeInTheDocument();
  });

  it('renders one list item per arrival', () => {
    const threeArrivals: Arrival[] = [
      { parentId: 'p-1', distanceMeters: 100, durationMinutes: 2, routePolyline: '' },
      { parentId: 'p-2', distanceMeters: 200, durationMinutes: 4, routePolyline: '' },
      { parentId: 'p-3', distanceMeters: 300, durationMinutes: 8, routePolyline: '' },
    ];
    render(<ArrivalsQueue arrivals={threeArrivals} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
