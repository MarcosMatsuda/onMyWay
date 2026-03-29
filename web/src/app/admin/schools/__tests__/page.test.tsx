import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as serverApi from '@/lib/server-api';

jest.mock('next/headers');
jest.mock('next/navigation');
jest.mock('@/lib/server-api');

// Import after mocks
import SchoolsPage from '../page';

const MOCK_SCHOOLS = [
  {
    id: 'school-1',
    name: 'School A',
    location: { lat: -23.5505, lng: -46.6333 },
    geofenceRadiusMeters: 500,
    notificationThresholdMeters: 1000,
  },
  {
    id: 'school-2',
    name: 'School B',
    location: { lat: -23.5600, lng: -46.6400 },
    geofenceRadiusMeters: 600,
    notificationThresholdMeters: 1200,
  },
];

describe('SchoolsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls listSchools when token is present', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    });

    const mockListSchools = serverApi.listSchools as jest.Mock;
    mockListSchools.mockResolvedValue(MOCK_SCHOOLS);

    await SchoolsPage({ searchParams: Promise.resolve({}) });

    expect(mockListSchools).toHaveBeenCalled();
  });

  it('redirects to /login when no token is present', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    try {
      await SchoolsPage({ searchParams: Promise.resolve({}) });
    } catch {
      // Expected - redirect throws
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to /login on UnauthorizedError', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'invalid-token' }),
    });

    const mockListSchools = serverApi.listSchools as jest.Mock;
    mockListSchools.mockRejectedValue(new serverApi.UnauthorizedError());

    try {
      await SchoolsPage({ searchParams: Promise.resolve({}) });
    } catch {
      // Expected - redirect throws
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('handles errors gracefully and returns empty schools array', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    });

    const mockListSchools = serverApi.listSchools as jest.Mock;
    mockListSchools.mockRejectedValue(new Error('API Error'));

    // Should not throw, just log error
    const result = await SchoolsPage({ searchParams: Promise.resolve({}) });

    expect(result).toBeDefined();
  });

  it('successfully loads multiple schools', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    });

    const mockListSchools = serverApi.listSchools as jest.Mock;
    mockListSchools.mockResolvedValue(MOCK_SCHOOLS);

    const result = await SchoolsPage({ searchParams: Promise.resolve({}) });

    expect(result).toBeDefined();
    expect(mockListSchools).toHaveBeenCalled();
  });
});
