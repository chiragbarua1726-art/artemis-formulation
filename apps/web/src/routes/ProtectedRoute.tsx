import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../lib/authStore';

interface ProtectedRouteProps {
  allowedRoles?: Array<'ADMIN' | 'MANAGER' | 'MR'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-slate-400">
        Verifying secure credentials...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If MR tries to access manager route, redirect to MR home
    if (user.role === 'MR') {
      return <Navigate to="/mr/today" replace />;
    }
    // If Manager/Admin tries to access MR route, allow or redirect to manager overview
    return <Navigate to="/manager/overview" replace />;
  }

  return <Outlet />;
};
