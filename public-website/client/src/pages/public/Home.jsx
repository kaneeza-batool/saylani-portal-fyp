import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAOS from '../../hooks/useAOS';
import useCourses from '../../hooks/useCourses';
import AnimatedCounter from '../../components/common/AnimatedCounter';
import ScrollToTopButton from '../../components/common/ScrollToTopButton';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import SectionHeading from '../../components/common/SectionHeading';
import { CATEGORY_LABELS } from '../../data/categoryLabels';
import resolveImageUrl from '../../utils/resolveImageUrl';

/* ============================================================
   TITAN — Simple, Beautiful & Clean Home Page
   Theme: TITAN Navy / Gold Brand Palette (Premium Light Look)
   ============================================================ */

// --- HERO SECTION (Updated to Premium Light with Rich SVGs) ---
const Hero = () => (
  <section className="relative py-28 lg:py-36 overflow-hidden bg-gradient-to-b from-neutral-50 via-white to-neutral-50/30 text-neutral-900 border-b border-neutral-100">
    {/* Subtle Premium Background Dot Mesh */}
    <div className="absolute inset-0 pointer-events-none opacity-[0.4]"
         style={{ backgroundImage: 'radial-gradient(#E4E1DA 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />

    {/* Rich Abstract Background Layer Visuals */}
    <svg className="absolute inset-0 w-full h-full hidden xl:block pointer-events-none" viewBox="0 0 1200 500" preserveAspectRatio="none">
      {/* 1. The Animated Tech Wave Line */}
      <path d="M -50 300 C 200 180, 450 390, 750 210 S 1100 120, 1250 280" fill="none" stroke="#CEA45C" strokeWidth="1.2" strokeDasharray="5 7" className="te-trace" opacity="0.45" />
      <circle cx="750" cy="210" r="4.5" fill="#D5B476" className="te-node" style={{ animationDelay: '1.5s' }} />
      <circle cx="1100" cy="120" r="4" fill="#97682B" className="te-node" style={{ animationDelay: '2.1s' }} />

      {/* 2. Top-Right Radial Ring Tech Accents */}
      <g opacity="0.3" className="te-float" style={{ transformOrigin: '1050px 100px' }}>
        <circle cx="1050" cy="100" r="80" fill="none" stroke="#C5C5C5" strokeWidth="1" />
        <circle cx="1050" cy="100" r="120" fill="none" stroke="#C5C5C5" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="1050" cy="100" r="4" fill="#CEA45C" />
      </g>

      {/* 3. Left Mid Floating Cross Grids */}
      <g opacity="0.25" className="te-float" style={{ animationDelay: '2s', transformOrigin: '120px 180px' }}>
        <path d="M 110 180 L 130 180 M 120 170 L 120 190" stroke="#667085" strokeWidth="2" />
        <path d="M 170 240 L 190 240 M 180 230 L 180 250" stroke="#CEA45C" strokeWidth="1.5" />
      </g>
    </svg>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <div className="max-w-4xl mx-auto">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold mb-8 uppercase te-mono border border-accent-200 bg-accent-50 text-accent-700 rounded-full shadow-sm">
          <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
          Learn IT Skills &amp; Get Job Placement
        </span>

        <h1 className="te-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary-900 leading-[1.15]">
          Learn Modern IT Skills &amp; <br />
          <span className="bg-gradient-to-r from-accent-600 via-accent-400 to-accent-700 bg-clip-text text-transparent">
            Start Your Successful Career.
          </span>
        </h1>

        <p className="te-body mt-6 text-base sm:text-lg leading-relaxed text-neutral-600 max-w-2xl mx-auto font-normal">
          We help students learn professional computer skills that companies are looking for. We teach you step-by-step from zero and connect you directly with tech companies for real jobs.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-5">
          <Link to="/apply" className="px-8 py-3.5 bg-primary-800 text-white font-bold text-sm rounded-lg hover:bg-primary-700 transition-all shadow-md shadow-primary-800/10 active:scale-95 no-underline">
            Apply Online Now
          </Link>
          <Link to="/programs" className="px-8 py-3.5 border border-neutral-200 bg-white text-neutral-700 font-bold text-sm rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-all active:scale-95 no-underline shadow-sm">
            View All Courses
          </Link>
        </div>

        <Link
          to="/find-your-path"
          aria-label="Take the Find Your Path quiz"
          className="group mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-50 border border-accent-200 text-accent-700 text-sm font-bold no-underline hover:bg-accent-100 hover:border-accent-300 transition-all"
        >
          <span>🎯</span>
          <span>Not sure where to start? Take our 2-minute quiz</span>
          <span className="transform group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </div>
  </section>
);

// --- STATS BAR ---
const StatsBar = () => {
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

// --- HOW IT WORKS ---
const WhyTitan = () => {
  const [ref, aosClass] = useAOS();
  const points = [
    { title: 'Live Interactive Classes', desc: 'No boring old videos. You will learn directly from live teachers in real-time, write code together, and get answers to your questions instantly.' },
    { title: 'Practical Coursework', desc: 'We skip useless old theories. We only teach you the actual software, tools, and coding practices that companies use today to do real work.' },
    { title: 'Direct Job Interviews', desc: 'Forget sending hundreds of resumes. Once you complete your training, our placement team schedules your job interviews directly with companies.' },
  ];
  return (
    <section ref={ref} className={`py-24 bg-neutral-50/50 border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Simple 3-Step Process"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1 bg-accent-50 text-accent-700 border border-accent-200 rounded-md"
          title="How We Help You Grow"
          titleClassName="te-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mt-4"
          description="A clear and reliable plan to take you from a student to a working IT professional."
          descriptionClassName="te-body mt-3 text-neutral-500 text-sm sm:text-base"
        />

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="hidden md:block absolute left-0 right-0 top-12 h-0.5 border-t border-dashed border-neutral-200 pointer-events-none z-0" />
          {points.map((p, idx) => (
            <Card key={idx} className="relative z-10 p-8 bg-white border border-neutral-200/80 rounded-xl shadow-sm hover:border-accent-500 hover:shadow-md transition-all duration-300 group">
              <div className="te-mono h-10 w-10 font-bold text-sm flex items-center justify-center mb-6 text-white bg-primary-800 rounded-lg group-hover:bg-accent-500 group-hover:text-primary-900 transition-colors">
                0{idx + 1}
              </div>
              <h3 className="te-display text-lg font-bold mb-3 text-neutral-900">{p.title}</h3>
              <p className="te-body text-sm leading-relaxed text-neutral-600 font-normal">{p.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- FEATURED PROGRAMS ---
const FeaturedPrograms = () => {
  const [ref, aosClass] = useAOS();
  const { courses } = useCourses();

  // Curated spread across web/data/cloud when available, falling back to
  // the first 3 active courses so the section is never empty.
  const curated = ['web', 'data', 'cloud']
    .map((cat) => courses.find((c) => c.category === cat))
    .filter(Boolean);
  const tracks = curated.length > 0 ? curated : courses.slice(0, 3);

  return (
    <section ref={ref} className={`py-24 bg-white border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 gap-6">
          <div>
            <Badge className="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1 text-accent-700 bg-accent-50 border border-accent-200 rounded-md">Trending Classes</Badge>
            <h2 className="te-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mt-4">Our Most Popular Courses</h2>
          </div>
          <Link to="/programs" className="te-body text-sm font-bold text-accent-600 hover:text-accent-700 flex items-center gap-1 group no-underline transition-colors">
            View All Available Courses <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tracks.map((t) => (
            <Card key={t._id} className="flex flex-col justify-between bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-accent-500 transition-all duration-300 group">
              <Link to={`/programs/${t.slug}`} className="relative h-48 overflow-hidden bg-neutral-100 block no-underline">
                <img src={resolveImageUrl(t.img)} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </Link>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <Badge className="te-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 text-accent-800 bg-accent-50 border border-accent-200 rounded">
                    {CATEGORY_LABELS[t.category] || t.category}
                  </Badge>
                  <h3 className="te-display text-xl font-bold mt-4 mb-3 text-neutral-900 leading-snug">
                    <Link to={`/programs/${t.slug}`} className="no-underline text-inherit hover:text-primary-800 transition-colors">{t.title}</Link>
                  </h3>
                  <p className="te-body text-sm text-neutral-600 font-normal leading-relaxed">{t.desc}</p>
                </div>
                <div className="mt-8 pt-5 border-t border-neutral-100 flex justify-between items-center text-xs font-bold text-neutral-500">
                  <Badge className="te-mono bg-neutral-50 fuel-badge px-2 py-1 rounded border border-neutral-100">{t.duration}</Badge>
                  <Link to={`/apply?program=${t._id}`} className="no-underline text-accent-600 hover:text-accent-700 transition-colors font-bold flex items-center gap-1">
                    Book Seat Now &rarr;
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- FIND YOUR PATH QUIZ BANNER ---
const QuizBanner = () => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-16 bg-white transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/find-your-path"
          className="group flex flex-col sm:flex-row items-center justify-between gap-4 no-underline p-6 sm:p-7 bg-primary-900 rounded-2xl overflow-hidden relative"
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <span className="text-3xl">🧭</span>
            <div>
              <h3 className="te-display text-lg sm:text-xl font-bold text-white">Not sure which program is right for you?</h3>
              <p className="te-body text-xs sm:text-sm text-white/60 mt-1">Take our 2-minute quiz and get a personalized recommendation.</p>
            </div>
          </div>
          <span className="shrink-0 relative z-10 px-6 py-3 bg-accent-500 text-primary-900 font-bold text-sm rounded-lg group-hover:bg-accent-400 transition-colors">
            Find Your Path →
          </span>
        </Link>
      </div>
    </section>
  );
};

// --- TIMELINE SECTION ---
const TimelineSection = () => {
  const [ref, aosClass] = useAOS();
  const steps = [
    { title: '1. Basic Online Entry Test', desc: 'Fill out a simple online application form and pass our easy entry test to check your basic computer knowledge.' },
    { title: '2. 1-Year Practical Learning', desc: 'Join our interactive classrooms to build real projects, clear quizzes, and do continuous practice for 12 months.' },
    { title: '3. Resume Sharing & Interviews', desc: 'Your final student profile, projects, and test scores are shared directly with HR managers in our partner companies.' }
  ];
  return (
    <section ref={ref} className={`py-24 bg-primary-900 text-white border-b border-primary-800 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Step-By-Step Journey"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-accent-400"
          title="Your Pathway from Admission to Job"
          titleClassName="te-display text-3xl sm:text-4xl font-bold mt-4"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
          {steps.map((s, idx) => (
            <Card key={idx} className="relative p-6 border border-primary-800 bg-primary-900/40 rounded-xl">
              <div className="absolute -top-6 left-6 te-mono h-12 w-12 rounded-full border border-accent-500/30 bg-primary-800 flex items-center justify-center font-bold text-accent-400 text-lg shadow-md shadow-accent-500/10">
                {idx + 1}
              </div>
              <h3 className="te-display text-lg font-bold mt-4 mb-2 text-white">{s.title}</h3>
              <p className="te-body text-sm text-neutral-400 leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- TESTIMONIALS ---
const Testimonials = () => {
  const reviews = [
    { name: 'Muhammad Saad', role: 'Cloud Support Engineer', text: 'Mujhe classes bohot acchi lagein kyunke sab kuch practical tha pehle hafte se. Maine real systems par live kaam kiya jiss se mujhe interview clear karne mein kafi madad mili.' },
    { name: 'Muhammad Fasih', role: 'Data Analyst', text: 'Maine pehle youtube videos se seekhne ki koshish ki thi par concepts samajh nahi aate thay. Yahan live teachers aur daily tasks ki wajah se cheezein bohot simple ho gaein.' },
    { name: 'Ayesha Khan', role: 'Frontend Web Developer', text: 'Yahan ka system baqi institutes se bilkul alag hai. Inki placement team ne mera interview direct top software house mein karwaya aur meri selection ho gayi.' },
    { name: 'Zainab Malik', role: 'Backend Developer', text: 'Mujhe pehle coding se dar lagta tha lekin yahan ke teachers ne bilkul zero level se sikhaya. Aaj main aik acchi company mein as a professional kaam kar rahi hoon.' },
  ];

  const infiniteReviews = [...reviews, ...reviews];

  return (
    <section className="py-24 bg-white border-b border-neutral-100 overflow-hidden">
      <SectionHeading
        wrapperClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center"
        eyebrow="Successful Alumni"
        eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-neutral-400"
        title="What Our Graduates Say"
        titleClassName="te-display text-3xl sm:text-4xl font-bold text-neutral-900 mt-3"
      />

      <div className="w-full relative">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-autoplay space-x-6 py-4">
          {infiniteReviews.map((r, i) => (
            <Card key={i} className="w-[380px] shrink-0 p-8 bg-neutral-50 border border-neutral-200/60 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <p className="te-body text-sm text-neutral-600 leading-relaxed font-normal">&ldquo;{r.text}&rdquo;</p>
              <div className="mt-6 pt-4 border-t border-neutral-200/60">
                <h4 className="te-display text-base font-bold text-neutral-900">{r.name}</h4>
                <p className="te-mono text-xs text-accent-600 font-semibold mt-0.5">{r.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- BRAND LOGO NETWORKS ---
const PartnersSection = () => (
  <section className="py-16 bg-neutral-50/50 border-b border-neutral-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <p className="te-mono text-xs font-bold text-neutral-400 uppercase tracking-widest mb-8">The Kind Of Roles Our Graduates Train For</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-center opacity-60">
        <div className="font-extrabold te-display text-neutral-700 text-lg tracking-wider">Web Developer</div>
        <div className="font-extrabold te-display text-neutral-700 text-lg tracking-wider">Data Analyst</div>
        <div className="font-extrabold te-display text-neutral-700 text-lg tracking-wider">AI/ML Engineer</div>
        <div className="font-extrabold te-display text-neutral-700 text-lg tracking-wider">Software QA</div>
      </div>
    </div>
  </section>
);

// --- CAMPUS HUBS ---
const CampusesGrid = () => {
  const [ref, aosClass] = useAOS();
  const hubs = [
    { city: 'Sukkur Campus', location: 'Saylani TITAN Sukkur Campus, Sindh', details: 'Our founding campus, with live classes, computer labs, and mentors on-site every batch day.' },
    { city: 'Karachi Campus', location: 'Saylani TITAN Zamzama Campus, DHA Phase V', details: 'Our second campus, serving Clifton and DHA residents. The same live curriculum and mentor support as Sukkur.' },
    { city: 'Hybrid & Online', location: 'Join From Anywhere', details: 'Attend live online classes and do practical work from home, with full access to recordings.' },
    { city: 'Expanding Soon', location: 'More Cities Announced', details: "We've grown steadily since 2025, with TITAN expansion announced for more cities across Pakistan." },
  ];
  return (
    <section ref={ref} className={`py-24 bg-white border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <SectionHeading
          wrapperClassName=""
          eyebrow="Our Campuses"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1 text-info-text bg-info-bg border border-info-text/30 rounded-md"
          title="Sukkur & Karachi, Open To Everyone"
          titleClassName="te-display text-3xl sm:text-4xl font-bold text-neutral-900 mt-4"
          description="We train students on-site at our Sukkur and Karachi campuses, and online across the rest of Pakistan. Same live classes, same mentors, same outcomes either way."
          descriptionClassName="te-body text-neutral-500 max-w-xl mx-auto mt-3 text-sm sm:text-base"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 text-left">
          {hubs.map((h, idx) => (
            <Card key={idx} className="p-8 bg-neutral-50/50 border border-neutral-200 rounded-xl shadow-sm hover:bg-white hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="te-mono text-xs font-semibold text-neutral-400 uppercase">0{idx + 1}</span>
                <span className="text-accent-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                </span>
              </div>
              <h3 className="te-display text-xl font-bold text-neutral-900 mt-3">{h.city}</h3>
              <p className="te-body text-sm text-accent-600 font-semibold mt-1">{h.location}</p>
              <p className="te-body text-sm text-neutral-500 mt-4 border-t pt-4 border-neutral-200/60">{h.details}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- VISION SECTION ---
const VisionSection = () => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-24 bg-neutral-50/50 border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          wrapperClassName="text-center max-w-3xl mx-auto mb-16"
          eyebrow="Our Main Goals"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-accent-600"
          title="We Build Real Professional Success Stories"
          titleClassName="te-display text-3xl sm:text-4xl font-bold text-neutral-900 mt-4"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8 border border-neutral-200 rounded-2xl bg-white shadow-sm hover:border-accent-500 transition-colors">
            <h3 className="te-display text-xl font-bold text-neutral-900">
              <AnimatedCounter target="100%" /> Hands-On, Project-Based Learning
            </h3>
            <p className="te-body text-sm text-neutral-600 leading-relaxed mt-3">
              No filler lectures. Every module ends with something real you built yourself. You do not need any previous software experience or science background to get started.
            </p>
          </Card>
          <Card className="p-8 border border-neutral-200 rounded-2xl bg-white shadow-sm hover:border-accent-500 transition-colors">
            <h3 className="te-display text-xl font-bold text-neutral-900">
              Modern Tools, Real Company Workflows
            </h3>
            <p className="te-body text-sm text-neutral-600 leading-relaxed mt-3">
              We teach the same tools, frameworks, and version-control habits used on real dev teams, so what you learn in class works on your first day at a job.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

// --- FAQ SECTION ---
const FAQSection = () => {
  const [ref, aosClass] = useAOS();
  const [openIdx, setOpenIdx] = useState(null);

  const faqs = [
    { q: 'Are there separate class timings for working professionals?', a: 'Yes! For students who attend university or work daytime jobs, we offer dedicated evening schedules and weekend computer lab access.' },
    { q: 'What happens if a student falls behind on assignments or quizzes?', a: 'We do not leave anyone behind. If you face difficulties with a practical task, our assigned mentors provide personal guidance sessions to help you catch up.' },
    { q: 'Is it mandatory for online students to visit the physical campus?', a: 'Not at all. Online students can complete their entire training from home. Physical branches are completely optional and open for students who want to practice on campus with peers.' },
    { q: 'Do I need to own a personal laptop for this training program?', a: 'If you are learning completely online from home, a basic laptop is required for practice. However, if you choose on-campus learning, you can use our high-speed computer labs completely free.' },
    { q: 'Will I receive an official certificate upon completing the course?', a: 'Yes, after successfully completing your training, projects, and final test, you will be awarded an industry-recognized professional certificate valid across the corporate sector.' },
    { q: 'Can students from non-technical backgrounds (Commerce/Arts) apply?', a: 'Absolutely! Most of our students come from non-tech backgrounds. We start our lessons from absolute zero, teaching basic logic and workflows before moving to advanced development.' }
  ];

  return (
    <section ref={ref} className={`py-24 bg-white border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          wrapperClassName="text-center mb-16"
          eyebrow="Common Doubts"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-neutral-400"
          title="Frequently Asked Questions"
          titleClassName="te-display text-3xl font-bold text-neutral-900 mt-3"
        />
        <div className="space-y-4">
          {faqs.map((f, idx) => (
            <div key={idx} className="border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50/50">
              <button onClick={() => setOpenIdx(openIdx === idx ? null : idx)} className="w-full p-6 text-left font-bold text-neutral-900 flex justify-between items-center te-display text-base transition-colors hover:bg-neutral-100/50">
                <span>{f.q}</span>
                <span className="text-accent-600 font-mono text-xl">{openIdx === idx ? '−' : '+'}</span>
              </button>
              {openIdx === idx && (
                <div className="p-6 pt-0 border-t border-neutral-200 bg-white te-body text-sm text-neutral-600 leading-relaxed">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- BOTTOM CTA ---
const BottomCTA = () => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-24 bg-neutral-50 text-center transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2 className="te-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">Start Your Professional Career Today</h2>
        <p className="te-body mt-4 text-neutral-600 max-w-xl mx-auto text-sm sm:text-base">
          Join thousands of smart students who have changed their lives by learning real practical software skills. Admission lines are open.
        </p>
        <div className="mt-10 flex justify-center gap-5">
          <Link to="/apply" className="px-8 py-3.5 bg-primary-800 text-white font-bold text-sm rounded-lg hover:bg-primary-700 transition-all shadow-md no-underline">
            Apply Online Now
          </Link>
          <Link to="/contact" className="px-8 py-3.5 border border-neutral-300 bg-white text-neutral-800 font-bold text-sm rounded-lg hover:bg-neutral-50 no-underline">
            Talk to Admissions Team
          </Link>
        </div>
      </div>
    </section>
  );
};

// --- MAIN ASSEMBLER ---
const Home = () => (
  <div className="relative bg-neutral-50 antialiased selection:bg-accent-500/20">
    <Hero />
    <StatsBar />
    <WhyTitan />
    <FeaturedPrograms />
    <QuizBanner />
    <TimelineSection />
    <Testimonials />
    <PartnersSection />
    <CampusesGrid />
    <VisionSection />
    <FAQSection />
    <BottomCTA />
    <ScrollToTopButton />
  </div>
);

export default Home;
