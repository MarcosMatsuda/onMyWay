import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as serverApi from '@/lib/server-api';

jest.mock('next/headers');
jest.mock('next/navigation');
jest.mock('@/lib/server-api');

// Import after mocks
import SchoolDetailPage from '../[id]/page';

const MOCK_SCHOOL = {
  id: 'school-1',
  name: 'Test School',
  location: { lat: -23.5505, lng: -46.6333 },
  geofenceRadiusMeters: 500,
  notificationThresholdMeters: 1000,
};

const MOCK_STATS = {
  totalParents: 50,
  avgETA: 12.5,
  etaLessThan5Min: 10,
  eta5To15Min: 25,
  etaGreaterThan15Min: 15,
};

describe('SchoolDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getSchool and getSchoolStats when token is present', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    });

    const mockGetSchool = serverApi.getSchool as jest.Mock;
    const mockGetSchoolStats = serverApi.getSchoolStats as jest.Mock;
    mockGetSchool.mockResolvedValue(MOCK_SCHOOL);
    mockGetSchoolStats.mockResolvedValue(MOCK_STATS);

    await SchoolDetailPage({ params: Promise.resolve({ id: 'school-1' }) });

    expect(mockGetSchool).toHaveBeenCalledWith('school-1');
    expect(mockGetSchoolStats).toHaveBeenCalledWith('school-1', 'valid-token');
  });

  it('redirects to /login when no token is present', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    try {
      await SchoolDetailPage({ params: Promise.resolve({ id: 'school-1' }) });
    } catch {
      // Expected - redirect throws
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to /admin/schools when school is not found', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    });

    const mockGetSchool = serverApi.getSchool as jest.Mock;
    const mockGetSchoolStats = serverApi.getSchoolStats as jest.Mock;
    mockGetSchool.mockResolvedValue(null);
    mockGetSchoolStats.mockResolvedValue(MOCK_STATS);

    try {
      await SchoolDetailPage({ params: Promise.resolve({ id: 'nonexistent' }) });
    } catch {
      // Expected - redirect throws
    }

    expect(redirect).toHaveBeenCalledWith('/admin/schools');
  });

  it('handles getSchoolStats error gracefully', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    });

    const mockGetSchool = serverApi.getSchool as jest.Mock;
    const mockGetSchoolStats = serverApi.getSchoolStats as jest.Mock;
    mockGetSchool.mockResolvedValue(MOCK_SCHOOL);
    mockGetSchoolStats.mockRejectedValue(new Error('Stats error'));

    const result = await SchoolDetailPage({ params: Promise.resolve({ id: 'school-1' }) });

    expect(result).toBeDefined();
    expect(mockGetSchool).toHaveBeenCalled();
  });

  it('redirects to /admin/schools when getSchool fails with any error', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'invalid-token' }),
    });

    const mockGetSchool = serverApi.getSchool as jest.Mock;
    const mockGetSchoolStats = serverApi.getSchoolStats as jest.Mock;
    mockGetSchool.mockRejectedValue(new serverApi.UnauthorizedError());
    mockGetSchoolStats.mockResolvedValue(MOCK_STATS);

    try {
      await SchoolDetailPage({ params: Promise.resolve({ id: 'school-1' }) });
    } catch {
      // Expected - redirect throws
    }

    expect(redirect).toHaveBeenCalledWith('/admin/schools');
  });

  it('successfully loads school with stats', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    });

    const mockGetSchool = serverApi.getSchool as jest.Mock;
    const mockGetSchoolStats = serverApi.getSchoolStats as jest.Mock;
    mockGetSchool.mockResolvedValue(MOCK_SCHOOL);
    mockGetSchoolStats.mockResolvedValue(MOCK_STATS);

    const result = await SchoolDetailPage({ params: Promise.resolve({ id: 'school-1' }) });

    expect(result).toBeDefined();
    expect(mockGetSchool).toHaveBeenCalled();
    expect(mockGetSchoolStats).toHaveBeenCalled();
  });
});
