import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('onmyway_token')?.value;

  // Ensure user is authenticated before accessing dashboard
  if (!token) {
    redirect('/login');
  }

  return <>{children}</>;
}
