import React, { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ExternalLink, FileText, Mail, MessageCircle, PlayCircle, Search, ShieldCheck, UserRoundCheck, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import {
  SUPPORT_COLLECTIONS,
  SUPPORT_EMAIL,
  flattenSupportArticles,
  searchSupportContent,
} from '../data/supportContent';

const iconMap = {
  play: PlayCircle,
  activity: UserRoundCheck,
  shield: ShieldCheck,
};

const SupportPage = () => {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [messages, setMessages] = useState([{ from: 'bot', text: 'Hi! How can we help you today?' }]);
  const [query, setQuery] = useState('');
  const [emailForm, setEmailForm] = useState({ email: '', query: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  const bottomRef = useRef(null);

  const searchResults = useMemo(() => searchSupportContent(query), [query]);
  const featuredCollection = SUPPORT_COLLECTIONS[0];
  const allArticles = flattenSupportArticles();

  const sendMessage = (event) => {
    event.preventDefault();
    if (!chatMsg.trim()) return;

    setMessages((current) => [
      ...current,
      { from: 'user', text: chatMsg },
      {
        from: 'bot',
        text: 'Thanks for your message. Please also check the support articles or email support if you need a tracked follow-up.',
      },
    ]);
    setChatMsg('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!query.trim()) return;

    if (searchResults.articles.length > 0) {
      navigate(`/admin/support/articles/${searchResults.articles[0].slug}`);
      return;
    }

    if (searchResults.collections.length > 0) {
      navigate(`/admin/support/collections/${searchResults.collections[0].slug}`);
      return;
    }

    toast.error('No support results matched your search');
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    if (!emailForm.email.trim() || !emailForm.query.trim()) {
      toast.error('Enter your email and message');
      return;
    }

    setSendingEmail(true);
    try {
      await api.post('/contact', emailForm);
      toast.success('Your support request has been sent');
      setEmailForm({ email: '', query: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send support request');
    } finally {
      setSendingEmail(false);
    }
  };

  const visibleArticles = query.trim() ? searchResults.articles : featuredCollection.articles;

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-8 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-7 shadow-sm">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Support</h1>
              <p className="mt-2 text-lg text-slate-500">
                Having trouble? Our team are on hand to answer any questions you may have.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for articles..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-5 pl-16 pr-6 text-xl text-slate-700 outline-none focus:border-[#2b4594] focus:ring-2 focus:ring-[#cfeab8]"
              />
            </form>

            {query.trim() && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  Found {searchResults.articles.length} article result{searchResults.articles.length === 1 ? '' : 's'},
                  {' '}{searchResults.collections.length} collection result{searchResults.collections.length === 1 ? '' : 's'},
                  and {searchResults.updates.length} update result{searchResults.updates.length === 1 ? '' : 's'}.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="flex min-h-[260px] flex-col rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#2b4594] text-[#2b4594]">
              <FileText size={32} strokeWidth={1.6} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-slate-900">User guide</h2>
            <p className="mt-3 flex-1 text-slate-500">Browse onboarding, workflow, and emergency-readiness articles.</p>
            <Link
              to="/admin/support/collections/getting-started"
              className="mt-8 inline-flex items-center justify-center gap-2 text-base font-semibold text-slate-700 hover:text-[#2b4594]"
            >
              View guide
              <ExternalLink size={16} />
            </Link>
          </div>

          <div className="flex min-h-[260px] flex-col rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#2b4594] text-[#2b4594]">
              <MessageCircle size={32} strokeWidth={1.6} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-slate-900">Online chat</h2>
            <p className="mt-3 flex-1 text-slate-500">Start a live-style support conversation for quick guidance.</p>
            <button
              type="button"
              onClick={() => setShowChat(true)}
              className="mt-8 inline-flex items-center justify-center gap-2 text-base font-semibold text-slate-700 hover:text-[#2b4594]"
            >
              <MessageCircle size={16} />
              New chat
            </button>
          </div>

          <div className="flex min-h-[260px] flex-col rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#2b4594] text-[#2b4594]">
              <Mail size={32} strokeWidth={1.6} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-slate-900">Email us</h2>
            <p className="mt-3 flex-1 text-slate-500">For non urgent queries, send a tracked support request.</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-3 text-base font-semibold text-slate-700 underline hover:text-[#2b4594]">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 px-8 py-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#2b4594] text-[#2b4594]">
                <PlayCircle size={20} />
              </div>
              <div>
                <h2 className="text-4xl font-semibold tracking-tight text-slate-900">{featuredCollection.title}</h2>
                <p className="mt-2 text-slate-500">
                  {query.trim() ? 'Matching articles' : `${featuredCollection.articles.length} articles`}
                </p>
              </div>
            </div>

            <div>
              {visibleArticles.map((article) => (
                <Link
                  key={article.slug}
                  to={`/admin/support/articles/${article.slug}`}
                  className="flex items-center justify-between gap-4 border-b border-slate-100 px-8 py-5 transition-colors hover:bg-slate-50 last:border-b-0"
                >
                  <div>
                    <p className="text-xl font-medium text-slate-800">{article.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{article.summary}</p>
                  </div>
                  <span className="text-2xl text-[#2b4594]">›</span>
                </Link>
              ))}

              {query.trim() && visibleArticles.length === 0 && (
                <div className="px-8 py-10 text-sm text-slate-500">
                  No article results were found for this search.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Collections</h3>
              <div className="mt-4 space-y-3">
                {(query.trim() ? searchResults.collections : SUPPORT_COLLECTIONS).map((collection) => {
                  const Icon = iconMap[collection.icon] || PlayCircle;
                  return (
                    <Link
                      key={collection.slug}
                      to={`/admin/support/collections/${collection.slug}`}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 transition-colors hover:border-[#b8df9f] hover:bg-[#f8fcf4]"
                    >
                      <div className="mt-0.5 text-[#2b4594]">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{collection.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{collection.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Email support</h3>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tracked</span>
              </div>
              <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3">
                <input
                  type="email"
                  value={emailForm.email}
                  onChange={(event) => setEmailForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Your email"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#2b4594] focus:ring-2 focus:ring-[#cfeab8]"
                />
                <textarea
                  rows={5}
                  value={emailForm.query}
                  onChange={(event) => setEmailForm((current) => ({ ...current, query: event.target.value }))}
                  placeholder="How can we help?"
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#2b4594] focus:ring-2 focus:ring-[#cfeab8]"
                />
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="w-full rounded-xl bg-[#2b4594] px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-[#20356f] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingEmail ? 'Sending...' : 'Send support request'}
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">What&apos;s new</h3>
                <Link to="/admin/support/whats-new" className="text-sm font-semibold text-[#2b4594] hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {searchResults.updates.slice(0, query.trim() ? 4 : 2).map((update) => (
                  <Link
                    key={update.slug}
                    to="/admin/support/whats-new"
                    className="block rounded-2xl border border-slate-200 px-4 py-3 transition-colors hover:border-[#b8df9f] hover:bg-[#f8fcf4]"
                  >
                    <p className="font-medium text-slate-800">{update.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{update.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showChat && (
          <div className="fixed bottom-20 right-6 z-50 flex w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#2b4594] px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">Support Chat</span>
              <button type="button" onClick={() => setShowChat(false)} className="text-slate-700 hover:text-slate-900">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-64 flex-1 space-y-2 overflow-y-auto p-3">
              {messages.map((message, index) => (
                <div key={`${message.from}-${index}`} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      message.from === 'user' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
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
              <button type="submit" className="rounded-lg bg-[#2b4594] px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-[#20356f] hover:text-white">
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;
