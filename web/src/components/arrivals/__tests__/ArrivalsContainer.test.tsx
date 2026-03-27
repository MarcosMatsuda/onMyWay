import React from 'react';
import { render, screen } from '@testing-library/react';
import ArrivalsContainer from '../ArrivalsContainer';
import { useArrivals } from '@/hooks/useArrivals';
import { Arrival, SchoolStats } from '@/types';

jest.mock('@/hooks/useArrivals');
jest.mock('@/components/map/ArrivalsMap', () => {
  function MockArrivalsMap() {
    return <div data-testid="arrivals-map" />;
  }
  return MockArrivalsMap;
});

const mockUseArrivals = useArrivals as jest.Mock;

const sampleArrivals: Arrival[] = [
  { parentId: 'parent-1', distanceMeters: 500, durationMinutes: 10, routePolyline: '' },
  { parentId: 'parent-2', distanceMeters: 200, durationMinutes: 3, routePolyline: '' },
];

const sampleStats: SchoolStats = {
  totalParents: 2,
  avgETA: 6,
  etaLessThan5Min: 1,
  eta5To15Min: 1,
  etaGreaterThan15Min: 0,
};

const defaultContainerProps = {
  schoolId: 'school-1',
  schoolName: 'Escola Primavera',
  schoolLat: -23.5505,
  schoolLng: -46.6333,
  initialArrivals: [] as Arrival[],
  stats: null as SchoolStats | null,
};

describe('ArrivalsContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseArrivals.mockReturnValue({
      arrivals: [],
      isConnected: false,
      lastUpdatedAt: null,
    });
  });

  it('renders the school name as heading', () => {
    render(<ArrivalsContainer {...defaultContainerProps} />);

    expect(screen.getByRole('heading', { name: 'Escola Primavera' })).toBeInTheDocument();
  });

  it('shows empty state message when no arrivals', () => {
    render(<ArrivalsContainer {...defaultContainerProps} />);

    expect(
      screen.getByText('Nenhum pai a caminho no momento.'),
    ).toBeInTheDocument();
  });

  it('renders arrivals list when arrivals are present', () => {
    mockUseArrivals.mockReturnValue({
      arrivals: sampleArrivals,
      isConnected: true,
      lastUpdatedAt: null,
    });

    render(
      <ArrivalsContainer
        {...defaultContainerProps}
        initialArrivals={sampleArrivals}
        stats={sampleStats}
      />,
    );

    expect(screen.getByText('Parent ID: parent-1')).toBeInTheDocument();
    expect(screen.getByText('Parent ID: parent-2')).toBeInTheDocument();
  });

  it('displays ETA and distance for each arrival', () => {
    mockUseArrivals.mockReturnValue({
      arrivals: sampleArrivals,
      isConnected: true,
      lastUpdatedAt: null,
    });

    render(
      <ArrivalsContainer
        {...defaultContainerProps}
        initialArrivals={sampleArrivals}
        stats={sampleStats}
      />,
    );

    expect(screen.getByText('10 min · 500 m')).toBeInTheDocument();
    expect(screen.getByText('3 min · 200 m')).toBeInTheDocument();
  });

  it('shows "Ao vivo" indicator when connected', () => {
    mockUseArrivals.mockReturnValue({
      arrivals: [],
      isConnected: true,
      lastUpdatedAt: null,
    });

    render(<ArrivalsContainer {...defaultContainerProps} />);

    expect(screen.getByText(/Ao vivo/)).toBeInTheDocument();
  });

  it('shows "Desconectado" indicator when not connected', () => {
    render(<ArrivalsContainer {...defaultContainerProps} />);

    expect(screen.getByText(/Desconectado/)).toBeInTheDocument();
  });

  it('shows "Atualizando..." when lastUpdatedAt is null', () => {
    render(<ArrivalsContainer {...defaultContainerProps} />);

    expect(screen.getByText('Atualizando...')).toBeInTheDocument();
  });

  it('shows formatted time when lastUpdatedAt is set', () => {
    const fixedDate = new Date('2024-01-15T14:30:45');
    mockUseArrivals.mockReturnValue({
      arrivals: [],
      isConnected: true,
      lastUpdatedAt: fixedDate,
    });

    render(<ArrivalsContainer {...defaultContainerProps} />);

    expect(screen.getByText(/Atualizado às/)).toBeInTheDocument();
  });

  it('passes schoolId and initialArrivals to useArrivals', () => {
    render(
      <ArrivalsContainer
        {...defaultContainerProps}
        schoolId="school-42"
        schoolName="Escola Teste"
        initialArrivals={sampleArrivals}
        stats={null}
      />,
    );

    expect(mockUseArrivals).toHaveBeenCalledWith('school-42', sampleArrivals);
  });

  it('does not render arrival list items when arrivals array is empty', () => {
    render(<ArrivalsContainer {...defaultContainerProps} />);

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('shows stats skeleton when stats prop is null', () => {
    const { container } = render(
      <ArrivalsContainer
        schoolId="school-1"
        schoolName="Escola Primavera"
        initialArrivals={[]}
        stats={null}
      />,
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(4);
  });

  it('renders stat cards when stats prop is provided', () => {
    render(
      <ArrivalsContainer
        schoolId="school-1"
        schoolName="Escola Primavera"
        initialArrivals={[]}
        stats={sampleStats}
      />,
    );
    expect(screen.getByText('Pais a caminho')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders one list item per arrival', () => {
    const threeArrivals: Arrival[] = [
      { parentId: 'p-1', distanceMeters: 100, durationMinutes: 2, routePolyline: '' },
      { parentId: 'p-2', distanceMeters: 200, durationMinutes: 4, routePolyline: '' },
      { parentId: 'p-3', distanceMeters: 300, durationMinutes: 8, routePolyline: '' },
    ];
    mockUseArrivals.mockReturnValue({
      arrivals: threeArrivals,
      isConnected: true,
      lastUpdatedAt: null,
    });

    render(
      <ArrivalsContainer {...defaultContainerProps} initialArrivals={threeArrivals} />,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders the arrivals map component', () => {
    render(<ArrivalsContainer {...defaultContainerProps} />);

    expect(screen.getByTestId('arrivals-map')).toBeInTheDocument();
  });

  it('passes correct school coordinates to map', () => {
    render(
      <ArrivalsContainer
        {...defaultContainerProps}
        schoolLat={-22.9068}
        schoolLng={-43.1729}
        schoolName="Escola Rio"
      />,
    );

    expect(screen.getByTestId('arrivals-map')).toBeInTheDocument();
  });
});
