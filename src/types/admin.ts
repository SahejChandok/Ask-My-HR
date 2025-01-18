export interface Tenant {
  id: string;
  name: string;
  created_at: string;
  users_count: number;
  employees_count: number;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Document {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  size: number;
  storage_path: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'past_due';
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface Document {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  size: number;
  storage_path: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  id: string;
  tenant_id: string;
  company_name: string;
  timezone: string;
  date_format: string;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminMetrics {
  active_employees: number;
  pending_timesheets: number;
  pending_leave: number;
  monthly_payroll: number;
  created_at: string;
  updated_at: string;
}