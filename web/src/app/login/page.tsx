import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { getSchoolIdFromToken } from '@/lib/jwt';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('onmyway_token')?.value;

  // If already authenticated, redirect to dashboard
  if (token) {
    const schoolId = getSchoolIdFromToken(token);
    if (schoolId) {
      redirect(`/dashboard/${schoolId}/arrivals`);
    }
    // Fallback if schoolId cannot be extracted (should not happen)
    redirect('/dashboard');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          onMyWay
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
