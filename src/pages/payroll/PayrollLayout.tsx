import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { PayrollNav } from '../../components/payroll/navigation/PayrollNav';
import { useAuth } from '../../contexts/AuthContext';

export function PayrollLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PayrollNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}