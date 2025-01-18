import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Timesheet, TimesheetEntry } from '../types';
import { Loader2, Plus, Check, X } from 'lucide-react';
import { TimesheetForm } from '../components/timesheets/TimesheetForm';
import { TimesheetDetails } from '../components/timesheets/TimesheetDetails';
import { getTimesheets, approveTimesheet, rejectTimesheet } from '../services/timesheetService';

export function Timesheets() {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [showForm, setShowForm] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet & { entries?: TimesheetEntry[] }>();

  const canApprove = ['platform_admin', 'tenant_admin', 'payroll_admin'].includes(user?.role || '');

  useEffect(() => {
    loadTimesheets();
  }, [user?.tenant_id]);

  async function loadTimesheets() {
    if (!user?.tenant_id) return;
    
    try {
      setLoading(true);
      setError(undefined);
      const data = await getTimesheets(user.tenant_id);
      setTimesheets(data);
    } catch (error) {
      console.error('Error loading timesheets:', error);
      setError('Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    if (!user?.id) return;

    try {
      const { success, error } = await approveTimesheet(id, user.id);
      if (!success) {
        throw new Error(error);
      }
      loadTimesheets();
    } catch (error) {
      console.error('Error approving timesheet:', error);
      setError('Failed to approve timesheet');
    }
  }

  async function handleReject(id: string) {
    if (!user?.id) return;

    try {
      const { success, error } = await rejectTimesheet(id, user.id, 'Rejected by manager');
      if (!success) {
        throw new Error(error);
      }
      loadTimesheets();
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      setError('Failed to reject timesheet');
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
        <h1 className="text-2xl font-semibold text-gray-900">Timesheets</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Timesheet
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {showForm && (
        <TimesheetForm
          onClose={() => setShowForm(false)}
          onSubmit={loadTimesheets}
        />
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {timesheets.map((timesheet) => (
            <li 
              key={timesheet.id}
              className="hover:bg-gray-50 focus-within:bg-gray-50"
            >
              <div className="px-4 py-4 sm:px-6">
                <div 
                  onClick={() => setSelectedTimesheet(timesheet)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm font-medium text-indigo-600 truncate">
                    {new Date(timesheet.period_start).toLocaleDateString()} -{' '}
                    {new Date(timesheet.period_end).toLocaleDateString()}
                  </span>
                  <span className="ml-2 flex-shrink-0 flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      {canApprove && timesheet.status === 'submitted' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(timesheet.id);
                            }}
                            className="p-1 text-green-600 hover:text-green-800 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(timesheet.id);
                            }}
                            className="p-1 text-red-600 hover:text-red-800 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          timesheet.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : timesheet.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {timesheet.status}
                      </span>
                    </div>
                  </span>
                </div>
              </div>
            </li>
          ))}
          {timesheets.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">
              No timesheets found
            </li>
          )}
        </ul>
      </div>
      
      {selectedTimesheet && (
        <TimesheetDetails
          timesheet={selectedTimesheet}
          onUpdate={loadTimesheets}
          onClose={() => setSelectedTimesheet(undefined)}
        />
      )}
    </div>
  );
}