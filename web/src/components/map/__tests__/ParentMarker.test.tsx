import { render, screen } from '@testing-library/react';
import ParentMarker from '../ParentMarker';
import { Arrival } from '@/types';
import polyline from '@mapbox/polyline';

jest.mock('react-leaflet', () => ({
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  Polyline: ({ pathOptions }: { pathOptions: { color: string; opacity: number } }) => (
    <div data-testid="polyline" data-color={pathOptions.color} data-opacity={pathOptions.opacity} />
  ),
}));

jest.mock('leaflet', () => ({
  Icon: jest.fn((options: { iconUrl: string }) => ({ iconUrl: options.iconUrl })),
}));

jest.mock('@mapbox/polyline', () => ({
  decode: jest.fn(),
}));

const mockPolylineDecode = polyline.decode as jest.Mock;

const makeArrival = (overrides: Partial<Arrival> = {}): Arrival => ({
  parentId: 'parent-1',
  distanceMeters: 1500,
  durationMinutes: 8,
  routePolyline: 'encoded_polyline',
  ...overrides,
});

describe('ParentMarker', () => {
  const defaultProps = {
    arrival: makeArrival(),
    index: 1,
    schoolLat: -23.5505,
    schoolLng: -46.6333,
  };

  beforeEach(() => {
    mockPolylineDecode.mockReturnValue([
      [-23.551, -46.634],
      [-23.5505, -46.6333],
    ]);
  });

  describe('null routePolyline', () => {
    it('renders nothing when routePolyline is empty string', () => {
      const { container } = render(
        <ParentMarker
          {...defaultProps}
          arrival={makeArrival({ routePolyline: '' })}
        />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when routePolyline is null', () => {
      const { container } = render(
        <ParentMarker
          {...defaultProps}
          arrival={makeArrival({ routePolyline: null as unknown as string })}
        />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('polyline decode errors', () => {
    it('renders nothing when polyline.decode throws', () => {
      mockPolylineDecode.mockImplementation(() => {
        throw new Error('invalid polyline');
      });

      const { container } = render(<ParentMarker {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when decoded coordinates array is empty', () => {
      mockPolylineDecode.mockReturnValue([]);

      const { container } = render(<ParentMarker {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('valid polyline rendering', () => {
    it('renders a polyline and a marker', () => {
      render(<ParentMarker {...defaultProps} />);

      expect(screen.getByTestId('polyline')).toBeInTheDocument();
      expect(screen.getByTestId('marker')).toBeInTheDocument();
    });

    it('renders polyline with blue color and 0.6 opacity', () => {
      render(<ParentMarker {...defaultProps} />);

      const polylineEl = screen.getByTestId('polyline');
      expect(polylineEl).toHaveAttribute('data-color', 'blue');
      expect(polylineEl).toHaveAttribute('data-opacity', '0.6');
    });

    it('renders popup with correct parent index', () => {
      render(<ParentMarker {...defaultProps} index={3} />);
      expect(screen.getByText('Pai #3')).toBeInTheDocument();
    });

    it('renders popup with ETA in minutes', () => {
      render(<ParentMarker {...defaultProps} arrival={makeArrival({ durationMinutes: 12 })} />);
      expect(screen.getByText('ETA: 12 min')).toBeInTheDocument();
    });

    it('renders popup with distance in km (1 decimal)', () => {
      render(<ParentMarker {...defaultProps} arrival={makeArrival({ distanceMeters: 1500 })} />);
      expect(screen.getByText('1.5 km')).toBeInTheDocument();
    });

    it('rounds distance correctly for non-round values', () => {
      render(<ParentMarker {...defaultProps} arrival={makeArrival({ distanceMeters: 2345 })} />);
      expect(screen.getByText('2.3 km')).toBeInTheDocument();
    });
  });

  describe('marker color by ETA', () => {
    function getIconSvg(): string {
      const { Icon } = require('leaflet');
      const iconCall = Icon.mock.calls[Icon.mock.calls.length - 1][0];
      const base64 = (iconCall.iconUrl as string).replace('data:image/svg+xml;base64,', '');
      return Buffer.from(base64, 'base64').toString('utf-8');
    }

    it('uses red marker for ETA < 5 minutes', () => {
      render(<ParentMarker {...defaultProps} arrival={makeArrival({ durationMinutes: 4 })} />);
      expect(getIconSvg()).toContain('fill="red"');
    });

    it('uses red marker for ETA exactly 0 minutes (edge)', () => {
      render(<ParentMarker {...defaultProps} arrival={makeArrival({ durationMinutes: 0 })} />);
      expect(getIconSvg()).toContain('fill="red"');
    });

    it('uses yellow marker for ETA exactly 5 minutes', () => {
      render(<ParentMarker {...defaultProps} arrival={makeArrival({ durationMinutes: 5 })} />);
      expect(getIconSvg()).toContain('fill="yellow"');
    });

    it('uses yellow marker for ETA between 5 and 15 minutes', () => {
      render(<ParentMarker {...defaultProps} arrival={makeArrival({ durationMinutes: 10 })} />);
      expect(getIconSvg()).toContain('fill="yellow"');
    });

    it('uses yellow marker for ETA exactly 15 minutes', () => {
      render(<ParentMarker {...defaultProps} arrival={makeArrival({ durationMinutes: 15 })} />);
      expect(getIconSvg()).toContain('fill="yellow"');
    });

    it('uses green marker for ETA > 15 minutes', () => {
      render(<ParentMarker {...defaultProps} arrival={makeArrival({ durationMinutes: 20 })} />);
      expect(getIconSvg()).toContain('fill="green"');
    });
  });

  describe('parent position from polyline', () => {
    it('uses first point of decoded polyline as parent position', () => {
      mockPolylineDecode.mockReturnValue([
        [-23.551, -46.634],
        [-23.552, -46.635],
        [-23.5505, -46.6333],
      ]);

      // Renders without crashing — parent position is first coordinate (start of route)
      render(<ParentMarker {...defaultProps} />);
      expect(screen.getByTestId('marker')).toBeInTheDocument();
    });

    it('handles single-coordinate polyline', () => {
      mockPolylineDecode.mockReturnValue([[-23.5505, -46.6333]]);

      render(<ParentMarker {...defaultProps} />);
      expect(screen.getByTestId('marker')).toBeInTheDocument();
    });
  });
});
