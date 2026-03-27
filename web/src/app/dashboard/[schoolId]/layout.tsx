import { ReactNode } from 'react';
import { getSchool } from '@/lib/server-api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface SchoolLayoutProps {
  children: ReactNode;
  params: Promise<{ schoolId: string }>;
}

export default async function SchoolLayout({
  children,
  params,
}: SchoolLayoutProps) {
  const { schoolId } = await params;

  let schoolName = schoolId;

  try {
    const schoolData = await getSchool(schoolId);
    schoolName = schoolData.name;
  } catch (error) {
    console.error('Failed to fetch school name:', error);
  }

  return (
    <DashboardLayout schoolId={schoolId} schoolName={schoolName}>
      {children}
    </DashboardLayout>
  );
}
