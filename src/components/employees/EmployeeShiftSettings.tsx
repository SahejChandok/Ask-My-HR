import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { ShiftRuleGroupSelect } from '../shifts/ShiftRuleGroupSelect';
import { EmployeeShiftOverrides } from '../shifts/EmployeeShiftOverrides';
import { getShiftRuleGroups } from '../../services/shiftRules';
import { TenantShiftConfig } from '../../types/shift';

interface EmployeeShiftSettingsProps {
  employeeId: string;
  tenantId: string;
}

export function EmployeeShiftSettings({ employeeId, tenantId }: EmployeeShiftSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [groups, setGroups] = useState<TenantShiftConfig[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>();

  useEffect(() => {
    loadGroups();
  }, [tenantId]);

  async function loadGroups() {
    try {
      setLoading(true);
      const data = await getShiftRuleGroups(tenantId);
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroupId(data[0].id);
      }
    } catch (error) {
      setError('Failed to load shift rule groups');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Shift Settings</h3>
        </div>

        <ShiftRuleGroupSelect
          groups={groups}
          selectedId={selectedGroupId}
          onChange={setSelectedGroupId}
          className="mb-6"
        />

        <EmployeeShiftOverrides
          employeeId={employeeId}
          onSave={async (overrides) => {
            // Save overrides
          }}
        />
      </div>
    </div>
  );
}