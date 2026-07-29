import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Users, ArrowRight, Smartphone, Mail, Phone, Zap, ShieldCheck, Building2 } from 'lucide-react';

const PublicLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Tipod_Final_Logo_high_pixel.png" alt="Tripod Services" className="h-10 w-auto" />
            <span className="text-xl font-bold text-[#2b4594]">Tripod Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/login')}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#2b4594] transition"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/admin/register')}
              className="px-4 py-2 text-sm font-semibold bg-[#2b4594] text-white rounded-lg hover:bg-[#1e326e] transition"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#2b4594] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Visitor Management<br />
            <span className="text-blue-200">Made Simple</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Tripod Hub is a public B2B SaaS platform. Any organization can sign up and manage visitors, guards, and employees — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/admin/register')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#2b4594] rounded-xl font-bold text-base hover:bg-blue-50 transition shadow-lg"
            >
              Start Your Organization — Free
            </button>
            <button
              onClick={() => navigate('/support')}
              className="w-full sm:w-auto px-8 py-4 border-2 border-white/50 text-white rounded-xl font-semibold text-base hover:border-white hover:bg-white/10 transition"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How It Works</h2>
            <p className="text-slate-500 text-lg">Open to any business — no invite needed</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Sign Up', desc: 'Any business registers at our public platform. No invite needed.' },
              { step: '2', title: 'Get Approved', desc: 'We review your request and activate your account quickly.' },
              { step: '3', title: 'Configure Your Site', desc: 'Set up visitor groups, locations, and security settings.' },
              { step: '4', title: 'Go Live', desc: 'Staff and visitors start using the app immediately.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
                <div className="w-12 h-12 rounded-full bg-[#2b4594] text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Public features ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Features for Everyone</h2>
            <p className="text-slate-500 text-lg">No account required for these public features</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users size={28} className="text-[#2b4594]" />,
                title: 'Public Visitor Check-in',
                desc: 'Visitors sign themselves in at any site — no account needed. Just scan a QR code or enter the site code.',
                action: () => navigate('/checkin/TRIPOD'),
                label: 'Try it now',
              },
              {
                icon: <ShieldCheck size={28} className="text-[#2b4594]" />,
                title: 'Health & Safety',
                desc: 'Built-in safety acknowledgment, visitor photo capture, and sign-out flow for every site.',
                action: () => navigate('/checkin/TRIPOD'),
                label: 'See how it works',
              },
              {
                icon: <Mail size={28} className="text-[#2b4594]" />,
                title: 'Public Support',
                desc: 'Anyone can reach our support team — whether you are a visitor, employee, or potential client.',
                action: () => navigate('/support'),
                label: 'Contact support',
              },
            ].map(({ icon, title, desc, action, label }) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-8 hover:shadow-md transition">
                <div className="w-14 h-14 bg-[#2b4594]/8 rounded-2xl flex items-center justify-center mb-5">
                  {icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
                <p className="text-slate-500 text-sm mb-5">{desc}</p>
                <button onClick={action} className="text-[#2b4594] font-semibold text-sm flex items-center gap-1 hover:gap-2 transition">
                  {label} <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to get started?</h2>
          <p className="text-slate-500 text-lg mb-8">
            Register your organization today. Free for all end users — employees, guards, and visitors.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/admin/register')}
              className="px-8 py-4 bg-[#2b4594] text-white rounded-xl font-bold hover:bg-[#1e326e] transition shadow-lg"
            >
              Register Your Organization
            </button>
            <button
              onClick={() => navigate('/admin/login')}
              className="px-8 py-4 border-2 border-[#2b4594] text-[#2b4594] rounded-xl font-bold hover:bg-[#2b4594]/5 transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-[#1a2d6d] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10 mb-10">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white rounded-xl p-2">
                  <img src="/Tipod_Final_Logo_high_pixel.png" alt="Tripod Services" className="h-8 w-auto" />
                </div>
                <span className="text-white font-bold text-xl">Tripod Hub</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Professional visitor management and attendance tracking for organizations of all sizes.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-3">
                <li><button onClick={() => navigate('/admin/register')} className="text-slate-300 hover:text-white text-sm transition">Register Organization</button></li>
                <li><button onClick={() => navigate('/admin/login')} className="text-slate-300 hover:text-white text-sm transition">Sign In</button></li>
                <li><button onClick={() => navigate('/support')} className="text-slate-300 hover:text-white text-sm transition">Support</button></li>
                <li><button onClick={() => navigate('/checkin/TRIPOD')} className="text-slate-300 hover:text-white text-sm transition">Try Visitor Check-in</button></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Contact Us</h4>
              <ul className="space-y-3">
                <li>
                  <a href="mailto:Abid.fiaz@tripodsvcs.co.uk" className="flex items-center gap-2 text-slate-300 hover:text-white text-sm transition">
                    <Mail size={15} />
                    Abid.fiaz@tripodsvcs.co.uk
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/447446084868" className="flex items-center gap-2 text-slate-300 hover:text-white text-sm transition">
                    <Phone size={15} />
                    +44 7446 084868
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-slate-400 text-sm">© 2026 Tripod Services Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default PublicLanding;
