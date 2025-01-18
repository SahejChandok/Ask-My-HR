import React from 'react';
import { Calendar } from 'lucide-react';

export function LeaveIntegration() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Leave Integration</h2>
      
      <div className="space-y-6">
        {/* Leave Types */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Leave Types</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {/* Add leave type configuration */}
          </div>
        </div>

        {/* Leave Accrual Rules */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Accrual Rules</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {/* Add leave accrual configuration */}
          </div>
        </div>
      </div>
    </div>
  );
}