import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const DepartmentContext = createContext({ departments: [], getDeptName: () => '' });

/**
 * Fetches /api/departments once at app start and provides:
 *  - departments: Department[]
 *  - getDeptName(id): string — resolves name from real DB id
 */
export function DepartmentProvider({ children }) {
  const [departments, setDepartments] = useState([]);
  const [deptMap, setDeptMap] = useState({}); // { [id]: name }

  const fetchDepartments = useCallback(async () => {
    const token = localStorage.getItem('token');
    const headers = (token && token !== 'null' && token !== 'undefined') ? { 'Authorization': `Bearer ${token.trim()}` } : {};

    try {
      const r = await fetch(`${API_BASE_URL}/departments`, { headers });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) {
          setDepartments(data);
          const map = {};
          data.forEach(d => { map[d.departmentId] = d.departmentName; });
          setDeptMap(map);
          sessionStorage.setItem('desk_ai_departments', JSON.stringify(data));
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const cached = sessionStorage.getItem('desk_ai_departments');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setDepartments(parsed);
        const map = {};
        parsed.forEach(d => { map[d.departmentId] = d.departmentName; });
        setDeptMap(map);
        return;
      } catch {}
    }

    fetchDepartments();
  }, [fetchDepartments]);

  const getDeptName = useCallback((id) => {
    if (!id) return '';
    return deptMap[Number(id)] || '';
  }, [deptMap]);

  /**
   * Fetches user and department information by email from the backend.
   * Resolves the department ID, department name, and full department entity.
   */
  const fetchDepartmentByEmail = useCallback(async (email, customToken) => {
    if (!email) return null;
    try {
      const token = customToken || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE_URL}/users/by-email?email=${encodeURIComponent(email.trim().toLowerCase())}`, { headers });
      if (res.ok) {
        const userData = await res.json();
        const deptId = userData.departmentId || userData.department?.departmentId || null;
        const deptName = userData.departmentName || userData.department?.departmentName || (deptId ? deptMap[deptId] : '') || '';
        return {
          userId: userData.userId,
          email: userData.email,
          name: userData.name,
          role: userData.roleName,
          departmentId: deptId,
          departmentName: deptName,
          department: userData.department
        };
      }
    } catch (err) {
      console.warn('Failed to fetch department by email:', err);
    }
    return null;
  }, [deptMap]);

  return (
    <DepartmentContext.Provider value={{ departments, deptMap, getDeptName, fetchDepartmentByEmail, refreshDepartments: fetchDepartments }}>
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartments() {
  return useContext(DepartmentContext);
}

/**
 * Resolves department name from a user object.
 * Priority: department object > departmentName field > departmentId lookup via context
 */
export function resolveDeptNameFromUser(u, getDeptName) {
  if (!u) return '';
  // Backend returns nested department object
  if (u.department && typeof u.department === 'object' && u.department.departmentName) {
    return u.department.departmentName;
  }
  // Flat departmentName field
  if (u.departmentName) return u.departmentName;
  // Use departmentId with live context lookup
  const id = u.departmentId || (u.department && (u.department.departmentId || u.department.id));
  if (id && getDeptName) {
    const name = getDeptName(id);
    if (name) return name;
  }
  return '';
}
