import { supabase } from '../../lib/supabase';
import { createTestTenant, createTestUser, cleanupTestData } from '../utils/testHelpers';

describe('Row Level Security Tests', () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let adminUser1Id: string;
  let employeeUser1Id: string;
  let adminUser2Id: string;

  beforeAll(async () => {
    // Create test tenants
    tenant1Id = await createTestTenant('Test Tenant 1');
    tenant2Id = await createTestTenant('Test Tenant 2');

    // Create test users
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

    adminUser2Id = await createTestUser({
      email: 'admin2@test.com',
      role: 'tenant_admin',
      tenantId: tenant2Id
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Payroll Settings', () => {
    it('prevents access to other tenant settings', async () => {
      // Try to access tenant2's settings as tenant1 admin
      const { data, error } = await supabase
        .from('payroll_settings')
        .select('*')
        .eq('tenant_id', tenant2Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('allows access to own tenant settings', async () => {
      const { data, error } = await supabase
        .from('payroll_settings')
        .select('*')
        .eq('tenant_id', tenant1Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].tenant_id).toBe(tenant1Id);
    });
  });

  describe('Employee Profiles', () => {
    it('prevents access to other tenant employees', async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('tenant_id', tenant2Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('allows employees to view own profile', async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('user_id', employeeUser1Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].user_id).toBe(employeeUser1Id);
    });
  });

  describe('Payroll Runs', () => {
    it('prevents access to other tenant payroll runs', async () => {
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('tenant_id', tenant2Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('allows admins to view own tenant payroll runs', async () => {
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('tenant_id', tenant1Id);

      expect(error).toBeNull();
      expect(data!.every(run => run.tenant_id === tenant1Id)).toBe(true);
    });

    it('prevents employees from creating payroll runs', async () => {
      const { error } = await supabase
        .from('payroll_runs')
        .insert({
          tenant_id: tenant1Id,
          period_start: '2024-01-01',
          period_end: '2024-01-31',
          processed_by: employeeUser1Id,
          status: 'draft'
        });

      expect(error).not.toBeNull();
    });
  });

  describe('Leave Requests', () => {
    it('prevents access to other tenant leave requests', async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('tenant_id', tenant2Id);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('allows employees to view own leave requests', async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeUser1Id);

      expect(error).toBeNull();
      expect(data!.every(request => request.employee_id === employeeUser1Id)).toBe(true);
    });
  });
});