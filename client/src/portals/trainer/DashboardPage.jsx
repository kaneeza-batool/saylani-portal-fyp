import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Layout/content sourced from the "MY BATCHES DASHBOARD" section of
// TITAN Trainer Portal.html — a 2-col grid of batch cards, each with a
// progress ring and two quick actions. No backend yet, so this is
// dummy data shaped like what /trainer/dashboard will eventually return.
const RING_RADIUS = 21;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const MY_BATCHES = [
  { id: 1, course: 'Web Development', batchNum: 'B-24', schedule: 'Mon, Wed, Fri · 10:00 AM', students: 32, pct: 68 },
  { id: 2, course: 'Graphic Designing', batchNum: 'B-19', schedule: 'Tue, Thu · 2:00 PM', students: 27, pct: 45 },
  { id: 3, course: 'Digital Marketing', batchNum: 'B-31', schedule: 'Mon, Wed · 4:00 PM', students: 24, pct: 82 },
  { id: 4, course: 'Cloud Computing', batchNum: 'B-08', schedule: 'Sat, Sun · 11:00 AM', students: 19, pct: 30 },
];

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

function ProgressRing({ pct }) {
  const offset = RING_CIRCUMFERENCE * (1 - pct / 100);
  return (
    <div className="relative w-[52px] h-[52px] shrink-0">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={RING_RADIUS} fill="none" stroke="#EEF2EE" strokeWidth="6" />
        <circle
          cx="26"
          cy="26"
          r={RING_RADIUS}
          fill="none"
          stroke="#2F6FE4"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 26 26)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-neutral-900">{pct}%</div>
    </div>
  );
}

function BatchCard({ batch }) {
  const navigate = useNavigate();

  return (
    <motion.div variants={fadeInUp} className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-heading font-bold text-h6 text-neutral-900">{batch.course}</div>
          <div className="text-caption text-neutral-400 font-normal mt-0.5">
            Batch {batch.batchNum} · {batch.schedule}
          </div>
        </div>
        <ProgressRing pct={batch.pct} />
      </div>

      <div className="flex items-center gap-1.5 text-body-sm text-neutral-600">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A9A93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8" r="3" />
          <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
        </svg>
        {batch.students} students
      </div>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => navigate('/trainer/attendance')}
          className="flex-1 border-none bg-royal-500 text-white text-caption font-semibold px-3 py-[9px] rounded cursor-pointer transition-colors hover:bg-royal-600"
        >
          Mark Attendance
        </button>
        <button
          type="button"
          onClick={() => navigate('/trainer/quizzes')}
          className="flex-1 border border-neutral-300 bg-white text-neutral-900 text-caption font-semibold px-3 py-[9px] rounded cursor-pointer transition-colors hover:bg-neutral-100 hover:border-neutral-400"
        >
          Create Quiz
        </button>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-4">
      {MY_BATCHES.map((batch) => (
        <BatchCard key={batch.id} batch={batch} />
      ))}
    </motion.div>
  );
}
