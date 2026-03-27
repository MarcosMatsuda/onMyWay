'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TOKEN_KEY } from '@/lib/auth';

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_KEY);
  redirect('/login');
}
