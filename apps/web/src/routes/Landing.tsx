import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@servivo/ui';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Servivo</h1>
        <p className="text-lg text-gray-500 mb-10">
          Book the nearest available pro — within the hour.
        </p>

        <div className="space-y-4">
          <div className="p-6 bg-white rounded-2xl shadow-md">
            <h2 className="font-semibold text-gray-800 mb-1">I need a pro</h2>
            <p className="text-sm text-gray-500 mb-4">Find someone available near you right now.</p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/consumer/login')}
            >
              Continue as Consumer
            </Button>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-md">
            <h2 className="font-semibold text-gray-800 mb-1">I'm a professional</h2>
            <p className="text-sm text-gray-500 mb-4">Manage your availability and accept bookings.</p>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/pro/login')}
            >
              Continue as Pro
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
