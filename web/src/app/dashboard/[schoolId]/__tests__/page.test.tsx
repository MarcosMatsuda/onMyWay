const mockRedirect = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: jest.fn((...args: unknown[]) => mockRedirect(...args)),
}));

import DashboardHome from '../page';

function buildParams(schoolId: string) {
  return Promise.resolve({ schoolId });
}

describe('DashboardHome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to the arrivals page for the given schoolId', async () => {
    await DashboardHome({ params: buildParams('school-123') });

    expect(mockRedirect).toHaveBeenCalledWith(
      '/dashboard/school-123/arrivals',
    );
  });

  it('redirects using the correct schoolId from params', async () => {
    await DashboardHome({ params: buildParams('school-abc') });

    expect(mockRedirect).toHaveBeenCalledWith(
      '/dashboard/school-abc/arrivals',
    );
  });

  it('calls redirect exactly once', async () => {
    await DashboardHome({ params: buildParams('school-1') });

    expect(mockRedirect).toHaveBeenCalledTimes(1);
  });
});
