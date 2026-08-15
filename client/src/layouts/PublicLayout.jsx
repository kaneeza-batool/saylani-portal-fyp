import { Link } from 'react-router-dom';
import AnimatedOutlet from '../components/AnimatedOutlet';

export default function PublicLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-neutral-50 font-sans">
      <header className="bg-navy-900 border-b-2 border-gold-500 sticky top-0 z-10">
        <div className="max-w-[1000px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/careers" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="TITAN" className="w-9 h-9 object-contain" />
            <div>
              <div className="font-heading font-bold text-body text-gold-400 leading-tight">TITAN</div>
              <div className="text-[10px] text-navy-200 leading-tight">Careers</div>
            </div>
          </Link>
          <div className="flex items-center gap-5">
            <Link to="/careers" className="text-caption font-semibold text-navy-100 hover:text-gold-400 transition-colors">
              All Openings
            </Link>
            <Link to="/careers/status" className="text-caption font-semibold text-navy-100 hover:text-gold-400 transition-colors">
              Check Status
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1000px] w-full mx-auto px-6 py-10">
        <AnimatedOutlet />
      </main>

      <footer className="border-t border-neutral-200 py-6">
        <div className="max-w-[1000px] mx-auto px-6 text-center text-caption text-neutral-400">
          TITAN — Taj Institute of Technology &amp; Applied Networks
        </div>
      </footer>
    </div>
  );
}
