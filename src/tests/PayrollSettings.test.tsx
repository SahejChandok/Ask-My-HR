import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PayrollSettings } from '../pages/payroll/PayrollSettings';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              pay_period_type: 'monthly',
              pay_day: 1
            },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }
}));

describe('PayrollSettings', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: 'tenant_admin' as const,
    tenant_id: '123',
    is_verified: true
  };

  const renderComponent = () => {
    render(
      <AuthContext.Provider value={{
        user: mockUser,
        loading: false,
        isDevMode: false,
        signIn: jest.fn(),
        signOut: jest.fn()
      }}>
        <PayrollSettings />
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads settings on mount', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('payroll_settings');
    });
  });

  it('updates settings on form submit', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText('Pay Period Type')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Pay Period Type'), {
      target: { value: 'fortnightly' }
    });

    fireEvent.submit(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('payroll_settings');
      expect(supabase.from('payroll_settings').update).toHaveBeenCalled();
    });
  });

  it('shows error message on API failure', async () => {
    const mockError = new Error('API Error');
    jest.spyOn(supabase, 'from').mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.reject(mockError)
        })
      })
    }));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load payroll settings')).toBeInTheDocument();
    });
  });

  it('disables form submission while loading', async () => {
    renderComponent();

    const submitButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
  });
});