import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getQuestions } from '../services/questionService';
import { initialsOf } from '../components/Sidebar';
import AskQuestionModal from '../components/AskQuestionModal';
import { fadeInUp, staggerContainer, cardInteraction } from '../lib/motionVariants';
import { SearchIcon, MessageCircleIcon, ThumbsUpIcon, CheckBadgeIcon } from '../components/icons';

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function QuestionCard({ question, courseId }) {
  return (
    <motion.div variants={fadeInUp} whileHover={cardInteraction.whileHover}>
      <Link
        to={`/doubts/${courseId}/${question._id}`}
        data-testid="question-card"
        className="flex items-start gap-3 sm:gap-4 bg-white border border-neutral-200 rounded-lg shadow-card p-4 sm:p-5"
      >
        {question.authorAvatarUrl ? (
          <img src={question.authorAvatarUrl} alt={question.authorName} className="w-9 h-9 rounded-pill object-cover shrink-0" />
        ) : (
          <span className="w-9 h-9 shrink-0 rounded-pill bg-primary-800 text-white font-bold text-xs flex items-center justify-center">
            {initialsOf(question.authorName)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-900 flex items-center flex-wrap gap-1.5">
              {question.title}
              {question.hasAcceptedAnswer && (
                <span
                  data-testid="accepted-indicator"
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-success-text bg-success-bg rounded-pill px-1.5 py-0.5"
                >
                  <CheckBadgeIcon className="w-3 h-3" />
                  Resolved
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-neutral-500">
            <span>{question.authorName}</span>
            <span>·</span>
            <span>{timeAgo(question.createdAt)}</span>
            {question.moduleTag && (
              <>
                <span>·</span>
                <span className="text-primary-800 font-medium">{question.moduleTag}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <ThumbsUpIcon className="w-3.5 h-3.5" />
            {question.upvoteCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircleIcon className="w-3.5 h-3.5" />
            {question.answerCount}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex items-start gap-4 bg-white border border-neutral-200 rounded-lg shadow-card p-4 sm:p-5 animate-pulse">
      <div className="w-9 h-9 rounded-pill bg-neutral-200 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-2/3 bg-neutral-200 rounded" />
        <div className="h-3 w-1/3 bg-neutral-200 rounded" />
      </div>
    </div>
  );
}

export default function DoubtsListPage() {
  const { courseId } = useParams();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [askOpen, setAskOpen] = useState(false);

  const { data: questions, isLoading, isError, refetch } = useQuery({
    queryKey: ['questions', courseId, sort, search],
    queryFn: () => getQuestions(courseId, { sort, search: search.trim() || undefined }),
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900">Ask a Doubt</h1>
          <p className="text-sm text-neutral-500 mt-1">Course-specific Q&amp;A — ask, answer, and upvote what helped.</p>
        </div>
        <button
          type="button"
          onClick={() => setAskOpen(true)}
          data-testid="ask-question-button"
          className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 transition-colors shrink-0"
        >
          + Ask a Question
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full rounded-md border border-neutral-300 pl-10 pr-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          />
        </div>
        <div className="flex rounded-md bg-neutral-100 p-1 shrink-0 self-start sm:self-auto">
          {[
            { key: 'newest', label: 'Newest' },
            { key: 'top', label: 'Most Upvoted' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSort(opt.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                sort === opt.key ? 'bg-primary-800 text-white' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : isError ? (
        <div className="py-16 text-center flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-neutral-500">Couldn't load questions.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
          >
            Retry
          </button>
        </div>
      ) : questions.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-neutral-500">
            {search ? 'No questions match your search.' : 'No questions yet — be the first to ask.'}
          </p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-3">
          {questions.map((q) => (
            <QuestionCard key={q._id} question={q} courseId={courseId} />
          ))}
        </motion.div>
      )}

      <AskQuestionModal open={askOpen} onClose={() => setAskOpen(false)} courseId={courseId} />
    </div>
  );
}
