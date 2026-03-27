const mockGet = jest.fn();
const mockUpdateSchoolConfig = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/lib/server-api', () => ({
  updateSchoolConfig: jest.fn(),
}));

import { cookies } from 'next/headers';
import { updateSchoolConfig } from '@/lib/server-api';
import { updateSchoolConfigAction } from '../update-school-config.action';

const mockCookies = cookies as jest.Mock;
const mockUpdateSchoolConfigFn = updateSchoolConfig as jest.Mock;

const config = { geofenceRadiusMeters: 500, notificationThresholdMeters: 300 };

describe('updateSchoolConfigAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies.mockResolvedValue({ get: mockGet });
  });

  it('returns success with data when token is present', async () => {
    mockGet.mockReturnValue({ value: 'valid-token' });
    mockUpdateSchoolConfigFn.mockResolvedValue(config);

    const result = await updateSchoolConfigAction('school-1', config);

    expect(result).toEqual({ success: true, data: config });
    expect(mockUpdateSchoolConfigFn).toHaveBeenCalledWith('school-1', config, 'valid-token');
  });

  it('returns error when no token in cookies', async () => {
    mockGet.mockReturnValue(undefined);

    const result = await updateSchoolConfigAction('school-1', config);

    expect(result).toEqual({ success: false, error: 'Não autenticado' });
    expect(mockUpdateSchoolConfigFn).not.toHaveBeenCalled();
  });

  it('returns error when API call throws', async () => {
    mockGet.mockReturnValue({ value: 'valid-token' });
    mockUpdateSchoolConfigFn.mockRejectedValue(new Error('Server error'));

    const result = await updateSchoolConfigAction('school-1', config);

    expect(result).toEqual({
      success: false,
      error: 'Erro ao atualizar configurações. Tente novamente.',
    });
  });
});
