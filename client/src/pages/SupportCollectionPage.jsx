import React from 'react';
import { ChevronRight, Clock3, PlayCircle, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { findSupportCollection } from '../data/supportContent';

const iconMap = {
  play: PlayCircle,
  activity: UserRoundCheck,
  shield: ShieldCheck,
};

const SupportCollectionPage = () => {
  const { collectionSlug } = useParams();
  const collection = findSupportCollection(collectionSlug);

  if (!collection) {
    return <Navigate to="/admin/support" replace />;
  }

  const Icon = iconMap[collection.icon] || PlayCircle;

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-8 py-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/admin/support" className="hover:text-slate-700">
              All Collections
            </Link>
            <ChevronRight size={14} />
            <span className="text-slate-700">{collection.title}</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#76c043] text-[#76c043]">
              <Icon size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">{collection.title}</h1>
              <p className="mt-2 max-w-3xl text-lg text-slate-500">{collection.description}</p>
              <p className="mt-4 text-sm font-medium text-slate-500">
                {collection.articles.length} article{collection.articles.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {collection.articles.map((article) => (
            <Link
              key={article.slug}
              to={`/admin/support/articles/${article.slug}`}
              className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 transition-colors hover:bg-slate-50 last:border-b-0"
            >
              <div>
                <p className="text-xl font-medium text-slate-800">{article.title}</p>
                <p className="mt-1 text-sm text-slate-500">{article.summary}</p>
              </div>

              <div className="flex items-center gap-5">
                <span className="inline-flex items-center gap-1 text-sm text-slate-400">
                  <Clock3 size={14} />
                  {article.readTime}
                </span>
                <ChevronRight size={18} className="text-[#76c043]" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportCollectionPage;
