// Authentication utilities and token management
export const AUTH_TOKEN_KEY = 'authToken';
export const USER_DATA_KEY = 'userData';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Token management
export const tokenManager = {
  // Get stored token
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  // Store token
  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  // Remove token
  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  // Check if token exists
  hasToken(): boolean {
    return !!this.getToken();
  },

  // Check if token is expired (basic check)
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Basic JWT structure check
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp ? payload.exp < currentTime : false;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  },
};

// User data management
export const userManager = {
  // Get stored user data
  getUser(): StoredUser | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  },

  // Store user data
  setUser(user: StoredUser): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  },

  // Remove user data
  removeUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_DATA_KEY);
  },

  // Update user data (merge with existing)
  updateUser(updates: Partial<StoredUser>): void {
    const currentUser = this.getUser();
    if (currentUser) {
      this.setUser({ ...currentUser, ...updates });
    }
  },
};

// Authentication state management
export const authManager = {
  // Check if user is authenticated
  isAuthenticated(): boolean {
    return tokenManager.hasToken() && !tokenManager.isTokenExpired() && !!userManager.getUser();
  },

  // Login - store token and user data
  login(token: string, user: StoredUser): void {
    tokenManager.setToken(token);
    userManager.setUser(user);
  },

  // Logout - clear all stored data
  logout(): void {
    tokenManager.removeToken();
    userManager.removeUser();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  // Get current user
  getCurrentUser(): StoredUser | null {
    return this.isAuthenticated() ? userManager.getUser() : null;
  },

  // Update current user
  updateCurrentUser(updates: Partial<StoredUser>): void {
    if (this.isAuthenticated()) {
      userManager.updateUser(updates);
    }
  },

  // Initialize auth state (call on app startup)
  initialize(): { isAuthenticated: boolean; user: StoredUser | null } {
    const isAuthenticated = this.isAuthenticated();
    const user = isAuthenticated ? userManager.getUser() : null;

    // Clean up if token is expired but still stored
    if (!isAuthenticated && (tokenManager.hasToken() || userManager.getUser())) {
      this.logout();
    }

    return { isAuthenticated, user };
  },
};

// Validation utilities
export const validation = {
  // Email validation
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Password validation
  isValidPassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (password.length > 100) {
      errors.push('Password must be less than 100 characters');
    }

    // Add more password rules if needed
    // if (!/[A-Z]/.test(password)) {
    //   errors.push('Password must contain at least one uppercase letter');
    // }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Name validation
  isValidName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 50;
  },
};

// Protected route helper
export const requireAuth = (): StoredUser | null => {
  if (!authManager.isAuthenticated()) {
    // Redirect to login if not authenticated
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }
  
  return authManager.getCurrentUser();
};

// Route protection utility
export const redirectIfAuthenticated = (): void => {
  if (authManager.isAuthenticated()) {
    // Redirect to dashboard if already authenticated
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  }
};

// Error handling utilities
export const authErrors = {
  // Common auth error messages
  INVALID_CREDENTIALS: 'Invalid email or password',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  EMAIL_EXISTS: 'An account with this email already exists',
  WEAK_PASSWORD: 'Password is too weak',
  INVALID_EMAIL: 'Please enter a valid email address',
  REQUIRED_FIELD: 'This field is required',
  TOKEN_EXPIRED: 'Session expired. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to access this resource',

  // Get user-friendly error message
  getUserFriendlyMessage(error: any): string {
    if (typeof error === 'string') return error;
    
    const message = error?.message || error?.error?.message || '';
    
    // Map backend errors to user-friendly messages
    if (message.includes('Invalid email or password')) {
      return this.INVALID_CREDENTIALS;
    }
    
    if (message.includes('already exists')) {
      return this.EMAIL_EXISTS;
    }
    
    if (message.includes('Network')) {
      return this.NETWORK_ERROR;
    }
    
    if (message.includes('token') || message.includes('unauthorized')) {
      return this.TOKEN_EXPIRED;
    }
    
    return message || this.SERVER_ERROR;
  },
};