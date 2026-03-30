import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TOKEN_KEY } from '@/lib/auth';
import { getSchoolParents } from '@/lib/server-api';
import { ParentsTable } from '@/components/parents/ParentsTable';

interface ParentsPageProps {
  params: Promise<{ schoolId: string }>;
}

export default async function ParentsPage({ params }: ParentsPageProps) {
  const { schoolId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value;

  if (!token) {
    redirect('/login');
  }

  const parents = await getSchoolParents(schoolId, token).catch(() => []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pais Cadastrados</h1>
        <p className="text-gray-600 mt-2">
          {parents.length}{' '}
          {parents.length === 1 ? 'pai cadastrado' : 'pais cadastrados'} nesta
          escola
        </p>
      </div>

      <ParentsTable schoolId={schoolId} initialParents={parents} />
    </div>
  );
}
