import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessIRD } from '../../utils/rbac';
import { IRDLayout } from './IRDLayout';
import { IRDDashboard } from './IRDDashboard';
import { IRDFiling } from './IRDFiling';
import { IRDFilingSubmit } from './IRDFilingSubmit';
import { IRDHistory } from './IRDHistory';
import { IRDSettings } from './IRDSettings';

function ProtectedRoute({ 
  children,
  path
}: {
  children: React.ReactNode;
  path: string;
}) {
  const { user } = useAuth();
  
  if (!user || !canAccessIRD(user.role, path)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function IRDRoutes() {
  return (
    <Routes>
      <Route element={<IRDLayout />}>
        <Route index element={
          <ProtectedRoute path="/ird">
            <IRDDashboard />
          </ProtectedRoute>
        } />
        <Route path="filing" element={
          <ProtectedRoute path="/ird/filing">
            <IRDFiling />
          </ProtectedRoute>
        } />
        <Route path="filing/submit/:runId" element={
          <ProtectedRoute path="/ird/filing/submit">
            <IRDFilingSubmit />
          </ProtectedRoute>
        } />
        <Route path="history" element={
          <ProtectedRoute path="/ird/history">
            <IRDHistory />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute path="/ird/settings">
            <IRDSettings />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/ird" replace />} />
      </Route>
    </Routes>
  );
}