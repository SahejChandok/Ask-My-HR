import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HolidayPaySummary } from '../components/dashboard/HolidayPaySummary';
import { DevModeIndicator } from '../components/DevModeIndicator';

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <DevModeIndicator />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Welcome back!</h2>
              <p className="mt-1 text-sm text-gray-500">
                {user?.email} ({user?.role})
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500">Quick Links</h3>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <a
                  href="/timesheets"
                  className="block p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:shadow-sm transition-all"
                >
                  <h4 className="text-base font-medium text-gray-900">Timesheets</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Submit and view your timesheets
                  </p>
                </a>
                <a
                  href="/leave"
                  className="block p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:shadow-sm transition-all"
                >
                  <h4 className="text-base font-medium text-gray-900">Leave</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Request and manage leave
                  </p>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <HolidayPaySummary />
      </div>
    </div>
  );
}