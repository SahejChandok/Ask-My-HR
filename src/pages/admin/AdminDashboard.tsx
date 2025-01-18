import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardMetrics } from '../../components/dashboard/DashboardMetrics';
import { Loader2 } from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeEmployees: 0,
    pendingTimesheets: 0,
    pendingLeave: 0,
    monthlyPayroll: 0
  });

  useEffect(() => {
    loadMetrics();
  }, [user?.tenant_id]);

  async function loadMetrics() {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_metrics')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .single();

      if (error) throw error;
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
      </div>

      <DashboardMetrics {...metrics} />
    </div>
  );
}