import { canAccessPayroll, getPayrollPermissions } from '../utils/rbac';
import { Role } from '../types';

describe('RBAC Utils', () => {
  describe('canAccessPayroll', () => {
    it('allows tenant admin full access', () => {
      const role: Role = 'tenant_admin';
      expect(canAccessPayroll(role, '/payroll')).toBe(true);
      expect(canAccessPayroll(role, '/payroll/process')).toBe(true);
      expect(canAccessPayroll(role, '/payroll/settings')).toBe(true);
    });

    it('allows payroll admin limited access', () => {
      const role: Role = 'payroll_admin';
      expect(canAccessPayroll(role, '/payroll')).toBe(true);
      expect(canAccessPayroll(role, '/payroll/process')).toBe(true);
      expect(canAccessPayroll(role, '/payroll/settings')).toBe(false);
    });

    it('restricts employee access', () => {
      const role: Role = 'employee';
      expect(canAccessPayroll(role, '/payroll')).toBe(true);
      expect(canAccessPayroll(role, '/payroll/history')).toBe(true);
      expect(canAccessPayroll(role, '/payroll/process')).toBe(false);
      expect(canAccessPayroll(role, '/payroll/reports')).toBe(false);
      expect(canAccessPayroll(role, '/payroll/settings')).toBe(false);
    });
  });

  describe('getPayrollPermissions', () => {
    it('returns all paths for tenant admin', () => {
      const permissions = getPayrollPermissions('tenant_admin');
      expect(permissions).toContain('/payroll');
      expect(permissions).toContain('/payroll/process');
      expect(permissions).toContain('/payroll/history');
      expect(permissions).toContain('/payroll/reports');
      expect(permissions).toContain('/payroll/settings');
    });

    it('returns limited paths for employee', () => {
      const permissions = getPayrollPermissions('employee');
      expect(permissions).toEqual(['/payroll', '/payroll/history']);
    });
  });
});