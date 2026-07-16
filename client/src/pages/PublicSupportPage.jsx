import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, Globe, Mail, ShieldCheck, MessageCircle } from 'lucide-react';

const PublicSupportPage = () => {
  const SUPPORT_EMAIL_OVERRIDE = 'Abid.fiaz@tripodsvcs.co.uk';
  const WHATSAPP_WA = '447446084868';

  // chat widget state
  const [showChat, setShowChat] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [messages, setMessages] = useState([{ from: 'bot', text: 'Hi! How can we help you today?' }]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showChat]);

  const sendMessage = (e) => {
    e?.preventDefault();
    const text = chatMsg.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: 'user', text }]);
    setChatMsg('');

    // Basic keyword-based FAQ responder
    const q = text.toLowerCase();
    let reply = 'Thanks — our team will respond via email or WhatsApp shortly.';

    if (q.includes('register') || q.includes('new member') || q.includes('add member')) {
      reply =
        "To register a new member: 1) Open Admin → People (https://tripod-signin-app.onrender.com/admin/people). 2) Click 'New person' or 'Add person'. 3) Fill name, email and any required fields. 4) Save. If you want, tell me the site name and I can guide further.";
    } else if (q.includes('printer')) {
      reply = 'Printer help: ensure the printer is powered and on the same network as your kiosk. Test a print from Activity > Export or the sign-in screen. Contact support with printer model if issues persist.';
    } else if (q.includes('evacuation') || q.includes('evacu')) {
      reply = 'Evacuation guide: Open Admin → Evacuation, start an evacuation for the active site, mark people safe as they are accounted for, and close the report when finished.';
    } else if (q.includes('pricing') || q.includes('trial')) {
      reply = 'Pricing and trials: Please contact sales@tripodsvcs.co.uk or request a callback and we will put you in touch with our sales team.';
    }

    setTimeout(() => {
      setMessages((m) => [...m, { from: 'bot', text: reply }]);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 sm:px-8 lg:px-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#eef8e7] text-[#2b4594]">
            <ShieldCheck size={24} />
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900">Support</h1>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">
            Need help with the Sign In App experience? Use the information below for support requests, product questions, or assistance with account access.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#cfeab8] bg-[#f8fcf4] text-[#2b4594]">
                <Mail size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Email support</h2>
                <p className="text-sm text-slate-500">Best for non-urgent questions and account help</p>
              </div>
            </div>
            <p className="mt-4 text-slate-600">
              Send an email to our support team and we will follow up with the next steps.
            </p>
            <p className="mt-3 text-slate-500">For non urgent queries email our support team or contact via WhatsApp.</p>
            <div className="mt-4 space-y-2">
              <a href={`mailto:Abid.fiaz@tripodsvcs.co.uk`} className="inline-block text-base font-semibold text-slate-800 underline">
                Abid.fiaz@tripodsvcs.co.uk
              </a>
              <a
                href={`https://wa.me/447446084868`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-base font-semibold text-[#2b4594]"
              >
                WhatsApp: +447446084868
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#cfeab8] bg-[#f8fcf4] text-[#2b4594]">
              <MessageCircle size={20} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mt-4">Online chat</h2>
            <p className="text-sm text-slate-500 mt-1">Start a live-style support chat for quick guidance.</p>
            <div className="mt-4">
              <button
                onClick={() => setShowChat(true)}
                className="inline-flex items-center gap-2 rounded-md bg-[#2b4594] px-4 py-2 text-sm font-semibold text-white"
              >
                New chat
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#cfeab8] bg-[#f8fcf4] text-[#2b4594]">
                <Globe size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Open the app</h2>
                <p className="text-sm text-slate-500">Visit the Sign In App admin website</p>
              </div>
            </div>
            <p className="mt-4 text-slate-600">
              This page is ready to use as your App Store support URL for verification purposes.
            </p>
            <a
              href="https://tripod-signin-app.onrender.com/admin/people"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-[#2b4594] hover:underline"
            >
              Open the Sign In App website
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Need a different contact method?</h2>
          <p className="mt-2 text-slate-600">
            If you want a different email address, phone number, or support hours, send me those details and I will update this page for you.
          </p>
        </div>
        {showChat && (
          <div className="fixed bottom-20 right-6 z-50 flex w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#2b4594] px-4 py-3">
              <span className="text-sm font-semibold text-slate-50">Support Chat</span>
              <button type="button" onClick={() => setShowChat(false)} className="text-white opacity-80 hover:opacity-100">
                ✕
              </button>
            </div>
            <div className="max-h-64 flex-1 space-y-2 overflow-y-auto p-3">
              {messages.map((message, index) => (
                <div key={`${message.from}-${index}`} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    style={{ maxWidth: '85%' }}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.from === 'user' ? 'bg-[#2b4594] text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-200 p-3">
              <input
                value={chatMsg}
                onChange={(event) => setChatMsg(event.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#2b4594]"
              />
              <button type="submit" className="rounded-lg bg-[#2b4594] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f6fc5]">
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicSupportPage;
