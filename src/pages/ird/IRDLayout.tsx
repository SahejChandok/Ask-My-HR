import React from 'react';
import { Outlet } from 'react-router-dom';
import { IRDNav } from '../../components/ird/navigation/IRDNav';
import { IRDBreadcrumbs } from '../../components/ird/navigation/IRDBreadcrumbs';

export function IRDLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <IRDNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <IRDBreadcrumbs />
        </div>
        <Outlet />
      </main>
    </div>
  );
}