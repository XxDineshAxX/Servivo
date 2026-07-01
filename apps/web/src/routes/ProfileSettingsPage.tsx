import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ConsumerProfile, ProProfile } from '@servivo/types';
import { useAuthStore } from '../store/authStore';
import { UserAvatar } from '../components/UserAvatar';
import { Button } from '@servivo/ui';
import { ThemeToggle } from '../components/ThemeToggle';

const SERVICE_OPTIONS = [
  'Plumber', 'Electrician', 'HVAC', 'Handyman', 'Cleaner',
  'Painter', 'Locksmith', 'Appliance Repair', 'Other',
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 space-y-4">
      <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { profile, updateProfile, signOut } = useAuthStore();

  const isPro = profile?.role === 'pro';
  const pro = profile as ProProfile | null;
  const consumer = profile as ConsumerProfile | null;

  // ── Shared fields ────────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [username, setUsername]       = useState(profile?.username ?? '');
  const [bio, setBio]                 = useState(profile?.bio ?? '');
  const [county, setCounty]           = useState(profile?.county ?? '');
  const [address, setAddress]         = useState(profile?.address ?? '');

  // ── Pro-only fields ──────────────────────────────────────────────────────────
  const [serviceTypes, setServiceTypes]               = useState<string[]>(pro?.serviceTypes ?? []);
  const [serviceRates, setServiceRates]               = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(pro?.serviceRates ?? {}).map(([k, v]) => [k, String(v)]))
  );
  const [rateNote, setRateNote]                       = useState(pro?.rateNote ?? '');
  const [servesFullMetroplex, setServesFullMetroplex] = useState(pro?.servesFullMetroplex ?? false);

  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Sync if profile changes externally
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setUsername(profile.username ?? '');
    setBio(profile.bio ?? '');
    setCounty(profile.county ?? '');
    setAddress(profile.address ?? '');
    if (isPro && pro) {
      setServiceTypes(pro.serviceTypes ?? []);
      setServiceRates(
        Object.fromEntries(Object.entries(pro.serviceRates ?? {}).map(([k, v]) => [k, String(v)]))
      );
      setRateNote(pro.rateNote ?? '');
      setServesFullMetroplex(pro.servesFullMetroplex ?? false);
    }
  }, [profile?.uid]);

  const toggleService = (s: string) => {
    setServiceTypes((prev) => {
      if (prev.includes(s)) {
        setServiceRates((r) => { const n = { ...r }; delete n[s]; return n; });
        return prev.filter((x) => x !== s);
      }
      return [...prev, s];
    });
  };

  const setServiceRate = (service: string, rate: string) =>
    setServiceRates((prev) => ({ ...prev, [service]: rate }));

  const handleSave = async () => {
    if (!displayName.trim()) { setError('Display name is required.'); return; }
    if (isPro && serviceTypes.length === 0) { setError('Select at least one service type.'); return; }
    setError(null);
    setSaving(true);
    try {
      const parsedRates: Record<string, number> = {};
      for (const [svc, rateStr] of Object.entries(serviceRates)) {
        const r = parseFloat(rateStr);
        if (!isNaN(r) && r > 0) parsedRates[svc] = r;
      }
      await updateProfile({
        displayName: displayName.trim(),
        username:    username.trim()  || undefined,
        bio:         bio.trim()       || undefined,
        county:      county.trim()    || undefined,
        address:     address.trim()   || undefined,
        ...(isPro ? {
          serviceTypes,
          serviceRates:        Object.keys(parsedRates).length > 0 ? parsedRates : undefined,
          rateNote:            rateNote.trim() || undefined,
          servesFullMetroplex: servesFullMetroplex,
        } : {}),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const inputCls =
    'w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 dark:text-indigo-400 text-sm font-medium"
          >
            ← Back
          </button>
          <h1 className="font-bold text-gray-900 dark:text-white">Profile</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-10">

        {/* Avatar + name preview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <UserAvatar name={displayName || profile.displayName} size="xl" />
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
              {displayName || profile.displayName}
            </p>
            {username && (
              <p className="text-sm text-indigo-500 dark:text-indigo-400">@{username}</p>
            )}
            <span className="inline-block mt-1 text-xs bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full px-2 py-0.5 font-medium capitalize">
              {profile.role}
            </span>
          </div>
        </div>

        {/* Basic info */}
        <Section title="Basic info">
          <Field label="Display name" hint="This is how you appear to others">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputCls}
              placeholder="Jane Smith"
            />
          </Field>

          <Field label="Username">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())
                }
                className={`${inputCls} pl-7`}
                placeholder="janesmith"
              />
            </div>
          </Field>

          <Field label="Bio" hint="A short intro shown on your profile">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={inputCls}
              placeholder={
                isPro
                  ? 'Tell consumers about your experience…'
                  : 'A short intro about yourself…'
              }
              rows={3}
              style={{ resize: 'none' }}
            />
          </Field>
        </Section>

        {/* Location info */}
        <Section title="Location">
          <Field label="County" hint="Shown on your profile (not your exact address)">
            <input
              type="text"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className={inputCls}
              placeholder="Dallas County"
            />
          </Field>

          <Field
            label={isPro ? 'Service area' : 'Home address'}
            hint={isPro ? 'General area you work in' : 'Helps pros estimate travel time'}
          >
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputCls}
              placeholder={isPro ? 'Dallas, TX' : '123 Main St, Dallas, TX'}
            />
          </Field>
        </Section>

        {/* Pro-only sections */}
        {isPro && (
          <>
            <Section title="Services">
              <Field label="Service types">
                <div className="flex flex-wrap gap-2">
                  {SERVICE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleService(s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        serviceTypes.includes(s)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            </Section>

            <Section title="Pricing">
              {serviceTypes.length > 0 ? (
                <Field
                  label="Hourly rates by service"
                  hint="Leave a rate blank if pricing varies for that service"
                >
                  <div className="space-y-2 mt-1">
                    {serviceTypes.map((s) => (
                      <div key={s} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{s}</span>
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={serviceRates[s] ?? ''}
                            onChange={(e) => setServiceRate(s, e.target.value)}
                            className={`${inputCls} pl-7`}
                            placeholder="75"
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">/hr</span>
                      </div>
                    ))}
                  </div>
                </Field>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Select your services above to set per-service rates.
                </p>
              )}

              <Field label="Pricing note" hint="E.g. 'Free estimates' or 'Weekend surcharge may apply'">
                <input
                  type="text"
                  value={rateNote}
                  onChange={(e) => setRateNote(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Free estimates · Rates may vary by job size"
                />
              </Field>

              <div className="flex items-center gap-3">
                <input
                  id="fullMetroplex"
                  type="checkbox"
                  checked={servesFullMetroplex}
                  onChange={(e) => setServesFullMetroplex(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 dark:border-gray-600"
                />
                <label
                  htmlFor="fullMetroplex"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  I serve the full service area
                </label>
              </div>
            </Section>
          </>
        )}

        {/* Save feedback */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
        )}
        {saved && (
          <p className="text-sm text-green-600 dark:text-green-400 text-center font-medium">
            ✓ Profile saved!
          </p>
        )}

        {/* Save button */}
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={handleSave}
          loading={saving}
        >
          Save changes
        </Button>

        {/* View public profile link */}
        <button
          onClick={() =>
            navigate(
              isPro
                ? `/pro/profile/${profile.uid}`
                : `/consumer/profile/${profile.uid}`,
            )
          }
          className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline py-1"
        >
          View my public profile →
        </button>

        {/* Divider */}
        <div className="border-t dark:border-gray-700 pt-4">
          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
