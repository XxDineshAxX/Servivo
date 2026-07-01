import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ProProfile, ConsumerProfile } from '@servivo/types';
import { getUserProfile, getProReviews, savePro, unsavePro } from '@servivo/firebase';
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

export default function ProProfilePage() {
  const { proId } = useParams<{ proId: string }>();
  const navigate = useNavigate();
  const { profile: currentUser } = useAuthStore();

  const [pro, setPro] = useState<ProProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savingFav, setSavingFav] = useState(false);

  const isConsumerViewing = currentUser?.role === 'consumer';
  const consumer = currentUser as ConsumerProfile | null;

  useEffect(() => {
    if (!proId) return;
    setLoading(true);

    // Load profile — failure shows "not found"
    getUserProfile(proId)
      .then((userProfile) => setPro(userProfile as ProProfile))
      .catch(() => setPro(null))
      .finally(() => setLoading(false));

    // Load reviews independently — failure is non-fatal (Firestore rules may block non-participants)
    getProReviews(proId)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [proId]);

  useEffect(() => {
    if (consumer && proId) {
      setIsSaved(consumer.savedProIds?.includes(proId) ?? false);
    }
  }, [consumer, proId]);

  const handleToggleSave = async () => {
    if (!consumer || !proId) return;
    setSavingFav(true);
    try {
      if (isSaved) {
        await unsavePro(consumer.uid, proId);
        setIsSaved(false);
      } else {
        await savePro(consumer.uid, proId);
        setIsSaved(true);
      }
    } finally {
      setSavingFav(false);
    }
  };

  const handleMessage = () => {
    if (!proId) return;
    if (currentUser?.role === 'consumer') {
      navigate(`/consumer/chat/${proId}`);
    } else {
      navigate(`/pro`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">Pro not found.</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const serviceArea = pro.servesFullMetroplex
    ? 'Serves full metroplex'
    : pro.county
    ? `${pro.county} area`
    : pro.address ?? 'Area not specified';

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
        <h1 className="font-bold text-gray-900 dark:text-white">Pro Profile</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Profile card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          {/* Avatar + name */}
          <div className="flex items-start gap-4 mb-4">
            <UserAvatar name={pro.displayName} photoURL={pro.photoURL} size="xl" />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{pro.displayName}</h2>
              {pro.username && (
                <p className="text-sm text-indigo-500 dark:text-indigo-400">@{pro.username}</p>
              )}
              <div className="mt-1">
                <StarRow rating={pro.rating} count={pro.completedBookings > 0 ? pro.completedBookings : undefined} />
              </div>
              {pro.isOnline && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Online now
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {pro.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{pro.bio}</p>
          )}

          {/* Info pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {pro.serviceTypes.map((s) => (
              <span key={s} className="text-xs bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full px-3 py-1 font-medium">
                {s}
              </span>
            ))}
          </div>

          {/* Detail rows */}
          <div className="space-y-2 text-sm border-t dark:border-gray-700 pt-4">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Service area</span>
              <span className="font-medium text-gray-900 dark:text-white">{serviceArea}</span>
            </div>
            {/* Per-service rates (new accounts) */}
            {pro.serviceRates && Object.keys(pro.serviceRates).length > 0 ? (
              <>
                {Object.entries(pro.serviceRates).map(([svc, rate]) => (
                  <div key={svc} className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{svc}</span>
                    <span className="font-medium text-gray-900 dark:text-white">${rate}/hr</span>
                  </div>
                ))}
                {pro.rateNote && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 pt-0.5">{pro.rateNote}</p>
                )}
              </>
            ) : pro.hourlyRate != null ? (
              /* Legacy single rate */
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Rate</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${pro.hourlyRate}/hr{pro.rateNote ? ` · ${pro.rateNote}` : ''}
                </span>
              </div>
            ) : pro.rateNote ? (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Pricing</span>
                <span className="font-medium text-gray-900 dark:text-white">{pro.rateNote}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Completed jobs</span>
              <span className="font-medium text-gray-900 dark:text-white">{pro.completedBookings}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-5">
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={handleMessage}
            >
              💬 Message
            </Button>
            {isConsumerViewing && (
              <Button
                variant={isSaved ? 'secondary' : 'ghost'}
                size="md"
                className="flex-1"
                onClick={handleToggleSave}
                loading={savingFav}
              >
                {isSaved ? '❤️ Saved' : '🤍 Save'}
              </Button>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">
            Reviews ({reviews.length})
          </h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No reviews yet</p>
          ) : (
            reviews.map((r) => <ReviewCard key={r.bookingId} entry={r} />)
          )}
        </div>
      </div>
    </div>
  );
}
