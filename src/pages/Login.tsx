import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building, Loader2 } from 'lucide-react';
import { AuthApiError } from '@supabase/supabase-js';

export function Login() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      
      await signIn(email, password);
    } catch (error) {
      if (error instanceof AuthApiError) {
        setError('Unable to connect to the server. Please try again.');
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Building className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Ask Your HR
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your complete HR and payroll solution
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign in
              </button>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-gray-700">
                Demo Accounts
              </p>
              <div className="mt-2 space-y-2">
                <div className="bg-gray-50 p-2 rounded-md">
                  <p className="text-xs font-medium text-gray-700">Demo Admin</p>
                  <p className="text-xs text-gray-500">
                    Email: tenant.admin@example.com<br />
                    Password: demo-password
                  </p>
                </div>
                <p className="text-xs text-gray-400 italic">
                  (Auto-created on first run)
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}