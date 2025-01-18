import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Timesheets } from './pages/Timesheets';
import { Leave } from './pages/Leave'; 
import { PayrollRoutes } from './pages/payroll';
import { AdminRoutes } from './pages/admin/AdminRoutes';
import { IRDRoutes } from './pages/ird';
import { Login } from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/timesheets" element={<Timesheets />} />
            <Route path="/leave" element={<Leave />} />
            <Route path="/admin/*" element={<AdminRoutes />} />
            <Route path="/payroll/*" element={<PayrollRoutes />} />
            <Route path="/ird/*" element={<IRDRoutes />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}