'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/logout.action';

interface DashboardSidebarProps {
  schoolId: string;
  schoolName: string;
}

export function DashboardSidebar({
  schoolId,
  schoolName,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const navLinks = [
    {
      href: `/dashboard/${schoolId}/arrivals`,
      label: 'Chegadas',
      icon: '🚗',
    },
    {
      href: `/dashboard/${schoolId}/parents`,
      label: 'Pais',
      icon: '👥',
    },
    {
      href: `/dashboard/${schoolId}/invite`,
      label: 'Código de Convite',
      icon: '🔑',
    },
    {
      href: `/dashboard/${schoolId}/settings`,
      label: 'Configurações',
      icon: '⚙️',
    },
  ];

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 md:block hidden">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold">onMyWay</h1>
        <p className="text-sm text-gray-400 mt-1 truncate" title={schoolName}>
          {schoolName}
        </p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(link.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span className="font-medium">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
