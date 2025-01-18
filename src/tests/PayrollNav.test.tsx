import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PayrollNav } from '../components/payroll/navigation/PayrollNav';
import { AuthContext } from '../contexts/AuthContext';
import { Role } from '../types';

describe('PayrollNav', () => {
  const renderWithAuth = (role: Role) => {
    render(
      <AuthContext.Provider value={{ 
        user: { role, id: '1', email: 'test@example.com', is_verified: true },
        loading: false,
        isDevMode: false,
        signIn: jest.fn(),
        signOut: jest.fn()
      }}>
        <MemoryRouter>
          <PayrollNav />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('renders all navigation items for tenant admin', () => {
    renderWithAuth('tenant_admin');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Process')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows limited navigation for employees', () => {
    renderWithAuth('employee');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.queryByText('Process')).not.toBeInTheDocument();
    expect(screen.queryByText('Reports')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('shows appropriate navigation for payroll admin', () => {
    renderWithAuth('payroll_admin');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Process')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('applies active styles to current route', () => {
    renderWithAuth('tenant_admin');
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('border-transparent');
    expect(dashboardLink).not.toHaveClass('border-indigo-500');
  });
});