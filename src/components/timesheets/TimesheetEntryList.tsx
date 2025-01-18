import React from 'react';
import { Plus } from 'lucide-react';
import { TimesheetEntryForm } from './TimesheetEntryForm';
import { TimesheetEntryData } from '../../types/timesheet';
import { TenantShiftConfig } from '../../types/shift';

interface TimesheetEntryListProps {
  entries: TimesheetEntryData[];
  errors?: Record<string, string>;
  shiftRules?: TenantShiftConfig;
  hourlyRate?: number;
  onEntryChange: (index: number, field: keyof TimesheetEntryData, value: string) => void;
  onAddEntry: () => void;
}

export function TimesheetEntryList({
  entries,
  errors = {},
  shiftRules,
  hourlyRate,
  onEntryChange,
  onAddEntry
}: TimesheetEntryListProps) {
  return (
    <div className="space-y-6">
      {entries.map((entry, index) => (
        <TimesheetEntryForm
          key={index}
          entry={entry}
          errors={Object.keys(errors)
            .filter(key => key.startsWith(`entry_${index}_`))
            .reduce((acc, key) => ({
              ...acc,
              [key.replace(`entry_${index}_`, '')]: errors[key]
            }), {})}
          shiftRules={shiftRules || undefined}
          hourlyRate={hourlyRate || 0}
          onChange={(field, value) => onEntryChange(index, field, value)}
        />
      ))}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onAddEntry}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </button>
      </div>
    </div>
  );
}