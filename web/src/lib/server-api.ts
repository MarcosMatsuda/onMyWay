import { Arrival, School, SchoolStats, SchoolConfig, SchoolParent, SchoolAdmin } from '@/types';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

function getBaseURL(): string {
  return process.env.API_URL || 'http://localhost:3000';
}

async function serverFetch<T>(
  path: string,
  token?: string,
  options?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${getBaseURL()}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function listSchools(): Promise<School[]> {
  return serverFetch<School[]>('/schools');
}

export async function getSchool(schoolId: string): Promise<School> {
  return serverFetch<School>(`/schools/${schoolId}`);
}

export async function getSchoolArrivals(
  schoolId: string,
  token: string,
): Promise<Arrival[]> {
  return serverFetch<Arrival[]>(`/schools/${schoolId}/arrivals`, token);
}

export async function getSchoolStats(
  schoolId: string,
  token: string,
): Promise<SchoolStats> {
  return serverFetch<SchoolStats>(`/schools/${schoolId}/stats`, token);
}

export async function updateSchoolConfig(
  schoolId: string,
  config: SchoolConfig,
  token: string,
): Promise<SchoolConfig> {
  return serverFetch<SchoolConfig>(`/schools/${schoolId}/config`, token, {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function createSchool(
  data: Omit<School, 'id'>,
  token: string,
): Promise<School> {
  return serverFetch<School>('/schools', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSchoolInvite(
  schoolId: string,
  token: string,
): Promise<{ inviteCode: string }> {
  return serverFetch<{ inviteCode: string }>(
    `/admin/schools/${schoolId}/invite`,
    token,
  );
}

export async function regenerateSchoolInvite(
  schoolId: string,
  token: string,
): Promise<{ inviteCode: string }> {
  return serverFetch<{ inviteCode: string }>(
    `/admin/schools/${schoolId}/regenerate-invite`,
    token,
    { method: 'POST' },
  );
}

export async function getSchoolParents(
  schoolId: string,
  token: string,
): Promise<SchoolParent[]> {
  return serverFetch<SchoolParent[]>(`/admin/schools/${schoolId}/parents`, token);
}

export async function removeSchoolParent(
  schoolId: string,
  parentId: string,
  token: string,
): Promise<void> {
  await serverFetch<void>(
    `/admin/schools/${schoolId}/parents/${parentId}`,
    token,
    { method: 'DELETE' },
  );
}

export async function getSchoolAdmins(
  schoolId: string,
  token: string,
): Promise<SchoolAdmin[]> {
  return serverFetch<SchoolAdmin[]>(`/admin/schools/${schoolId}/admins`, token);
}

export async function createSchoolAdmin(
  data: { name: string; email: string; password: string; schoolId: string },
  token: string,
): Promise<SchoolAdmin> {
  return serverFetch<SchoolAdmin>('/admin/users', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminUser(
  userId: string,
  token: string,
): Promise<void> {
  await serverFetch<void>(`/admin/users/${userId}`, token, { method: 'DELETE' });
}
