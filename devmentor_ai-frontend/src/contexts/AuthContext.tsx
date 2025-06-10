'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { apiClient, User, AuthResponse } from '@/lib/api';
import { authManager, authErrors, validation } from '@/lib/auth';

// Types
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'INITIALIZE'; payload: { user: User | null; isAuthenticated: boolean } };

interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string }) => Promise<boolean>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading to check stored auth
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    case 'INITIALIZE':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { isAuthenticated, user } = authManager.initialize();
        
        if (isAuthenticated && user) {
          // Verify token with backend
          try {
            const response = await apiClient.getProfile();
            dispatch({
              type: 'INITIALIZE',
              payload: { user: response.user, isAuthenticated: true },
            });
          } catch (error) {
            // Token is invalid, clear stored data
            authManager.logout();
            dispatch({
              type: 'INITIALIZE',
              payload: { user: null, isAuthenticated: false },
            });
          }
        } else {
          dispatch({
            type: 'INITIALIZE',
            payload: { user: null, isAuthenticated: false },
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({
          type: 'INITIALIZE',
          payload: { user: null, isAuthenticated: false },
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    // Validate inputs
    if (!email || !password) {
      dispatch({ type: 'SET_ERROR', payload: 'Email and password are required' });
      return false;
    }

    if (!validation.isValidEmail(email)) {
      dispatch({ type: 'SET_ERROR', payload: authErrors.INVALID_EMAIL });
      return false;
    }

    try {
      const response: AuthResponse = await apiClient.login({ email, password });
      
      // Store auth data
      authManager.login(response.token, {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      });

      dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
      return true;
    } catch (error: any) {
      const errorMessage = authErrors.getUserFriendlyMessage(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    // Validate inputs
    if (!name || !email || !password) {
      dispatch({ type: 'SET_ERROR', payload: 'All fields are required' });
      return false;
    }

    if (!validation.isValidName(name)) {
      dispatch({ type: 'SET_ERROR', payload: 'Name must be between 2 and 50 characters' });
      return false;
    }

    if (!validation.isValidEmail(email)) {
      dispatch({ type: 'SET_ERROR', payload: authErrors.INVALID_EMAIL });
      return false;
    }

    const passwordValidation = validation.isValidPassword(password);
    if (!passwordValidation.isValid) {
      dispatch({ type: 'SET_ERROR', payload: passwordValidation.errors[0] });
      return false;
    }

    try {
      const response: AuthResponse = await apiClient.register({ name, email, password });
      
      // Store auth data
      authManager.login(response.token, {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      });

      dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
      return true;
    } catch (error: any) {
      const errorMessage = authErrors.getUserFriendlyMessage(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    }
  };

  // Logout function
  const logout = (): void => {
    authManager.logout();
    dispatch({ type: 'LOGOUT' });
  };

  // Update profile function
  const updateProfile = async (data: { name?: string; email?: string }): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    // Validate inputs
    if (data.name && !validation.isValidName(data.name)) {
      dispatch({ type: 'SET_ERROR', payload: 'Name must be between 2 and 50 characters' });
      return false;
    }

    if (data.email && !validation.isValidEmail(data.email)) {
      dispatch({ type: 'SET_ERROR', payload: authErrors.INVALID_EMAIL });
      return false;
    }

    try {
      const response = await apiClient.updateProfile(data);
      
      // Update stored user data
      authManager.updateCurrentUser({
        name: response.user.name,
        email: response.user.email,
      });

      dispatch({ type: 'UPDATE_USER', payload: response.user });
      dispatch({ type: 'SET_LOADING', payload: false });
      return true;
    } catch (error: any) {
      const errorMessage = authErrors.getUserFriendlyMessage(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    if (!state.isAuthenticated) return;

    try {
      const response = await apiClient.getProfile();
      
      // Update stored user data
      authManager.updateCurrentUser(response.user);
      
      dispatch({ type: 'UPDATE_USER', payload: response.user });
    } catch (error: any) {
      console.error('Failed to refresh user data:', error);
      
      // If token is invalid, logout
      if (error.message?.includes('token') || error.message?.includes('unauthorized')) {
        logout();
      }
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const contextValue: AuthContextType = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export context for advanced usage
export { AuthContext };