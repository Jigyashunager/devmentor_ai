'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requiredRole?: string;
  fallback?: ReactNode;
}

export default function ProtectedRoute({
  children,
  redirectTo = '/login',
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.push(redirectTo);
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        // Redirect to unauthorized page if role doesn't match
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, redirectTo, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Don't render children if not authenticated or wrong role
  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
}

// Higher-order component version for easier usage
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    requiredRole?: string;
    fallback?: ReactNode;
  }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute
        redirectTo={options?.redirectTo}
        requiredRole={options?.requiredRole}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}