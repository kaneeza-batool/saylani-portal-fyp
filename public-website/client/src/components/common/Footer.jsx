import { Link } from 'react-router-dom';
import titanLogo from '../../assets/titan-logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="text-white border-t bg-primary-800" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Column 1: Brand Info */}
          <div className="space-y-5">
            <Link to="/" className="flex items-center gap-3 no-underline">
              <img src={titanLogo} alt="TITAN crest" className="h-14 w-auto" />
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-white m-0 leading-none">TITAN</span>
                <span className="text-[9px] font-bold tracking-[0.25em] uppercase mt-1 leading-none text-accent-500">
                  Taj Institute of Technology &amp; Applied Networks
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed opacity-75 pr-4">
              TITAN trains students in Sukkur & Karachi for real, hands-on tech careers. Live classes, real projects, and direct connections to hiring companies. No fluff, no wasted semesters.
            </p>
          </div>

          {/* Column 2: Academic Tracks */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-6 text-accent-500">Programs</h4>
            <ul className="space-y-3 p-0 list-none text-sm">
              <li><Link to="/programs" className="text-white/80 hover:text-white no-underline transition-colors">Web Development</Link></li>
              <li><Link to="/programs" className="text-white/80 hover:text-white no-underline transition-colors">AI &amp; Data Science</Link></li>
              <li><Link to="/programs" className="text-white/80 hover:text-white no-underline transition-colors">View All Programs</Link></li>
              <li><Link to="/apply" className="text-white/80 hover:text-white no-underline transition-colors">Apply Now</Link></li>
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-6 text-accent-500">Quick Navigation</h4>
            <ul className="space-y-3 p-0 list-none text-sm">
              <li><Link to="/campuses" className="text-white/80 hover:text-white no-underline transition-colors">Our Campuses</Link></li>
              <li><Link to="/success-stories" className="text-white/80 hover:text-white no-underline transition-colors">Success Stories & Alumni</Link></li>
              <li><Link to="/about" className="text-white/80 hover:text-white no-underline transition-colors">About the Institute</Link></li>
              <li><Link to="/contact" className="text-white/80 hover:text-white no-underline transition-colors">Contact Us</Link></li>
              <li><Link to="/verify" className="text-white/80 hover:text-white no-underline transition-colors">Verify Certificate</Link></li>
            </ul>
          </div>

          {/* Column 4: Get In Touch */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-6 text-accent-500">Get In Touch</h4>
            <ul className="space-y-4 p-0 list-none text-sm text-white/80">
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 mt-0.5 flex-shrink-0 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Saylani TITAN Sukkur Campus, Military Road, Sukkur, Sindh</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 mt-0.5 flex-shrink-0 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Saylani TITAN Zamzama Campus, DHA Phase V, Karachi</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+92118848261" className="text-white/80 hover:text-white no-underline transition-colors">111-848-261 (UAN)</a>
              </li>
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:admissions@titaninstitute.pk" className="text-white/80 hover:text-white no-underline transition-colors">admissions@titaninstitute.pk</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Section: Copyright & Legal */}
        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-xs opacity-60" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <p>&copy; {currentYear} Taj Institute of Technology and Applied Networks (TITAN). All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link to="/privacy-policy" className="text-white/60 hover:text-white no-underline hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="text-white/60 hover:text-white no-underline hover:underline">Terms of Service</Link>
            <Link to="/registry" className="text-white/60 hover:text-white no-underline hover:underline">Academic Registry</Link>
            <Link to="/admin/login" className="text-white/30 hover:text-white/60 no-underline text-[11px]">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
