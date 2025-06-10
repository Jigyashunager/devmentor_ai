'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthValidation } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function RegisterForm({ onSuccess, redirectTo = '/dashboard' }: RegisterFormProps) {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const { authError, clearAuthError, validateRegisterForm } = useAuthValidation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    const errors = validateRegisterForm(formData.name, formData.email, formData.password);
    
    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Attempt registration
    const success = await register(formData.name, formData.email, formData.password);
    
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

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 2) return { strength: score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { strength: score, label: 'Medium', color: 'bg-yellow-500' };
    return { strength: score, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Join DevMentor AI to start improving your code
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

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
              className={allErrors.some(e => e.toLowerCase().includes('name')) ? 'border-red-300' : ''}
            />
          </div>

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
                autoComplete="new-password"
                placeholder="Choose a strong password"
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
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength.strength <= 2 ? 'text-red-600' :
                    passwordStrength.strength <= 3 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isLoading}
                className={allErrors.some(e => e.toLowerCase().includes('match')) ? 'border-red-300' : ''}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div className="flex items-center gap-2 text-xs">
                {formData.password === formData.confirmPassword ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
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
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          {/* Terms and Privacy */}
          <p className="text-xs text-gray-600 text-center">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>

          {/* Login Link */}
          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}