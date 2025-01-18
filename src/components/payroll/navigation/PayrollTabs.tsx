import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Play, History, FileText, Settings } from 'lucide-react';

const tabs = [
  {
    to: '/payroll',
    icon: LayoutDashboard,
    label: 'Dashboard',
    end: true
  },
  {
    to: '/payroll/process',
    icon: Play,
    label: 'Process'
  },
  {
    to: '/payroll/history',
    icon: History,
    label: 'History'
  },
  {
    to: '/payroll/reports',
    icon: FileText,
    label: 'Reports'
  },
  {
    to: '/payroll/settings',
    icon: Settings,
    label: 'Settings'
  }
];

export function PayrollTabs() {
  return (
    <nav className="border-b border-gray-200">
      <div className="flex space-x-8">
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `
              flex items-center px-3 py-4 text-sm font-medium border-b-2 -mb-px
              ${isActive 
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
            `}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}