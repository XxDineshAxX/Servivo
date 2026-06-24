import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProProfile } from '@servivo/types';
import { addAvailabilitySlot } from '@servivo/firebase';
import { useAuthStore } from '../../store/authStore';
import { Button } from '@servivo/ui';
import { ThemeToggle } from '../../components/ThemeToggle';

interface SlotForm {
  date: string;
  startTime: string;
  endTime: string;
}

export default function ProSchedule() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const pro = profile as ProProfile | null;

  const [form, setForm] = useState<SlotForm>({ date: '', startTime: '', endTime: '' });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pro) return;

    const startAt = new Date(`${form.date}T${form.startTime}`).getTime();
    const endAt = new Date(`${form.date}T${form.endTime}`).getTime();

    if (endAt <= startAt) {
      setError('End time must be after start time.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await addAvailabilitySlot({ proId: pro.uid, startAt, endAt });
      setSuccessMsg(`Slot added: ${form.date} ${form.startTime}–${form.endTime}`);
      setForm({ date: '', startTime: '', endTime: '' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pro')} className="text-indigo-600 dark:text-indigo-400 text-sm">← Back</button>
          <h1 className="font-bold text-gray-900 dark:text-white">Manage Schedule</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="p-4 max-w-md mx-auto">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Add time slots when you're available. Consumers will only see you during these windows.
        </p>

        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={form.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMsg && <p className="text-sm text-green-600">✓ {successMsg}</p>}

          <Button type="submit" variant="primary" size="md" className="w-full" loading={saving}>
            Add Availability Slot
          </Button>
        </form>
      </div>
    </div>
  );
}
