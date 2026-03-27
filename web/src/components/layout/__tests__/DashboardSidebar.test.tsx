import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardSidebar } from '../DashboardSidebar';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/logout.action';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/app/actions/logout.action', () => ({
  logoutAction: jest.fn(),
}));

describe('DashboardSidebar', () => {
  const mockUsePathname = usePathname as jest.Mock;
  const mockLogoutAction = logoutAction as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/dashboard/school-123/arrivals');
  });

  it('renders school name and application title', () => {
    render(
      <DashboardSidebar schoolId="school-123" schoolName="Test School" />
    );

    expect(screen.getByText('onMyWay')).toBeInTheDocument();
    expect(screen.getByText('Test School')).toBeInTheDocument();
  });

  it('renders navigation links with correct labels and icons', () => {
    render(
      <DashboardSidebar schoolId="school-123" schoolName="Test School" />
    );

    expect(screen.getByText('Chegadas')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
    expect(screen.getByText('🚗')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    render(
      <DashboardSidebar schoolId="school-123" schoolName="Test School" />
    );

    const logoutButton = screen.getByRole('button', { name: /sair/i });
    expect(logoutButton).toBeInTheDocument();
  });

  it('highlights active link based on pathname', () => {
    mockUsePathname.mockReturnValue('/dashboard/school-123/arrivals');

    render(
      <DashboardSidebar schoolId="school-123" schoolName="Test School" />
    );

    const arrivalsLink = screen.getByText('Chegadas').closest('a');
    const settingsLink = screen.getByText('Configurações').closest('a');

    expect(arrivalsLink).toHaveClass('bg-blue-600');
    expect(settingsLink).not.toHaveClass('bg-blue-600');
  });

  it('highlights settings link when on settings page', () => {
    mockUsePathname.mockReturnValue('/dashboard/school-123/settings');

    render(
      <DashboardSidebar schoolId="school-123" schoolName="Test School" />
    );

    const arrivalsLink = screen.getByText('Chegadas').closest('a');
    const settingsLink = screen.getByText('Configurações').closest('a');

    expect(settingsLink).toHaveClass('bg-blue-600');
    expect(arrivalsLink).not.toHaveClass('bg-blue-600');
  });

  it('highlights arrivals link when on arrivals sub-route', () => {
    mockUsePathname.mockReturnValue('/dashboard/school-123/arrivals/detail');

    render(
      <DashboardSidebar schoolId="school-123" schoolName="Test School" />
    );

    const arrivalsLink = screen.getByText('Chegadas').closest('a');
    expect(arrivalsLink).toHaveClass('bg-blue-600');
  });

  it('calls logoutAction when logout button is clicked', async () => {
    mockLogoutAction.mockResolvedValue(undefined);

    render(
      <DashboardSidebar schoolId="school-123" schoolName="Test School" />
    );

    const logoutButton = screen.getByRole('button', { name: /sair/i });
    fireEvent.click(logoutButton);

    expect(mockLogoutAction).toHaveBeenCalledTimes(1);
  });

  it('generates correct href for navigation links with schoolId', () => {
    render(
      <DashboardSidebar schoolId="school-456" schoolName="Another School" />
    );

    const arrivalsLink = screen.getByText('Chegadas').closest('a');
    const settingsLink = screen.getByText('Configurações').closest('a');

    expect(arrivalsLink).toHaveAttribute(
      'href',
      '/dashboard/school-456/arrivals'
    );
    expect(settingsLink).toHaveAttribute(
      'href',
      '/dashboard/school-456/settings'
    );
  });

  it('truncates long school names with ellipsis', () => {
    const longName = 'Very Long School Name That Should Be Truncated';

    render(<DashboardSidebar schoolId="school-123" schoolName={longName} />);

    const schoolNameElement = screen.getByText(longName);
    expect(schoolNameElement).toHaveClass('truncate');
    expect(schoolNameElement).toHaveAttribute('title', longName);
  });

  it('applies hover styles to non-active links', () => {
    mockUsePathname.mockReturnValue('/dashboard/school-123/arrivals');

    render(
      <DashboardSidebar schoolId="school-123" schoolName="Test School" />
    );

    const settingsLink = screen.getByText('Configurações').closest('a');
    expect(settingsLink).toHaveClass('hover:bg-gray-800');
  });
});
