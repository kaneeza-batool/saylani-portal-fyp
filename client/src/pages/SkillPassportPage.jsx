import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getSkillPassport } from '../services/skillPassportService';
import { fadeInUp, staggerContainer, cardInteraction } from '../lib/motionVariants';
import { BriefcaseIcon, CheckBadgeIcon, ClockIcon, CertificateIcon } from '../components/icons';

function CourseRow({ course }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 border-b border-neutral-100 last:border-b-0"
    >
      <span
        className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
          course.completed ? 'bg-success-bg text-success-text' : 'bg-neutral-100 text-neutral-400'
        }`}
      >
        {course.completed ? <CheckBadgeIcon className="w-4.5 h-4.5" /> : <ClockIcon className="w-4.5 h-4.5" />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900">{course.courseName}</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          {course.completed ? `Completed · Grade ${course.finalGrade}` : `In progress · ${course.progressPercent}%`}
        </p>
      </div>

      {course.certificateId && (
        <Link
          to={`/certificate/${course.courseId}`}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold bg-primary-800 text-white hover:bg-primary-900 transition-colors shrink-0"
        >
          <CertificateIcon className="w-3.5 h-3.5" />
          View Certificate
        </Link>
      )}
    </motion.div>
  );
}

function SkillPill({ skill }) {
  return (
    <motion.span
      variants={fadeInUp}
      className="inline-flex items-center rounded-pill px-3 py-1.5 text-sm font-semibold bg-accent-100 text-accent-800"
    >
      {skill}
    </motion.span>
  );
}

export default function SkillPassportPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['skill-passport'],
    queryFn: getSkillPassport,
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center gap-2">
        <BriefcaseIcon className="w-5 h-5 text-primary-800" />
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900">Skill Passport</h1>
      </div>
      <p className="text-sm text-neutral-500 -mt-3">
        A lifetime summary across every course you've taken at TITAN — grades, certificates, and skills earned.
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="h-40 bg-white border border-neutral-200 rounded-lg shadow-card animate-pulse" />
          <div className="h-32 bg-white border border-neutral-200 rounded-lg shadow-card animate-pulse" />
        </div>
      ) : isError ? (
        <div className="py-16 text-center flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-neutral-500">Couldn't load your skill passport.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="bg-primary-900 text-white rounded-2xl p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
            <div>
              <p className="text-accent-400 text-sm font-semibold uppercase tracking-wide">{data.studentName}</p>
              <h2 className="font-heading text-2xl font-bold mt-1">Student Passport</h2>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="font-heading text-3xl font-bold">{data.completedCount}</p>
                <p className="text-xs text-white/50 mt-0.5">Courses Completed</p>
              </div>
              <div>
                <p className="font-heading text-3xl font-bold">{data.certificateCount}</p>
                <p className="text-xs text-white/50 mt-0.5">Certificates Earned</p>
              </div>
              <div>
                <p className="font-heading text-3xl font-bold">{data.skills.length}</p>
                <p className="text-xs text-white/50 mt-0.5">Skills</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-neutral-200">
              <h3 className="font-heading text-lg font-bold text-neutral-900">Courses</h3>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {data.courses.map((c) => (
                <CourseRow key={c.courseId} course={c} />
              ))}
            </motion.div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-5 sm:p-6">
            <h3 className="font-heading text-lg font-bold text-neutral-900 mb-4">Skills</h3>
            {data.skills.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Skills appear here once you complete a course — nothing completed yet.
              </p>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-wrap gap-2">
                {data.skills.map((s) => (
                  <SkillPill key={s} skill={s} />
                ))}
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
