import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ConsumerProfile } from '@servivo/types';
import type { Conversation } from '@servivo/types';
import { subscribeConversations } from '@servivo/firebase';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function ChatList() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeConversations(profile.uid, (convos) => {
      setConversations(convos);
      setLoading(false);
    });
    return unsub;
  }, [profile?.uid]);

  const consumer = profile as ConsumerProfile | null;
  const otherName = (c: Conversation) =>
    consumer?.uid === c.consumerId ? c.proName : c.consumerName;

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
          <h1 className="font-bold text-gray-900 dark:text-white">Messages</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full p-4">
        {loading ? (
          <p className="text-center text-gray-400 py-12 text-sm">Loading…</p>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-medium text-gray-600 dark:text-gray-400">No messages yet</p>
            <p className="text-sm mt-1">Tap "Message" on a pro's card to start a conversation</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => navigate(`/consumer/chat/${c.proId}`)}
                  className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 text-left flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-700 dark:text-indigo-300 font-bold text-lg">
                      {otherName(c).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {otherName(c)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {c.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                  {/* Time */}
                  {c.lastAt && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                      {new Date(c.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
