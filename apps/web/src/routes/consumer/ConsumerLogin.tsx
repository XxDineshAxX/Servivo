import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUpConsumer } from '@servivo/firebase';
import { Button } from '@servivo/ui';
import { ThemeToggle } from '../../components/ThemeToggle';

type Mode = 'login' | 'signup';

function friendlyError(err: unknown): string {
  console.error('[Auth error]', err);
  const code = (err as any)?.code ?? '';
  const message = (err as any)?.message ?? '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Incorrect email or password. Please try again.';
  }
  if (code === 'auth/email-already-in-use') return 'An account with this email already exists.';
  if (code === 'auth/weak-password') return 'Password must be at least 6 characters.';
  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a moment and try again.';
  if (message.includes('No profile found')) return 'Account found but profile is incomplete. Please sign up again.';
  return `Something went wrong (${code || message || 'unknown'}). Please try again.`;
}

export default function ConsumerLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');

  // Shared
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // Sign-up extras
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername]       = useState('');
  const [address, setAddress]         = useState('');
  const [county, setCounty]           = useState('');
  const [bio, setBio]                 = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUpConsumer(email, password, displayName, {
          username: username.trim() || undefined,
          address:  address.trim()  || undefined,
          county:   county.trim()   || undefined,
          bio:      bio.trim()      || undefined,
        });
      }
      navigate('/consumer');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="min-h-screen bg-indigo-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex justify-end mb-2">
          <ThemeToggle />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Consumer portal</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputCls}
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                  <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                    className={`${inputCls} pl-7`}
                    placeholder="janesmith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Home address
                  <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputCls}
                  placeholder="123 Main St, Dallas, TX"
                />
                <p className="text-xs text-gray-400 mt-1">Helps pros estimate travel time</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  County
                  <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="text"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className={inputCls}
                  placeholder="Dallas County"
                />
                <p className="text-xs text-gray-400 mt-1">Shown on your profile instead of your exact address</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                  <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={inputCls}
                  placeholder="A short intro about yourself…"
                  rows={2}
                  style={{ resize: 'none' }}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className={inputCls}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className={inputCls}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3">
              <span className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5">⚠️</span>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          )}

          <Button type="submit" variant="primary" size="md" className="w-full" loading={loading}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">Are you a professional?</p>
          <button
            type="button"
            onClick={() => navigate('/pro/login')}
            className="mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign in as a pro →
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">
          <a href="/" className="hover:underline">← Back to home</a>
        </p>
      </div>
    </div>
  );
}
