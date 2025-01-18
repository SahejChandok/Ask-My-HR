import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessPayroll } from '../../utils/rbac';
import { PayrollLayout } from './PayrollLayout';
import { PayrollDashboard } from './PayrollDashboard';
import { PayrollProcess } from './PayrollProcess';
import { PayrollHistory } from './PayrollHistory';
import { PayrollReports } from './PayrollReports';
import { PayrollSettings } from './PayrollSettings';

function ProtectedRoute({ 
  children, 
  path 
}: { 
  children: React.ReactNode;
  path: string;
}) {
  const { user } = useAuth();
  
  if (!user || !canAccessPayroll(user.role, path)) {
    return <Navigate to="/payroll" replace />;
  }

  return <>{children}</>;
}

export function PayrollRoutes() {
  return (
    <Routes>
      <Route element={<PayrollLayout />}>
        <Route index element={
          <ProtectedRoute path="/payroll">
            <PayrollDashboard />
          </ProtectedRoute>
        } />
        <Route path="process/*" element={
          <ProtectedRoute path="/payroll/process">
            <PayrollProcess />
          </ProtectedRoute>
        } />
        <Route path="history" element={
          <ProtectedRoute path="/payroll/history">
            <PayrollHistory />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute path="/payroll/reports">
            <PayrollReports />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute path="/payroll/settings">
            <PayrollSettings />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/payroll" replace />} />
      </Route>
    </Routes>
  );
}