import { useNavigate } from 'react-router-dom';
import { Button } from '@servivo/ui';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-2xl font-black text-indigo-600">Servivo</span>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pro/login')}>
            Pro login
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/consumer/login')}>
            Get started
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block bg-indigo-500 bg-opacity-40 text-indigo-100 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            On-demand home services
          </div>
          <h1 className="text-5xl font-black mb-5 leading-tight">
            A pro at your door<br />within the hour
          </h1>
          <p className="text-indigo-200 text-xl mb-10 max-w-xl mx-auto">
            Servivo connects you with the nearest available professional in real time — no scheduling, no waiting days.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/consumer/login')}
              className="bg-white text-indigo-700 hover:bg-indigo-50"
            >
              Book a pro now
            </Button>
            <button
              onClick={() => navigate('/pro/login')}
              className="px-6 py-3 rounded-lg border-2 border-indigo-400 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Join as a pro →
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How it works</h2>
          <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
            From request to doorstep in three simple steps.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: '📍',
                title: 'Share your location',
                desc: 'Open the app and we instantly find all available pros within range of you right now.',
              },
              {
                step: '2',
                icon: '⚡',
                title: 'Pick & book',
                desc: 'See pros sorted by distance and availability. Tap to send a booking request in one click.',
              },
              {
                step: '3',
                icon: '🔧',
                title: 'They come to you',
                desc: 'Your pro accepts and heads over. Track their location on the map until they arrive.',
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <div className="text-4xl mb-4">{icon}</div>
                <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Step {step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">Everything you need, nothing you don't</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: '🗺️', title: 'Live map', desc: 'See nearby pros as pins on a real map. Watch your pro move toward you after they accept.' },
              { icon: '⏱️', title: '60-minute window', desc: 'We only show pros who can actually arrive within the hour — no false promises.' },
              { icon: '🔔', title: 'Instant notifications', desc: 'Pros get a push notification the moment you book. Consumers are notified the instant a pro responds.' },
              { icon: '✅', title: 'Pro accepts or declines', desc: 'Pros stay in control — they can accept or decline each request. If declined, find another nearby pro instantly.' },
              { icon: '🔒', title: 'Separate logins', desc: 'Consumers and pros have dedicated accounts and dashboards built for their specific needs.' },
              { icon: '📅', title: 'Schedule management', desc: 'Pros set their own availability windows. Only available pros appear in consumer searches.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-6 bg-gray-50 rounded-2xl">
                <span className="text-3xl flex-shrink-0">{icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-6 bg-indigo-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Services available</h2>
          <p className="text-gray-500 mb-10">Skilled professionals across the most common home service categories.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Plumber', 'Electrician', 'HVAC', 'Handyman', 'Cleaner', 'Painter', 'Locksmith', 'Appliance Repair'].map((s) => (
              <span key={s} className="bg-white text-indigo-700 border border-indigo-200 px-5 py-2 rounded-full text-sm font-medium shadow-sm">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-indigo-600 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl font-black mb-4">Ready to get started?</h2>
          <p className="text-indigo-200 text-lg mb-10">
            Book your first pro in under a minute — no credit card required to sign up.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/consumer/login')}
              className="bg-white text-indigo-700 hover:bg-indigo-50"
            >
              Book a pro
            </Button>
            <button
              onClick={() => navigate('/pro/login')}
              className="px-6 py-3 rounded-lg border-2 border-indigo-400 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Become a pro →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-sm text-gray-400 border-t">
        <span className="font-bold text-gray-600 mr-2">Servivo</span>
        On-demand home services · {new Date().getFullYear()}
      </footer>

    </div>
  );
}
