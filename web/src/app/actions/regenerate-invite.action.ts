'use server';

import { cookies } from 'next/headers';
import { TOKEN_KEY } from '@/lib/auth';
import { regenerateSchoolInvite } from '@/lib/server-api';

export async function regenerateInviteAction(
  schoolId: string,
): Promise<{ success: boolean; inviteCode?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_KEY)?.value;

    if (!token) {
      return { success: false, error: 'Não autenticado' };
    }

    const result = await regenerateSchoolInvite(schoolId, token);
    return { success: true, inviteCode: result.inviteCode };
  } catch (error) {
    console.error('Error regenerating invite code:', error);
    return { success: false, error: 'Erro ao regenerar código. Tente novamente.' };
  }
}
