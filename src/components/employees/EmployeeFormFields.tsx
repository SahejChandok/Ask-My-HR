import React from 'react';
import { ShiftRuleGroupSelect } from '../shifts/ShiftRuleGroupSelect';
import { TenantShiftConfig } from '../../types/shift';

interface EmployeeFormFieldsProps {
  formData: {
    first_name: string;
    last_name: string;
    ird_number: string;
    email: string;
    hourly_rate: number;
    employment_type: 'hourly' | 'salary';
    is_active: boolean;
    kiwisaver_enrolled: boolean;
    kiwisaver_rate: number;
    tax_code: string;
    shift_rule_group_id?: string;
  };
  onChange: (field: string, value: string | number | boolean) => void;
  shiftGroups?: TenantShiftConfig[];
}

export function EmployeeFormFields({ formData, onChange, shiftGroups }: EmployeeFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Shift Rules */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Shift Rules Configuration
        </label>
        <ShiftRuleGroupSelect
          groups={shiftGroups || []}
          selectedId={formData.shift_rule_group_id}
          onChange={(id) => onChange('shift_rule_group_id', id)}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-gray-500">
          Select the shift rules that apply to this employee
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          First Name
        </label>
        <input
          type="text"
          required
          value={formData.first_name}
          onChange={(e) => onChange('first_name', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Last Name
        </label>
        <input
          type="text"
          required
          value={formData.last_name}
          onChange={(e) => onChange('last_name', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          IRD Number
        </label>
        <input
          type="text"
          required
          pattern="[0-9]{9}"
          maxLength={9}
          value={formData.ird_number}
          onChange={(e) => onChange('ird_number', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Employment Type
        </label>
        <select
          value={formData.employment_type}
          onChange={(e) => onChange('employment_type', e.target.value as 'hourly' | 'salary')}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="hourly">Hourly</option>
          <option value="salary">Salary</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {formData.employment_type === 'salary' ? 'Annual Salary' : 'Hourly Rate'}
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={formData.employment_type === 'salary' ? formData.hourly_rate * 2080 : formData.hourly_rate}
            onChange={(e) => onChange('hourly_rate', 
              formData.employment_type === 'salary' 
                ? parseFloat(e.target.value) / 2080 
                : parseFloat(e.target.value)
            )}
            className="pl-7 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {formData.employment_type === 'salary' && (
            <p className="mt-1 text-sm text-gray-500">
              Hourly equivalent: ${(formData.hourly_rate).toFixed(2)}/hr
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.kiwisaver_enrolled}
            onChange={(e) => onChange('kiwisaver_enrolled', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            KiwiSaver Enrolled
          </label>
        </div>
      </div>

      {formData.kiwisaver_enrolled && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            KiwiSaver Rate (%)
          </label>
          <select
            value={formData.kiwisaver_rate}
            onChange={(e) => onChange('kiwisaver_rate', parseFloat(e.target.value))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value={3}>3%</option>
            <option value={4}>4%</option>
            <option value={6}>6%</option>
            <option value={8}>8%</option>
            <option value={10}>10%</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tax Code
        </label>
        <select
          value={formData.tax_code}
          onChange={(e) => onChange('tax_code', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="M">M (Main job)</option>
          <option value="SB">SB (Secondary job)</option>
          <option value="S">S (Secondary higher rate)</option>
          <option value="SH">SH (Secondary highest rate)</option>
          <option value="ST">ST (Secondary tax rate)</option>
          <option value="SA">SA (Salary/wages annual)</option>
        </select>
      </div>
      
      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => onChange('is_active', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Active Employee
          </label>
        </div>
      </div>
    </div>
  );
}