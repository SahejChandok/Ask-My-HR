import React from 'react';
import { PayrollCalculationLog } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Clock, DollarSign, Calculator, PiggyBank, Receipt } from 'lucide-react';

interface PayrollDebugProps {
  logs: PayrollCalculationLog[];
}

export function PayrollDebug({ logs }: PayrollDebugProps) {
  // Group logs by type
  const logsByType = logs.reduce((acc, log) => {
    if (!acc[log.log_type]) {
      acc[log.log_type] = [];
    }
    acc[log.log_type].push(log);
    return acc;
  }, {} as Record<string, PayrollCalculationLog[]>);

  const sections = [
    {
      type: 'timesheet_summary',
      title: 'Timesheet Summary',
      icon: Clock,
      render: (log: PayrollCalculationLog) => (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Hours</span>
            <span>{log.details.total_hours.toFixed(2)}h</span>
          </div>
          <div className="flex justify-between">
            <span>Entries</span>
            <span>{log.details.entry_count}</span>
          </div>
        </div>
      )
    },
    {
      type: 'salary_calculation',
      title: 'Salary Calculation',
      icon: DollarSign,
      render: (log: PayrollCalculationLog) => (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Annual Salary</span>
            <span>{formatCurrency(log.details.annual_salary)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pay Period Amount</span>
            <span>{formatCurrency(log.details.pay_period_amount)}</span>
          </div>
        </div>
      )
    },
    {
      type: 'hourly_calculation',
      title: 'Hourly Pay Calculation',
      icon: Calculator,
      render: (log: PayrollCalculationLog) => (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Hours Worked</span>
            <span>{log.details.hours_worked.toFixed(2)}h</span>
          </div>
          <div className="flex justify-between">
            <span>Hourly Rate</span>
            <span>{formatCurrency(log.details.hourly_rate)}/hr</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Gross Pay</span>
            <span>{formatCurrency(log.details.gross_pay)}</span>
          </div>
        </div>
      )
    },
    {
      type: 'kiwisaver_calculation',
      title: 'KiwiSaver Calculation',
      icon: PiggyBank,
      render: (log: PayrollCalculationLog) => (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Employee Rate</span>
            <span>{log.details.employee_rate}%</span>
          </div>
          <div className="flex justify-between">
            <span>Employee Contribution</span>
            <span>{formatCurrency(log.details.employee_contribution)}</span>
          </div>
          <div className="flex justify-between">
            <span>Employer Contribution (3%)</span>
            <span>{formatCurrency(log.details.employer_contribution)}</span>
          </div>
        </div>
      )
    },
    {
      type: 'tax_calculation',
      title: 'Tax Calculation',
      icon: Receipt,
      render: (log: PayrollCalculationLog) => (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Gross Pay</span>
            <span>{formatCurrency(log.details.gross_pay)}</span>
          </div>
          <div className="flex justify-between">
            <span>Annualized Pay</span>
            <span>{formatCurrency(log.details.annualized_pay)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax Code</span>
            <span>{log.details.tax_code}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax Rate</span>
            <span>{(log.details.tax_rate * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>PAYE Tax</span>
            <span>{formatCurrency(log.details.tax_amount)}</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Calculation Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map(section => {
          const sectionLogs = logsByType[section.type] || [];
          if (sectionLogs.length === 0) return null;

          return (
            <div 
              key={section.type}
              className="bg-white shadow-sm rounded-lg p-6"
            >
              <div className="flex items-center mb-4">
                <section.icon className="w-5 h-5 text-gray-400 mr-2" />
                <h4 className="text-sm font-medium text-gray-900">
                  {section.title}
                </h4>
              </div>
              {sectionLogs.map((log, index) => (
                <div key={log.id} className="text-sm">
                  {section.render(log)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}