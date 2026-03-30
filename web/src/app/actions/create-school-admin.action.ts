'use server';

import { cookies } from 'next/headers';
import { TOKEN_KEY } from '@/lib/auth';
import { createSchoolAdmin } from '@/lib/server-api';
import { SchoolAdmin } from '@/types';

export async function createSchoolAdminAction(data: {
  name: string;
  email: string;
  password: string;
  schoolId: string;
}): Promise<{ success: boolean; admin?: SchoolAdmin; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_KEY)?.value;

    if (!token) {
      return { success: false, error: 'Não autenticado' };
    }

    const admin = await createSchoolAdmin(data, token);
    return { success: true, admin };
  } catch (error) {
    console.error('Error creating school admin:', error);
    return {
      success: false,
      error: 'Erro ao criar administrador. Verifique os dados e tente novamente.',
    };
  }
}
