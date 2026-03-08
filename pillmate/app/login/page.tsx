'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

const LoginForm = () => {
  const { user, loading, signInWithEmail, registerWithEmail } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const searchParams = useSearchParams();
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    if (searchParams?.get('mode') === 'signup') {
      setIsRegister(true);
    } else {
      setIsRegister(false);
    }
  }, [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorStr, setErrorStr] = useState('');

  // Redirect user if already logged in
  useEffect(() => {
    if (user) {
      router.push('/upload');
    }
  }, [user, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 border-4 border-sage/30 border-t-sage rounded-full animate-spin" />
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setErrorStr('');
    
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      setTimeout(() => router.push('/upload'), 100);
    } catch (error: any) {
      setErrorStr(error.message);
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
              {isRegister ? 'Create an account to manage your prescriptions' : 'Sign in to manage your prescriptions and medications'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {errorStr && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium text-center">
                {errorStr}
              </div>
            )}
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-5 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent font-jakarta"
              required
            />
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-5 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent font-jakarta"
              required
              minLength={6}
            />

            <button
              type="submit"
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 rounded-full px-8 py-3.5 mt-2 font-jakarta font-semibold text-white bg-sage shadow-lg hover:shadow-xl transition-all duration-500 ease-out hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              {signingIn ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {signingIn ? 'Processing...' : (isRegister ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <p className="text-center text-stone-500 text-sm font-jakarta mt-8">
            {isRegister ? 'Already have an account?' : 'Need an account?'}
            <button 
              type="button" 
              onClick={() => { 
                setIsRegister(!isRegister); 
                setErrorStr(''); 
                router.replace(isRegister ? '/login' : '/login?mode=signup');
              }} 
              className="ml-2 font-semibold text-sage hover:underline"
            >
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 border-4 border-sage/30 border-t-sage rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
