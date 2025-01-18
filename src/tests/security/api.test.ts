import { supabase } from '../../lib/supabase';
import { createTestTenant, createTestUser, cleanupTestData } from '../utils/testHelpers';
import { processPayroll } from '../../utils/payroll/calculations';
import { validatePayrollPeriod } from '../../utils/payroll/validation';

describe('API Security Tests', () => {
  let tenant1Id: string;
  let adminUser1Id: string;
  let employeeUser1Id: string;

  beforeAll(async () => {
    tenant1Id = await createTestTenant('Test Tenant 1');
    adminUser1Id = await createTestUser({
      email: 'admin1@test.com',
      role: 'tenant_admin',
      tenantId: tenant1Id
    });
    employeeUser1Id = await createTestUser({
      email: 'employee1@test.com',
      role: 'employee',
      tenantId: tenant1Id
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Payroll Processing', () => {
    it('prevents employees from processing payroll', async () => {
      // Sign in as employee
      await supabase.auth.signInWithPassword({
        email: 'employee1@test.com',
        password: 'test-password'
      });

      const result = await processPayroll({
        tenantId: tenant1Id,
        userId: employeeUser1Id,
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31'
      });

      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/unauthorized/i);
    });

    it('allows admins to process payroll', async () => {
      // Sign in as admin
      await supabase.auth.signInWithPassword({
        email: 'admin1@test.com',
        password: 'test-password'
      });

      const result = await processPayroll({
        tenantId: tenant1Id,
        userId: adminUser1Id,
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31'
      });

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
    });
  });

  describe('Payroll Validation', () => {
    it('prevents validation of other tenant periods', async () => {
      const result = await validatePayrollPeriod(
        'other-tenant-id',
        '2024-01-01',
        '2024-01-31'
      );

      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/unauthorized/i);
    });

    it('allows validation of own tenant periods', async () => {
      const result = await validatePayrollPeriod(
        tenant1Id,
        '2024-01-01',
        '2024-01-31'
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('Employee Data Access', () => {
    it('prevents employees from accessing other employee data', async () => {
      // Sign in as employee
      await supabase.auth.signInWithPassword({
        email: 'employee1@test.com',
        password: 'test-password'
      });

      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .neq('user_id', employeeUser1Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('allows admins to access all employee data within tenant', async () => {
      // Sign in as admin
      await supabase.auth.signInWithPassword({
        email: 'admin1@test.com',
        password: 'test-password'
      });

      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('tenant_id', tenant1Id);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
    });
  });
});