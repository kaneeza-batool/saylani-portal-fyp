import { Link } from 'react-router-dom';
import useAOS from '../../hooks/useAOS';
import AnimatedCounter from '../../components/common/AnimatedCounter';
import ScrollToTopButton from '../../components/common/ScrollToTopButton';
import Card from '../../components/common/Card';
import SectionHeading from '../../components/common/SectionHeading';

/* ============================================================
   TITAN — About Page
   Theme: TITAN Navy / Gold Brand Palette
   ============================================================ */

// --- HERO ---
const Hero = () => (
  <section className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-neutral-50 via-white to-neutral-50/30 text-neutral-900 border-b border-neutral-100">
    <div className="absolute inset-0 pointer-events-none opacity-[0.4]"
         style={{ backgroundImage: 'radial-gradient(#E4E1DA 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold mb-8 uppercase te-mono border border-accent-200 bg-accent-50 text-accent-700 rounded-full shadow-sm">
        <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
        Taj Institute of Technology and Applied Networks
      </span>
      <h1 className="te-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary-900 leading-[1.15]">
        We Turn Beginners Into <br />
        <span className="bg-gradient-to-r from-accent-600 via-accent-400 to-accent-700 bg-clip-text text-transparent">
          Job-Ready Developers.
        </span>
      </h1>
      <p className="te-body mt-6 text-base sm:text-lg leading-relaxed text-neutral-600 max-w-2xl mx-auto font-normal">
        TITAN is a hands-on tech training institute based in Sukkur, Sindh. We take students with zero coding background and turn them into job-ready developers and data professionals through live classes, real projects, and direct connections to hiring companies.
      </p>
    </div>
  </section>
);

// --- OUR STORY ---
const OurStory = () => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-24 bg-white border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <SectionHeading
            wrapperClassName=""
            eyebrow="Our Story"
            eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1 bg-accent-50 text-accent-700 border border-accent-200 rounded-md"
            title="Started in 2025, With One Goal"
            titleClassName="te-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mt-4"
          />
          <p className="te-body text-sm sm:text-base text-neutral-600 leading-relaxed mt-6">
            TITAN, the Taj Institute of Technology and Applied Networks, opened its doors in Sukkur in 2025. We saw too many talented students in the region with no clear, affordable path into tech careers, so we built one: live instructors, real projects, and a direct line to hiring companies, all under one roof.
          </p>
          <p className="te-body text-sm sm:text-base text-neutral-600 leading-relaxed mt-4">
            We're still young and growing on purpose. Every batch is small enough that mentors actually know your name, and every course is built around what companies are hiring for right now, not outdated theory.
          </p>
        </div>
        <Card className="p-8 bg-neutral-50/60 border border-neutral-200 rounded-2xl">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="te-display text-3xl font-extrabold text-primary-800"><AnimatedCounter target="2025" /></div>
              <div className="te-mono text-xs font-bold tracking-wider text-neutral-500 uppercase mt-1">Established</div>
            </div>
            <div>
              <div className="te-display text-3xl font-extrabold text-primary-800">2</div>
              <div className="te-mono text-xs font-bold tracking-wider text-neutral-500 uppercase mt-1">Campuses: Sukkur & Karachi</div>
            </div>
            <div>
              <div className="te-display text-3xl font-extrabold text-primary-800"><AnimatedCounter target="600+" /></div>
              <div className="te-mono text-xs font-bold tracking-wider text-neutral-500 uppercase mt-1">Students Trained</div>
            </div>
            <div>
              <div className="te-display text-3xl font-extrabold text-primary-800"><AnimatedCounter target="70%" /></div>
              <div className="te-mono text-xs font-bold tracking-wider text-neutral-500 uppercase mt-1">Job Placement Rate</div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

// --- MISSION & VALUES ---
const ValuesSection = () => {
  const [ref, aosClass] = useAOS();
  const values = [
    {
      title: 'Hands-On Learning',
      desc: 'No filler lectures. Every module ends with something real you built yourself, using the same tools professional developers use every day.',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
    },
    {
      title: 'Accessibility',
      desc: "You don't need a science background, a laptop, or prior coding experience to start. We teach from absolute zero and offer on-campus lab access for anyone who needs it.",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>,
    },
    {
      title: 'Real Career Outcomes',
      desc: "Training that doesn't lead to a job isn't training. It's a hobby. Our placement team works directly with hiring companies so your effort turns into an actual offer.",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
    },
    {
      title: 'Community Impact',
      desc: "We're based in Sukkur because talent isn't only in big cities. Every graduate who lands a remote or on-site tech job proves that to the next student who walks in.",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    },
  ];
  return (
    <section ref={ref} className={`py-24 bg-neutral-50/50 border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Mission & Values"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1 bg-accent-50 text-accent-700 border border-accent-200 rounded-md"
          title="What We Actually Care About"
          titleClassName="te-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mt-4"
          description="Four things that shape every decision we make, from curriculum design to who we hire as mentors."
          descriptionClassName="te-body mt-3 text-neutral-500 text-sm sm:text-base"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, idx) => (
            <Card key={idx} className="p-7 bg-white border border-neutral-200/80 rounded-xl shadow-sm hover:border-accent-500 hover:shadow-md transition-all duration-300">
              <div className="h-11 w-11 rounded-lg flex items-center justify-center text-primary-800 bg-accent-50 border border-accent-100">
                {v.icon}
              </div>
              <h3 className="te-display text-base font-bold mt-5 mb-2 text-neutral-900">{v.title}</h3>
              <p className="te-body text-sm leading-relaxed text-neutral-600 font-normal">{v.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- OUR APPROACH ---
const ApproachSection = () => {
  const [ref, aosClass] = useAOS();
  const points = [
    { title: 'Project-Based, Not Slide-Based', desc: 'You build real, working things from week one: a website, a data dashboard, a deployed app, not just watch slides about them.' },
    { title: 'Industry-Aligned Curriculum', desc: 'Course content is reviewed against what hiring companies actually ask for, so what you practice in the lab matches what you\'ll do on the job.' },
    { title: 'Small Batches, Real Mentorship', desc: 'Batches stay small on purpose. With 12+ mentors across our programs, you get direct feedback on your work instead of getting lost in a crowd.' },
  ];
  return (
    <section ref={ref} className={`py-24 bg-primary-900 text-white border-b border-primary-800 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Approach"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-accent-400"
          title="How We Actually Teach"
          titleClassName="te-display text-3xl sm:text-4xl font-bold mt-4"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {points.map((p, idx) => (
            <Card key={idx} className="p-6 border border-primary-800 bg-primary-900/40 rounded-xl">
              <div className="te-mono h-10 w-10 font-bold text-sm flex items-center justify-center mb-6 text-primary-900 bg-accent-500 rounded-lg">
                0{idx + 1}
              </div>
              <h3 className="te-display text-lg font-bold mb-3 text-white">{p.title}</h3>
              <p className="te-body text-sm leading-relaxed text-neutral-300">{p.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- INSTRUCTORS ---
const InstructorsSection = () => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-24 bg-white border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <SectionHeading
            wrapperClassName=""
            eyebrow="Our Instructors"
            eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1 text-info-text bg-info-bg border border-info-text/30 rounded-md"
            title="Taught By People Who Build Software For A Living"
            titleClassName="te-display text-3xl sm:text-4xl font-bold text-neutral-900 mt-4"
          />
          <p className="te-body text-sm sm:text-base text-neutral-600 leading-relaxed mt-6">
            Our 12+ mentors and instructors aren't career teachers reading from a textbook. They're working developers, data professionals, and engineers who teach because they want the next generation of Sukkur's tech talent to skip the mistakes they made.
          </p>
          <p className="te-body text-sm sm:text-base text-neutral-600 leading-relaxed mt-4">
            Every mentor is assigned to a small batch, reviews your actual project work, and stays reachable well past class hours.
          </p>
        </div>
        <Card className="p-8 bg-neutral-50/60 border border-neutral-200 rounded-2xl text-center">
          <div className="te-display text-5xl font-extrabold text-primary-800"><AnimatedCounter target="12+" /></div>
          <p className="te-mono text-xs font-bold tracking-wider text-neutral-500 uppercase mt-2">Expert Mentors &amp; Instructors</p>
          <div className="mt-6 pt-6 border-t border-neutral-200 text-left space-y-3">
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <span className="w-1.5 h-1.5 rounded-full bg-success-text shrink-0" /> Working developers &amp; data professionals
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <span className="w-1.5 h-1.5 rounded-full bg-success-text shrink-0" /> Assigned per-batch, not shared across hundreds
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <span className="w-1.5 h-1.5 rounded-full bg-success-text shrink-0" /> Review real project work, not just quizzes
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

// --- VERIFY CALLOUT (kept from earlier content-audit pass) ---
const VerifyCallout = () => (
  <section className="py-16 bg-neutral-50/50 border-b border-neutral-100">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="p-6 border border-neutral-200 bg-white flex items-start gap-3 rounded-xl">
        <span className="text-xl">🔒</span>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Every TITAN certificate is digitally verifiable. Employers and recruiters can confirm a graduate's certificate is genuine in seconds.{' '}
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
        <h2 className="te-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">Ready to Start Your Own Story?</h2>
        <p className="te-body mt-4 text-neutral-600 max-w-xl mx-auto text-sm sm:text-base">
          Explore our programs or apply directly. Admissions are open for the next batch.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-5">
          <Link to="/apply" className="px-8 py-3.5 bg-primary-800 text-white font-bold text-sm rounded-lg hover:bg-primary-700 transition-all shadow-md no-underline">
            Enroll Now
          </Link>
          <Link to="/programs" className="px-8 py-3.5 border border-neutral-300 bg-white text-neutral-800 font-bold text-sm rounded-lg hover:bg-neutral-50 no-underline">
            View Programs
          </Link>
        </div>
      </div>
    </section>
  );
};

// --- MAIN ASSEMBLER ---
const About = () => (
  <div className="relative bg-neutral-50 antialiased selection:bg-accent-500/20">
    <Hero />
    <OurStory />
    <ValuesSection />
    <ApproachSection />
    <InstructorsSection />
    <VerifyCallout />
    <BottomCTA />
    <ScrollToTopButton />
  </div>
);

export default About;
