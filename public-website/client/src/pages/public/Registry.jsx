import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';

/* ============================================================
   TITAN — Academic Registry (/registry)
   A hub indexing the site's real self-service lookup tools, rather
   than a new, unspecified data feature — "Academic Registry" (the
   name the Footer link already used) fits a directory of these four
   real tools better than a bare "coming soon" stub ever did.
   Theme: TITAN Navy / Gold Brand Palette
   ============================================================ */

const REGISTRY_TOOLS = [
  {
    to: '/check-result',
    title: 'Check Result',
    description: 'Look up your course exam result using your CNIC or application reference number.',
  },
  {
    to: '/entry-test-status',
    title: 'Entry Test Status',
    description: "See whether your entry test has been scheduled, and your score once it's graded.",
  },
  {
    to: '/download-id-card',
    title: 'Download ID Card',
    description: 'Generate and download a printable student ID card for an active enrollment.',
  },
  {
    to: '/verify',
    title: 'Verify Certificate',
    description: 'Confirm a TITAN certificate is genuine using its certificate ID.',
  },
];

const Registry = () => {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900">Academic Registry</h1>
        <p className="mt-3 text-sm text-neutral-600 max-w-xl mx-auto">
          Self-service tools for current and former students — no login required. Pick a lookup below to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {REGISTRY_TOOLS.map((tool) => (
          <Card key={tool.to}>
            <Link
              to={tool.to}
              className="block h-full p-6 border border-neutral-200 bg-white hover:border-primary-800 transition-colors"
              style={{ borderRadius: 'var(--radius-standard)' }}
            >
              <h2 className="text-base font-bold text-neutral-900">{tool.title}</h2>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{tool.description}</p>
              <span className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-primary-800">
                Open &rarr;
              </span>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Registry;
