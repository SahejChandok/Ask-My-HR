import React, { useState } from 'react';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DocumentUploadProps {
  employeeId: string;
  onComplete: () => void;
}

export function DocumentUpload({ employeeId, onComplete }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);

  const requiredDocs = [
    'ID Verification',
    'Tax Code Declaration',
    'KiwiSaver Form',
    'Bank Account Details'
  ];

  async function handleUpload(file: File, type: string) {
    try {
      setUploading(true);
      setError(undefined);

      const { data, error } = await supabase.storage
        .from('employee-documents')
        .upload(`${employeeId}/${type}/${file.name}`, file);

      if (error) throw error;

      setUploadedDocs([...uploadedDocs, type]);

      if (uploadedDocs.length + 1 === requiredDocs.length) {
        onComplete();
      }

    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload document');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Required Documents</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {requiredDocs.map(doc => (
          <div key={doc} className="relative">
            <label className="block text-sm font-medium text-gray-700">
              {doc}
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file, doc);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
            {uploadedDocs.includes(doc) && (
              <div className="absolute top-0 right-0 p-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}