'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { Home, Upload, Pill, LogOut, Activity } from 'lucide-react';

const PRIMARY_RGB = "74, 108, 88"

const Navigation = () => {
  const { user, logout, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // ── Nav tabs change based on auth state ──────────────────────────────────
  const navItems = user
    ? [
        { name: 'Home',        url: '/',            icon: Home    },
        { name: 'Upload',      url: '/upload',      icon: Upload  },
        { name: 'Medications', url: '/medications', icon: Pill    },
        { name: 'Activity',    url: '/logs',        icon: Activity },
      ]
    : [
        { name: 'Home', url: '/', icon: Home },
      ];

  // ── Right-slot: auth controls rendered INSIDE the pill ───────────────────
  const authSlot = user ? (
    /* Logged-in: avatar + first name + Sign Out */
    <div className="flex items-center gap-2 pr-2">
      <img
        src={user.photoURL}
        alt={user.displayName}
        referrerPolicy="no-referrer"
        className="w-7 h-7 rounded-full border border-stone-200"
      />
      <span className="hidden lg:inline text-stone-600 font-jakarta text-sm font-medium leading-none">
        {user.displayName?.split(' ')[0]}
      </span>
      <button
        data-testid="logout-button"
        onClick={handleLogout}
        title="Sign out"
        className="flex items-center gap-1 text-stone-400 hover:text-red-400 transition-colors duration-200 font-jakarta text-xs pl-1"
      >
        <LogOut size={14} strokeWidth={2} />
        <span className="hidden lg:inline">Sign Out</span>
      </button>
    </div>
  ) : (
    /* Logged-out: Sign In (Google) + Sign Up */
    <div className="flex items-center gap-1 pr-1">
      {/* Sign In — outlined */}
      <button
        onClick={signInWithGoogle}
        className="hidden md:flex items-center gap-1.5 text-xs font-semibold font-jakarta px-4 py-1.5 rounded-full border transition-all duration-200 text-stone-600 border-stone-300 hover:border-sage hover:text-sage"
      >
        {/* Google "G" logo */}
        <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
        </svg>
        Sign In
      </button>

      {/* Mobile: icon-only Sign In */}
      <button
        onClick={signInWithGoogle}
        className="md:hidden flex items-center justify-center w-8 h-8 rounded-full border border-stone-300 hover:border-sage transition-colors duration-200"
        title="Sign in with Google"
      >
        <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
        </svg>
      </button>

      {/* Sign Up — filled */}
      <Link
        href="/login"
        className="hidden md:flex items-center text-xs font-semibold font-jakarta px-4 py-1.5 rounded-full transition-all duration-200 text-white"
        style={{ background: `rgb(${PRIMARY_RGB})` }}
      >
        Sign Up
      </Link>
    </div>
  );

  return (
    <>
      {/* Fixed top-left wordmark */}
      <div className="fixed top-0 left-0 z-50 pt-6 pl-6">
        <a href="/" className="font-fraunces text-2xl font-semibold text-sage select-none">
          PillMate
        </a>
      </div>

      {/* Tubelight navbar — centered pill with auth inside */}
      <NavBar items={navItems} rightSlot={authSlot} />
    </>
  );
};

export { Navigation };
