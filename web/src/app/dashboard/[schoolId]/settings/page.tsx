import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TOKEN_KEY } from '@/lib/auth';
import { getSchool } from '@/lib/server-api';
import { SchoolSettingsForm } from '@/components/settings/SchoolSettingsForm';

interface SettingsPageProps {
  params: Promise<{ schoolId: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { schoolId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value;

  if (!token) {
    redirect('/login');
  }

  const school = await getSchool(schoolId).catch(() => null);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações da Escola</h1>
        <p className="text-gray-600 mt-2">
          Configure as preferências de geolocalização e notificações
        </p>
      </div>

      <SchoolSettingsForm
        schoolId={schoolId}
        initialGeofenceRadius={school?.geofenceRadiusMeters ?? 500}
        initialNotificationThreshold={school?.notificationThresholdMeters ?? 300}
      />
    </div>
  );
}
