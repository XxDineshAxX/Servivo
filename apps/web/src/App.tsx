import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Consumer pages
import ConsumerLogin from './routes/consumer/ConsumerLogin';
import ConsumerHome from './routes/consumer/ConsumerHome';
import BookingStatus from './routes/consumer/BookingStatus';

// Pro pages
import ProLogin from './routes/pro/ProLogin';
import ProDashboard from './routes/pro/ProDashboard';
import ProSchedule from './routes/pro/ProSchedule';

// Landing / role selector
import Landing from './routes/Landing';

export default function App() {
  const { profile, loading, init } = useAuthStore();

  // Start Firebase auth listener on mount
  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, []);

  // Wait for Firebase to resolve auth state before rendering routes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />

        {/* Consumer auth */}
        <Route path="/consumer/login" element={<ConsumerLogin />} />

        {/* Consumer app — protected */}
        <Route
          path="/consumer"
          element={profile?.role === 'consumer' ? <ConsumerHome /> : <Navigate to="/consumer/login" replace />}
        />
        <Route
          path="/consumer/booking/:bookingId"
          element={profile?.role === 'consumer' ? <BookingStatus /> : <Navigate to="/consumer/login" replace />}
        />

        {/* Pro auth */}
        <Route path="/pro/login" element={<ProLogin />} />

        {/* Pro app — protected */}
        <Route
          path="/pro"
          element={profile?.role === 'pro' ? <ProDashboard /> : <Navigate to="/pro/login" replace />}
        />
        <Route
          path="/pro/schedule"
          element={profile?.role === 'pro' ? <ProSchedule /> : <Navigate to="/pro/login" replace />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
