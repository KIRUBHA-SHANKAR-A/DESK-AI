import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import EmployeePage from './pages/EmployeePage';
import SupportEngineerPage from './pages/SupportEngineerPage';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin Command Center — Strictly ADMIN role */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Employee Portal — EMPLOYEE, USER, or ADMIN */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE', 'USER', 'ADMIN']}>
            <EmployeePage />
          </ProtectedRoute>
        }
      />

      {/* Support Engineer Console — SUPPORT_ENGINEER, ENGINEER, or ADMIN */}
      <Route
        path="/engineer"
        element={
          <ProtectedRoute allowedRoles={['SUPPORT_ENGINEER', 'ENGINEER', 'ADMIN']}>
            <SupportEngineerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute allowedRoles={['SUPPORT_ENGINEER', 'ENGINEER', 'ADMIN']}>
            <SupportEngineerPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


export default App;
