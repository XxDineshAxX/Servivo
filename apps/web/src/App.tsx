import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Initialise theme on app load (store does this on import)
import './store/themeStore';

// Consumer pages
import ConsumerLogin from './routes/consumer/ConsumerLogin';
import ConsumerHome from './routes/consumer/ConsumerHome';
import BookingStatus from './routes/consumer/BookingStatus';
import ConsumerBookings from './routes/consumer/ConsumerBookings';
import ChatList from './routes/consumer/ChatList';
import Chat from './routes/consumer/Chat';

// Pro pages
import ProLogin from './routes/pro/ProLogin';
import ProDashboard from './routes/pro/ProDashboard';
import ProSchedule from './routes/pro/ProSchedule';
import ProBookings from './routes/pro/ProBookings';
import ProMessages from './routes/pro/ProMessages';
import ProChat from './routes/pro/ProChat';

// Profile pages (accessible by any authenticated user)
import ProProfilePage from './routes/ProProfilePage';
import ConsumerProfilePage from './routes/ConsumerProfilePage';
import ProfileSettingsPage from './routes/ProfileSettingsPage';

// Landing / role selector
import Landing from './routes/Landing';

/** Catches any render crash so the user never sees a full white screen. */
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-sm w-full p-8 text-center">
            <p className="text-4xl mb-4">⚠️</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {this.state.error.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors"
            >
              Back to home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppRoutes() {
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
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />

      {/* Consumer auth */}
      <Route path="/consumer/login" element={<ConsumerLogin />} />

      {/* Consumer app — protected */}
      <Route path="/consumer"                       element={isConsumer ? <ConsumerHome />      : <Navigate to="/consumer/login" replace />} />
      <Route path="/consumer/booking/:bookingId"    element={isConsumer ? <BookingStatus />     : <Navigate to="/consumer/login" replace />} />
      <Route path="/consumer/bookings"              element={isConsumer ? <ConsumerBookings />  : <Navigate to="/consumer/login" replace />} />
      <Route path="/consumer/chats"                 element={isConsumer ? <ChatList />          : <Navigate to="/consumer/login" replace />} />
      <Route path="/consumer/chat/:proId"           element={isConsumer ? <Chat />              : <Navigate to="/consumer/login" replace />} />

      {/* Pro auth */}
      <Route path="/pro/login" element={<ProLogin />} />

      {/* Pro app — protected */}
      <Route path="/pro"                  element={isPro ? <ProDashboard /> : <Navigate to="/pro/login" replace />} />
      <Route path="/pro/schedule"         element={isPro ? <ProSchedule />  : <Navigate to="/pro/login" replace />} />
      <Route path="/pro/bookings"         element={isPro ? <ProBookings />  : <Navigate to="/pro/login" replace />} />
      <Route path="/pro/messages"         element={isPro ? <ProMessages />  : <Navigate to="/pro/login" replace />} />
      <Route path="/pro/chat/:consumerId" element={isPro ? <ProChat />      : <Navigate to="/pro/login" replace />} />

      {/* Profile pages — any logged-in user */}
      <Route
        path="/pro/profile/:proId"
        element={profile ? <ProProfilePage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/consumer/profile/:consumerId"
        element={profile ? <ConsumerProfilePage /> : <Navigate to="/" replace />}
      />

      {/* My profile settings — any logged-in user */}
      <Route
        path="/profile"
        element={profile ? <ProfileSettingsPage /> : <Navigate to="/" replace />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
