import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Message } from '@servivo/types';
import type { ConsumerProfile, ProProfile } from '@servivo/types';
import {
  getOrCreateConversation,
  sendMessage,
  subscribeMessages,
  getUserProfile,
  makeConversationId,
} from '@servivo/firebase';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function Chat() {
  const { proId } = useParams<{ proId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [proProfile, setProProfile] = useState<ProProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const consumer = profile as ConsumerProfile | null;

  // Load pro profile and ensure conversation exists
  useEffect(() => {
    if (!consumer || !proId) return;

    (async () => {
      try {
        const pro = await getUserProfile(proId) as ProProfile;
        setProProfile(pro);
        const convId = await getOrCreateConversation(
          consumer.uid,
          proId,
          consumer.displayName,
          pro.displayName,
        );
        setConversationId(convId);
      } catch (e) {
        console.error('Failed to init conversation:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [consumer?.uid, proId]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId) return;
    const unsub = subscribeMessages(conversationId, (msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, [conversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || !consumer || !text.trim()) return;
    setSending(true);
    try {
      await sendMessage(conversationId, consumer.uid, text);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 dark:text-indigo-400 text-sm font-medium"
          >
            ←
          </button>
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
            <span className="text-indigo-700 dark:text-indigo-300 font-bold">
              {proProfile?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">
              {proProfile?.displayName ?? 'Loading…'}
            </p>
            {proProfile?.serviceTypes && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {proProfile.serviceTypes.join(', ')}
              </p>
            )}
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-8">Loading messages…</p>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-sm">
              Say hello to {proProfile?.displayName ?? 'the pro'}!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === consumer?.uid;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm rounded-bl-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMine ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-4 py-3 flex gap-2"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          disabled={loading || !conversationId}
          className="flex-1 bg-gray-100 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={sending || !text.trim() || !conversationId}
          className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-indigo-700 transition-colors flex-shrink-0"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
