'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { Home, Upload, Pill, LogOut, Activity, Archive } from 'lucide-react';

const PRIMARY_RGB = "74, 108, 88"

const Navigation = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // ── Nav tabs ──────────────────────────────────
  const navItems = [
    { name: 'Home',        url: '/',            icon: Home    },
    { name: 'Upload',      url: '/upload',      icon: Upload  },
    { name: 'Medications', url: '/medications', icon: Pill    },
    { name: 'Vault',       url: '/vault',       icon: Archive },
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
    /* Logged-out: Sign In + Sign Up */
    <div className="flex items-center gap-1 pr-1">
      {/* Sign In — outlined */}
      <Link
        href="/login"
        className="hidden md:flex items-center gap-1.5 text-xs font-semibold font-jakarta px-4 py-1.5 rounded-full border transition-all duration-200 text-stone-600 border-stone-300 hover:border-sage hover:text-sage"
      >
        Sign In
      </Link>

      {/* Mobile: icon-only Sign In */}
      <Link
        href="/login"
        className="md:hidden flex items-center justify-center text-xs font-semibold font-jakarta px-3 py-1.5 rounded-full border border-stone-300 hover:border-sage transition-colors duration-200"
        title="Sign in"
      >
        Sign In
      </Link>

      {/* Sign Up — filled */}
      <Link
        href="/login?mode=signup"
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
