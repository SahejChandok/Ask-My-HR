import React from 'react';
import { Settings, Copy, Trash2, Clock } from 'lucide-react';
import { TenantShiftConfig } from '../../types/shift';
import { formatHours } from '../../utils/formatters';

interface ShiftRuleGroupListProps {
  groups: TenantShiftConfig[];
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ShiftRuleGroupList({ groups, onEdit, onDuplicate, onDelete }: ShiftRuleGroupListProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Shift Rule Groups</h3>
        
        {groups.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No shift rule groups defined yet.</p>
        ) : (
          <div className="space-y-4">
          {groups.map(group => (
            <div 
              key={group.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                    <p className="text-sm text-gray-500">
                      {formatHours(group.timeRules?.standardHours?.daily || 8)}h daily / {formatHours(group.timeRules?.standardHours?.weekly || 40)}h weekly
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(group.id)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                    title="Edit rules"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDuplicate(group.id)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                    title="Duplicate group"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(group.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete group"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}