import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';

export function DevModeIndicator() {
  const { isDevMode } = useAuth();

  if (!isDevMode) return null;

  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-md p-4 shadow-lg mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-bold text-yellow-800">
            Development Mode Active
          </h3>
          <div className="mt-2 text-sm text-yellow-700 space-y-1">
            <p>Email verification is bypassed in development mode</p>
            <div className="mt-2 p-2 bg-yellow-100 rounded">
              <p className="font-medium">Demo Account:</p>
              <p>Email: tenant.admin@example.com</p>
              <p>Password: demo-password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}