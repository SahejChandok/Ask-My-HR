import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CreditCard, Package, Users, AlertTriangle, CheckCircle } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  maxEmployees: number;
}

const PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    maxEmployees: 10,
    features: ['Basic Payroll', 'Leave Management', 'Employee Portal']
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    maxEmployees: 50,
    features: ['Advanced Payroll', 'Document Management', 'IRD Integration', 'API Access']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    maxEmployees: 500,
    features: ['Custom Features', 'Priority Support', 'Data Analytics', 'Custom Integrations']
  }
];

export function SubscriptionManagement() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  useEffect(() => {
    loadSubscription();
  }, [user?.tenant_id]);

  async function loadSubscription() {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .select('plan_id, status')
        .eq('tenant_id', user.tenant_id)
        .single();

      if (error) throw error;
      setCurrentPlan(data?.plan_id);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(planId: string) {
    // In a real app, this would integrate with a payment provider
    try {
      setError(undefined);
      setSuccess(undefined);

      const { error } = await supabase
        .from('tenant_subscriptions')
        .upsert({
          tenant_id: user?.tenant_id,
          plan_id: planId,
          status: 'active',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setSuccess('Subscription updated successfully');
      setCurrentPlan(planId);
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError('Failed to update subscription');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Subscription Management</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`bg-white rounded-lg shadow-sm divide-y divide-gray-200 ${
            currentPlan === plan.id ? 'ring-2 ring-indigo-600' : ''
          }`}>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900">{plan.name}</h2>
              <p className="mt-4 text-sm text-gray-500">
                Perfect for organizations with up to {plan.maxEmployees} employees
              </p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                <span className="text-base font-medium text-gray-500">/month</span>
              </p>
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={currentPlan === plan.id}
                className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium ${
                  currentPlan === plan.id
                    ? 'bg-gray-100 text-gray-500 cursor-default'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {currentPlan === plan.id ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
            <div className="px-6 pt-6 pb-8">
              <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                What's included
              </h3>
              <ul className="mt-6 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex space-x-3">
                    <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}