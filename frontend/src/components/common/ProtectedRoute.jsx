import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, requiredPermission, requiredRoles }) => {
  const { isAuthenticated, loading, can, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !can(requiredPermission)) {
    return (
      <div className="p-8 text-center glass-panel rounded-2xl border border-rose-500/20 max-w-md mx-auto mt-20">
        <h2 className="text-base font-bold text-rose-400 mb-2">Access Forbidden (403)</h2>
        <p className="text-xs text-slate-300">
          Your current role does not have authorization to view this resource ({requiredPermission}).
        </p>
      </div>
    );
  }

  if (requiredRoles && !hasRole(...requiredRoles)) {
    return (
      <div className="p-8 text-center glass-panel rounded-2xl border border-rose-500/20 max-w-md mx-auto mt-20">
        <h2 className="text-base font-bold text-rose-400 mb-2">Access Forbidden (403)</h2>
        <p className="text-xs text-slate-300">
          This section requires one of the following roles: [{requiredRoles.join(', ')}].
        </p>
      </div>
    );
  }

  return children;
};
