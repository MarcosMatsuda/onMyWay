import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TOKEN_KEY } from '@/lib/auth';
import { getSchoolInvite } from '@/lib/server-api';
import { InviteCodeCard } from '@/components/invite/InviteCodeCard';

interface InvitePageProps {
  params: Promise<{ schoolId: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { schoolId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value;

  if (!token) {
    redirect('/login');
  }

  const { inviteCode } = await getSchoolInvite(schoolId, token);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Código de Convite</h1>
        <p className="text-gray-600 mt-2">
          Gerencie o código que permite novos pais se cadastrarem nesta escola
        </p>
      </div>

      <InviteCodeCard schoolId={schoolId} initialInviteCode={inviteCode} />
    </div>
  );
}
