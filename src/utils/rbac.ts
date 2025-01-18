import { Role } from '../types';
import { isDevelopment } from './environment';

interface RoutePermissions {
  [key: string]: Role[];
}

// Define permissions for different modules
const PAYROLL_PERMISSIONS: RoutePermissions = {
  '/payroll': ['platform_admin', 'tenant_admin', 'payroll_admin', 'employee'],
  '/payroll/process': ['platform_admin', 'tenant_admin', 'payroll_admin'],
  '/payroll/history': ['platform_admin', 'tenant_admin', 'payroll_admin', 'employee'],
  '/payroll/reports': ['platform_admin', 'tenant_admin', 'payroll_admin'],
  '/payroll/settings': ['platform_admin', 'tenant_admin']
};

const ADMIN_PERMISSIONS: RoutePermissions = {
  '/admin': ['platform_admin', 'tenant_admin'],
  '/admin/tenants': ['platform_admin'],
  '/admin/subscription': ['platform_admin', 'tenant_admin'],
  '/admin/documents': ['platform_admin', 'tenant_admin'],
  '/admin/documents': ['platform_admin', 'tenant_admin'],
  '/admin/settings': ['platform_admin', 'tenant_admin']
};

const IRD_ROUTES: RoutePermissions = {
  '/ird': ['platform_admin', 'tenant_admin'],
  '/ird/filing': ['platform_admin', 'tenant_admin'],
  '/ird/filing/submit': ['platform_admin', 'tenant_admin'],
  '/ird/history': ['platform_admin', 'tenant_admin'],
  '/ird/settings': ['platform_admin', 'tenant_admin']
};

// Helper function to normalize paths
function normalizePath(path: string): string {
  return path.replace(/\/$/, '');
}

// Check payroll access
export function canAccessPayroll(userRole: Role, path: string): boolean {
  const normalizedPath = normalizePath(path);
  const exactPath = Object.keys(PAYROLL_PERMISSIONS).find(p => p === normalizedPath);
  
  // In development mode, allow all access
  if (isDevelopment()) {
    return true;
  }

  const allowedRoles = exactPath ? PAYROLL_PERMISSIONS[exactPath] : null;
  return allowedRoles?.includes(userRole) || false;
}

// Check admin access
export function canAccessAdmin(userRole: Role, path: string): boolean {
  const normalizedPath = normalizePath(path);
  const exactPath = Object.keys(ADMIN_PERMISSIONS).find(p => normalizedPath.startsWith(p));
  
  if (isDevelopment()) {
    return true;
  }
  
  const allowedRoles = exactPath ? ADMIN_PERMISSIONS[exactPath] : null;
  return allowedRoles?.includes(userRole) || false;
}

// Check IRD access
export function canAccessIRD(userRole: Role, path: string): boolean {
  const normalizedPath = normalizePath(path);
  const exactPath = Object.keys(IRD_ROUTES).find(p => normalizedPath.startsWith(p));
  
  // In development mode, allow all access
  if (isDevelopment()) {
    return true;
  }

  const allowedRoles = exactPath ? IRD_ROUTES[exactPath] : null;
  return allowedRoles?.includes(userRole) || false;
}

// Get payroll permissions
export function getPayrollPermissions(userRole: Role): string[] {
  return Object.entries(PAYROLL_PERMISSIONS)
    .filter(([_, roles]) => roles.includes(userRole))
    .map(([path]) => path);
}

// Get admin permissions
export function getAdminPermissions(userRole: Role): string[] {
  return Object.entries(ADMIN_PERMISSIONS)
    .filter(([_, roles]) => roles.includes(userRole))
    .map(([path]) => path);
}
// Get IRD permissions
export function getIRDPermissions(userRole: Role): string[] {
  return Object.entries(IRD_ROUTES)
    .filter(([_, roles]) => roles.includes(userRole))
    .map(([path]) => path);
}