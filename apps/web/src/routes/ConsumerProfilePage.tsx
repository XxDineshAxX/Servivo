import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ConsumerProfile } from '@servivo/types';
import { getUserProfile, getConsumerReviews } from '@servivo/firebase';
import type { ReviewEntry } from '@servivo/firebase';
import { useAuthStore } from '../store/authStore';
import { UserAvatar } from '../components/UserAvatar';
import { Button } from '@servivo/ui';

function StarRow({ rating, count }: { rating: number; count?: number }) {
  const filled = Math.round(rating);
  return (
    <span className="flex items-center gap-1">
      <span className="text-yellow-400">
        {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
      </span>
      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        {rating.toFixed(1)}{count != null ? ` (${count})` : ''}
      </span>
    </span>
  );
}

function ReviewCard({ entry }: { entry: ReviewEntry }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{entry.reviewerName}</span>
        <span className="text-yellow-400 text-sm">{'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}</span>
      </div>
      {entry.serviceType && (
        <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">{entry.serviceType}</p>
      )}
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{entry.review}</p>
      <p className="text-xs text-gray-400 mt-2">
        {new Date(entry.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}

export default function ConsumerProfilePage() {
  const { consumerId } = useParams<{ consumerId: string }>();
  const navigate = useNavigate();
  const { profile: currentUser } = useAuthStore();

  const [consumer, setConsumer] = useState<ConsumerProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!consumerId) return;
    setLoading(true);
    Promise.all([getUserProfile(consumerId), getConsumerReviews(consumerId)])
      .then(([userProfile, revs]) => {
        setConsumer(userProfile as ConsumerProfile);
        setReviews(revs);
      })
      .finally(() => setLoading(false));
  }, [consumerId]);

  const handleMessage = () => {
    if (!consumerId) return;
    if (currentUser?.role === 'pro') {
      navigate(`/pro/chat/${consumerId}`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!consumer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">Consumer not found.</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const memberSince = new Date(consumer.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-600 dark:text-indigo-400 text-sm font-medium"
        >
          ← Back
        </button>
        <h1 className="font-bold text-gray-900 dark:text-white">Consumer Profile</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Profile card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          {/* Avatar + name */}
          <div className="flex items-start gap-4 mb-4">
            <UserAvatar name={consumer.displayName} photoURL={consumer.photoURL} size="xl" />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{consumer.displayName}</h2>
              {consumer.username && (
                <p className="text-sm text-indigo-500 dark:text-indigo-400">@{consumer.username}</p>
              )}
              {(consumer.avgRating != null && consumer.ratingCount != null && consumer.ratingCount > 0) && (
                <div className="mt-1">
                  <StarRow rating={consumer.avgRating} count={consumer.ratingCount} />
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {consumer.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{consumer.bio}</p>
          )}

          {/* Detail rows */}
          <div className="space-y-2 text-sm border-t dark:border-gray-700 pt-4">
            {consumer.county && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">County</span>
                <span className="font-medium text-gray-900 dark:text-white">{consumer.county}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Member since</span>
              <span className="font-medium text-gray-900 dark:text-white">{memberSince}</span>
            </div>
            {reviews.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Reviews from pros</span>
                <span className="font-medium text-gray-900 dark:text-white">{reviews.length}</span>
              </div>
            )}
          </div>

          {/* Message button (pro → consumer) */}
          {currentUser?.role === 'pro' && (
            <div className="mt-5">
              <Button variant="primary" size="md" className="w-full" onClick={handleMessage}>
                💬 Message
              </Button>
            </div>
          )}
        </div>

        {/* Reviews from pros */}
        {reviews.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
              Reviews from pros ({reviews.length})
            </h3>
            {reviews.map((r) => <ReviewCard key={r.bookingId} entry={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
