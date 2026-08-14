import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAOS from '../../hooks/useAOS';
import ScrollToTopButton from '../../components/common/ScrollToTopButton';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import SectionHeading from '../../components/common/SectionHeading';

/* ============================================================
   TITAN — Contact Page
   Theme: TITAN Navy / Gold Brand Palette
   ============================================================ */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5200';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm = { name: '', email: '', subject: '', message: '' };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Full name is required.';
  if (!form.email.trim()) errors.email = 'Email address is required.';
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (!form.subject.trim()) errors.subject = 'Subject is required.';
  if (!form.message.trim()) errors.message = 'Message is required.';
  return errors;
}

// --- HERO ---
const Hero = () => (
  <section className="relative py-24 lg:py-28 overflow-hidden bg-gradient-to-b from-neutral-50 via-white to-neutral-50/30 text-neutral-900 border-b border-neutral-100">
    <div className="absolute inset-0 pointer-events-none opacity-[0.4]"
         style={{ backgroundImage: 'radial-gradient(#E4E1DA 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <Badge className="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1.5 text-accent-700 bg-accent-50 border border-accent-200 rounded-full">
        Get In Touch
      </Badge>
      <h1 className="te-display text-4xl sm:text-5xl font-extrabold tracking-tight text-primary-900 leading-[1.15] mt-6">
        We're Here To Help
      </h1>
      <p className="te-body mt-5 text-base sm:text-lg leading-relaxed text-neutral-600 max-w-xl mx-auto font-normal">
        Have questions about our programs, admissions, or how to apply? Send us a message and our admissions team will get back to you.
      </p>
    </div>
  </section>
);

// --- INFO + FORM ---
const ContactMain = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [serverError, setServerError] = useState('');

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus('submitting');
    setServerError('');
    try {
      await axios.post(`${API_URL}/api/contact`, form);
      setStatus('success');
      setForm(initialForm);
    } catch (err) {
      setStatus('error');
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  const infoItems = [
    {
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      label: 'Sukkur Campus',
      value: 'Saylani TITAN Sukkur Campus, Military Road, Sukkur, Sindh',
    },
    {
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      label: 'Karachi Campus',
      value: 'Saylani TITAN Zamzama Campus, DHA Phase V, Karachi',
    },
    {
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
      label: 'Phone',
      value: '111-848-261 (UAN)',
    },
    {
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
      label: 'Email',
      value: 'admissions@titaninstitute.pk',
    },
  ];

  return (
    <section className="py-20 bg-white border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Left: Info */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="te-display text-xl font-bold text-neutral-900">Contact Information</h2>
            <div className="mt-5 space-y-5">
              {infoItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-accent-500 shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="te-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">{item.label}</p>
                    <p className="text-sm text-neutral-700 font-medium mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="p-5 border border-neutral-200 bg-neutral-50/50" style={{ borderRadius: 'var(--radius-standard)' }}>
            <h3 className="te-display text-sm font-bold text-neutral-900">Office Hours</h3>
            <div className="mt-3 space-y-1.5 text-sm text-neutral-600">
              <div className="flex justify-between"><span>Monday – Friday</span><span className="font-semibold text-neutral-900">9:00 AM – 6:00 PM</span></div>
              <div className="flex justify-between"><span>Saturday</span><span className="font-semibold text-neutral-900">10:00 AM – 4:00 PM</span></div>
              <div className="flex justify-between"><span>Sunday</span><span className="font-semibold text-neutral-900">Closed</span></div>
            </div>
          </Card>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-3">
          <div className="p-6 sm:p-8 border border-neutral-200 bg-white shadow-sm" style={{ borderRadius: 'var(--radius-standard)' }}>
            {status === 'success' ? (
              <div className="text-center py-8">
                <p className="text-lg font-semibold text-neutral-900">Message sent!</p>
                <p className="mt-2 text-sm text-neutral-600">
                  Thanks for reaching out. We've sent a confirmation to your email, and our admissions team will get back to you soon.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-sm font-semibold text-primary-800 hover:opacity-80 transition-opacity"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-neutral-600">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={handleChange('name')}
                    className="w-full border border-neutral-200 p-2.5 text-sm outline-none transition-colors"
                    style={{ borderRadius: 'var(--radius-standard)' }}
                    placeholder="John"
                  />
                  {errors.name && <p className="mt-1 text-xs text-danger-text">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-neutral-600">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    className="w-full border border-neutral-200 p-2.5 text-sm outline-none transition-colors"
                    style={{ borderRadius: 'var(--radius-standard)' }}
                    placeholder="john@domain.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-danger-text">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-neutral-600">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={handleChange('subject')}
                    className="w-full border border-neutral-200 p-2.5 text-sm outline-none transition-colors"
                    style={{ borderRadius: 'var(--radius-standard)' }}
                    placeholder="Admissions question"
                  />
                  {errors.subject && <p className="mt-1 text-xs text-danger-text">{errors.subject}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-neutral-600">Message</label>
                  <textarea
                    value={form.message}
                    onChange={handleChange('message')}
                    rows={4}
                    className="w-full border border-neutral-200 p-2.5 text-sm outline-none transition-colors resize-none"
                    style={{ borderRadius: 'var(--radius-standard)' }}
                    placeholder="How can we help?"
                  />
                  {errors.message && <p className="mt-1 text-xs text-danger-text">{errors.message}</p>}
                </div>
                {status === 'error' && <p className="text-xs text-danger-text">{serverError}</p>}
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full text-white p-2.5 text-sm font-semibold hover:opacity-90 transition-opacity bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ borderRadius: 'var(--radius-standard)' }}
                >
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- BEFORE YOU CONTACT US ---
const BeforeYouContact = () => {
  const [ref, aosClass] = useAOS();
  const items = [
    { q: 'Want to apply for a program?', a: "You don't need to email us. Head straight to Enroll Now and submit your application directly.", to: '/apply', cta: 'Go to Enroll Now →' },
    { q: 'Want to see what we teach?', a: 'Browse the full course catalog. Duration, prerequisites, and seat availability are listed on every program.', to: '/programs', cta: 'View Programs →' },
    { q: 'Need to verify a graduate\'s certificate?', a: "If you're an employer confirming a certificate, use our certificate verification tool instead of contacting us directly.", to: '/verify', cta: 'Verify a Certificate →' },
    { q: 'Waiting on your entry test?', a: 'Check your schedule and outcome instantly with your CNIC or application reference number. No need to wait on a reply.', to: '/entry-test-status', cta: 'Check Entry Test Status →' },
    { q: 'Waiting on an exam result?', a: 'Course and final assessment results are looked up the same way: instant, no email required.', to: '/check-result', cta: 'Check Your Result →' },
    { q: 'Need your student ID card?', a: 'Enrolled students can preview and download their official ID card directly, any time.', to: '/download-id-card', cta: 'Download ID Card →' },
  ];
  return (
    <section ref={ref} className={`py-24 bg-neutral-50/50 border-b border-neutral-100 transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Before You Contact Us"
          eyebrowClassName="te-mono text-xs font-bold uppercase tracking-widest text-neutral-400"
          title="You Might Not Need To Email Us"
          titleClassName="te-display text-3xl sm:text-4xl font-bold text-neutral-900 mt-4"
          description="A few common reasons people reach out have a faster, direct answer below."
          descriptionClassName="te-body mt-3 text-neutral-500 text-sm sm:text-base"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <Card key={idx} className="p-6 bg-white border border-neutral-200/80 rounded-xl shadow-sm hover:border-accent-500 hover:shadow-md transition-all duration-300">
              <h3 className="te-display text-base font-bold text-neutral-900">{item.q}</h3>
              <p className="te-body text-sm text-neutral-600 leading-relaxed mt-2">{item.a}</p>
              <Link to={item.to} className="inline-block mt-4 text-sm font-bold text-accent-600 hover:text-accent-700 no-underline transition-colors">
                {item.cta}
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- MAP ---
const MapSection = () => {
  const [ref, aosClass] = useAOS();
  return (
    <section ref={ref} className={`py-20 bg-white transition-all duration-700 transform ${aosClass}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="te-display text-xl font-bold text-neutral-900 text-center mb-6">Find Our Sukkur Campus</h2>
        <div className="rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
          <iframe
            title="Saylani TITAN Sukkur Campus location"
            src="https://www.google.com/maps?q=27.698767,68.846491(Saylani+TITAN+Sukkur+Campus)&output=embed"
            width="100%"
            height="320"
            style={{ border: 0 }}
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <p className="text-center mt-4 text-sm text-neutral-500">
          Looking for our Karachi campus map or full details on both locations? <Link to="/campuses" className="font-semibold text-primary-800 hover:text-primary-900">View our Campuses page →</Link>
        </p>
      </div>
    </section>
  );
};

// --- MAIN ASSEMBLER ---
const Contact = () => (
  <div className="relative bg-neutral-50 antialiased selection:bg-accent-500/20">
    <Hero />
    <ContactMain />
    <BeforeYouContact />
    <MapSection />
    <ScrollToTopButton />
  </div>
);

export default Contact;
