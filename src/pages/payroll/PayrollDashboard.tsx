import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, AlertCircle } from 'lucide-react';

export function PayrollDashboard() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/payroll/process')}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Process New Payroll Run
              </button>
            </div>
          </div>

          {/* Pending Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Items</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Unapproved Timesheets</span>
                </div>
                <span className="text-sm font-medium text-gray-900">3</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Leave Requests</span>
                </div>
                <span className="text-sm font-medium text-gray-900">2</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {/* Add recent payroll runs here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}