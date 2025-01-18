import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PayPeriodType } from '../types';
import { getCurrentPayPeriod } from '../utils/dateUtils';
import { PayrollHeader } from './payroll/PayrollHeader';
import { PayrollError } from './payroll/PayrollError';
import { PayrollPeriodSelect } from './PayrollPeriodSelect';
import { PayrollResults } from './payroll/PayrollResults';
import { usePayrollProcessing } from './payroll/usePayrollProcessing';
import { checkSupabaseConnection } from '../lib/supabase';
import { calculatePeriodEndDate, formatAPIDate } from '../utils/dateUtils';

interface PayrollRunProps {
  periodStart: string;
  periodEnd: string;
  onComplete: () => void;
}

export function PayrollRun({ periodStart: initialStart, periodEnd: initialEnd, onComplete }: PayrollRunProps) {
  const { user } = useAuth();
  const [localError, setLocalError] = useState<string>();
  const [{ periodStart, periodEnd }, setPeriod] = useState({
    periodStart: initialStart,
    periodEnd: initialEnd
  });
  const [periodType, setPeriodType] = useState<PayPeriodType>('monthly');

  // Update end date when start date changes
  const handleStartDateChange = (newStart: string) => {
    const start = new Date(newStart);
    start.setHours(0, 0, 0, 0);
    const end = calculatePeriodEndDate(start, periodType);
    setPeriod({
      periodStart: formatAPIDate(start),
      periodEnd: formatAPIDate(end)
    });
  };
  // Update end date when period type changes
  const handlePeriodTypeChange = (type: PayPeriodType) => {
    setPeriodType(type);
    const start = new Date(periodStart);
    start.setHours(0, 0, 0, 0);
    const end = calculatePeriodEndDate(start, type);
    setPeriod(prev => ({
      ...prev,
      periodEnd: formatAPIDate(end)
    }));
  };

  const {
    loading,
    error,
    overlappingRuns,
    results,
    processPayroll
  } = usePayrollProcessing(periodStart, periodEnd, user?.tenant_id);

  async function handleProcess() {
    if (!user?.tenant_id) {
      setLocalError('Your session has expired. Please log in again.');
      return false;
    }

    // Check connection first
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      setLocalError('Unable to connect to the server. Please try again.');
      return false;
    }

    const success = await processPayroll(user.id);
    if (success) {
      // Only show results if we have valid data
      if (results.length === 0) {
        setLocalError('No approved timesheets found for this period');
        return false;
      }
      onComplete();
      return true;
    }
    
    if (!error) {
      setLocalError('Failed to process payroll. Please try again.');
    }
    
    return false;
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pay Period Type
        </label>
        <select
          value={periodType}
          onChange={(e) => handlePeriodTypeChange(e.target.value as typeof periodType)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="weekly">Weekly</option>
          <option value="fortnightly">Fortnightly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <PayrollPeriodSelect
        periodType={periodType}
        startDate={periodStart}
        endDate={periodEnd}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={(end) => setPeriod(prev => ({ ...prev, periodEnd: end }))}
      />

      <PayrollHeader
        periodStart={periodStart}
        periodEnd={periodEnd}
        loading={loading}
        onProcess={handleProcess}
      />
      
      {(error || localError) && (
        <PayrollError
          error={error || localError || ''}
          overlappingRuns={overlappingRuns}
        />
      )}

      {results.length > 0 && (
        <PayrollResults
          results={results}
          periodStart={periodStart}
          periodEnd={periodEnd}
        />
      )}
    </div>
  );
}