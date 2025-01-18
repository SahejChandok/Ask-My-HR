import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminNav } from '../../components/admin/navigation/AdminNav';
import { AdminBreadcrumbs } from '../../components/admin/navigation/AdminBreadcrumbs';

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <AdminBreadcrumbs />
        </div>
        <Outlet />
      </main>
    </div>
  );
}