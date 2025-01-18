import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; 
import { canAccessAdmin } from '../../utils/rbac';
import { AdminLayout } from './AdminLayout';
import { TenantAdmin } from './TenantAdmin';
import { TenantManagement } from './TenantManagement';
import { ShiftRulesAdmin } from './ShiftRulesAdmin';
import { SubscriptionManagement } from './SubscriptionManagement';
import { DocumentManagement } from '../documents/DocumentManagement';

function ProtectedRoute({ 
  children,
  path
}: {
  children: React.ReactNode;
  path: string;
}) {
  const { user } = useAuth();
  
  if (!user || !canAccessAdmin(user.role, path)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={
          <ProtectedRoute path="/admin/dashboard">
            <TenantAdmin />
          </ProtectedRoute>
        } />
        <Route path="tenants" element={
          <ProtectedRoute path="/admin/tenants">
            <TenantManagement />
          </ProtectedRoute>
        } />
        <Route path="shifts" element={
          <ProtectedRoute path="/admin/shifts">
            <ShiftRulesAdmin />
          </ProtectedRoute>
        } />
        <Route path="subscription" element={
          <ProtectedRoute path="/admin/subscription">
            <SubscriptionManagement />
          </ProtectedRoute>
        } />
        <Route path="documents" element={
          <ProtectedRoute path="/admin/documents">
            <DocumentManagement />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}