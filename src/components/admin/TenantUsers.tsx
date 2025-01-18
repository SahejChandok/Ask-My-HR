import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, AlertTriangle, Loader2, UserPlus } from 'lucide-react';

interface TenantUser {
  id: string;
  email: string;
  role: string;
  is_verified: boolean;
  last_sign_in: string | null;
}

export function TenantUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadUsers();
  }, [user?.tenant_id]);

  async function loadUsers() {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .order('email');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Users</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage user access and roles
          </p>
        </div>
        <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Sign In
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="text-sm font-medium text-gray-900">
                      {user.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.is_verified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  {user.last_sign_in
                    ? new Date(user.last_sign_in).toLocaleDateString()
                    : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}