import { redirect } from 'next/navigation';

interface DashboardHomeProps {
  params: Promise<{ schoolId: string }>;
}

export default async function DashboardHome({ params }: DashboardHomeProps) {
  const { schoolId } = await params;
  redirect(`/dashboard/${schoolId}/arrivals`);
}
