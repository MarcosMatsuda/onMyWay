import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TOKEN_KEY } from '@/lib/auth';
import { getSchoolAdmins } from '@/lib/server-api';
import { AdminsManager } from '@/components/admins/AdminsManager';

interface AdminsPageProps {
  params: Promise<{ schoolId: string }>;
}

export default async function AdminsPage({ params }: AdminsPageProps) {
  const { schoolId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value;

  if (!token) {
    redirect('/login');
  }

  const admins = await getSchoolAdmins(schoolId, token).catch(() => []);

  return (
    <div className="p-8">
      <AdminsManager schoolId={schoolId} initialAdmins={admins} />
    </div>
  );
}
