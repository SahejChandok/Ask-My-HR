import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Building2, Plus, Settings, Loader2, AlertTriangle } from 'lucide-react';
import { Tenant } from '../../types/admin';

export function TenantManagement() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadTenants();
  }, [user?.tenant_id]);

  async function loadTenants() {
    if (!user?.role || user.role !== 'platform_admin') {
      setError('Unauthorized: Only platform admins can view tenants');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(undefined);

      // Get tenants with counts using subqueries
      const { data, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          *,
          users:users(count),
          employees:employee_profiles(count)
        `);

      if (tenantsError) throw tenantsError;

      // Transform data to include counts
      const transformedTenants = (data || []).map(tenant => ({
        ...tenant,
        users_count: tenant.users?.[0]?.count || 0,
        employees_count: tenant.employees?.[0]?.count || 0,
        status: tenant.status || 'active'
      }));

      setTenants(transformedTenants);
    } catch (error) {
      console.error('Error loading tenants:', error);
      setError('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-md flex items-center">
          <AlertTriangle className="w-6 h-6 mr-3" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Tenant Management</h1>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-5 h-5 mr-2" />
          New Tenant
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Users
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employees
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {tenant.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created {new Date(tenant.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  {tenant.users_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  {tenant.employees_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                    tenant.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900">
                    <Settings className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}