import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getQuestionDetail,
  createAnswer,
  upvoteQuestion,
  upvoteAnswer,
  markAcceptedAnswer,
} from '../services/questionService';
import { initialsOf } from '../components/Sidebar';
import { fadeInUp, staggerContainer } from '../lib/motionVariants';
import { ThumbsUpIcon, CheckBadgeIcon } from '../components/icons';

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ name, avatarUrl }) {
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className="w-9 h-9 rounded-pill object-cover shrink-0" />
  ) : (
    <span className="w-9 h-9 shrink-0 rounded-pill bg-primary-800 text-white font-bold text-xs flex items-center justify-center">
      {initialsOf(name)}
    </span>
  );
}

function AnswerCard({ answer, canAccept, onUpvote, onAccept }) {
  return (
    <motion.div
      variants={fadeInUp}
      data-testid="answer-card"
      data-accepted={answer.isAcceptedAnswer}
      className={`rounded-lg border p-4 sm:p-5 flex flex-col gap-3 ${
        answer.isAcceptedAnswer ? 'border-success-text/30 bg-success-bg/40' : 'border-neutral-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={answer.authorName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center flex-wrap gap-1.5">
            <p className="text-sm font-semibold text-neutral-900">{answer.authorName}</p>
            {answer.authorRole === 'trainer' && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-primary-800 bg-primary-100 rounded-pill px-1.5 py-0.5">
                Trainer
              </span>
            )}
            {answer.isAcceptedAnswer && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-success-text bg-success-bg rounded-pill px-1.5 py-0.5">
                <CheckBadgeIcon className="w-3 h-3" />
                Accepted Answer
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">{timeAgo(answer.createdAt)}</p>
        </div>
      </div>

      <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{answer.body}</p>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => onUpvote(answer._id)}
          data-testid="answer-upvote"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <ThumbsUpIcon className="w-3.5 h-3.5" />
          {answer.upvoteCount}
        </button>

        {canAccept && !answer.isAcceptedAnswer && (
          <button
            type="button"
            onClick={() => onAccept(answer._id)}
            data-testid="mark-accepted"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-success-text hover:bg-success-bg transition-colors"
          >
            <CheckBadgeIcon className="w-3.5 h-3.5" />
            Mark as Accepted
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function DoubtDetailPage() {
  const { questionId } = useParams();
  const queryClient = useQueryClient();
  const [answerBody, setAnswerBody] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['question', questionId],
    queryFn: () => getQuestionDetail(questionId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['question', questionId] });

  const answerMutation = useMutation({
    mutationFn: (body) => createAnswer(questionId, body),
    onSuccess: () => {
      setAnswerBody('');
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });

  const upvoteQMutation = useMutation({ mutationFn: () => upvoteQuestion(questionId), onSuccess: invalidate });
  const upvoteAMutation = useMutation({ mutationFn: (answerId) => upvoteAnswer(answerId), onSuccess: invalidate });
  const acceptMutation = useMutation({
    mutationFn: (answerId) => markAcceptedAnswer(answerId),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });

  function handleSubmitAnswer(e) {
    e.preventDefault();
    if (!answerBody.trim()) return;
    answerMutation.mutate(answerBody.trim());
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-32 bg-white border border-neutral-200 rounded-lg shadow-card" />
        <div className="h-24 bg-white border border-neutral-200 rounded-lg shadow-card" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-neutral-500">Couldn't load this question.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
        >
          Retry
        </button>
      </div>
    );
  }

  const { question, answers } = data;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Link
        to="/doubts"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-800 hover:text-primary-900 transition-colors self-start"
      >
        ← Back to Questions
      </Link>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-5 sm:p-6 flex flex-col gap-4" data-testid="question-detail">
        <div className="flex items-start gap-3">
          <Avatar name={question.authorName} avatarUrl={question.authorAvatarUrl} />
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-lg sm:text-xl font-bold text-neutral-900">{question.title}</h1>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 text-xs text-neutral-500">
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
        </div>

        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{question.body}</p>

        <button
          type="button"
          onClick={() => upvoteQMutation.mutate()}
          data-testid="question-upvote"
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors self-start"
        >
          <ThumbsUpIcon className="w-3.5 h-3.5" />
          {question.upvoteCount} Upvote{question.upvoteCount === 1 ? '' : 's'}
        </button>
      </div>

      <div>
        <h2 className="font-heading text-base font-bold text-neutral-900 mb-3">
          {answers.length} Answer{answers.length === 1 ? '' : 's'}
        </h2>
        {answers.length === 0 ? (
          <p className="text-sm text-neutral-500">No answers yet — be the first to help out.</p>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-3">
            {answers.map((a) => (
              <AnswerCard
                key={a._id}
                answer={a}
                canAccept={question.isOwnQuestion}
                onUpvote={(id) => upvoteAMutation.mutate(id)}
                onAccept={(id) => acceptMutation.mutate(id)}
              />
            ))}
          </motion.div>
        )}
      </div>

      <form
        onSubmit={handleSubmitAnswer}
        className="bg-white border border-neutral-200 rounded-lg shadow-card p-4 sm:p-5 flex flex-col gap-3"
      >
        <label className="text-sm font-semibold text-neutral-700">Answer this question</label>
        <textarea
          value={answerBody}
          onChange={(e) => setAnswerBody(e.target.value)}
          rows={4}
          placeholder="Share what you know — code snippets, explanations, or links all help."
          data-testid="answer-body-input"
          className="w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
        />
        <button
          type="submit"
          disabled={answerMutation.isPending || !answerBody.trim()}
          data-testid="submit-answer"
          className="rounded-md px-5 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed self-start"
        >
          {answerMutation.isPending ? 'Posting...' : 'Post Answer'}
        </button>
      </form>
    </div>
  );
}
