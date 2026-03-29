'use server';

import { cookies } from 'next/headers';
import { TOKEN_KEY } from '@/lib/auth';
import { removeSchoolParent } from '@/lib/server-api';

export async function removeParentAction(
  schoolId: string,
  parentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_KEY)?.value;

    if (!token) {
      return { success: false, error: 'Não autenticado' };
    }

    await removeSchoolParent(schoolId, parentId, token);
    return { success: true };
  } catch (error) {
    console.error('Error removing parent:', error);
    return { success: false, error: 'Erro ao remover pai. Tente novamente.' };
  }
}
