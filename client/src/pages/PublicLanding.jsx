import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, ShieldCheck, Users, Globe, ArrowRight, Smartphone, Clock, ChevronRight, Mail, Phone, Shield, Zap } from 'lucide-react';

const PublicLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative bg-[#2b4594] text-white py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-[#2b4594] to-[#1e326e] opacity-90" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm">
            <Building2 size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Tripod Hub
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10">
            The public visitor management companion app. 
            <br />
            Organizations use our platform to manage visitors, guards, and employees.
            <br className="hidden md:block" />
            <span className="text-white font-semibold">You can use it too — just ask your organization.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/admin/register')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#2b4594] rounded-xl font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2"
            >
              <UserPlus size={20} />
              Start Your Organization
            </button>
            <button
              onClick={() => navigate('/mobile-landing')}
              className="w-full sm:w-auto px-8 py-4 bg-[#2b4594]/30 border border-white/30 text-white rounded-xl font-semibold hover:bg-[#2b4594]/40 transition flex items-center justify-center gap-2"
            >
              <Smartphone size={20} />
              Download Mobile App
            </button>
          </div>
        </div>
      </section>

      {/* What is Tripod Hub? */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              What is Tripod Hub?
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-slate-700">
                Tripod Hub is a <strong className="text-[#2b4594]">B2B SaaS platform</strong> that helps organizations manage visitor check-ins, employee attendance, and security operations.
              </p>
              <p className="text-lg text-slate-700">
                Think of it like "Airbnb for visitor management" — we provide the technology, and any organization can use it.
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h3 className="font-semibold text-[#2b4594] mb-3 flex items-center gap-2">
                  <Zap size={18} />
                  Key Points
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Publicly available on App Store & Google Play</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Free for end users (employees, guards, visitors)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Organizations pay for subscription</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Any business can sign up and start using it</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-semibold text-slate-900">How It Works</h3>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Public Platform</span>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#2b4594] text-white flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-slate-900">Organization Signs Up</h4>
                  <p className="text-sm text-slate-600 mt-1">Any business creates their own account at tripod-signin-app.onrender.com</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#2b4594] text-white flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-slate-900">They Configure Their Site</h4>
                  <p className="text-sm text-slate-600 mt-1">Admin sets up visitor groups, locations, and security settings</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#2b4594] text-white flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-slate-900">Employees & Guards Use the App</h4>
                  <p className="text-sm text-slate-600 mt-1">Staff download the app and sign in with credentials from their organization</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#2b4594] text-white flex items-center justify-center flex-shrink-0 font-bold">4</div>
                <div>
                  <h4 className="font-semibold text-slate-900">Visitors Check In Publicly</h4>
                  <p className="text-sm text-slate-600 mt-1">Anyone can visit and sign in at any Tripod Hub site — no account needed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Features */}
      <section className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Public Features Available to Everyone
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              You don't need an account to experience our core visitor management features.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-[#2b4594]/30 transition">
              <div className="w-14 h-14 bg-[#2b4594]/10 rounded-2xl flex items-center justify-center mb-6">
                <Users size={32} className="text-[#2b4594]" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Public Visitor Check-in
              </h3>
              <p className="text-slate-600 mb-6">
                Visit any organization using Tripod Hub and sign in yourself — no account required. Just enter the site code and complete the check-in form.
              </p>
              <button
                onClick={() => navigate('/checkin/TRIPOD')}
                className="text-[#2b4594] font-semibold flex items-center gap-2 hover:gap-3 transition"
              >
                Try it now <ArrowRight size={16} />
              </button>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-[#2b4594]/30 transition">
              <div className="w-14 h-14 bg-[#2b4594]/10 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={32} className="text-[#2b4594]" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Health & Safety
              </h3>
              <p className="text-slate-600 mb-6">
                All public check-ins include health & safety acknowledgment, visitor拍照, and sign-out functionality for site security.
              </p>
              <button
                onClick={() => navigate('/checkin/TRIPOD')}
                className="text-[#2b4594] font-semibold flex items-center gap-2 hover:gap-3 transition"
              >
                See how it works <ArrowRight size={16} />
              </button>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-[#2b4594]/30 transition">
              <div className="w-14 h-14 bg-[#2b4594]/10 rounded-2xl flex items-center justify-center mb-6">
                <Mail size={32} className="text-[#2b4594]" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Public Support
              </h3>
              <p className="text-slate-600 mb-6">
                Get help through our public support portal. Questions about pricing, setup, or usage? We're here for everyone.
              </p>
              <button
                onClick={() => navigate('/support')}
                className="text-[#2b4594] font-semibold flex items-center gap-2 hover:gap-3 transition"
              >
                Contact support <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* For Organizations */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#2b4594] to-[#1e326e] rounded-3xl p-8 md:p-16 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Is Your Organization Using Tripod Hub?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            If your company uses Tripod Hub for visitor management, download the mobile app and ask your admin for login credentials.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/mobile-landing')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#2b4594] rounded-xl font-semibold hover:bg-blue-50 transition"
            >
              Download Mobile App
            </button>
            <button
              onClick={() => navigate('/support')}
              className="w-full sm:w-auto px-8 py-4 bg-[#2b4594]/40 border border-white/20 text-white rounded-xl font-semibold hover:bg-[#2b4594]/50 transition"
            >
              Get Help from Admin
            </button>
          </div>
        </div>
      </section>

      {/* For New Organizations */}
      <section className="bg-slate-50 py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Not seeing your organization? Start your own!
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Tripod Hub is open to any business. Sign up today and start managing your visitor check-ins in minutes.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-slate-100">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-6">
                  Why Choose Tripod Hub?
                </h3>
                <ul className="space-y-4">
                  {[
                    'No credit card required to start',
                    'Free for all employees and guards',
                    'Complete visitor management solution',
                    'Real-time attendance tracking',
                    'Evacuation management',
                    'Mobile app for all staff'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8">
                <h4 className="text-xl font-semibold text-slate-900 mb-6">Create Your Organization</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2b4594] focus:border-transparent" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2b4594] focus:border-transparent" placeholder="Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input type="email" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2b4594] focus:border-transparent" placeholder="john@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Organization Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#2b4594] focus:border-transparent" placeholder="My Company Ltd" />
                  </div>
                  <button
                    onClick={() => navigate('/admin/register')}
                    className="w-full bg-[#2b4594] text-white py-4 rounded-xl font-semibold hover:bg-[#1e326e] transition"
                  >
                    Start Your Free Trial
                  </button>
                  <p className="text-xs text-slate-500 text-center mt-4">
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src="/Tipod_Final_Logo_high_pixel.png" alt="Tripod Hub" className="h-10 w-auto" />
                <span className="text-white font-bold text-xl">Tripod Hub</span>
              </div>
              <p className="text-slate-400 max-w-md">
                Professional visitor management and attendance tracking for organizations of all sizes. Publicly available B2B SaaS platform.
              </p>
              <div className="mt-6 flex gap-4">
                <a href="mailto:Abid.fiaz@tripodsvcs.co.uk" className="flex items-center gap-2 hover:text-white transition">
                  <Mail size={18} />
                  <span>Abid.fiaz@tripodsvcs.co.uk</span>
                </a>
                <a href="https://wa.me/447446084868" className="flex items-center gap-2 hover:text-white transition">
                  <Phone size={18} />
                  <span>+44 7446 084868</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Public Features</h4>
              <ul className="space-y-3">
                <li>
                  <a href="/support" className="hover:text-white transition">Support</a>
                </li>
                <li>
                  <a href="/checkin/TRIPOD" className="hover:text-white transition">Try Public Check-in</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Platform</h4>
              <ul className="space-y-3">
                <li>
                  <span className="text-slate-500">B2B SaaS Platform</span>
                </li>
                <li>
                  <span className="text-slate-500">Multi-tenant Architecture</span>
                </li>
                <li>
                  <span className="text-slate-500">Public & Private Access</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500 text-sm">
            <p>© 2026 Tripod Services Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLanding;
