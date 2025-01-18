import React, { useState } from 'react';
import { IRDFilingConfig } from '../../components/ird/IRDFilingConfig';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function IRDSettings() {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const handleUpdate = () => {
    setError(undefined);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleError = (err: string) => {
    setSuccess(false);
    setError(err);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">IRD Settings</h1>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Settings saved successfully
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <IRDFilingConfig 
        onUpdate={handleUpdate}
        onError={handleError}
      />
    </div>
  );
}