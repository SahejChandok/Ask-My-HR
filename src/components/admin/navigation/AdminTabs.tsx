import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, CreditCard, FileText, Settings } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { canAccessAdmin } from '../../../utils/rbac';

const tabs = [
  {
    to: '/admin/tenants',
    icon: Building2,
    label: 'Tenants',
    roles: ['platform_admin']
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

export function AdminTabs() {
  const { user } = useAuth();
  
  const allowedTabs = tabs.filter(tab => 
    user?.role && canAccessAdmin(user.role, tab.to)
  );

  return (
    <nav className="border-b border-gray-200">
      <div className="flex space-x-8">
        {allowedTabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
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