import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Initialise theme on app load (store does this on import)
import './store/themeStore';

// Consumer pages
import ConsumerLogin from './routes/consumer/ConsumerLogin';
import ConsumerHome from './routes/consumer/ConsumerHome';
import BookingStatus from './routes/consumer/BookingStatus';
import ChatList from './routes/consumer/ChatList';
import Chat from './routes/consumer/Chat';

// Pro pages
import ProLogin from './routes/pro/ProLogin';
import ProDashboard from './routes/pro/ProDashboard';
import ProSchedule from './routes/pro/ProSchedule';

// Landing / role selector
import Landing from './routes/Landing';

export default function App() {
  const { profile, loading, init } = useAuthStore();

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  const isConsumer = profile?.role === 'consumer';
  const isPro      = profile?.role === 'pro';

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />

        {/* Consumer auth */}
        <Route path="/consumer/login" element={<ConsumerLogin />} />

        {/* Consumer app — protected */}
        <Route path="/consumer"                       element={isConsumer ? <ConsumerHome />   : <Navigate to="/consumer/login" replace />} />
        <Route path="/consumer/booking/:bookingId"    element={isConsumer ? <BookingStatus />  : <Navigate to="/consumer/login" replace />} />
        <Route path="/consumer/chats"                 element={isConsumer ? <ChatList />       : <Navigate to="/consumer/login" replace />} />
        <Route path="/consumer/chat/:proId"           element={isConsumer ? <Chat />           : <Navigate to="/consumer/login" replace />} />

        {/* Pro auth */}
        <Route path="/pro/login" element={<ProLogin />} />

        {/* Pro app — protected */}
        <Route path="/pro"          element={isPro ? <ProDashboard /> : <Navigate to="/pro/login" replace />} />
        <Route path="/pro/schedule" element={isPro ? <ProSchedule />  : <Navigate to="/pro/login" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
