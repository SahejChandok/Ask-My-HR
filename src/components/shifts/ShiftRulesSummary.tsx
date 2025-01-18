import React from 'react';
import { Clock, DollarSign, Calendar } from 'lucide-react';
import { TenantShiftConfig } from '../../types/shift';

interface ShiftRulesSummaryProps {
  config: TenantShiftConfig;
}

export function ShiftRulesSummary({ config }: ShiftRulesSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Time Rules */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Time Rules</h3>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Standard Hours</dt>
            <dd className="mt-1 text-sm text-gray-900">
              Daily: {config.timeRules.standardHours.daily}h<br />
              Weekly: {config.timeRules.standardHours.weekly}h
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Break Rules</dt>
            <dd className="mt-1 text-sm text-gray-900">
              Minimum Break: {config.timeRules.breakRules.minimumBreak}min<br />
              Break Frequency: Every {config.timeRules.breakRules.breakFrequency}h
            </dd>
          </div>
        </dl>
      </div>

      {/* Rate Multipliers */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Rate Multipliers</h3>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Overtime Rates</dt>
            <dd className="mt-1 text-sm text-gray-900">
              First {config.rateMultipliers.overtime.threshold}h: {config.rateMultipliers.overtime.rate1}x<br />
              Additional: {config.rateMultipliers.overtime.rate2}x
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Weekend Rates</dt>
            <dd className="mt-1 text-sm text-gray-900">
              Saturday: {config.rateMultipliers.weekend.saturday}x<br />
              Sunday: {config.rateMultipliers.weekend.sunday}x
            </dd>
          </div>
        </dl>
      </div>

      {/* Roster Rules */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Calendar className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Roster Rules</h3>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Rest Periods</dt>
            <dd className="mt-1 text-sm text-gray-900">
              Minimum Rest: {config.rosterRules.minimumRestPeriod}h<br />
              Max Consecutive Days: {config.rosterRules.maximumConsecutiveDays}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Notice Requirements</dt>
            <dd className="mt-1 text-sm text-gray-900">
              Required Notice: {config.rosterRules.noticeRequired}h<br />
              Max Weekly Hours: {config.rosterRules.maximumWeeklyHours}h
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}