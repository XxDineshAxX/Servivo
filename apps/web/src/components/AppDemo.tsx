import { useEffect, useState } from 'react';

const STEPS = [
  {
    label: 'Find nearby pros',
    screen: 'map',
  },
  {
    label: 'Send a booking',
    screen: 'book',
  },
  {
    label: 'Pro on the way',
    screen: 'status',
  },
];

const STEP_DURATION = 3000; // ms per screen

export function AppDemo() {
  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setStep((s) => (s + 1) % STEPS.length);
        setFade(true);
      }, 300);
    }, STEP_DURATION);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Step pills */}
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => { setFade(false); setTimeout(() => { setStep(i); setFade(true); }, 200); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              i === step
                ? 'bg-indigo-600 text-white shadow-md scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div className="relative w-64 h-[520px]">
        {/* Phone shell */}
        <div className="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl border-[6px] border-gray-700 dark:border-gray-500 ring-1 ring-gray-600 dark:ring-gray-400" />
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-gray-900 rounded-b-2xl z-20" />
        {/* Screen area */}
        <div className="absolute inset-[6px] rounded-[2.5rem] overflow-hidden bg-gray-50 dark:bg-gray-800">
          <div
            style={{
              opacity: fade ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
            className="w-full h-full"
          >
            {step === 0 && <MapScreen />}
            {step === 1 && <BookScreen />}
            {step === 2 && <StatusScreen />}
          </div>
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-600 rounded-full" />
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-500 ${
              i === step ? 'w-6 h-2 bg-indigo-600' : 'w-2 h-2 bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Screen 1: Map view ─────────────────────────────────────── */
function MapScreen() {
  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="bg-white dark:bg-gray-900 px-5 pt-8 pb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-800 dark:text-white">Servivo</span>
        <span className="text-xs text-gray-400">📶 🔋</span>
      </div>
      {/* Map area */}
      <div className="flex-1 relative overflow-hidden bg-slate-200 dark:bg-slate-700">
        {/* Fake map grid */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#6366f1" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* fake roads */}
          <line x1="0" y1="80" x2="300" y2="80" stroke="#fff" strokeWidth="6" opacity="0.6"/>
          <line x1="0" y1="160" x2="300" y2="160" stroke="#fff" strokeWidth="4" opacity="0.4"/>
          <line x1="80" y1="0" x2="80" y2="300" stroke="#fff" strokeWidth="6" opacity="0.6"/>
          <line x1="180" y1="0" x2="180" y2="300" stroke="#fff" strokeWidth="4" opacity="0.4"/>
        </svg>

        {/* Pro pins */}
        <ProPin x={38} y={28} name="Mike R." distance="0.4 km" pulse />
        <ProPin x={62} y={55} name="Sara L." distance="0.9 km" />
        <ProPin x={22} y={65} name="Tom W." distance="1.2 km" />

        {/* User location */}
        <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
          <div className="w-5 h-5 bg-indigo-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <div className="absolute inset-0 w-5 h-5 bg-indigo-400 rounded-full opacity-40 animate-ping" />
        </div>
      </div>
      {/* Bottom bar */}
      <div className="bg-white dark:bg-gray-900 px-4 py-3 shadow-lg">
        <p className="text-xs font-bold text-gray-800 dark:text-white mb-1">3 pros nearby</p>
        <p className="text-[10px] text-gray-400">All available within 60 min</p>
      </div>
    </div>
  );
}

function ProPin({ x, y, name, distance, pulse }: { x: number; y: number; name: string; distance: string; pulse?: boolean }) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -100%)' }}
    >
      {pulse && <div className="absolute -inset-2 bg-indigo-400 rounded-full opacity-30 animate-ping" />}
      <div className={`relative px-2 py-1 rounded-lg text-[9px] font-bold text-white shadow-md flex items-center gap-1 ${pulse ? 'bg-indigo-600' : 'bg-gray-700'}`}>
        🔧 {name}
        <span className="opacity-75">{distance}</span>
      </div>
      <div className={`w-2 h-2 rotate-45 -mt-1 ${pulse ? 'bg-indigo-600' : 'bg-gray-700'}`} />
    </div>
  );
}

/* ─── Screen 2: Booking ──────────────────────────────────────── */
function BookScreen() {
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBooked(true), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="bg-indigo-600 px-5 pt-10 pb-5 text-white">
        <p className="text-[10px] opacity-75 mb-1">Closest available pro</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-lg font-bold">M</div>
          <div>
            <p className="font-bold text-sm">Mike Rodriguez</p>
            <p className="text-[10px] opacity-75">⭐ 4.9 · Handyman · 0.4 km</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 px-4 py-4 space-y-3">
        <DetailRow icon="🔧" label="Service" value="Handyman" />
        <DetailRow icon="📍" label="Location" value="Your current location" />
        <DetailRow icon="⏱️" label="ETA" value="~12 minutes" />
        <DetailRow icon="💰" label="Rate" value="$45 / hr" />
      </div>

      {/* Book button */}
      <div className="px-4 pb-8">
        {!booked ? (
          <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-sm shadow-lg active:scale-95 transition-transform">
            ⚡ Book Mike now
          </button>
        ) : (
          <div className="w-full bg-green-500 text-white font-bold py-3 rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 animate-bounce-once">
            <span className="text-base">✅</span> Request sent!
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-700 rounded-xl px-3 py-2.5 shadow-sm">
      <span className="text-base">{icon}</span>
      <span className="text-[10px] text-gray-400 w-14 flex-shrink-0">{label}</span>
      <span className="text-xs font-semibold text-gray-800 dark:text-white">{value}</span>
    </div>
  );
}

/* ─── Screen 3: Status ───────────────────────────────────────── */
function StatusScreen() {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 4, 92));
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="bg-green-600 px-5 pt-10 pb-4 text-white text-center">
        <p className="text-xs font-bold mb-0.5">✅ Booking Accepted</p>
        <p className="text-[10px] opacity-80">Mike is on his way to you</p>
      </div>

      {/* Mini map */}
      <div className="relative bg-slate-200 dark:bg-slate-700 mx-4 mt-4 rounded-2xl overflow-hidden h-32">
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#6366f1" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid2)" />
          <line x1="0" y1="50" x2="300" y2="50" stroke="#fff" strokeWidth="5" opacity="0.5"/>
          <line x1="0" y1="90" x2="300" y2="90" stroke="#fff" strokeWidth="3" opacity="0.3"/>
          <line x1="60" y1="0" x2="60" y2="200" stroke="#fff" strokeWidth="5" opacity="0.5"/>
          <line x1="150" y1="0" x2="150" y2="200" stroke="#fff" strokeWidth="3" opacity="0.3"/>
        </svg>
        {/* Moving pro dot */}
        <div
          className="absolute w-6 h-6 bg-indigo-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] transition-all duration-500"
          style={{ left: `${progress}%`, top: '40%', transform: 'translate(-50%,-50%)' }}
        >
          🔧
        </div>
        {/* User dot */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow" />
        {/* Dotted path */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <line x1="10%" y1="50%" x2="88%" y2="50%" stroke="#6366f1" strokeWidth="2" strokeDasharray="6 4" opacity="0.5"/>
        </svg>
      </div>

      {/* ETA */}
      <div className="mx-4 mt-3 bg-white dark:bg-gray-700 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[10px] text-gray-400">Estimated arrival</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">~{Math.max(1, Math.round(12 * (1 - progress / 100)))} min away</p>
        </div>
        <span className="text-2xl">🚗</span>
      </div>

      {/* Pro info */}
      <div className="mx-4 mt-3 bg-white dark:bg-gray-700 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">M</div>
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-900 dark:text-white">Mike Rodriguez</p>
          <p className="text-[10px] text-gray-400">⭐ 4.9 · Handyman</p>
        </div>
        <button className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white 