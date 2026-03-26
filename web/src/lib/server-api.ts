import { Arrival, School, SchoolStats } from '@/types';

const baseURL = process.env.API_URL || 'http://localhost:3000';

async function serverFetch<T>(
  path: string,
  token?: string,
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseURL}${path}`, { headers });

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
