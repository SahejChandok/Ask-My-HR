import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PayPeriodType } from '../../types';
import { getCurrentPayPeriod, calculatePeriodEndDate } from '../../utils/dateUtils';
import { PayrollHeader } from './PayrollHeader';
import { PayrollError } from './PayrollError';
import { PayrollResults } from './PayrollResults';
import { PayrollPeriodSelect } from '../PayrollPeriodSelect';
import { usePayrollProcessing } from './hooks/usePayrollProcessing';
import { checkSupabaseConnection } from '../../lib/supabase';

interface PayrollRunProps {
  periodType: PayPeriodType;
  onComplete: () => void;
}

export function PayrollRun({ periodType, onComplete }: PayrollRunProps) {
  const { user } = useAuth();
  const [localError, setLocalError] = useState<string>();
  const [{ start: initialStart, end: initialEnd }] = useState(() => 
    getCurrentPayPeriod(periodType)
  );
  const [periodStart, setPeriodStart] = useState(initialStart);
  const [periodEnd, setPeriodEnd] = useState(initialEnd);
  const {
    loading,
    loading,
    error,
    validationError,
    overlappingRuns,
    logs,
    results,
    processPayroll
  } = usePayrollProcessing(periodStart, periodEnd, user?.tenant_id);
  
  // Update end date when start date or period type changes
  const handleStartDateChange = (newStart: string) => {
    const start = new Date(newStart);
    start.setHours(0, 0, 0, 0);
    const end = calculatePeriodEndDate(start, periodType);
    setPeriodStart(newStart);
    setPeriodEnd(formatAPIDate(end));
  };
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>();

  async function handleProcess() {
    if (!user?.tenant_id) {
      setLocalError('User or tenant information is missing');
      return;
    }

    // Check connection first
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      setLocalError('Failed to connect to database');
      return;
    }

    const success = await processPayroll(user.id);
    if (success) {
      // Only show results if we have valid data
      if (results.length === 0) {
        setLocalError('No valid payroll data found for this period');
        return;
      }
      onComplete();
    }
  }

  return (
    <div className="space-y-6">
      <PayrollPeriodSelect
        periodType={periodType}
        startDate={periodStart}
        endDate={periodEnd} 
        onStartDateChange={handleStartDateChange}
        onEndDateChange={setPeriodEnd}
      />

      <PayrollHeader
        periodStart={periodStart}
        periodEnd={periodEnd}
        loading={loading}
        onProcess={handleProcess}
      />
      
      {(error || localError || validationError) && (
        <PayrollError
          error={validationError || error || localError || ''}
          overlappingRuns={overlappingRuns}
          isValidationError={!!validationError}
        />
      )}

      {results.length > 0 && (
        <PayrollResults
          results={results}
          periodStart={periodStart}
          periodEnd={periodEnd}
          logs={logs}
          onEmployeeSelect={setSelectedEmployeeId}
          selectedEmployeeId={selectedEmployeeId}
        />
      )}
    </div>
  );
}