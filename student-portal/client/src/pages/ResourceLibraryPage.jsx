import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getResourceLibrary } from '../services/resourceService';
import { fadeInUp, staggerContainer, cardInteraction } from '../lib/motionVariants';
import { SearchIcon, ExternalLinkIcon, BookOpenIcon } from '../components/icons';

const SOURCE_STYLE = {
  'Google Drive': 'bg-info-bg text-info-text',
  GitHub: 'bg-neutral-800 text-white',
  YouTube: 'bg-danger-bg text-danger-text',
  Figma: 'bg-warning-bg text-warning-text',
  Notion: 'bg-neutral-100 text-neutral-600',
  Link: 'bg-neutral-100 text-neutral-500',
};

function ResourceCard({ resource }) {
  return (
    <motion.a
      variants={fadeInUp}
      whileHover={cardInteraction.whileHover}
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white border border-neutral-200 rounded-lg shadow-card p-4 sm:p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-pill px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${SOURCE_STYLE[resource.source] || SOURCE_STYLE.Link}`}
        >
          {resource.source}
        </span>
        <ExternalLinkIcon className="w-4 h-4 text-neutral-400 shrink-0" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-900 truncate">{resource.title}</p>
        <p className="text-xs text-neutral-400 truncate mt-1">{resource.url}</p>
      </div>
      <p className="text-xs text-neutral-500 mt-auto pt-2 border-t border-neutral-100">
        From: <span className="font-medium text-neutral-700">{resource.assignmentTitle}</span>
      </p>
    </motion.a>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-4 sm:p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-4 w-20 bg-neutral-200 rounded-pill" />
      <div className="h-4 w-3/4 bg-neutral-200 rounded" />
      <div className="h-3 w-1/2 bg-neutral-200 rounded" />
    </div>
  );
}

export default function ResourceLibraryPage() {
  const { courseId } = useParams();
  const [search, setSearch] = useState('');

  const { data: resources, isLoading, isError, refetch } = useQuery({
    queryKey: ['resources', courseId],
    queryFn: () => getResourceLibrary(courseId),
  });

  const filtered = (resources || []).filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q) ||
      r.assignmentTitle.toLowerCase().includes(q) ||
      r.source.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center gap-2">
        <BookOpenIcon className="w-5 h-5 text-primary-800" />
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900">Resource Library</h1>
      </div>

      <div className="relative">
        <SearchIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources..."
          className="w-full rounded-md border border-neutral-300 pl-10 pr-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : isError ? (
        <div className="py-16 text-center flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-neutral-500">Couldn't load the resource library.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-neutral-500">
            {resources?.length ? 'No resources match your search.' : 'No reference links found for this course yet.'}
          </p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((r, i) => (
            <ResourceCard key={`${r.assignmentId}-${i}`} resource={r} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
