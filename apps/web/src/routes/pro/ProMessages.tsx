import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Conversation } from '@servivo/types';
import type { ProProfile } from '@servivo/types';
import { subscribeConversations } from '@servivo/firebase';
import { useAuthStore } from '../../store/authStore';
import { HamburgerButton, SideMenu } from '../../components/SideMenu';
import { UserAvatar } from '../../components/UserAvatar';

export default function ProMessages() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const pro = profile as ProProfile | null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!pro) return;
    setError(null);
    const unsub = subscribeConversations(
      pro.uid,
      (convos) => {
        setConversations(convos);
        setLoading(false);
        setError(null);
      },
      (err: Error) => {
        console.error('ProMessages subscription error:', err);
        setLoading(false);
        setError(err.message?.includes('permission') || err.message?.includes('PERMISSION')
          ? 'Permission denied — make sure the Firestore rules in Firebase Console are up to date.'
          : 'Failed to load messages. Check your connection and try again.');
      },
    );
    return unsub;
  }, [pro?.uid]);

  const isUnread = (c: Conversation) =>
    !!c.lastSenderId &&
    c.lastSenderId !== pro?.uid &&
    !(c.readBy ?? []).includes(pro?.uid ?? '');

  const unreadTotal = conversations.filter(isUnread).length;

  const proMenuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/pro' },
    { icon: '📋', label: 'Bookings',  path: '/pro/bookings' },
    { icon: '💬', label: 'Messages',  path: '/pro/messages', badge: unreadTotal },
    { icon: '📅', label: 'Schedule',  path: '/pro/schedule' },
    { icon: '👤', label: 'Profile',   path: '/profile' },
  ];

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 dark:text-indigo-400 text-sm font-medium"
          >
            ← Back
          </button>
          <h1 className="font-bold text-gray-900 dark:text-white">
            Messages
            {unreadTotal > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                {unreadTotal}
              </span>
            )}
          </h1>
        </div>
        <HamburgerButton onClick={() => setMenuOpen(true)} badge={unreadTotal} />
      </header>

      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} items={proMenuItems} />

      <div className="flex-1 max-w-lg mx-auto w-full p-4">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}
        {loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">Loading…</p>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-medium text-gray-600 dark:text-gray-400">No messages yet</p>
            <p className="text-sm mt-1">When a consumer messages you, it'll show up here</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {conversations.map((c) => {
              const unread = isUnread(c);
              return (
                <li key={c.id}>
                  <button
                    onClick={() => navigate(`/pro/chat/${c.consumerId}`)}
                    className={`w-full rounded-2xl p-4 text-left flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow ${
                      unread
                        ? 'bg-indigo-50 dark:bg-indigo-900/30'
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    {/* Avatar with unread dot */}
                    <div className="relative flex-shrink-0">
                      <UserAvatar name={c.consumerName} size="md" />
                      {unread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/consumer/profile/${c.consumerId}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`truncate block hover:underline ${unread ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'font-semibold text-gray-900 dark:text-white'}`}
                      >
                        {c.consumerName}
                      </Link>
                      <p className={`text-sm truncate mt-0.5 ${unread ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                        {c.lastMessage || 'No messages yet'}
                      </p>
                    </div>

                    {/* Time + unread dot */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {c.lastAt ? (
                        <span className={`text-xs ${unread ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                          {formatTime(c.lastAt)}
                        </span>
                      ) : null}
                      {unread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
