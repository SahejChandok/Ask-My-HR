import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
import { LeaveRequest, LeaveBalance, Role } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';
import { calculateLeaveHours } from '../utils/leaveCalculations';
import { Loader2, Plus, Check, X } from 'lucide-react';
import { LeaveRequestForm } from '../components/leave/LeaveRequestForm';
import { LeaveCalendar } from '../components/leave/LeaveCalendar';
import { LeaveBalanceCard } from '../components/leave/LeaveBalanceCard';
import { LeaveRequestDetails } from '../components/leave/LeaveRequestDetails';

export function Leave() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest>();

  const canApprove = ['platform_admin', 'tenant_admin', 'hr_manager'].includes(user?.role || '');

  useEffect(() => {
    loadLeaveData();
  }, [user]);

  async function loadLeaveData() {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      setError(undefined);

      // First get employee profiles to ensure we have names
      const { data: profiles, error: profilesError } = await supabase
        .from('employee_profiles')
        .select('id, first_name, last_name')
        .eq('tenant_id', user.tenant_id);

      if (profilesError) {
        throw new Error('Failed to load employee data');
      }

      const employeeMap = new Map(
        profiles?.map(p => [p.id, { first_name: p.first_name, last_name: p.last_name }]) || []
      );

      try {
        const [requestsResponse, balancesResponse] = await Promise.all([
          supabase
            .from('leave_requests')
            .select('*')
            .eq('tenant_id', user.tenant_id)
            .order('created_at', { ascending: false }),
          supabase
            .from('leave_balances')
            .select('*')
            .eq('tenant_id', user.tenant_id)
        ]);

        if (requestsResponse.error) throw new Error('Failed to load leave requests');
        if (balancesResponse.error) throw new Error('Failed to load leave balances');

        // Attach employee names to requests and balances
        setRequests((requestsResponse.data || []).map(request => ({
          ...request,
          employee_profiles: employeeMap.get(request.employee_id) || {
            first_name: 'Unknown',
            last_name: 'Employee'
          }
        })));

        setBalances((balancesResponse.data || []).map(balance => ({
          ...balance,
          employee_profiles: employeeMap.get(balance.employee_id) || {
            first_name: 'Unknown',
            last_name: 'Employee'
          }
        })));
      } catch (error) {
        throw new Error('Failed to process leave data');
      }
    } catch (error) {
      console.error('Error loading leave data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string, approved: boolean) {
    try {
      setError(undefined);
      setLoading(true);

      if (!user?.tenant_id) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      // First get the leave request details
      const { data: leaveRequest, error: requestError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', user.tenant_id)
        .single();

      if (requestError) {
        throw new Error('Failed to fetch leave request details');
      }

      if (!leaveRequest) {
        throw new Error('Leave request not found');
      }

      // Get current balance before update
      const { data: balances, error: balanceError } = await supabase
        .from('leave_balances')
        .select('taken_hours, accrued_hours, balance_hours')
        .eq('employee_id', leaveRequest.employee_id)
        .eq('leave_type', leaveRequest.leave_type)
        .eq('year_start', '2024-01-01')
        .limit(1);

      if (balanceError) {
        throw new Error('Failed to fetch leave balance');
      }
      
      const currentBalance = balances?.[0];
      if (!currentBalance && approved) {
        throw new Error('Leave balance not found');
      }

      // Calculate leave hours excluding weekends
      const leaveHours = calculateLeaveHours(leaveRequest);
      
      // Validate sufficient balance for approval
      if (approved && leaveHours > currentBalance.balance_hours) {
        throw new Error(`Insufficient leave balance. Available: ${currentBalance.balance_hours}h, Requested: ${leaveHours}h`);
      }

      // First update the leave request status
      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', id)
        .eq('tenant_id', user.tenant_id);

      if (updateError) {
        throw new Error('Failed to update leave request status');
      }

      // If approved, update leave balance
      if (approved) {
        const { error: balanceError } = await supabase
          .from('leave_balances')
          .update([{
            taken_hours: currentBalance.taken_hours + leaveHours,
            balance_hours: currentBalance.balance_hours - leaveHours,
            updated_at: new Date().toISOString()
          }])
          .eq('employee_id', leaveRequest.employee_id)
          .eq('leave_type', leaveRequest.leave_type)
          .eq('year_start', '2024-01-01');

        if (balanceError) {
          throw new Error('Failed to update leave balance');
        }
      }

      await loadLeaveData();
    } catch (error) {
      console.error('Error updating leave request:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Leave</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="w-5 h-5 mr-2" />
          Request Leave
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {showForm && (
        <LeaveRequestForm
          onClose={() => setShowForm(false)}
          onSubmit={loadLeaveData}
          balances={balances}
        />
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {balances.map((balance) => (
          <LeaveBalanceCard key={balance.id} balance={balance} />
        ))}
      </div>

      <LeaveCalendar
        requests={requests}
        onRequestClick={setSelectedRequest}
      />

      {selectedRequest && (
        <LeaveRequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest(undefined)}
          onApprove={canApprove ? (id) => handleApprove(id, true) : undefined}
          onReject={canApprove ? (id) => handleApprove(id, false) : undefined}
          canApprove={canApprove}
        />
      )}
    </div>
  );
}