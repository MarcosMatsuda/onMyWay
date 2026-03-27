import { render, screen } from '@testing-library/react';
import ArrivalsMap from '../ArrivalsMap';
import { Arrival } from '@/types';

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  Polyline: () => <div data-testid="polyline" />,
}));

jest.mock('leaflet', () => ({
  Icon: jest.fn(() => ({})),
}));

jest.mock('@mapbox/polyline', () => ({
  decode: jest.fn((encoded: string) => {
    if (encoded === 'valid_polyline') {
      return [
        [-23.5505, -46.6333],
        [-23.5515, -46.6343],
      ];
    }
    return [];
  }),
}));

describe('ArrivalsMap', () => {
  const mockArrivals: Arrival[] = [
    {
      parentId: 'parent-1',
      distanceMeters: 1500,
      durationMinutes: 8,
      routePolyline: 'valid_polyline',
    },
    {
      parentId: 'parent-2',
      distanceMeters: 500,
      durationMinutes: 3,
      routePolyline: 'valid_polyline',
    },
  ];

  it('renders map container with school marker', () => {
    render(
      <ArrivalsMap
        schoolLat={-23.5505}
        schoolLng={-46.6333}
        schoolName="Test School"
        arrivals={[]}
      />,
    );

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    expect(screen.getByText('Test School')).toBeInTheDocument();
  });

  it('renders parent markers for arrivals with polylines', () => {
    render(
      <ArrivalsMap
        schoolLat={-23.5505}
        schoolLng={-46.6333}
        schoolName="Test School"
        arrivals={mockArrivals}
      />,
    );

    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBe(3);

    expect(screen.getByText('Pai #1')).toBeInTheDocument();
    expect(screen.getByText('ETA: 8 min')).toBeInTheDocument();
    expect(screen.getByText('Pai #2')).toBeInTheDocument();
    expect(screen.getByText('ETA: 3 min')).toBeInTheDocument();
  });

  it('renders polylines for valid routes', () => {
    render(
      <ArrivalsMap
        schoolLat={-23.5505}
        schoolLng={-46.6333}
        schoolName="Test School"
        arrivals={mockArrivals}
      />,
    );

    const polylines = screen.getAllByTestId('polyline');
    expect(polylines.length).toBe(2);
  });

  it('handles empty arrivals array', () => {
    render(
      <ArrivalsMap
        schoolLat={-23.5505}
        schoolLng={-46.6333}
        schoolName="Test School"
        arrivals={[]}
      />,
    );

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByText('Test School')).toBeInTheDocument();

    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBe(1);
  });

  it('skips arrivals without polylines', () => {
    const arrivalsWithoutPolyline: Arrival[] = [
      {
        parentId: 'parent-3',
        distanceMeters: 2000,
        durationMinutes: 10,
        routePolyline: '',
      },
    ];

    render(
      <ArrivalsMap
        schoolLat={-23.5505}
        schoolLng={-46.6333}
        schoolName="Test School"
        arrivals={arrivalsWithoutPolyline}
      />,
    );

    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBe(1);
  });
});
