'use client'

import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../api/lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  // Redirect user if already logged in
  useEffect(() => {
    if (user) {
      router.push('/upload');
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 border-4 border-sage/30 border-t-sage rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 border-4 border-sage/30 border-t-sage rounded-full animate-spin" />
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      router.push('/upload');
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Sign in failed. Please try again.');
        console.error('Sign in error:', error);
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="font-fraunces text-4xl font-normal text-stone-900 mb-3">
              Welcome to PillMate
            </h1>
            <p className="font-jakarta text-stone-500 text-lg leading-relaxed">
              Sign in to manage your prescriptions and medications
            </p>
          </div>

          <button
            data-testid="google-sign-in-button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 rounded-full px-8 py-4 font-jakarta font-semibold text-white bg-sage shadow-lg hover:shadow-xl transition-all duration-500 ease-out hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
          >
            {signingIn ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {signingIn ? 'Signing in...' : 'Continue with Google'}
          </button>

          <p className="text-center text-stone-400 text-sm font-jakarta mt-8">
            Your data stays private and secure with Firebase Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
