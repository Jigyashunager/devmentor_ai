'use client';

import { useEffect } from 'react';
import { useRedirectIfAuthenticated } from '@/hooks/useAuth';
import LoginForm from '@/components/auth/LoginForm';
import { Code } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  // Redirect to dashboard if already authenticated
  useRedirectIfAuthenticated();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Code className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">DevMentor AI</span>
        </Link>
        
        <Link
          href="/register"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Need an account? <span className="font-medium text-blue-600">Sign up</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-gray-500">
        <p>
          © 2024 DevMentor AI. Built for developers who want to excel.
        </p>
      </footer>
    </div>
  );
}