import { ReactNode } from 'react';
import { DashboardSidebar } from './DashboardSidebar';

interface DashboardLayoutProps {
  schoolId: string;
  schoolName: string;
  children: ReactNode;
}

export function DashboardLayout({
  schoolId,
  schoolName,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar schoolId={schoolId} schoolName={schoolName} />
      <main className="flex-1 md:ml-60 ml-0">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
