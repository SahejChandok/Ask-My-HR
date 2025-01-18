import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Building2, CreditCard, FileText, Settings, Users, Clock } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { canAccessAdmin } from '../../../utils/rbac';

const NAV_ITEMS = [
  {
    to: '/admin',
    icon: Building2,
    label: 'Dashboard',
    roles: ['platform_admin', 'tenant_admin'],
    end: true
  },
  {
    to: '/admin/tenants',
    icon: Building2,
    label: 'Tenants',
    roles: ['platform_admin'],
  },
  {
    to: '/admin/shifts',
    icon: Clock,
    label: 'Shift Rules',
    roles: ['platform_admin', 'tenant_admin']
  },
  {
    to: '/admin/users',
    icon: Users,
    label: 'Users',
    roles: ['platform_admin', 'tenant_admin']
  },
  {
    to: '/admin/subscription',
    icon: CreditCard,
    label: 'Subscription',
    roles: ['platform_admin', 'tenant_admin']
  },
  {
    to: '/admin/documents',
    icon: FileText,
    label: 'Documents',
    roles: ['platform_admin', 'tenant_admin']
  },
  {
    to: '/admin/settings',
    icon: Settings,
    label: 'Settings',
    roles: ['platform_admin', 'tenant_admin']
  }
];

export function AdminNav() {
  const { user } = useAuth();
  const location = useLocation();

  // Only show nav items user has access to
  const allowedItems = NAV_ITEMS.filter(item => 
    user?.role && canAccessAdmin(user.role, item.to)
  );

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 -mb-px">
          {allowedItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
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