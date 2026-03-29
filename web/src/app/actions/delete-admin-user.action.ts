'use server';

import { cookies } from 'next/headers';
import { TOKEN_KEY } from '@/lib/auth';
import { deleteAdminUser } from '@/lib/server-api';

export async function deleteAdminUserAction(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_KEY)?.value;

    if (!token) {
      return { success: false, error: 'Não autenticado' };
    }

    await deleteAdminUser(userId, token);
    return { success: true };
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return {
      success: false,
      error: 'Erro ao remover administrador. Tente novamente.',
    };
  }
}
