import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Message, ProProfile } from '@servivo/types';
import {
  getOrCreateConversation,
  sendMessage,
  subscribeMessages,
  getUserProfile,
  makeConversationId,
  markConversationRead,
} from '@servivo/firebase';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function ProChat() {
  const { consumerId } = useParams<{ consumerId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const pro = profile as ProProfile | null;

  // Compute conversation ID immediately
  const conversationId = pro?.uid && consumerId
    ? makeConversationId(consumerId, pro.uid)
    : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [consumerName, setConsumerName] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load consumer profile and ensure conversation doc exists
  useEffect(() => {
    if (!pro || !consumerId || !conversationId) return;
    (async () => {
      try {
        const consumer = await getUserProfile(consumerId);
        setConsumerName(consumer.displayName);
        await getOrCreateConversation(
          consumerId,
          pro.uid,
          consumer.displayName,
          pro.displayName,
        );
      } catch (e) {
        console.error('Failed to init pro conversation:', e);
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [pro?.uid, consumerId]);

  // Subscribe to messages as soon as conversationId is known;
  // also mark as read whenever we open or receive new messages.
  useEffect(() => {
    if (!conversationId || !pro?.uid) return;
    markConversationRead(conversationId, pro.uid);
    return subscribeMessages(conversationId, (msgs: Message[]) => {
      setMessages(msgs);
      markConversationRead(conversationId, pro.uid!);
    });
  }, [conversationId, pro?.uid]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || !pro || !consumerId || !text.trim()) return;
    setSending(true);
    try {
      await sendMessage(conversationId, pro.uid, text, [consumerId, pro.uid]);
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
              {consumerName?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
          <p className="font-semibold text-sm text-gray-900 dark:text-white">
            {consumerName || 'Loading…'}
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {profileLoading && messages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">Loading messages…</p>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-sm">Start the conversation with {consumerName}!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === pro?.uid;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm rounded-bl-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'}`}>
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
          disabled={!conversationId}
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
