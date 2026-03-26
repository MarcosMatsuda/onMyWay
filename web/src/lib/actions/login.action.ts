'use server';

import { cookies } from 'next/headers';
import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function loginAction(
  email: string,
  password: string,
): Promise<{ success: true; schoolId: string } | { success: false; error: string }> {
  try {
    const response = await axios.post(
      `${baseURL}/auth/login`,
      { email, password },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const { accessToken, parent } = response.data;

    // Set the cookie on the server
    const cookieStore = await cookies();
    cookieStore.set('onmyway_token', accessToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { success: true, schoolId: parent.schoolId };
  } catch (error) {
    // Handle different error scenarios
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return { success: false, error: 'Email ou senha inválidos' };
      }
      if (error.response?.status === 400) {
        const messages = error.response.data?.message;
        const message = Array.isArray(messages)
          ? messages.join(', ')
          : messages || 'Email ou senha inválidos';
        return { success: false, error: message };
      }
    }
    return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
  }
}
