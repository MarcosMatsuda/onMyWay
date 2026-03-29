import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSchool, UnauthorizedError } from '@/lib/server-api';
import NewSchoolForm from '@/components/admin/NewSchoolForm';
import { TOKEN_KEY } from '@/lib/auth';

export default async function NewSchoolPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value;

  if (!token) {
    redirect('/login');
  }

  const handleCreateSchool = async (formData: FormData) => {
    'use server';

    const name = formData.get('name') as string;
    const lat = parseFloat(formData.get('lat') as string);
    const lng = parseFloat(formData.get('lng') as string);
    const geofenceRadiusMeters = parseInt(formData.get('geofenceRadiusMeters') as string);
    const notificationThresholdMeters = parseInt(
      formData.get('notificationThresholdMeters') as string,
    );

    try {
      await createSchool(
        {
          name,
          location: { lat, lng },
          geofenceRadiusMeters,
          notificationThresholdMeters,
        },
        token,
      );

      redirect('/admin/schools');
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        redirect('/login');
      }
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New School</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <NewSchoolForm onSubmit={handleCreateSchool} />
        </div>
      </div>
    </div>
  );
}
