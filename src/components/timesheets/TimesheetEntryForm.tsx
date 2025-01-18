import React from 'react';
import { TimesheetEntryFields } from './TimesheetEntryFields';
import { TimesheetEntryData } from '../../types/timesheet';

interface TimesheetEntryFormProps {
  entry: TimesheetEntryData;
  errors?: Record<string, string>;
  onChange: (field: keyof TimesheetEntryData, value: string) => void;
}

export function TimesheetEntryForm({ entry, errors = {}, onChange }: TimesheetEntryFormProps) {
  return (
    <div className="grid grid-cols-6 gap-4">
      <TimesheetEntryFields 
        entry={entry} 
        errors={errors}
        onChange={onChange} 
      />
    </div>
  );
}