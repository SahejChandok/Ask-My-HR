import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { EmployeeProfile } from '../types';
import { Loader2, Plus } from 'lucide-react';
import { EmployeeForm } from '../components/employees/EmployeeForm';
import { EmployeeList } from '../components/employees/EmployeeList';

export function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);

  useEffect(() => {
    loadEmployees();
  }, [user]);

  async function loadEmployees() {
    if (!user?.tenant_id) return;

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

  function handleEdit(employee: EmployeeProfile) {
    setSelectedEmployee(employee);
    setShowForm(true);
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
        <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
        <button
          onClick={() => {
            setSelectedEmployee(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Employee
        </button>
      </div>

      {showForm && (
        <EmployeeForm
          employee={selectedEmployee}
          onClose={() => {
            setShowForm(false);
            setSelectedEmployee(null);
          }}
          onSubmit={() => {
            loadEmployees();
            setShowForm(false);
            setSelectedEmployee(null);
          }}
        />
      )}

      <EmployeeList
        employees={employees}
        onEdit={handleEdit}
      />
    </div>
  );
}