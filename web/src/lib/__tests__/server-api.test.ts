import {
  listSchools,
  getSchool,
  getSchoolArrivals,
  getSchoolStats,
  updateSchoolConfig,
} from '../server-api';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockOkResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(data),
  } as Response);
}

function mockErrorResponse(status: number, statusText: string) {
  return Promise.resolve({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({}),
  } as Response);
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('listSchools', () => {
  it('returns list of schools', async () => {
    const schools = [
      { id: 'school-1', name: 'School A', location: { lat: -23.5, lng: -46.6 } },
    ];
    mockFetch.mockReturnValueOnce(mockOkResponse(schools));

    const result = await listSchools();

    expect(result).toEqual(schools);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/schools'),
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    );
  });

  it('returns empty array when no schools exist', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse([]));

    const result = await listSchools();

    expect(result).toEqual([]);
  });

  it('does not send Authorization header', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse([]));

    await listSchools();

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers).not.toHaveProperty('Authorization');
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockReturnValueOnce(mockErrorResponse(500, 'Internal Server Error'));

    await expect(listSchools()).rejects.toThrow('API error: 500 Internal Server Error');
  });

  it('propagates network errors (fetch rejects)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    await expect(listSchools()).rejects.toThrow('Network failure');
  });
});

describe('getSchool', () => {
  it('returns a single school by id', async () => {
    const school = { id: 'school-1', name: 'School A', location: { lat: -23.5, lng: -46.6 } };
    mockFetch.mockReturnValueOnce(mockOkResponse(school));

    const result = await getSchool('school-1');

    expect(result).toEqual(school);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/schools/school-1'),
      expect.any(Object),
    );
  });

  it('does not send Authorization header', async () => {
    const school = { id: 'school-1', name: 'School A', location: { lat: -23.5, lng: -46.6 } };
    mockFetch.mockReturnValueOnce(mockOkResponse(school));

    await getSchool('school-1');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers).not.toHaveProperty('Authorization');
  });

  it('throws on 404', async () => {
    mockFetch.mockReturnValueOnce(mockErrorResponse(404, 'Not Found'));

    await expect(getSchool('missing-id')).rejects.toThrow('API error: 404 Not Found');
  });

  it('propagates network errors (fetch rejects)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    await expect(getSchool('school-1')).rejects.toThrow('Network failure');
  });
});

describe('getSchoolArrivals', () => {
  it('returns arrivals with Authorization header', async () => {
    const arrivals = [
      { parentId: 'p-1', distanceMeters: 300, durationMinutes: 4, routePolyline: 'abc' },
    ];
    mockFetch.mockReturnValueOnce(mockOkResponse(arrivals));

    const result = await getSchoolArrivals('school-1', 'my-token');

    expect(result).toEqual(arrivals);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/schools/school-1/arrivals'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
      }),
    );
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockReturnValueOnce(mockErrorResponse(401, 'Unauthorized'));

    await expect(getSchoolArrivals('school-1', 'bad-token')).rejects.toThrow(
      'API error: 401 Unauthorized',
    );
  });

  it('returns empty array when no arrivals exist', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse([]));

    const result = await getSchoolArrivals('school-1', 'my-token');

    expect(result).toEqual([]);
  });

  it('propagates network errors (fetch rejects)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    await expect(getSchoolArrivals('school-1', 'my-token')).rejects.toThrow('Network failure');
  });
});

describe('getSchoolStats', () => {
  it('returns school stats with Authorization header', async () => {
    const stats = {
      totalParents: 10,
      avgETA: 8,
      etaLessThan5Min: 3,
      eta5To15Min: 5,
      etaGreaterThan15Min: 2,
    };
    mockFetch.mockReturnValueOnce(mockOkResponse(stats));

    const result = await getSchoolStats('school-1', 'my-token');

    expect(result).toEqual(stats);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/schools/school-1/stats'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
      }),
    );
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockReturnValueOnce(mockErrorResponse(403, 'Forbidden'));

    await expect(getSchoolStats('school-1', 'bad-token')).rejects.toThrow(
      'API error: 403 Forbidden',
    );
  });

  it('propagates network errors (fetch rejects)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    await expect(getSchoolStats('school-1', 'my-token')).rejects.toThrow('Network failure');
  });
});

describe('updateSchoolConfig', () => {
  const config = { geofenceRadiusMeters: 500, notificationThresholdMeters: 300 };

  it('sends POST to /schools/:id/config with Authorization header and body', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(config));

    const result = await updateSchoolConfig('school-1', config, 'my-token');

    expect(result).toEqual(config);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/schools/school-1/config'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(config),
        headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
      }),
    );
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockReturnValueOnce(mockErrorResponse(401, 'Unauthorized'));

    await expect(updateSchoolConfig('school-1', config, 'bad-token')).rejects.toThrow(
      'API error: 401 Unauthorized',
    );
  });

  it('propagates network errors (fetch rejects)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    await expect(updateSchoolConfig('school-1', config, 'my-token')).rejects.toThrow(
      'Network failure',
    );
  });
});
