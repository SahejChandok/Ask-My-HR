import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export function PayrollBreadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    
    return {
      path,
      label,
      isLast: index === pathSegments.length - 1
    };
  });

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500">
      <Link to="/" className="hover:text-gray-700">
        <Home className="w-4 h-4" />
      </Link>
      {breadcrumbs.map(({ path, label, isLast }) => (
        <React.Fragment key={path}>
          <ChevronRight className="w-4 h-4" />
          {isLast ? (
            <span className="text-gray-900 font-medium">{label}</span>
          ) : (
            <Link to={path} className="hover:text-gray-700">
              {label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}