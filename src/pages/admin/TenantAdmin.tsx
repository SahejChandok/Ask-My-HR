import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Loader2, AlertTriangle } from 'lucide-react';
import { TenantMetrics } from '../../components/admin/TenantMetrics';
import { TenantQuickActions } from '../../components/admin/TenantQuickActions';
import { TenantActivity } from '../../components/admin/TenantActivity';
import { TenantSettings } from '../../components/admin/TenantSettings';
import { TenantUsers } from '../../components/admin/TenantUsers';

export function TenantAdmin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [metrics, setMetrics] = useState({
    activeEmployees: 0,
    pendingTimesheets: 0,
    pendingLeave: 0,
    monthlyPayroll: 0
  });
  const [settings, setSettings] = useState({
    companyName: '',
    timezone: 'Pacific/Auckland',
    dateFormat: 'DD/MM/YYYY',
    emailNotifications: true
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    loadTenantData();
  }, [user?.tenant_id]);

  async function loadTenantData() {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      setError(undefined);

      // Get metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('admin_metrics')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .single();

      if (metricsError) throw metricsError;
      setMetrics({
        activeEmployees: metricsData?.active_employees || 0,
        pendingTimesheets: metricsData?.pending_timesheets || 0,
        pendingLeave: metricsData?.pending_leave || 0,
        monthlyPayroll: metricsData?.monthly_payroll || 0
      });

      // Get settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .single();

      if (settingsError) throw settingsError;
      if (settingsData) {
        setSettings({
          companyName: settingsData.company_name,
          timezone: settingsData.timezone,
          dateFormat: settingsData.date_format,
          emailNotifications: settingsData.email_notifications
        });
      }

      // Get recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('tenant_activity')
        .select(`
          *,
          users (
            id,
            email,
            employee_profiles (
              first_name,
              last_name
            )
          )
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (activityError) throw activityError;
      setActivities(activityData || []);

    } catch (error) {
      console.error('Error loading tenant data:', error);
      setError('Failed to load tenant information');
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
        <h1 className="text-2xl font-semibold text-gray-900">Tenant Administration</h1>
      </div>

      <TenantMetrics {...metrics} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TenantQuickActions />
        <TenantActivity activities={activities} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TenantSettings 
          settings={settings}
          onUpdate={loadTenantData}
        />
        <TenantUsers />
      </div>
    </div>
  );
}