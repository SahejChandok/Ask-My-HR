import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PayrollPeriodSelect } from '../../../components/PayrollPeriodSelect';
import { getCurrentPayPeriod } from '../../../utils/dateUtils';

export function PeriodSelection() {
  const navigate = useNavigate();
  const { start, end } = getCurrentPayPeriod('fortnightly');

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Select Pay Period</h2>
        <PayrollPeriodSelect
          periodType="fortnightly"
          startDate={start}
          endDate={end}
          onStartDateChange={(date) => console.log('Start:', date)}
          onEndDateChange={(date) => console.log('End:', date)}
        />
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => navigate('/payroll/process/review')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Continue to Review
          </button>
        </div>
      </div>
    </div>
  );
}