import { Link } from 'react-router-dom';
import Badge from '../../components/common/Badge';

/* ============================================================
   TITAN — 404 Not Found
   Theme: TITAN Navy / Gold Brand Palette
   ============================================================ */

const NotFound = () => (
  <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-gradient-to-b from-neutral-50 via-white to-neutral-50/30">
    <div className="absolute inset-0 pointer-events-none opacity-[0.4]"
         style={{ backgroundImage: 'radial-gradient(#E4E1DA 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 py-24">
      <Badge className="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1.5 text-accent-700 bg-accent-50 border border-accent-200 rounded-full">
        404
      </Badge>
      <h1 className="te-display text-3xl sm:text-5xl font-extrabold tracking-tight text-primary-900 leading-[1.15] mt-6">
        This Page Wandered Off Campus.
      </h1>
      <p className="te-body mt-5 text-sm sm:text-base leading-relaxed text-neutral-600 max-w-lg mx-auto">
        The page you're looking for doesn't exist or may have moved. Let's get you back on track.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link to="/" className="px-7 py-3.5 bg-primary-900 text-white font-bold text-sm rounded-lg hover:bg-primary-800 transition-all shadow-md no-underline">
          Back To Home
        </Link>
        <Link to="/programs" className="px-7 py-3.5 border border-neutral-200 bg-white text-neutral-700 font-bold text-sm rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-all no-underline shadow-sm">
          Browse Programs
        </Link>
      </div>
    </div>
  </section>
);

export default NotFound;
