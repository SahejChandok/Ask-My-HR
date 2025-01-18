import React from 'react';
import { X, Users } from 'lucide-react';
import { EmployeeSelect } from '../EmployeeSelect';

interface TimesheetFormHeaderProps {
  showEmployeeSelect: boolean;
  selectedEmployeeId: string;
  onEmployeeChange: (id: string) => void;
  onClose: () => void;
}

export function TimesheetFormHeader({
  showEmployeeSelect,
  selectedEmployeeId,
  onEmployeeChange,
  onClose
}: TimesheetFormHeaderProps) {
  return (
    <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
      <div className="flex-1">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          New Timesheet
        </h3>
        {showEmployeeSelect && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700">
              Employee
            </label>
            <div className="mt-1 flex items-center">
              <Users className="w-5 h-5 text-gray-400 mr-2" />
              <EmployeeSelect
                value={selectedEmployeeId}
                onChange={onEmployeeChange}
                className="flex-1"
              />
            </div>
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-500"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}