import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { NearbyAvailablePro, ConsumerProfile } from '@servivo/types';
import { savePro, unsavePro } from '@servivo/firebase';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, Button } from '@servivo/ui';

interface ProCardProps {
  pro: NearbyAvailablePro;
  rank: number;
  onBook: (pro: NearbyAvailablePro) => void;
  loading?: boolean;
}

export function ProCard({ pro, rank, onBook, loading }: ProCardProps) {
  const navigate = useNavigate();
  const { profile, setProfile } = useAuthStore();
  const consumer = profile as ConsumerProfile | null;

  const minutesAway = Math.round((pro.nextAvailableAt - Date.now()) / 60_000);
  const isSaved = consumer?.savedProIds?.includes(pro.proId) ?? false;

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!consumer) return;
    const newSavedIds = isSaved
      ? (consumer.savedProIds ?? []).filter((id) => id !== pro.proId)
      : [...(consumer.savedProIds ?? []), pro.proId];
    // Optimistic update
    setProfile({ ...consumer, savedProIds: newSavedIds });
    // Persist
    if (isSaved) await unsavePro(consumer.uid, pro.proId);
    else await savePro(consumer.uid, pro.proId);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/consumer/chat/${pro.proId}`);
  };

  return (
    <Card className="mb-3 dark:bg-gray-800 dark:border-gray-700">
      <CardHeader
        title={
          <Link
            to={`/pro/profile/${pro.proId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            {pro.proName}
          </Link>
        }
        subtitle={pro.serviceTypes.join(', ')}
        right={
          <div className="flex items-center gap-2">
            {/* Save/favourite button */}
            <button
              onClick={handleToggleSave}
              title={isSaved ? 'Remove from saved' : 'Save this pro'}
              className="text-xl leading-none focus:outline-none"
            >
              {isSaved ? '❤️' : '🤍'}
            </button>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900 rounded-full px-2 py-0.5">
              #{rank}
            </span>
          </div>
        }
      />
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
        <span>📍 {pro.distanceKm.toFixed(1)} km</span>
        <span>⭐ {pro.rating.toFixed(1)}</span>
        <span>⏱ Available {minutesAway <= 0 ? 'now' : `in ${minutesAway} min`}</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={() => onBook(pro)}
          loading={loading}
        >
          Book {pro.proName.split(' ')[0]}
        </Button>
        <button
          onClick={handleMessage}
          className="px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors"
        >
          💬 Message
        </button>
      </div>
    </Card>
  );
}
