'use server';

import { cookies } from 'next/headers';
import { TOKEN_KEY } from '@/lib/auth';
import { updateSchoolConfig } from '@/lib/server-api';
import { SchoolConfig } from '@/types';

export async function updateSchoolConfigAction(
  schoolId: string,
  config: SchoolConfig,
): Promise<{ success: boolean; error?: string; data?: SchoolConfig }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_KEY)?.value;

    if (!token) {
      return { success: false, error: 'Não autenticado' };
    }

    const updatedConfig = await updateSchoolConfig(schoolId, config, token);
    return { success: true, data: updatedConfig };
  } catch (error) {
    console.error('Error updating school config:', error);
    return {
      success: false,
      error: 'Erro ao atualizar configurações. Tente novamente.',
    };
  }
}
