import React from 'react';
import { Clock } from 'lucide-react';
import { TenantShiftConfig } from '../../types/shift';

interface ShiftRuleGroupSelectProps {
  groups: TenantShiftConfig[];
  selectedId?: string;
  onChange: (groupId: string) => void;
  className?: string;
}

export function ShiftRuleGroupSelect({ 
  groups, 
  selectedId, 
  onChange,
  className = ''
}: ShiftRuleGroupSelectProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Shift Rules Configuration
      </label>
      <div className="space-y-2">
        {groups.map(group => (
          <label
            key={group.id}
            className={`
              flex items-center p-3 border rounded-lg cursor-pointer transition-colors
              ${selectedId === group.id 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 hover:border-indigo-300'
              }
            `}
          >
            <input
              type="radio"
              name="shiftRuleGroup"
              value={group.id}
              checked={selectedId === group.id}
              onChange={() => onChange(group.id)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <div className="ml-3 flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">{group.name}</p>
                <p className="text-sm text-gray-500">
                  {group.timeRules.standardHours.daily}h daily / {group.timeRules.standardHours.weekly}h weekly
                </p>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}