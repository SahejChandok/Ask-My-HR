-- Create subscription plans table
CREATE TABLE subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  max_employees integer NOT NULL,
  features jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create tenant subscriptions table
CREATE TABLE tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  plan_id text REFERENCES subscription_plans(id),
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_tenant_subscription UNIQUE (tenant_id)
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "public_read_plans" ON subscription_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tenant_access_policy" ON tenant_subscriptions
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, price, max_employees, features) VALUES
('starter', 'Starter', 49.00, 10, '["Basic Payroll", "Leave Management", "Employee Portal"]'),
('business', 'Business', 99.00, 50, '["Advanced Payroll", "Document Management", "IRD Integration", "API Access"]'),
('enterprise', 'Enterprise', 199.00, 500, '["Custom Features", "Priority Support", "Data Analytics", "Custom Integrations"]')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  max_employees = EXCLUDED.max_employees,
  features = EXCLUDED.features;

-- Add subscription for demo tenant
INSERT INTO tenant_subscriptions (
  tenant_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'business',
  'active',
  now(),
  now() + interval '1 month'
) ON CONFLICT (tenant_id) DO UPDATE SET
  status = EXCLUDED.status,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = now();