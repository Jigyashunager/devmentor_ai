'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthValidation } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function LoginForm({ onSuccess, redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { authError, clearAuthError, validateLoginForm } = useAuthValidation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    if (authError) {
      clearAuthError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setValidationErrors([]);
    clearAuthError();

    // Client-side validation
    const errors = validateLoginForm(formData.email, formData.password);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Attempt login
    const success = await login(formData.email, formData.password);
    
    if (success) {
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to dashboard or specified route
        router.push(redirectTo);
      }
    }
  };

  const allErrors = [...validationErrors, ...(authError ? [authError] : [])];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your DevMentor AI account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Display */}
          {allErrors.length > 0 && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Please fix the following errors:
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {allErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              className={allErrors.some(e => e.toLowerCase().includes('email')) ? 'border-red-300' : ''}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className={allErrors.some(e => e.toLowerCase().includes('password')) ? 'border-red-300' : ''}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Register Link */}
          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up here
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}