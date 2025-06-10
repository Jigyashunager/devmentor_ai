// Re-export useAuth from context for easier imports
import { useAuth as useAuthContext } from '../contexts/AuthContext';
export { useAuth } from '../contexts/AuthContext';

// Additional auth-related hooks can be added here

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Hook for protecting routes
export const useRequireAuth = (redirectTo: string = '/login') => {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isAuthenticated, isLoading, user };
};

// Hook for redirecting authenticated users
export const useRedirectIfAuthenticated = (redirectTo: string = '/dashboard') => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isAuthenticated, isLoading };
};

// Hook for auth state monitoring
export const useAuthState = () => {
  const { user, isAuthenticated, isLoading, error } = useAuthContext();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    // Computed properties
    isLoggedIn: isAuthenticated && !!user,
    userName: user?.name || '',
    userEmail: user?.email || '',
    userRole: user?.role || 'developer',
  };
};

// Hook for form validation with auth context
export const useAuthValidation = () => {
  const { error, clearError } = useAuthContext();

  const validateLoginForm = (email: string, password: string): string[] => {
    const errors: string[] = [];
    
    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address');
    }
    
    return errors;
  };

  const validateRegisterForm = (name: string, email: string, password: string): string[] => {
    const errors: string[] = [];
    
    if (!name) errors.push('Name is required');
    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');
    
    if (name && (name.trim().length < 2 || name.trim().length > 50)) {
      errors.push('Name must be between 2 and 50 characters');
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (password && password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    return errors;
  };

  return {
    authError: error,
    clearAuthError: clearError,
    validateLoginForm,
    validateRegisterForm,
  };
};