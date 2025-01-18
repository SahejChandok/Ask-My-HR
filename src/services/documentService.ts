import { supabase } from '../lib/supabase';
import { Document } from '../types/admin';

export async function uploadDocument(
  file: File,
  tenantId: string,
  category: string = 'general'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tenant-documents')
      .upload(`${tenantId}/${file.name}`, file);

    if (uploadError) throw uploadError;

    // Create document record
    const { error: recordError } = await supabase
      .from('documents')
      .insert({
        tenant_id: tenantId,
        name: file.name,
        type: file.type,
        size: file.size,
        storage_path: uploadData.path,
        category
      });

    if (recordError) throw recordError;

    return { success: true };
  } catch (error) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload document'
    };
  }
}

export async function getDocuments(tenantId: string): Promise<Document[]> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

export async function deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get document details first
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('tenant-documents')
      .remove([doc.storage_path]);

    if (storageError) throw storageError;

    // Delete record
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete document'
    };
  }
}

export async function downloadDocument(id: string): Promise<{ url: string; error?: string }> {
  try {
    // Get document details
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Get download URL
    const { data, error: downloadError } = await supabase.storage
      .from('tenant-documents')
      .createSignedUrl(doc.storage_path, 60); // URL valid for 60 seconds

    if (downloadError) throw downloadError;

    return { url: data.signedUrl };
  } catch (error) {
    console.error('Error getting download URL:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'Failed to get download URL'
    };
  }
}