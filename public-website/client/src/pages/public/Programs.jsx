import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollToTopButton from '../../components/common/ScrollToTopButton';
import Card from '../../components/common/Card';
import CourseCard from '../../components/common/CourseCard';
import SectionHeading from '../../components/common/SectionHeading';
import useCourses from '../../hooks/useCourses';
import { fadeInUp, staggerContainer, revealOnScroll } from '../../utils/motionVariants';

/* ============================================================
   TITAN — Heavy Programs & Dynamic Faculty Tracks Catalog
   Theme: TITAN Navy / Gold Brand Palette
   ============================================================ */

const TABS = [
  { id: 'all', label: 'All Tracks' },
  { id: 'basic', label: 'Basic Computer Operations' },
  { id: 'web', label: 'Web Engineering' },
  { id: 'data', label: 'Data Intelligence' },
  { id: 'cloud', label: 'Cloud Infrastructure' },
  { id: 'security', label: 'Networking & Security' },
  { id: 'creative', label: 'Creative Assets' },
  { id: 'vocational', label: 'Vocational Skills' },
];

const Programs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { courses, loading, error } = useCourses();

  const filteredTracks = courses.filter(track => {
    const matchesTab = activeTab === 'all' || track.category === activeTab;
    const normSearch = searchQuery.toLowerCase();
    const matchesSearch = track.title.toLowerCase().includes(normSearch) ||
                          track.tags.toLowerCase().includes(normSearch) ||
                          track.languages.some(l => l.toLowerCase().includes(normSearch)) ||
                          track.tools.some(t => t.toLowerCase().includes(normSearch));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="relative bg-neutral-50 antialiased selection:bg-neutral-500/20 pt-16">
      {/* ================= 1. ASYMMETRIC PREMIUM HERO SECTION ================= */}
      <section className="relative min-h-[70vh] flex items-center bg-white overflow-hidden border-b border-neutral-100 py-16 lg:py-1">
        {/* Elite Ambient Glassmorphic Background Glows (No cheap dots) */}
        <motion.div
          className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-accent-50/30 to-info-bg/20 rounded-full blur-3xl pointer-events-none -z-10"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-to-bl from-neutral-100 via-accent-50/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* Subtle Decorative Technical SVG Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-30 -z-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <line x1="10%" y1="0" x2="10%" y2="100%" stroke="#E4E1DA" strokeWidth="0.5" />
            <line x1="45%" y1="0" x2="45%" y2="100%" stroke="#E4E1DA" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#E4E1DA" strokeWidth="0.5" />
          </svg>
        </div>

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          animate="show"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10"
        >
          {/* Asymmetric Assembled Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">

            {/* LEFT SIDE: Mega Bold Title & Micro Tags */}
            <div className="lg:col-span-7 space-y-6">
              {/* Ultra-Clean Tech Pill Badge */}
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-bold tracking-wider uppercase te-mono bg-neutral-50 border border-neutral-200/70 text-neutral-900 rounded-full shadow-xs select-none">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
                </span>
                <span>Faculty Architecture Core v2.4</span>
              </motion.div>

              {/* Bold Asymmetric Heading */}
              <motion.h1 variants={fadeInUp} className="te-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-primary-900 leading-[1.12]">
                Skills That Change <br />
                Your Life. <span className="bg-gradient-to-r from-accent-600 via-primary-800 to-primary-900 bg-clip-text text-transparent">Learn From The Best</span>
              </motion.h1>

              {/* Context Floating Graphic SVG Component (Abstract Tech Node) */}
              <motion.div variants={fadeInUp} className="hidden sm:flex items-center gap-4 pt-4 text-neutral-300">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="animate-spin-slow">
                  <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="20" cy="20" r="6" fill="#CEA45C" fillOpacity="0.1" stroke="#CEA45C" strokeWidth="1.5" />
                </svg>
                <div className="h-px w-24 bg-gradient-to-r from-neutral-200 to-transparent" />
                <span className="te-mono text-[10px] text-neutral-400 font-medium uppercase tracking-widest">
                  Industrial Matrix Setup
                </span>
              </motion.div>
            </div>

            {/* RIGHT SIDE: Supporting Description, Premium Action Block & Compact Live Search */}
            <div className="lg:col-span-5 lg:pt-10 space-y-8">
              {/* Clean Editorial Description */}
              <motion.p variants={fadeInUp} className="te-body text-neutral-600 text-sm sm:text-base font-normal leading-relaxed border-l-2 border-accent-500/40 pl-4">
                From core operations to deep stack web routing, explore our industrial production pipelines. Isolate specific functional curriculum blocks instantly by typing tags like <span className="text-neutral-900 font-semibold underline decoration-accent-200 decoration-2">Web Engineering</span>, <span className="text-neutral-900 font-semibold underline decoration-accent-200 decoration-2">Python</span>, or <span className="text-neutral-900 font-semibold underline decoration-accent-200 decoration-2">Figma</span>.
              </motion.p>

              {/* High-Fidelity Floating Search Bar & Filter Summary */}
              <motion.div variants={fadeInUp} className="space-y-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-neutral-100 to-accent-50/50 rounded-2xl blur-md opacity-40 group-focus-within:opacity-100 transition-opacity duration-300" />

                  <div className="relative bg-white border border-neutral-200/90 rounded-xl shadow-xs group-focus-within:border-neutral-900 group-focus-within:shadow-md transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-neutral-900 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>

                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search basic operations, engineering..."
                      className="w-full pl-11 pr-20 py-3.5 bg-transparent text-neutral-900 text-xs sm:text-sm font-normal focus:outline-none placeholder:text-neutral-300 transition-all"
                    />

                    <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-neutral-50 border border-neutral-100 rounded text-[9px] text-neutral-400 font-medium te-mono select-none">
                      <span>Ctrl K</span>
                    </div>
                  </div>
                </div>

                {/* Minimalist Catalog Counter Indicator */}
                <div className="flex items-center justify-between text-[11px] te-mono text-neutral-400 font-bold px-1">
                  <span className="uppercase tracking-wider">Catalog Integration:</span>
                  <span className="text-neutral-900 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={filteredTracks.length}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="inline-block"
                      >
                        {filteredTracks.length} Active Tracks
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </div>

                {/* Quiz prompt — surfaced before scrolling through the full grid */}
                <Link
                  to="/find-your-path"
                  className="group flex items-center justify-between gap-3 px-4 py-3 bg-accent-50 border border-accent-200 rounded-xl no-underline hover:bg-accent-100 hover:border-accent-300 transition-all"
                >
                  <span className="flex items-center gap-2 text-xs sm:text-sm font-bold text-accent-800">
                    <span>🎯</span>
                    <span>Not sure which program fits? Take our 2-minute quiz</span>
                  </span>
                  <span className="shrink-0 te-mono text-[11px] font-bold text-accent-700 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </motion.div>

            </div>

          </div>
        </motion.div>
      </section>

      {/* ================= 2. CATEGORY TAB SWITCHER ================= */}
      <section className="py-5 bg-white border-b border-neutral-50 sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-nowrap overflow-x-auto pb-2 sm:pb-0 sm:justify-center gap-2 scrollbar-none">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors border ${
                  activeTab === tab.id
                    ? 'border-primary-900 text-white'
                    : 'bg-neutral-50/30 border-neutral-100 text-neutral-900 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="active-category-pill"
                    className="absolute inset-0 bg-primary-900 rounded-lg shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 3. ADVANCED COURSE CARD GRID ================= */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-neutral-100 animate-pulse">
                  <div className="h-44 bg-neutral-100" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 w-3/4 bg-neutral-100 rounded" />
                    <div className="h-4 w-1/4 bg-neutral-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-center py-16 text-sm text-danger-text">{error}</p>
          ) : (
            <AnimatePresence mode="wait">
              {filteredTracks.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16 border border-dashed border-neutral-200 rounded-2xl max-w-md mx-auto"
                >
                  <span className="text-2xl">🔍</span>
                  <h3 className="te-display font-bold text-neutral-900 mt-3">No matching tracks found</h3>
                  <p className="te-body text-neutral-900/60 text-xs mt-1">Try searching for alternative terms or check your category filters.</p>
                  <button onClick={() => { setActiveTab('all'); setSearchQuery(''); }} className="mt-4 px-4 py-2 bg-neutral-50 text-neutral-900 font-bold text-xs rounded-lg border-none hover:bg-neutral-100 cursor-pointer transition-colors">Reset Filters</button>
                </motion.div>
              ) : (
                <motion.div
                  key={`${activeTab}-${searchQuery}`}
                  variants={staggerContainer(0.06)}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {filteredTracks.map(track => (
                    <motion.div key={track._id} variants={fadeInUp}>
                      <CourseCard track={track} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}

        </div>
      </section>

      {/* ================= QUIZ ENTRY BANNER ================= */}
      <section className="py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...revealOnScroll} variants={fadeInUp} whileHover={{ scale: 1.01 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
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
          </motion.div>
        </div>
      </section>

      {/* ================= 4. RE-ENGINEERED HYBRID LEARNING SYSTEM ================= */}
      <section className="py-16 bg-neutral-50/10 border-t border-b border-neutral-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...revealOnScroll} variants={fadeInUp}>
            <SectionHeading
              wrapperClassName="text-center max-w-2xl mx-auto mb-10"
              eyebrow="Flexible Class Setup"
              eyebrowClassName="te-mono text-xs font-bold bg-neutral-50 text-neutral-900 border border-neutral-100 px-3 py-1 rounded-full uppercase"
              title="Choose How You Want to Learn"
              titleClassName="te-display text-2xl font-bold text-neutral-900 mt-3"
              description="We provide premium, identical educational standards for both learning environments. Every lecture includes modern live instructions, actual practical code challenges, and absolute mentor support."
              descriptionClassName="te-body text-xs sm:text-sm text-neutral-900/60 mt-1.5"
            />
          </motion.div>

          <motion.div {...revealOnScroll} variants={staggerContainer(0.15)} className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Online Portal Block */}
            <motion.div variants={fadeInUp} whileHover={{ y: -4 }} transition={{ duration: 0.25 }}>
              <Card className="bg-white border border-neutral-100/60 p-6 rounded-xl shadow-xs hover:shadow-lg transition-shadow duration-300 flex gap-4 items-start h-full">
                <div className="text-2xl bg-info-bg text-info-text p-3 rounded-lg shrink-0">🌐</div>
                <div>
                  <h3 className="te-display text-base font-bold text-neutral-900">Live Interactive Online Classes</h3>
                  <p className="te-body text-xs text-neutral-900/70 mt-1 leading-relaxed">
                    Learn from home with live interactive streaming portals. No boring pre-recorded video loops. You can ask doubts directly from live teachers, solve problems in real-time, and submit digital code assignments weekly.
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* On-Campus Block */}
            <motion.div variants={fadeInUp} whileHover={{ y: -4 }} transition={{ duration: 0.25 }}>
              <Card className="bg-white border border-neutral-100/60 p-6 rounded-xl shadow-xs hover:shadow-lg transition-shadow duration-300 flex gap-4 items-start h-full">
                <div className="text-2xl bg-success-bg text-success-text p-3 rounded-lg shrink-0">🟢</div>
                <div>
                  <h3 className="te-display text-base font-bold text-neutral-900">On-Campus Physical Lab Training</h3>
                  <p className="te-body text-xs text-neutral-900/70 mt-1 leading-relaxed">
                    Join our modern local tech hub nodes. Get dedicated, high-speed physical workstations, sit face-to-face with industry specialists, work collaboratively on development tasks, and practice real coding protocols.
                  </p>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Reusable Floating Scroll to Top Component Integration */}
      <ScrollToTopButton />
    </div>
  );
};

export default Programs;
