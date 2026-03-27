import React from 'react';
import { render, screen } from '@testing-library/react';
import ArrivalsPage from '../page';
import { getSchoolArrivals, getSchool } from '@/lib/server-api';
import { TOKEN_KEY } from '@/lib/auth';

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock server-api
jest.mock('@/lib/server-api', () => ({
  getSchoolArrivals: jest.fn(),
  getSchool: jest.fn(),
}));

// Mock ArrivalsContainer to isolate page behaviour
jest.mock('@/components/arrivals/ArrivalsContainer', () => ({
  __esModule: true,
  default: ({
    schoolId,
    schoolName,
    initialArrivals,
  }: {
    schoolId: string;
    schoolName: string;
    initialArrivals: unknown[];
  }) => (
    <div data-testid="arrivals-container">
      <span data-testid="school-id">{schoolId}</span>
      <span data-testid="school-name">{schoolName}</span>
      <span data-testid="arrivals-count">{initialArrivals.length}</span>
    </div>
  ),
}));

import { cookies } from 'next/headers';

const mockCookies = cookies as jest.Mock;
const mockGetSchoolArrivals = getSchoolArrivals as jest.Mock;
const mockGetSchool = getSchool as jest.Mock;

const sampleArrivals = [
  { parentId: 'p-1', distanceMeters: 300, durationMinutes: 4, routePolyline: '' },
  { parentId: 'p-2', distanceMeters: 500, durationMinutes: 7, routePolyline: '' },
];

function buildParams(schoolId: string) {
  return Promise.resolve({ schoolId });
}

describe('ArrivalsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders ArrivalsContainer with arrivals and school name when token is present', async () => {
    mockCookies.mockResolvedValue({
      get: (key: string) => (key === TOKEN_KEY ? { value: 'valid-token' } : undefined),
    });
    mockGetSchoolArrivals.mockResolvedValue(sampleArrivals);
    mockGetSchool.mockResolvedValue({ id: 'school-1', name: 'Escola Primavera', location: {} });

    const Page = await ArrivalsPage({ params: buildParams('school-1') });
    render(Page);

    expect(screen.getByTestId('school-id')).toHaveTextContent('school-1');
    expect(screen.getByTestId('school-name')).toHaveTextContent('Escola Primavera');
    expect(screen.getByTestId('arrivals-count')).toHaveTextContent('2');
  });

  it('falls back to schoolId as schoolName when getSchool throws', async () => {
    mockCookies.mockResolvedValue({
      get: (key: string) => (key === TOKEN_KEY ? { value: 'valid-token' } : undefined),
    });
    mockGetSchoolArrivals.mockResolvedValue([]);
    mockGetSchool.mockRejectedValue(new Error('Not found'));

    const Page = await ArrivalsPage({ params: buildParams('school-42') });
    render(Page);

    expect(screen.getByTestId('school-name')).toHaveTextContent('school-42');
  });

  it('renders with empty arrivals when no token is present', async () => {
    mockCookies.mockResolvedValue({
      get: () => undefined,
    });

    const Page = await ArrivalsPage({ params: buildParams('school-1') });
    render(Page);

    expect(screen.getByTestId('arrivals-count')).toHaveTextContent('0');
    expect(mockGetSchoolArrivals).not.toHaveBeenCalled();
  });

  it('renders with empty arrivals when getSchoolArrivals throws', async () => {
    mockCookies.mockResolvedValue({
      get: (key: string) => (key === TOKEN_KEY ? { value: 'valid-token' } : undefined),
    });
    mockGetSchoolArrivals.mockRejectedValue(new Error('Unauthorized'));
    mockGetSchool.mockResolvedValue({ id: 'school-1', name: 'Escola Primavera', location: {} });

    const Page = await ArrivalsPage({ params: buildParams('school-1') });
    render(Page);

    expect(screen.getByTestId('arrivals-count')).toHaveTextContent('0');
  });

  it('passes correct schoolId from route params to ArrivalsContainer', async () => {
    mockCookies.mockResolvedValue({
      get: () => undefined,
    });

    const Page = await ArrivalsPage({ params: buildParams('school-xyz') });
    render(Page);

    expect(screen.getByTestId('school-id')).toHaveTextContent('school-xyz');
  });

  it('calls getSchoolArrivals with correct schoolId and token', async () => {
    mockCookies.mockResolvedValue({
      get: (key: string) => (key === TOKEN_KEY ? { value: 'my-token' } : undefined),
    });
    mockGetSchoolArrivals.mockResolvedValue([]);
    mockGetSchool.mockResolvedValue({ id: 'school-1', name: 'Escola', location: {} });

    await ArrivalsPage({ params: buildParams('school-1') });

    expect(mockGetSchoolArrivals).toHaveBeenCalledWith('school-1', 'my-token');
  });
});
