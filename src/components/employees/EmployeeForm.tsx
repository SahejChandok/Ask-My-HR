import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { EmployeeProfile, TenantShiftConfig } from '../../types';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { EmployeeFormFields } from './EmployeeFormFields';
import { validateEmployeeEmail } from '../../utils/employeeValidation';
import { getShiftRuleGroups } from '../../services/shiftRules';

interface EmployeeFormProps {
  employee?: EmployeeProfile | null;
  onClose: () => void;
  onSubmit: () => void;
}

export function EmployeeForm({ employee, onClose, onSubmit }: EmployeeFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [shiftGroups, setShiftGroups] = useState<TenantShiftConfig[]>([]);
  const [formData, setFormData] = useState({
    first_name: employee?.first_name || '',
    last_name: employee?.last_name || '',
    ird_number: employee?.ird_number || '012345678',
    email: employee?.email || '',
    hourly_rate: employee?.hourly_rate || 30.00,
    employment_type: employee?.employment_type || 'hourly',
    is_active: employee?.is_active ?? true,
    kiwisaver_enrolled: employee?.kiwisaver_enrolled ?? true,
    kiwisaver_rate: employee?.kiwisaver_rate || 3.0,
    tax_code: employee?.tax_code || 'M',
    shift_rule_group_id: employee?.shift_rule_group_id,
    tenant_id: user?.tenant_id,
  });

  useEffect(() => {
    if (user?.tenant_id) {
      loadShiftGroups();
    }
  }, [user?.tenant_id]);

  async function loadShiftGroups() {
    try {
      const groups = await getShiftRuleGroups(user!.tenant_id!);
      setShiftGroups(groups);
    } catch (error) {
      console.error('Error loading shift groups:', error);
    }
  }
  function handleChange(field: string, value: string | number | boolean) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;
    setError(undefined);
    setLoading(true);
    
    try {
      // Validate email format
      if (!formData.email.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Validate IRD number format
      if (!/^\d{9}$/.test(formData.ird_number)) {
        setError('IRD number must be exactly 9 digits');
        setLoading(false);
        return;
      }

      // Call RPC function to validate email
      const { data: validation, error: validationError } = await supabase
        .rpc('validate_employee_email', {
          p_email: formData.email,
          p_tenant_id: user.tenant_id,
          p_exclude_id: employee?.id
        });

      if (validationError) {
        setError(validationError.message);
        return;
      }
      
      if (!validation.valid) {
        setError(validation.message);
        return;
      }

      let userId;
      
      if (!employee) {
        const { data: authData, error: authError } = await supabase
          .rpc('create_auth_user', {
            p_email: formData.email,
            p_tenant_id: user.tenant_id,
            p_role: 'employee'  // The function will convert this to role_type
          });

        if (authError) throw authError;
        if (!authData) throw new Error('Failed to create user account');
        
        userId = authData;
      }
      
      const employeeData = {
        ...formData,
        tenant_id: user.tenant_id,
        user_id: userId || employee?.user_id,
        updated_at: new Date().toISOString()
      };

      if (employee) {
        const { error: updateError } = await supabase
          .from('employee_profiles')
          .update(employeeData)
          .eq('id', employee.id)
          .eq('tenant_id', user.tenant_id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('employee_profiles')
          .insert([employeeData]);

        if (insertError) {
          if (insertError.message.includes('already exists')) {
            setError('This email address is already in use');
            return;
          }
          throw insertError;
        }
      }

      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
      setError(error instanceof Error ? error.message : 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center relative">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            {employee ? 'Edit Employee' : 'New Employee'}
          </h3>
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            </div>
          )}
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <EmployeeFormFields
            formData={formData}
            onChange={handleChange}
            shiftGroups={shiftGroups}
          />

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Saving...' : employee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}