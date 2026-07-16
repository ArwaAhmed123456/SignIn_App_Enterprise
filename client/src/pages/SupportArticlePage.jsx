import React from 'react';
import { ChevronRight, Clock3 } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { findSupportArticle } from '../data/supportContent';

const SupportArticlePage = () => {
  const { articleSlug } = useParams();
  const article = findSupportArticle(articleSlug);

  if (!article) {
    return <Navigate to="/admin/support" replace />;
  }

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-8 py-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/admin/support" className="hover:text-slate-700">
              All Collections
            </Link>
            <ChevronRight size={14} />
            <Link to={`/admin/support/collections/${article.collectionSlug}`} className="hover:text-slate-700">
              {article.collectionTitle}
            </Link>
            <ChevronRight size={14} />
            <span className="text-slate-700">{article.title}</span>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="rounded-full bg-[#eef3fb] px-3 py-1 font-medium text-[#2b4594]">
                {article.collectionTitle}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 size={14} />
                {article.readTime}
              </span>
              <span>Updated {article.updatedAt}</span>
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900">{article.title}</h1>
            <p className="mt-3 text-lg text-slate-500">{article.summary}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <div className="space-y-8">
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-semibold text-slate-900">{section.heading}</h2>
                <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportArticlePage;
