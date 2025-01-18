import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FileText, Upload, Folder, Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
  updated_at: string;
  category: string;
}

export function DocumentManagement() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadDocuments();
  }, [user?.tenant_id]);

  async function loadDocuments() {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(files: FileList) {
    if (!user?.tenant_id) return;

    try {
      setUploading(true);
      setError(undefined);

      for (const file of Array.from(files)) {
        const { data, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(`${user.tenant_id}/${file.name}`, file);

        if (uploadError) throw uploadError;

        // Create document record
        const { error: recordError } = await supabase
          .from('documents')
          .insert({
            tenant_id: user.tenant_id,
            name: file.name,
            type: file.type,
            size: file.size,
            storage_path: data?.path,
            category: 'general'
          });

        if (recordError) throw recordError;
      }

      loadDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload document');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete document');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
        <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
          <Upload className="w-5 h-5 mr-2" />
          Upload Files
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uploaded
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="text-sm font-medium text-gray-900">
                      {doc.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Folder className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">{doc.category}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(doc.size / 1024).toFixed(1)} KB
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(doc.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    <button className="text-indigo-600 hover:text-indigo-900">
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}