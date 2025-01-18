import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { EmployeeProfile } from '../types';
import { Loader2 } from 'lucide-react';

interface EmployeeSelectProps {
  value?: string;
  onChange: (employeeId: string) => void;
  className?: string;
}

export function EmployeeSelect({ value, onChange, className = '' }: EmployeeSelectProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadEmployees() {
      if (!user?.tenant_id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('employee_profiles')
          .select('*')
          .eq('tenant_id', user.tenant_id)
          .order('first_name, last_name');

        if (error) throw error;
        setEmployees(data || []);
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, [user?.tenant_id]);

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin" />;
  }

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${className}`}
      >
        <option value="">Select Employee</option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.first_name} {employee.last_name}
          </option>
        ))}
      </select>
    </div>
  );
}