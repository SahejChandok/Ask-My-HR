-- Create documents table
CREATE TABLE documents (
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
CREATE POLICY "tenant_access_policy" ON documents
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-documents', 'tenant-documents', false);

-- Add storage policy for tenant documents
CREATE POLICY "tenant_storage_policy"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'tenant-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add indexes
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_category ON documents(tenant_id, category);
CREATE INDEX idx_documents_created ON documents(tenant_id, created_at DESC);

-- Grant necessary permissions
GRANT ALL ON documents TO authenticated;