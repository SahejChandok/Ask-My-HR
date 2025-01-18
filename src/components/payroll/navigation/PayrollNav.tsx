import React, { useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Play, History, FileText, Settings, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { canAccessPayroll } from '../../../utils/rbac';
import { Role } from '../../../types';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles: Role[];
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/payroll',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: ['platform_admin', 'tenant_admin', 'payroll_admin', 'employee'],
    end: true
  },
  {
    to: '/payroll/process',
    icon: Play,
    label: 'Process',
    roles: ['platform_admin', 'tenant_admin', 'payroll_admin']
  },
  {
    to: '/payroll/history',
    icon: History,
    label: 'History',
    roles: ['platform_admin', 'tenant_admin', 'payroll_admin', 'employee']
  },
  {
    to: '/payroll/reports',
    icon: FileText,
    label: 'Reports',
    roles: ['platform_admin', 'tenant_admin', 'payroll_admin']
  },
  {
    to: '/payroll/ird',
    icon: FileSpreadsheet,
    label: 'IRD Filing',
    roles: ['platform_admin', 'tenant_admin']
  },
  {
    to: '/payroll/settings',
    icon: Settings,
    label: 'Settings',
    roles: ['platform_admin', 'tenant_admin']
  }
];

export function PayrollNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const allowedItems = useMemo(() => 
    NAV_ITEMS.filter(item => 
      user?.role && canAccessPayroll(user.role, item.to)
    ), [user?.role]
  );

  // Redirect if user can't access current route
  React.useEffect(() => {
    if (user?.role && !canAccessPayroll(user.role, location.pathname)) {
      navigate('/payroll');
    }
  }, [user?.role, location.pathname, navigate]);

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