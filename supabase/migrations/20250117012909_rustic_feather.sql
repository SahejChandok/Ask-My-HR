-- Create storage buckets for documents if they don't exist
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

-- Drop existing storage policy if it exists
DROP POLICY IF EXISTS "tenant_documents_policy" ON storage.objects;

-- Add storage policies for documents
CREATE POLICY "tenant_documents_policy"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id IN ('documents', 'tenant-documents') AND 
  (storage.foldername(name))[1] = get_auth_tenant_id()::text
);

-- Create tenant settings table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS tenant_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenants(id),
    company_name text NOT NULL,
    timezone text NOT NULL DEFAULT 'Pacific/Auckland',
    date_format text NOT NULL DEFAULT 'DD/MM/YYYY',
    email_notifications boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT tenant_settings_tenant_id_key UNIQUE (tenant_id)
  );
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "tenant_settings_policy" ON tenant_settings;

-- Add RLS policy
CREATE POLICY "tenant_settings_policy" ON tenant_settings
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Add default settings for demo tenant if not exists
INSERT INTO tenant_settings (
  tenant_id,
  company_name,
  timezone,
  date_format
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'ACME Corporation',
  'Pacific/Auckland',
  'DD/MM/YYYY'
) ON CONFLICT (tenant_id) DO UPDATE SET
  updated_at = now();