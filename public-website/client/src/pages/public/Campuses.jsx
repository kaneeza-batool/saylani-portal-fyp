import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAOS from '../../hooks/useAOS';
import ScrollToTopButton from '../../components/common/ScrollToTopButton';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import SectionHeading from '../../components/common/SectionHeading';

/* ============================================================
   TITAN — Campuses Page
   Theme: TITAN Navy / Gold Brand Palette
   ============================================================ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5200';

// Marketing copy only — curated per city, kept separate from the DB record
// (name/address/status) so this page can never show a campus that doesn't
// really exist or hide one that does. Any campus without an entry here
// (e.g. a newly-added city) still renders, just with generic copy instead
// of a hand-written blurb.
const CAMPUS_COPY = {
  Sukkur: {
    eyebrow: 'Original Campus',
    description:
      "Our founding campus, where TITAN opened its doors in 2025. Live classrooms, hands-on computer labs, and the mentors who'll help you land your first tech job all come together here.",
  },
  Karachi: {
    eyebrow: 'Karachi Campus',
    description:
      'Our Karachi campus, serving Clifton and DHA residents. The same live curriculum, mentor support, and hands-on lab time as Sukkur, right in the heart of Zamzama Commercial.',
  },
};

const DEFAULT_FACILITIES = [
  'Dedicated computer labs with high-speed internet',
  'Live classroom spaces for every batch',
  'On-site mentors available during class hours',
  'Free lab access for students without a personal laptop',
];

function toCampusView(campus) {
  const copy = CAMPUS_COPY[campus.city] || {};
  return {
    id: campus._id,
    eyebrow: copy.eyebrow || campus.city,
    name: campus.name,
    addressLine: campus.address || `${campus.city}, Pakistan — contact us for the exact address`,
    description: copy.description || `Our ${campus.city} campus — live classes, hands-on labs, and mentor support on-site.`,
    facilities: DEFAULT_FACILITIES,
    mapSrc: `https://www.google.com/maps?q=${encodeURIComponent(campus.address || `${campus.name}, ${campus.city}`)}&output=embed`,
  };
}

// --- HERO ---
const Hero = () => (
  <section className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-neutral-50 via-white to-neutral-50/30 text-neutral-900 border-b border-neutral-100">
    <div className="absolute inset-0 pointer-events-none opacity-[0.4]"
         style={{ backgroundImage: 'radial-gradient(#E4E1DA 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <Badge className="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1.5 text-info-text bg-info-bg border border-info-text/30 rounded-full">
        Our Campuses
      </Badge>
      <h1 className="te-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary-900 leading-[1.15] mt-6">
        Sukkur &amp; Karachi, <br />
        <span className="bg-gradient-to-r from-accent-600 via-accent-400 to-accent-700 bg-clip-text text-transparent">
          With More Cities Coming.
        </span>
      </h1>
      <p className="te-body mt-6 text-base sm:text-lg leading-relaxed text-neutral-600 max-w-2xl mx-auto font-normal">
        We train students on-site at our Sukkur and Karachi campuses, and online across the rest of Pakistan. Same live classes, same mentors, same outcomes either way.
      </p>
    </div>
  </section>
);

// --- ONE CAMPUS BLOCK ---
const CampusBlock = ({ campus, reversed }) => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-16 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          {/* Photo placeholder */}
          <Card className={`relative h-72 lg:h-full min-h-[320px] rounded-2xl overflow-hidden border border-neutral-200 bg-gradient-to-br from-primary-800 via-primary-900 to-neutral-900 flex flex-col items-center justify-center text-center p-8 ${reversed ? 'lg:order-2' : 'lg:order-1'}`}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CEA45C" strokeWidth="1.5" className="opacity-80">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
            <p className="te-mono text-xs font-bold tracking-widest uppercase text-accent-400 mt-4">Campus Photos Coming Soon</p>
            <p className="te-body text-xs text-neutral-300 mt-2 max-w-xs">We're putting together a proper photo tour of our labs and classrooms. Check back soon.</p>
          </Card>

          {/* Details */}
          <div className={reversed ? 'lg:order-1' : 'lg:order-2'}>
            <SectionHeading
              wrapperClassName=""
              eyebrow={campus.eyebrow}
              eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1 bg-accent-50 text-accent-700 border border-accent-200 rounded-md"
              title={campus.name}
              titleClassName="te-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-4"
            />
            <p className="te-mono text-xs font-bold text-neutral-500 uppercase tracking-wider mt-3">{campus.addressLine}</p>
            <p className="te-body text-sm text-neutral-600 leading-relaxed mt-4">
              {campus.description}
            </p>

            <div className="mt-6 space-y-2.5">
              {campus.facilities.map((f, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm text-neutral-700">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CEA45C" strokeWidth="3" className="mt-0.5 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-wrap gap-3">
              <Badge className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 text-success-text bg-success-bg border border-success-text/20 rounded">On-Campus Labs</Badge>
              <Badge className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 text-info-text bg-info-bg border border-info-text/20 rounded">Hybrid Friendly</Badge>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mt-10 rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
          <iframe
            title={`${campus.name} location`}
            src={campus.mapSrc}
            width="100%"
            height="360"
            style={{ border: 0 }}
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
};

// --- ALL CAMPUSES ---
const CampusesList = () => {
  const [campuses, setCampuses] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/campuses`)
      .then((res) => setCampuses((res.data.campuses || []).filter((c) => c.status !== 'inactive')))
      .catch(() => setCampuses([]));
  }, []);

  if (campuses === null) {
    return <div className="py-16 text-center text-sm text-neutral-400">Loading campuses…</div>;
  }
  if (campuses.length === 0) {
    return <div className="py-16 text-center text-sm text-neutral-400">Campus details are being updated — check back soon.</div>;
  }

  return (
    <div className="bg-white border-b border-neutral-100 divide-y divide-neutral-100">
      {campuses.map((campus, idx) => (
        <CampusBlock key={campus._id} campus={toCampusView(campus)} reversed={idx % 2 === 1} />
      ))}
    </div>
  );
};

// --- GROWING STEADILY ---
const GrowingSteadily = () => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-24 bg-primary-900 text-white border-b border-primary-800 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Badge className="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1 text-accent-400 border border-accent-500/30 rounded-full">
          Growing Steadily
        </Badge>
        <h2 className="te-display text-3xl sm:text-4xl font-bold mt-5">Growing Steadily Across Pakistan</h2>
        <p className="te-body mt-4 text-neutral-300 leading-relaxed max-w-2xl mx-auto text-sm sm:text-base">
          We're a young institute, founded in 2025, and we've grown from our original Sukkur campus to a second campus in Karachi's Zamzama Commercial Area. We've also announced plans to bring TITAN to more cities, including Quetta, Faisalabad, and Lahore, as those campuses are confirmed and ready. No shortcuts, no overpromising.
        </p>
      </div>
    </section>
  );
};

// --- ONLINE / HYBRID ---
const OnlineHybrid = () => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-24 bg-neutral-50/50 border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          wrapperClassName="text-center max-w-2xl mx-auto mb-14"
          eyebrow="Not Near Sukkur Or Karachi?"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-accent-600"
          title="Learn Online or Hybrid, From Anywhere"
          titleClassName="te-display text-3xl sm:text-4xl font-bold text-neutral-900 mt-4"
          description="Many of our courses are available both on-campus and online — ask your campus for current options."
          descriptionClassName="te-body text-neutral-500 max-w-xl mx-auto mt-3 text-sm sm:text-base"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white border border-neutral-100/60 p-6 rounded-xl shadow-xs flex gap-4 items-start">
            <div className="text-2xl bg-info-bg text-info-text p-3 rounded-lg shrink-0">🌐</div>
            <div>
              <h3 className="te-display text-base font-bold text-neutral-900">Live Interactive Online Classes</h3>
              <p className="te-body text-xs text-neutral-900/70 mt-1 leading-relaxed">
                Attend the exact same live classes from home. Ask questions in real time, submit assignments, and get the same mentor feedback as on-campus students.
              </p>
            </div>
          </Card>
          <Card className="bg-white border border-neutral-100/60 p-6 rounded-xl shadow-xs flex gap-4 items-start">
            <div className="text-2xl bg-success-bg text-success-text p-3 rounded-lg shrink-0">🟢</div>
            <div>
              <h3 className="te-display text-base font-bold text-neutral-900">Hybrid: Best of Both</h3>
              <p className="te-body text-xs text-neutral-900/70 mt-1 leading-relaxed">
                Join online for most classes and drop into a TITAN campus lab in Sukkur or Karachi whenever you want hands-on practice time or in-person mentor support.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

// --- BOTTOM CTA ---
const BottomCTA = () => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-24 bg-white text-center transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2 className="te-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">Whichever Way You Learn, Let's Start</h2>
        <p className="te-body mt-4 text-neutral-600 max-w-xl mx-auto text-sm sm:text-base">
          On-campus in Sukkur or Karachi, or online from anywhere in Pakistan. Enrollment is open for the next batch.
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
const Campuses = () => (
  <div className="relative bg-neutral-50 antialiased selection:bg-accent-500/20">
    <Hero />
    <CampusesList />
    <GrowingSteadily />
    <OnlineHybrid />
    <BottomCTA />
    <ScrollToTopButton />
  </div>
);

export default Campuses;
