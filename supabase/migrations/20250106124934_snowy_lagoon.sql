-- Drop existing policies first
DROP POLICY IF EXISTS "tenant_access_policy" ON documents;
DROP POLICY IF EXISTS "tenant_documents_policy" ON storage.objects;

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  name text NOT NULL,
  type text NOT NULL,
  size integer NOT NULL,
  storage_path text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "documents_tenant_access" ON documents
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Create storage buckets if they don't exist
DO $$ 
BEGIN
  -- Create documents bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('documents', 'documents', false)
  ON CONFLICT (id) DO NOTHING;

  -- Create tenant-documents bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('tenant-documents', 'tenant-documents', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Add storage policies for documents
CREATE POLICY "storage_tenant_access" ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id IN ('documents', 'tenant-documents') AND 
    (storage.foldername(name))[1] = get_auth_tenant_id()::text
  );

-- Create tenant subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  plan_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT now() + interval '1 month',
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_tenant_subscription UNIQUE (tenant_id)
);

-- Enable RLS
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "subscriptions_tenant_access" ON tenant_subscriptions
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

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