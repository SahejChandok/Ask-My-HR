import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2,
  Users,
  Clock,
  Calendar,
  Receipt,
  FileText,
  LogOut,
  Settings,
} from 'lucide-react';

export function Sidebar() {
  const { user, signOut } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      icon: Building2,
      to: '/',
      roles: ['platform_admin', 'tenant_admin', 'employee', 'hr_manager', 'payroll_admin'],
      end: true
    },
    {
      label: 'Employees',
      icon: Users,
      to: '/employees',
      roles: ['platform_admin', 'tenant_admin', 'hr_manager', 'payroll_admin']
    },
    {
      label: 'Timesheets',
      icon: Clock,
      to: '/timesheets',
      roles: ['platform_admin', 'tenant_admin', 'employee', 'payroll_admin']
    },
    {
      label: 'Leave',
      icon: Calendar,
      to: '/leave',
      roles: ['platform_admin', 'tenant_admin', 'employee', 'hr_manager']
    },
    {
      label: 'Payroll',
      icon: Receipt,
      to: '/payroll',
      roles: ['platform_admin', 'tenant_admin', 'payroll_admin']
    },
    {
      label: 'Admin',
      icon: Building2,
      to: '/admin',
      roles: ['platform_admin', 'tenant_admin']
    },
    {
      label: 'IRD Filing',
      icon: FileText,
      to: '/ird',
      roles: ['platform_admin', 'tenant_admin']
    },
    {
      label: 'Settings',
      icon: Settings,
      to: '/settings',
      roles: ['platform_admin', 'tenant_admin']
    }
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="flex flex-col h-full">
        <div className="space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t">
          <button
            onClick={() => signOut()}
            className="flex items-center space-x-3 px-3 py-2 w-full rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}