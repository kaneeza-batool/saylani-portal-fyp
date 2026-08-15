import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import titanLogo from '../../assets/titan-logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Programs', path: '/programs' },
    { name: 'Campuses', path: '/campuses' },
    { name: 'Success Stories', path: '/success-stories' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const statusLinks = [
    { name: 'Find Your Path', path: '/find-your-path', desc: 'Not sure which program fits? Answer a few questions' },
    { name: 'Entry Test Status', path: '/entry-test-status', desc: 'Check your entry test schedule & outcome' },
    { name: 'Check Result', path: '/check-result', desc: 'Look up your academic exam results' },
    { name: 'Download ID Card', path: '/download-id-card', desc: 'Preview & download your student ID' },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-neutral-200 transition-all duration-300 bg-white/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 xl:px-8">
        <div className="flex justify-between h-20 items-center">

          {/* Logo and Titan Branding */}
          <div className="flex-shrink-0">
            <Link to="/" className="group flex items-center gap-3 no-underline">
              <img
                src={titanLogo}
                alt="TITAN crest"
                className="h-11 w-auto transform group-hover:scale-105 transition-transform duration-200"
              />
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-neutral-900 m-0 leading-none">TITAN</span>
                <span className="hidden xl:block text-[9px] font-medium tracking-[0.18em] text-neutral-600 uppercase mt-1 leading-none">
                  Taj Institute of Technology
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-semibold tracking-wide relative py-2 no-underline transition-colors duration-200 whitespace-nowrap ${
                    isActive ? 'text-accent-600' : 'text-neutral-900/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.name}
                    <span
                      className={`absolute bottom-0 left-0 w-full h-[2.5px] rounded-full transform origin-left transition-transform duration-300 bg-accent-600 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                    />
                  </>
                )}
              </NavLink>
            ))}

            {/* Student Tools Dropdown */}
            <div className="relative group py-2">
              <button type="button" className="flex items-center gap-1 text-sm font-semibold tracking-wide text-neutral-900/80 hover:text-accent-600 transition-colors duration-200 cursor-pointer bg-transparent border-none p-0 whitespace-nowrap">
                Student Tools
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 group-hover:rotate-180 transition-transform duration-200"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="w-72 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden">
                  {statusLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="block px-4 py-3 no-underline hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
                    >
                      <p className="text-sm font-bold text-neutral-900">{link.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{link.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Login / Apply Now Action Buttons */}
          <div className="hidden lg:flex items-center space-x-4 xl:space-x-5">
            <Link
              to="/login"
              className="text-sm font-bold no-underline transition-all duration-200 hover:opacity-80 text-neutral-900"
            >
              Login
            </Link>
            <Link
              to="/apply"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 active:scale-95 hover:brightness-110 bg-accent-600"
              style={{ borderRadius: 'var(--radius-standard)' }}
            >
              Apply Now
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle mobile menu"
              className="p-2 rounded-lg focus:outline-none text-primary-800"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-neutral-200 absolute top-full left-0 w-full shadow-lg px-6 pt-4 pb-8 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 text-base font-bold no-underline rounded-lg ${
                  isActive ? 'text-accent-600 bg-neutral-50' : 'text-neutral-900 bg-transparent'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}

          <div className="pt-4 mt-2 border-t border-neutral-200">
            <p className="px-3 text-xs font-bold uppercase tracking-widest text-neutral-400">Student Tools</p>
            {statusLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 text-base font-bold no-underline rounded-lg ${
                    isActive ? 'text-accent-600 bg-neutral-50' : 'text-neutral-900 bg-transparent'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          <div className="pt-6 border-t border-neutral-200 flex flex-col gap-3 mt-4">
            <Link to="/login" onClick={() => setIsOpen(false)} className="text-center py-2.5 text-base font-bold no-underline text-neutral-900">
              Login
            </Link>
            <Link to="/apply" onClick={() => setIsOpen(false)} className="text-center text-white py-3 font-bold no-underline bg-accent-600" style={{ borderRadius: 'var(--radius-standard)' }}>
              Apply Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
