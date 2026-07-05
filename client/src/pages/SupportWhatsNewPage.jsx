import React from 'react';
import { BellDot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WHATS_NEW_ITEMS } from '../data/supportContent';

const SupportWhatsNewPage = () => {
  return (
    <div className="h-full overflow-auto bg-slate-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-8 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#eef8e7] text-[#2b4594]">
            <BellDot size={24} />
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900">What&apos;s new</h1>
          <p className="mt-3 max-w-3xl text-lg text-slate-500">
            Recent product and workflow updates for the admin experience.
          </p>
        </div>

        <div className="space-y-5">
          {WHATS_NEW_ITEMS.map((item) => (
            <article key={item.slug} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#eef8e7] px-3 py-1 text-sm font-medium text-[#4f8f2f]">
                  Release note
                </span>
                <span className="text-sm text-slate-400">{item.date}</span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-slate-600">{item.summary}</p>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {item.bullets.map((bullet) => (
                  <p key={bullet}>- {bullet}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Looking for setup guidance? Visit{' '}
          <Link to="/admin/support/collections/getting-started" className="font-semibold text-[#4f8f2f] hover:underline">
            Getting Started
          </Link>
          .
        </div>
      </div>
    </div>
  );
};

export default SupportWhatsNewPage;
