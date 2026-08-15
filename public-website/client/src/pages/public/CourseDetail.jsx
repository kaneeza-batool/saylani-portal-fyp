import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import ScrollToTopButton from '../../components/common/ScrollToTopButton';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import SectionHeading from '../../components/common/SectionHeading';
import useAOS from '../../hooks/useAOS';
import useCourses from '../../hooks/useCourses';
import { CATEGORY_LABELS } from '../../data/categoryLabels';
import { getTestimonialByCategory, OUTCOME_STYLES } from '../../data/testimonials';

/* ============================================================
   TITAN — Course Detail Page (/programs/:slug)
   Theme: TITAN Navy / Gold Brand Palette
   ============================================================ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5200';

// Delivery mode and registration status vary by campus and aren't tracked
// per-course — see the audit note on the Course model — so the detail page
// shows one honest generic line (in DeliveryModeSection) instead of a
// status badge or hardcoded-campus mode cards.

// --- HERO ---
const Hero = ({ track }) => (
  <section className="relative py-16 lg:py-20 overflow-hidden bg-gradient-to-b from-neutral-50 via-white to-neutral-50/30 text-neutral-900 border-b border-neutral-100">
    <div className="absolute inset-0 pointer-events-none opacity-[0.4]"
         style={{ backgroundImage: 'radial-gradient(#E4E1DA 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <nav className="te-mono text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-6" aria-label="Breadcrumb">
        <Link to="/programs" className="hover:text-neutral-900 transition-colors no-underline text-neutral-400">Programs</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-600">{CATEGORY_LABELS[track.category]}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Badge className="te-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 text-white bg-primary-900 rounded border border-white/10">
          {CATEGORY_LABELS[track.category]}
        </Badge>
        <Badge className="te-mono text-[10px] font-bold px-2.5 py-1 text-neutral-900/80 bg-neutral-50 border border-neutral-100 rounded">
          {track.duration}
        </Badge>
        {track.codingRequired ? (
          <Badge className="inline-flex items-center gap-1 text-[10px] font-bold text-warning-text bg-warning-bg border border-warning-text/20 px-2.5 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-warning-text" /> Coding Required
          </Badge>
        ) : (
          <Badge className="inline-flex items-center gap-1 text-[10px] font-bold text-success-text bg-success-bg border border-success-text/20 px-2.5 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-success-text" /> No Coding Needed
          </Badge>
        )}
      </div>

      <h1 className="te-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-primary-900 leading-[1.15]">
        {track.title}
      </h1>
      <p className="te-body mt-5 text-base sm:text-lg leading-relaxed text-neutral-600 max-w-3xl font-normal">
        {track.tagline}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          to={`/apply?program=${track._id}`}
          className="px-7 py-3.5 font-bold text-sm rounded-lg text-center no-underline transition-all shadow-md bg-primary-900 text-white hover:bg-primary-800 shadow-primary-900/15"
        >
          Enroll Now →
        </Link>
        <span className="te-body text-xs text-neutral-500">{track.desc}</span>
      </div>
    </div>
  </section>
);

// --- WHAT YOU'LL LEARN ---
const CurriculumSection = ({ track }) => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-20 bg-white border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          wrapperClassName="max-w-2xl mb-12"
          eyebrow="Curriculum Outline"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-neutral-400"
          title="What You'll Learn"
          titleClassName="te-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-3"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {track.curriculum.map((mod, idx) => (
            <Card key={idx} className="p-6 bg-neutral-50/40 border border-neutral-100 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="te-mono text-xs font-bold text-white bg-primary-900 w-7 h-7 flex items-center justify-center rounded-full shrink-0">
                  {idx + 1}
                </span>
                <h3 className="te-display text-sm font-bold text-neutral-900">{mod.module}</h3>
              </div>
              <ul className="space-y-2 list-none p-0 m-0 pl-10">
                {mod.topics.map((topic, tIdx) => (
                  <li key={tIdx} className="flex items-start gap-2 text-xs text-neutral-600 font-medium leading-relaxed">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CEA45C" strokeWidth="3" className="mt-0.5 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- TOOLS & TECHNOLOGIES ---
const ToolsSection = ({ track }) => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-20 bg-neutral-50/50 border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          wrapperClassName="max-w-2xl mb-10"
          eyebrow="Hands-On With"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-neutral-400"
          title="Tools & Technologies"
          titleClassName="te-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-3"
        />
        <div className="flex flex-wrap gap-3">
          {track.languages.map((lang, idx) => (
            <Badge key={`lang-${idx}`} className="te-mono text-xs font-bold text-white bg-primary-900 px-4 py-2 rounded-lg">
              {lang}
            </Badge>
          ))}
          {track.tools.map((tool, idx) => (
            <Badge key={`tool-${idx}`} className="te-mono text-xs font-bold text-neutral-900 bg-white border border-neutral-200 px-4 py-2 rounded-lg shadow-xs">
              {tool}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- WHO THIS IS FOR ---
const WhoForSection = ({ track }) => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-20 bg-white border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <SectionHeading
              wrapperClassName="mb-5"
              eyebrow="Prerequisites"
              eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-neutral-400"
              title="Who This Is For"
              titleClassName="te-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-3"
            />
            <p className="te-body text-sm text-neutral-600 leading-relaxed">{track.idealFor}</p>
          </div>
          <Card className="p-6 bg-neutral-50/40 border border-neutral-100 rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">{track.codingRequired ? '💻' : '🙌'}</span>
              <div>
                <h4 className="te-display text-sm font-bold text-neutral-900">
                  {track.codingRequired ? 'Coding Required' : 'No Coding Needed'}
                </h4>
                <p className="te-body text-xs text-neutral-600 mt-1 leading-relaxed">
                  {track.codingRequired
                    ? 'This track involves writing real code. You\'ll be typing and debugging from early on.'
                    : 'This track is fully code-free. Every skill is taught through hands-on tools and interfaces.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 pt-4 border-t border-neutral-100">
              <span className="text-lg">📊</span>
              <div>
                <h4 className="te-display text-sm font-bold text-neutral-900">{track.duration} Program</h4>
                <p className="te-body text-xs text-neutral-600 mt-1 leading-relaxed">
                  Structured batch schedule with small, focused cohorts.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

// --- CAREER OUTCOMES ---
const CareerOutcomesSection = ({ track }) => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-20 bg-primary-900 text-white border-b border-primary-800 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="te-mono text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Where This Can Take You</p>
        <h2 className="te-display text-2xl sm:text-3xl font-bold">Career Outcomes</h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {track.careerOutcomes.map((role, idx) => (
            <div key={idx} className="px-6 py-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
              <span className="te-display font-extrabold text-white text-base tracking-wide">{role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- DELIVERY MODE ---
const DeliveryModeSection = ({ track }) => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-20 bg-white border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          wrapperClassName="max-w-2xl mb-10"
          eyebrow="Flexible Class Setup"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-neutral-400"
          title="Delivery Mode"
          titleClassName="te-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-3"
        />
        <Card className="p-6 bg-neutral-50/40 border border-neutral-100 rounded-xl">
          <p className="te-body text-sm text-neutral-600 leading-relaxed">
            Delivery mode and availability vary by campus. <Link to="/campuses" className="font-bold text-primary-800 hover:text-primary-900 no-underline">Contact your nearest campus</Link> or{' '}
            <Link to={`/apply?program=${track._id}`} className="font-bold text-primary-800 hover:text-primary-900 no-underline">Enroll Now</Link> for current details.
          </p>
        </Card>
      </div>
    </section>
  );
};

// --- MATCHING TESTIMONIAL ---
const TestimonialSection = ({ track }) => {
  const [ref, aosClass] = useAOS();
  const testimonial = getTestimonialByCategory(track.category);
  if (!testimonial) return null;
  return (
    <section ref={ref} className={`py-20 bg-neutral-50/50 border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          wrapperClassName="text-center max-w-xl mx-auto mb-10"
          eyebrow="From A Graduate"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-neutral-400"
          title="Hear From Someone Who's Been There"
          titleClassName="te-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-3"
        />
        <Card className="p-8 bg-white border border-neutral-200/80 rounded-xl shadow-sm">
          <Badge className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${OUTCOME_STYLES[testimonial.outcomeColor]}`}>
            {testimonial.outcome}
          </Badge>
          <p className="te-body text-sm text-neutral-600 leading-relaxed mt-4">&ldquo;{testimonial.quote}&rdquo;</p>
          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
            <div>
              <h4 className="te-display text-base font-bold text-neutral-900">{testimonial.name}</h4>
              <p className="te-mono text-xs text-accent-600 font-semibold mt-0.5">{testimonial.program} · {testimonial.batch}</p>
            </div>
            <Link to="/success-stories" className="te-mono text-[11px] font-bold text-primary-800 hover:text-primary-900 no-underline">
              More Stories →
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
};

// --- RELATED PROGRAMS ---
const RelatedProgramsSection = ({ track, allCourses }) => {
  const [ref, aosClass] = useAOS();
  const related = allCourses.filter((c) => c.category === track.category && c._id !== track._id).slice(0, 3);
  if (related.length === 0) return null;
  return (
    <section ref={ref} className={`py-20 bg-white border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          wrapperClassName="max-w-2xl mb-10"
          eyebrow={CATEGORY_LABELS[track.category]}
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-neutral-400"
          title="Related Programs"
          titleClassName="te-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-3"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {related.map((r) => (
            <Link
              key={r._id}
              to={`/programs/${r.slug}`}
              className="block p-6 bg-neutral-50/40 border border-neutral-100 rounded-xl hover:border-primary-600 hover:shadow-md transition-all duration-300 no-underline group"
            >
              <Badge className="te-mono text-[9px] font-bold uppercase tracking-wider px-2 py-1 text-neutral-900/80 bg-white border border-neutral-100 rounded">
                {r.duration}
              </Badge>
              <h3 className="te-display text-sm font-bold text-neutral-900 mt-3 group-hover:text-primary-800 transition-colors leading-snug">
                {r.title}
              </h3>
              <p className="te-body text-xs text-neutral-600 mt-2 leading-relaxed line-clamp-3">{r.tagline}</p>
              <span className="te-mono text-[10px] font-bold text-accent-600 mt-4 inline-block">View Details →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- BOTTOM CTA ---
const BottomCTA = ({ track }) => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-20 bg-neutral-50 text-center transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="te-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">Ready to Start {track.title}?</h2>
        <p className="te-body mt-3 text-neutral-600 text-sm sm:text-base">Seats are limited each batch. Apply now to reserve yours.</p>
        <div className="mt-8">
          <Link
            to={`/apply?program=${track._id}`}
            className="inline-block px-8 py-3.5 font-bold text-sm rounded-lg no-underline transition-all shadow-md bg-primary-800 text-white hover:bg-primary-700 shadow-primary-900/15"
          >
            Enroll Now
          </Link>
        </div>
      </div>
    </section>
  );
};

// --- STICKY PERSISTENT ENROLL BAR ---
const StickyEnrollBar = ({ track }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 480);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-neutral-200 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="te-display text-sm font-bold text-neutral-900 truncate">{track.title}</p>
          <p className="te-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{track.duration} · {CATEGORY_LABELS[track.category]}</p>
        </div>
        <Link
          to={`/apply?program=${track._id}`}
          className="shrink-0 px-5 py-2.5 font-bold text-xs rounded-lg no-underline transition-all shadow-sm bg-primary-900 text-white hover:bg-primary-800"
        >
          Enroll Now
        </Link>
      </div>
    </div>
  );
};

// --- NOT FOUND FALLBACK ---
const CourseNotFound = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-white">
    <div className="text-center px-6">
      <h1 className="te-display text-2xl font-bold text-neutral-900">Course Not Found</h1>
      <p className="te-body text-sm text-neutral-600 mt-2">We couldn't find a program matching that link.</p>
      <Link to="/programs" className="inline-block mt-6 px-6 py-3 bg-primary-900 text-white font-bold text-sm rounded-lg no-underline hover:bg-primary-800 transition-colors">
        Browse All Programs
      </Link>
    </div>
  </div>
);

// --- MAIN ASSEMBLER ---
const CourseDetail = () => {
  const { slug } = useParams();
  const [track, setTrack] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | found | not_found
  const { courses: allCourses } = useCourses();

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    axios
      .get(`${API_URL}/api/courses/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (cancelled) return;
        setTrack(res.data.course);
        setStatus('found');
      })
      .catch(() => {
        if (!cancelled) setStatus('not_found');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === 'loading') {
    return <div className="min-h-[60vh] flex items-center justify-center bg-white"><p className="text-sm text-neutral-500">Loading course...</p></div>;
  }
  if (status === 'not_found' || !track) return <CourseNotFound />;

  return (
    <div className="relative bg-neutral-50 antialiased selection:bg-accent-500/20 pb-16">
      <Hero track={track} />
      <CurriculumSection track={track} />
      <ToolsSection track={track} />
      <WhoForSection track={track} />
      <CareerOutcomesSection track={track} />
      <DeliveryModeSection track={track} />
      <TestimonialSection track={track} />
      <RelatedProgramsSection track={track} allCourses={allCourses} />
      <BottomCTA track={track} />
      <StickyEnrollBar track={track} />
      <ScrollToTopButton />
    </div>
  );
};

export default CourseDetail;
