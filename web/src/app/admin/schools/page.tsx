import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { listSchools, UnauthorizedError } from '@/lib/server-api';
import { TOKEN_KEY } from '@/lib/auth';
import Link from 'next/link';
import { School } from '@/types';

interface SchoolsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SchoolsPage({ searchParams }: SchoolsPageProps) {
  let schools: School[] = [];

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_KEY)?.value;

    if (!token) {
      redirect('/login');
    }

    schools = await listSchools();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/login');
    }
    console.error('Error loading schools:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Schools</h1>
          <Link
            href="/admin/schools/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            New School
          </Link>
        </div>

        {schools.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No schools yet</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Geofence Radius
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {school.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {school.location.lat.toFixed(4)}, {school.location.lng.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {school.geofenceRadiusMeters}m
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/schools/${school.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
