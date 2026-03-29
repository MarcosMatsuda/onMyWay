import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TOKEN_KEY } from '@/lib/auth';
import { getSchoolParents } from '@/lib/server-api';

interface ParentsPageProps {
  params: Promise<{ schoolId: string }>;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
          {parents.length} {parents.length === 1 ? 'pai cadastrado' : 'pais cadastrados'} nesta
          escola
        </p>
      </div>

      {parents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">Nenhum pai cadastrado ainda.</p>
          <p className="text-gray-400 text-sm mt-1">
            Compartilhe o código de convite para que pais possam se registrar.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cadastrado em
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parents.map((parent) => (
                <tr key={parent.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{parent.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{parent.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{parent.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(parent.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
