import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from './ThemeToggle';

export interface MenuItem {
  icon: string;
  label: string;
  path: string;
  /** Optional badge count shown on the item */
  badge?: number;
}

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
}

export function SideMenu({ isOpen, onClose, items }: SideMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuthStore();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleNav = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header / user info */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 pt-10 pb-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-500 bg-opacity-50 text-white hover:bg-opacity-75 transition-colors text-sm"
            aria-label="Close menu"
          >
            ✕
          </button>

          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-white bg-opacity-20 flex items-center justify-center mb-3 border-2 border-white border-opacity-40">
            <span className="text-white font-bold text-2xl">
              {profile?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>

          <p className="font-bold text-white text-lg leading-tight truncate">
            {profile?.displayName}
          </p>
          {(profile as any)?.username && (
            <p className="text-indigo-200 text-sm mt-0.5">
              @{(profile as any).username}
            </p>
          )}
          <p className="text-indigo-300 text-xs mt-1 capitalize">
            {profile?.role} account
          </p>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {items.map(({ icon, label, path, badge }) => (
            <button
              key={path}
              onClick={() => handleNav(path)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors ${
                isActive(path)
                  ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold border-r-4 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-xl w-6 text-center flex-shrink-0">{icon}</span>
              <span className="text-sm flex-1">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom: theme toggle + sign out */}
        <div className="border-t dark:border-gray-700 px-5 py-4 space-y-1">
          <div className="flex items-center justify-between px-0 py-2 text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-4">
              <span className="text-xl w-6 text-center">🎨</span>
              <span className="text-sm">Appearance</span>
            </div>
            <ThemeToggle />
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-0 py-3 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <span className="text-xl w-6 text-center">🚪</span>
            <span className="text-sm font-medium">Sign out</span>
          </button>
        </div>
      </div>
    </>
  );
}

/** Hamburger button — drop this anywhere in a header */
export function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Open menu"
    >
      <span className="w-5 h-0.5 bg-gray-600 dark:bg-gray-300 rounded-full" />
      <span className="w-5 h-0.5 bg-gray-600 dark:bg-gray-300 rounded-full" />
      <span className="w-5 h-0.5 bg-gray-600 dark:bg-gray-300 rounded-full" />
    </button>
  );
}
