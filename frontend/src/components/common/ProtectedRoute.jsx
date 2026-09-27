import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Enterprise Route Guard:
 * 1. Checks if a valid JWT token and user profile exist in localStorage.
 * 2. Redirects unauthenticated users to /login immediately.
 * 3. Enforces strict role-based access control (RBAC).
 * 4. Redirects authenticated users with incorrect roles to their designated home console.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');

  if (!token || !userRaw) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(userRaw);
    const rawRole = (user.roleName || user.role || '').toUpperCase().trim();
    const role = rawRole.startsWith('ROLE_') ? rawRole.substring(5) : rawRole;

    if (allowedRoles && allowedRoles.length > 0) {
      const normalizedAllowed = allowedRoles.map(r => {
        const up = r.toUpperCase().trim();
        return up.startsWith('ROLE_') ? up.substring(5) : up;
      });

      const isAllowed =
        normalizedAllowed.includes(role) ||
        (normalizedAllowed.includes('SUPPORT_ENGINEER') && (role === 'ENGINEER' || role === 'SUPPORT')) ||
        (normalizedAllowed.includes('EMPLOYEE') && role === 'USER');

      if (!isAllowed) {
        // Redirect unauthorized user to their proper dashboard
        if (role === 'ADMIN') {
          return <Navigate to="/admin" replace />;
        } else if (role === 'SUPPORT_ENGINEER' || role === 'ENGINEER' || role === 'SUPPORT') {
          return <Navigate to="/engineer" replace />;
        } else {
          return <Navigate to="/employee" replace />;
        }
      }
    }

    return children;
  } catch (err) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
}
