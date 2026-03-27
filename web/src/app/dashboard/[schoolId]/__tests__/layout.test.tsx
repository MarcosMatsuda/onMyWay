import React from 'react';
import { render, screen } from '@testing-library/react';
import { getSchool } from '@/lib/server-api';

jest.mock('@/lib/server-api', () => ({
  getSchool: jest.fn(),
}));

jest.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({
    schoolId,
    schoolName,
    children,
  }: {
    schoolId: string;
    schoolName: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="dashboard-layout">
      <span data-testid="layout-school-id">{schoolId}</span>
      <span data-testid="layout-school-name">{schoolName}</span>
      <div data-testid="layout-children">{children}</div>
    </div>
  ),
}));

import SchoolLayout from '../layout';

const mockGetSchool = getSchool as jest.Mock;

function buildParams(schoolId: string) {
  return Promise.resolve({ schoolId });
}

describe('SchoolLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders DashboardLayout with school name from API', async () => {
    mockGetSchool.mockResolvedValue({
      id: 'school-1',
      name: 'Escola Primavera',
      location: {},
    });

    const Layout = await SchoolLayout({
      params: buildParams('school-1'),
      children: <span>children</span>,
    });
    render(Layout);

    expect(screen.getByTestId('layout-school-id')).toHaveTextContent('school-1');
    expect(screen.getByTestId('layout-school-name')).toHaveTextContent(
      'Escola Primavera',
    );
  });

  it('falls back to schoolId as school name when getSchool throws', async () => {
    mockGetSchool.mockRejectedValue(new Error('Not found'));

    const Layout = await SchoolLayout({
      params: buildParams('school-xyz'),
      children: <span>children</span>,
    });
    render(Layout);

    expect(screen.getByTestId('layout-school-name')).toHaveTextContent(
      'school-xyz',
    );
  });

  it('passes children through to DashboardLayout', async () => {
    mockGetSchool.mockResolvedValue({ id: 'school-1', name: 'School', location: {} });

    const Layout = await SchoolLayout({
      params: buildParams('school-1'),
      children: <div data-testid="page-child">Page</div>,
    });
    render(Layout);

    expect(screen.getByTestId('page-child')).toBeInTheDocument();
  });

  it('calls getSchool with the correct schoolId', async () => {
    mockGetSchool.mockResolvedValue({ id: 'school-99', name: 'Test', location: {} });

    await SchoolLayout({
      params: buildParams('school-99'),
      children: <span />,
    });

    expect(mockGetSchool).toHaveBeenCalledWith('school-99');
  });
});
