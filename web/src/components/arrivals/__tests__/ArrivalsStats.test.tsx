import React from 'react';
import { render, screen } from '@testing-library/react';
import ArrivalsStats from '../ArrivalsStats';
import { SchoolStats } from '@/types';

describe('ArrivalsStats', () => {
  it('shows skeleton placeholders when stats is null', () => {
    const { container } = render(<ArrivalsStats stats={null} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(4);
  });

  it('renders all four stat cards with backend data', () => {
    const stats: SchoolStats = {
      totalParents: 12,
      avgETA: 8,
      etaLessThan5Min: 3,
      eta5To15Min: 7,
      etaGreaterThan15Min: 2,
    };
    render(<ArrivalsStats stats={stats} />);

    expect(screen.getByText('Pais a caminho')).toBeInTheDocument();
    expect(screen.getByText('Tempo médio')).toBeInTheDocument();
    expect(screen.getByText('menos de 5 min')).toBeInTheDocument();
    expect(screen.getByText('5 a 15 min')).toBeInTheDocument();
  });

  it('displays total parents correctly', () => {
    const stats: SchoolStats = {
      totalParents: 15,
      avgETA: 10,
      etaLessThan5Min: 4,
      eta5To15Min: 8,
      etaGreaterThan15Min: 3,
    };
    render(<ArrivalsStats stats={stats} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('displays average ETA with min suffix', () => {
    const stats: SchoolStats = {
      totalParents: 10,
      avgETA: 12,
      etaLessThan5Min: 2,
      eta5To15Min: 6,
      etaGreaterThan15Min: 2,
    };
    render(<ArrivalsStats stats={stats} />);
    expect(screen.getByText('12 min')).toBeInTheDocument();
  });

  it('displays ETA breakdowns correctly', () => {
    const stats: SchoolStats = {
      totalParents: 20,
      avgETA: 9,
      etaLessThan5Min: 5,
      eta5To15Min: 12,
      etaGreaterThan15Min: 3,
    };
    render(<ArrivalsStats stats={stats} />);
    expect(screen.getByText('5')).toBeInTheDocument(); // less than 5 min
    expect(screen.getByText('12')).toBeInTheDocument(); // 5 to 15 min
  });

  it('shows zero values when no parents', () => {
    const stats: SchoolStats = {
      totalParents: 0,
      avgETA: 0,
      etaLessThan5Min: 0,
      eta5To15Min: 0,
      etaGreaterThan15Min: 0,
    };
    render(<ArrivalsStats stats={stats} />);
    expect(screen.getAllByText('0')).toHaveLength(3); // total, less than 5, 5 to 15
    expect(screen.getByText('0 min')).toBeInTheDocument(); // avg ETA
  });

  it('uses grid layout with 2 columns on mobile and 4 on desktop', () => {
    const stats: SchoolStats = {
      totalParents: 10,
      avgETA: 8,
      etaLessThan5Min: 3,
      eta5To15Min: 5,
      etaGreaterThan15Min: 2,
    };
    const { container } = render(<ArrivalsStats stats={stats} />);
    const gridDiv = container.querySelector('.grid');
    expect(gridDiv).toHaveClass('grid-cols-2');
    expect(gridDiv).toHaveClass('md:grid-cols-4');
  });

  it('does not render a card for etaGreaterThan15Min', () => {
    const stats: SchoolStats = {
      totalParents: 5,
      avgETA: 20,
      etaLessThan5Min: 0,
      eta5To15Min: 1,
      etaGreaterThan15Min: 4,
    };
    render(<ArrivalsStats stats={stats} />);
    expect(screen.queryByText('mais de 15 min')).not.toBeInTheDocument();
    expect(screen.queryByText('4')).not.toBeInTheDocument();
  });

  it('renders exactly 4 stat cards when stats provided', () => {
    const stats: SchoolStats = {
      totalParents: 3,
      avgETA: 7,
      etaLessThan5Min: 1,
      eta5To15Min: 2,
      etaGreaterThan15Min: 0,
    };
    const { container } = render(<ArrivalsStats stats={stats} />);
    const cards = container.querySelectorAll('.bg-white.rounded-lg');
    expect(cards).toHaveLength(4);
  });

  it('skeleton grid uses same layout as data grid', () => {
    const { container } = render(<ArrivalsStats stats={null} />);
    const gridDiv = container.querySelector('.grid');
    expect(gridDiv).toHaveClass('grid-cols-2');
    expect(gridDiv).toHaveClass('md:grid-cols-4');
  });
});
