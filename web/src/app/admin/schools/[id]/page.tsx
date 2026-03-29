import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSchool, getSchoolStats, UnauthorizedError } from '@/lib/server-api';
import { TOKEN_KEY } from '@/lib/auth';
import Link from 'next/link';
import { School, SchoolStats } from '@/types';

interface SchoolDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SchoolDetailPage({ params }: SchoolDetailPageProps) {
  const { id } = await params;

  let school: School | null = null;
  let stats: SchoolStats | null = null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_KEY)?.value;

    if (!token) {
      redirect('/login');
    }

    [school, stats] = await Promise.all([
      getSchool(id).catch(() => null),
      getSchoolStats(id, token).catch(() => null),
    ]);

    if (!school) {
      redirect('/admin/schools');
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/login');
    }
    console.error('Error loading school:', error);
  }

  if (!school) {
    return <div className="text-center py-12">School not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{school.name}</h1>
          <Link
            href="/admin/schools"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg divide-y">
          {/* School Information */}
          <div className="px-6 py-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">School Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="mt-1 text-sm text-gray-900">
                  {school.location.lat.toFixed(4)}, {school.location.lng.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Geofence Radius</p>
                <p className="mt-1 text-sm text-gray-900">{school.geofenceRadiusMeters}m</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Notification Threshold</p>
                <p className="mt-1 text-sm text-gray-900">
                  {school.notificationThresholdMeters}m
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="px-6 py-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Current Stats</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="bg-gray-50 px-4 py-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Total Parents</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {stats.totalParents}
                  </p>
                </div>
                <div className="bg-gray-50 px-4 py-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Avg ETA</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {Math.round(stats.avgETA)}m
                  </p>
                </div>
                <div className="bg-gray-50 px-4 py-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">&lt; 5 min</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {stats.etaLessThan5Min}
                  </p>
                </div>
                <div className="bg-gray-50 px-4 py-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">5-15 min</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {stats.eta5To15Min}
                  </p>
                </div>
                <div className="bg-gray-50 px-4 py-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">&gt; 15 min</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {stats.etaGreaterThan15Min}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 py-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Actions</h2>
            <div className="flex gap-4">
              <Link
                href={`/dashboard/${school.id}/arrivals`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
