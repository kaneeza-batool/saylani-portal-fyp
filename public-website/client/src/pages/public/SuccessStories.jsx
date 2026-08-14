import { Link } from 'react-router-dom';
import useAOS from '../../hooks/useAOS';
import AnimatedCounter from '../../components/common/AnimatedCounter';
import ScrollToTopButton from '../../components/common/ScrollToTopButton';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import SectionHeading from '../../components/common/SectionHeading';
import { TESTIMONIALS, OUTCOME_STYLES } from '../../data/testimonials';

/* ============================================================
   TITAN — Success Stories Page
   Theme: TITAN Navy / Gold Brand Palette
   ============================================================ */

// --- HERO ---
const Hero = () => (
  <section className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-neutral-50 via-white to-neutral-50/30 text-neutral-900 border-b border-neutral-100">
    <div className="absolute inset-0 pointer-events-none opacity-[0.4]"
         style={{ backgroundImage: 'radial-gradient(#E4E1DA 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <Badge className="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1.5 text-accent-700 bg-accent-50 border border-accent-200 rounded-full">
        Successful Alumni
      </Badge>
      <h1 className="te-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary-900 leading-[1.15] mt-6">
        Real Students. <br />
        <span className="bg-gradient-to-r from-accent-600 via-accent-400 to-accent-700 bg-clip-text text-transparent">
          Real Outcomes.
        </span>
      </h1>
      <p className="te-body mt-6 text-base sm:text-lg leading-relaxed text-neutral-600 max-w-2xl mx-auto font-normal">
        From first jobs to freelance careers to launching their own businesses, here's what happens after TITAN.
      </p>
    </div>
  </section>
);

// --- STATS STRIP ---
const StatsStrip = () => {
  const [ref, aosClass] = useAOS();
  const stats = [
    { target: '600+', label: 'Students Trained' },
    { target: '70%', label: 'Job Placement Rate' },
    { target: '12+', label: 'Expert Mentors & Instructors' },
    { target: '24', label: 'Weeks In Our Flagship Program' },
  ];
  return (
    <div ref={ref} className={`border-b border-neutral-100 bg-white transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x-0 lg:divide-x divide-neutral-100">
          {stats.map((s, i) => (
            <div key={i} className="text-center px-4 space-y-2">
              <div className="te-display text-3xl sm:text-4xl font-extrabold text-neutral-900">
                <AnimatedCounter target={s.target} />
              </div>
              <div className="te-mono text-xs font-bold tracking-wider text-neutral-500 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- TESTIMONIAL GRID ---
const TestimonialGrid = () => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-24 bg-neutral-50/50 border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="In Their Own Words"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-neutral-400"
          title="What Our Graduates Say"
          titleClassName="te-display text-3xl sm:text-4xl font-bold text-neutral-900 mt-3"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <Card key={idx} className="p-7 bg-white border border-neutral-200/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div>
                <Badge className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${OUTCOME_STYLES[t.outcomeColor]}`}>
                  {t.outcome}
                </Badge>
                <p className="te-body text-sm text-neutral-600 leading-relaxed mt-4">&ldquo;{t.quote}&rdquo;</p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100">
                <h4 className="te-display text-base font-bold text-neutral-900">{t.name}</h4>
                <p className="te-mono text-xs text-accent-600 font-semibold mt-0.5">{t.program} · {t.batch}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- VERIFY CALLOUT ---
const VerifyCallout = () => (
  <section className="py-16 bg-white border-b border-neutral-100">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="p-6 border border-neutral-200 bg-neutral-50/40 flex items-start gap-3 rounded-xl">
        <span className="text-xl">🔒</span>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Employers: every TITAN certificate is digitally verifiable. Confirm a graduate's certificate is genuine in seconds.{' '}
          <Link to="/verify" className="font-semibold text-primary-800 hover:text-primary-900">Verify a certificate →</Link>
        </p>
      </Card>
    </div>
  </section>
);

// --- BOTTOM CTA ---
const BottomCTA = () => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-24 bg-neutral-50 text-center transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2 className="te-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">Your Story Could Be Next</h2>
        <p className="te-body mt-4 text-neutral-600 max-w-xl mx-auto text-sm sm:text-base">
          Join the next batch and start building the portfolio that gets you hired, freelancing, or launched.
        </p>
        <div className="mt-10 flex justify-center gap-5">
          <Link to="/apply" className="px-8 py-3.5 bg-primary-800 text-white font-bold text-sm rounded-lg hover:bg-primary-700 transition-all shadow-md no-underline">
            Enroll Now
          </Link>
        </div>
      </div>
    </section>
  );
};

// --- MAIN ASSEMBLER ---
const SuccessStories = () => (
  <div className="relative bg-neutral-50 antialiased selection:bg-accent-500/20">
    <Hero />
    <StatsStrip />
    <TestimonialGrid />
    <VerifyCallout />
    <BottomCTA />
    <ScrollToTopButton />
  </div>
);

export default SuccessStories;
