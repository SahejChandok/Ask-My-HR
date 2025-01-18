import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, History, Settings } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { canAccessIRD } from '../../../utils/rbac';

const NAV_ITEMS = [
  {
    to: '/ird',
    icon: LayoutDashboard,
    label: 'Dashboard',
    end: true
  },
  {
    to: '/ird/filing',
    icon: FileText,
    label: 'Filing'
  },
  {
    to: '/ird/history',
    icon: History,
    label: 'History'
  },
  {
    to: '/ird/settings',
    icon: Settings,
    label: 'Settings'
  }
];

export function IRDNav() {
  const { user } = useAuth();
  const location = useLocation();

  // Only show nav items user has access to
  const allowedItems = NAV_ITEMS.filter(item => 
    user?.role && canAccessIRD(user.role, item.to)
  );

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 -mb-px">
          {allowedItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `
                group inline-flex items-center px-1 py-4 border-b-2 text-sm font-medium
                ${isActive
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon className={`w-5 h-5 mr-2 ${
                location.pathname === to
                  ? 'text-indigo-500'
                  : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}