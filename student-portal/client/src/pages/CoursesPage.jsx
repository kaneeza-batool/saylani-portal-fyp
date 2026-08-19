import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getEnrolledCourses } from '../services/courseService';
import { fadeInUp, staggerContainer, cardInteraction } from '../lib/motionVariants';
import { SearchIcon } from '../components/icons';

function CourseCardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-5 sm:p-6 flex flex-col gap-4 animate-pulse">
      <div className="h-4 w-24 bg-neutral-200 rounded" />
      <div className="h-6 w-40 bg-neutral-200 rounded" />
      <div className="h-2 w-full bg-neutral-200 rounded-pill" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="h-8 bg-neutral-100 rounded" />
        <div className="h-8 bg-neutral-100 rounded" />
        <div className="h-8 bg-neutral-100 rounded" />
        <div className="h-8 bg-neutral-100 rounded" />
      </div>
      <div className="h-10 w-full bg-neutral-200 rounded-md" />
    </div>
  );
}

function CourseCard({ course, onViewDetails }) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={cardInteraction.whileHover}
      className="bg-white border border-neutral-200 rounded-lg shadow-card p-5 sm:p-6 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-pill px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-primary-100 text-primary-800">
            {course.category || course.name}
          </span>
          <h3 className="font-heading text-lg font-bold text-neutral-900 mt-2 truncate">{course.name}</h3>
        </div>
        <span className="inline-flex items-center rounded-pill px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-success-bg text-success-text shrink-0">
          Enrolled
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
          <span>Progress</span>
          <span className="font-semibold text-neutral-700">{course.progressPercent}%</span>
        </div>
        <div className="h-2 rounded-pill bg-neutral-100 overflow-hidden">
          <div
            className="h-full bg-accent-500 rounded-pill transition-all"
            style={{ width: `${Math.min(course.progressPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3 text-sm">
        <div>
          <p className="text-xs text-neutral-400">Batch</p>
          <p className="font-medium text-neutral-800 truncate">{course.batch}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Roll No.</p>
          <p className="font-medium text-neutral-800 truncate">{course.rollNumber}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Campus</p>
          <p className="font-medium text-neutral-800 truncate">{course.campus}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">City</p>
          <p className="font-medium text-neutral-800 truncate">{course.city}</p>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={() => onViewDetails(course._id)}
        whileTap={{ scale: 0.97 }}
        className="mt-1 rounded-md px-4 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 transition-colors"
      >
        View Details
      </motion.button>
    </motion.div>
  );
}

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const {
    data: courses,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['courses'],
    queryFn: getEnrolledCourses,
  });

  const filtered = (courses || []).filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));

  function handleViewDetails() {
    navigate('/dashboard');
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full rounded-md border border-neutral-300 pl-10 pr-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </div>
      ) : isError ? (
        <div className="py-16 text-center flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-neutral-500">Couldn't load your courses.</p>
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
            {courses?.length ? 'No courses match your search.' : "You're not enrolled in any courses yet."}
          </p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {filtered.map((course) => (
            <CourseCard key={course._id} course={course} onViewDetails={handleViewDetails} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
