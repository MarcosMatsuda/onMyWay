import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardLayout } from '../DashboardLayout';

jest.mock('../DashboardSidebar', () => ({
  DashboardSidebar: ({
    schoolId,
    schoolName,
  }: {
    schoolId: string;
    schoolName: string;
  }) => (
    <aside data-testid="dashboard-sidebar">
      <span data-testid="sidebar-school-id">{schoolId}</span>
      <span data-testid="sidebar-school-name">{schoolName}</span>
    </aside>
  ),
}));

describe('DashboardLayout', () => {
  it('renders children inside main content area', () => {
    render(
      <DashboardLayout schoolId="school-1" schoolName="Test School">
        <div data-testid="page-content">Page Content</div>
      </DashboardLayout>,
    );

    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('renders DashboardSidebar with correct props', () => {
    render(
      <DashboardLayout schoolId="school-42" schoolName="Escola Primavera">
        <span>child</span>
      </DashboardLayout>,
    );

    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-school-id')).toHaveTextContent(
      'school-42',
    );
    expect(screen.getByTestId('sidebar-school-name')).toHaveTextContent(
      'Escola Primavera',
    );
  });

  it('renders multiple children', () => {
    render(
      <DashboardLayout schoolId="school-1" schoolName="School">
        <div data-testid="child-a">A</div>
        <div data-testid="child-b">B</div>
      </DashboardLayout>,
    );

    expect(screen.getByTestId('child-a')).toBeInTheDocument();
    expect(screen.getByTestId('child-b')).toBeInTheDocument();
  });

  it('applies responsive margin class to main element', () => {
    const { container } = render(
      <DashboardLayout schoolId="school-1" schoolName="School">
        <span>content</span>
      </DashboardLayout>,
    );

    const main = container.querySelector('main');
    expect(main).toHaveClass('md:ml-60');
  });
});
