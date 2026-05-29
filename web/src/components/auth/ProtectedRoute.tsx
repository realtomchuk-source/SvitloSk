import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * ProtectedRoute Component
 * Checks if the user is authenticated and optionally has admin privileges.
 * Shows a loading spinner while auth state is resolving.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, isAuthLoading } = useStore();
  const location = useLocation();

  // ДІАГНОСТИКА: Виведемо в консоль роль користувача
  console.log('DEBUG AUTH:', { 
    id: user?.id, 
    email: user?.email, 
    role: user?.user_metadata?.role,
    isLoading: isAuthLoading 
  });

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0b]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-zinc-800 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm font-medium">Перевірка доступу...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Logged in but not an admin (if required)
  const userRole = user.user_metadata?.role;
  if (requireAdmin && userRole !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0b] text-white p-6 text-center">
        <div>
          <h1 className="text-4xl font-black mb-4 tracking-tighter">403</h1>
          <p className="text-zinc-500 max-w-xs mx-auto">У вас немає прав для доступу до цієї панелі. Будь ласка, зверніться до власника.</p>
          <button 
            onClick={() => window.location.hash = '#/'}
            className="mt-8 px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all"
          >
            На головну
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
