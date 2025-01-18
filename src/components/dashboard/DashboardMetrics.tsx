import React from 'react';
import { Users, Clock, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface DashboardMetrics {
  activeEmployees: number;
  pendingTimesheets: number;
  pendingLeave: number;
  monthlyPayroll: number;
}

export function DashboardMetrics({
  activeEmployees,
  pendingTimesheets,
  pendingLeave,
  monthlyPayroll
}: DashboardMetrics) {
  const metrics = [
    {
      name: 'Active Employees',
      value: activeEmployees,
      icon: Users,
      change: '+2.5%',
      changeType: 'increase'
    },
    {
      name: 'Pending Timesheets',
      value: pendingTimesheets,
      icon: Clock,
      change: '-3',
      changeType: 'decrease'
    },
    {
      name: 'Leave Requests',
      value: pendingLeave,
      icon: Calendar,
      change: '+1',
      changeType: 'increase'
    },
    {
      name: 'Monthly Payroll',
      value: formatCurrency(monthlyPayroll),
      icon: DollarSign,
      change: '+5.2%',
      changeType: 'increase'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <metric.icon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {metric.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {metric.value}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}