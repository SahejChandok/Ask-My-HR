import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, Calendar, Settings } from 'lucide-react';

export function TenantQuickActions() {
  const actions = [
    {
      name: 'Manage Users',
      icon: Users,
      to: '/admin/users',
      description: 'Add or modify user accounts'
    },
    {
      name: 'Timesheets',
      icon: Clock,
      to: '/timesheets',
      description: 'Review and approve timesheets'
    },
    {
      name: 'Leave Requests',
      icon: Calendar,
      to: '/leave',
      description: 'Manage leave applications'
    },
    {
      name: 'Settings',
      icon: Settings,
      to: '/admin/settings',
      description: 'Configure tenant settings'
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.name}
            to={action.to}
            className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:border-indigo-500 hover:shadow-sm transition-all"
          >
            <action.icon className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-900">{action.name}</span>
            <span className="text-xs text-gray-500 text-center mt-1">
              {action.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}