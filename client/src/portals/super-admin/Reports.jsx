import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchReportSummary } from '../../services/reportsService';
import ExportButtons from '../../components/ExportButtons';
import {
  GraduationCapIcon,
  TeacherIcon,
  CampusIcon,
  BookIcon,
  BriefcaseIcon,
  ClipboardIcon,
  JobPostingIcon,
  CalendarIcon,
} from '../../components/icons';

const TOTAL_CARDS = [
  { key: 'students', label: 'Students', Icon: GraduationCapIcon, bg: 'bg-success-bg', color: 'text-success-text' },
  { key: 'trainers', label: 'Trainers', Icon: TeacherIcon, bg: 'bg-info-bg', color: 'text-info-text' },
  { key: 'campuses', label: 'Campuses', Icon: CampusIcon, bg: 'bg-warning-bg', color: 'text-warning-text' },
  { key: 'courses', label: 'Courses', Icon: BookIcon, bg: 'bg-success-bg', color: 'text-success-text' },
  { key: 'employers', label: 'Employers', Icon: BriefcaseIcon, bg: 'bg-info-bg', color: 'text-info-text' },
  { key: 'quizzes', label: 'Quizzes', Icon: ClipboardIcon, bg: 'bg-warning-bg', color: 'text-warning-text' },
  { key: 'jobs', label: 'Job Postings', Icon: JobPostingIcon, bg: 'bg-success-bg', color: 'text-success-text' },
  { key: 'slots', label: 'Total Slots', Icon: CalendarIcon, bg: 'bg-info-bg', color: 'text-info-text' },
];

const STUDENT_STATUS_LABEL = { enrolled: 'Enrolled', pending: 'Pending', completed: 'Completed', dropout: 'Dropout' };
const EMPLOYER_STATUS_LABEL = { pending: 'Pending', verified: 'Verified', rejected: 'Rejected' };

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

function BreakdownCard({ title, data, labels }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  return (
    <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3.5">
      <div className="font-heading font-bold text-h6 text-neutral-900">{title}</div>
      {Object.keys(labels).map((key) => {
        const count = data[key] || 0;
        const pct = Math.round((count / total) * 100);
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-neutral-600">{labels[key]}</span>
              <span className="text-caption text-neutral-400 font-normal">{count}</span>
            </div>
            <div className="h-[7px] rounded-pill bg-neutral-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-pill bg-gradient-to-r from-gold-500 to-gold-600"
              />
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

export default function Reports() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['reports-summary'], queryFn: fetchReportSummary });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="bg-surface border border-neutral-200 rounded-xl p-5 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] text-body-sm text-danger-600">
        Couldn't load the report summary. Please try again.
      </div>
    );
  }

  const { totals, studentsByStatus, employersByStatus } = data;

  const exportRows = [
    ...TOTAL_CARDS.map((c) => ({ category: 'Totals', metric: c.label, value: totals[c.key] ?? 0 })),
    ...Object.keys(STUDENT_STATUS_LABEL).map((key) => ({
      category: 'Students by Status',
      metric: STUDENT_STATUS_LABEL[key],
      value: studentsByStatus[key] || 0,
    })),
    ...Object.keys(EMPLOYER_STATUS_LABEL).map((key) => ({
      category: 'Employers by Verification',
      metric: EMPLOYER_STATUS_LABEL[key],
      value: employersByStatus[key] || 0,
    })),
  ];
  const exportColumns = [
    { header: 'Category', accessor: (r) => r.category },
    { header: 'Metric', accessor: (r) => r.metric },
    { header: 'Value', accessor: (r) => r.value },
  ];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="font-heading font-bold text-h5 text-neutral-900">Reports Overview</div>
        <ExportButtons title="Reports Overview" filenameBase="titan-reports" columns={exportColumns} rows={exportRows} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOTAL_CARDS.map((c) => (
          <motion.div key={c.key} variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-overline uppercase text-neutral-500">{c.label}</span>
              <div className={`w-[34px] h-[34px] rounded flex items-center justify-center ${c.bg} ${c.color}`}>
                <c.Icon width="17" height="17" />
              </div>
            </div>
            <div className="font-heading text-h3 text-neutral-900">{(totals[c.key] ?? 0).toLocaleString()}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownCard title="Students by Status" data={studentsByStatus} labels={STUDENT_STATUS_LABEL} />
        <BreakdownCard title="Employers by Verification Status" data={employersByStatus} labels={EMPLOYER_STATUS_LABEL} />
      </div>
    </motion.div>
  );
}
