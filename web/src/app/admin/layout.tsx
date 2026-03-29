import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeJWT } from '@/lib/jwt';
import { TOKEN_KEY } from '@/lib/auth';
import { ReactNode } from 'react';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = decodeJWT(token);

  if (payload?.role !== 'super_admin') {
    redirect('/login');
  }

  return <>{children}</>;
}
