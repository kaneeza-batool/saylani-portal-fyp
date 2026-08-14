// Shared testimonial records used on the Success Stories page and pulled
// into matching course detail pages via `category`. `category` maps to
// TRACKS_DATA's course categories (see data/courses.js) so a course detail
// page can show a testimonial from an alum of a related program.
export const TESTIMONIALS = [
  {
    name: 'Bilal Ahmed',
    program: 'Web Development',
    category: 'web',
    batch: 'Batch WD-14',
    outcome: 'Employed',
    outcomeColor: 'success',
    quote: "I joined TITAN with zero coding experience. Six months into the Web Development track, our mentors helped me build a real portfolio with React and Node.js, and I got hired as a Frontend Developer at a Karachi-based software house before I'd even finished the program.",
  },
  {
    name: 'Ayesha Raza',
    program: 'AI & Data Science',
    category: 'data',
    batch: 'Batch AI-05',
    outcome: 'Employed',
    outcomeColor: 'success',
    quote: 'The Python and Pandas modules were exactly what I needed. I built a full dashboard project for my final assessment, and it became the centerpiece of my portfolio. I now work remotely as a Data Analyst for a fintech startup.',
  },
  {
    name: 'Hamza Sheikh',
    program: 'Web Development',
    category: 'web',
    batch: 'Batch WD-09',
    outcome: 'Freelancing',
    outcomeColor: 'info',
    quote: "I didn't want a 9-to-5; I wanted flexibility. TITAN taught me the same React and Express stack companies use, and I started picking up freelance web projects on Upwork before graduation. I now build sites full-time for international clients.",
  },
  {
    name: 'Sana Iqbal',
    program: 'E-Commerce Store Operations',
    category: 'basic',
    batch: 'Batch ECOM-02',
    outcome: 'Own Business',
    outcomeColor: 'accent',
    quote: "I had no tech background at all. I run a small clothing business, and the E-Commerce Store Operations course taught me Shopify and inventory management from scratch, and I launched my own online store the month after finishing.",
  },
  {
    name: 'Usman Tariq',
    program: 'AI & Data Science',
    category: 'data',
    batch: 'Batch AI-03',
    outcome: 'Employed',
    outcomeColor: 'success',
    quote: 'The Machine Learning modules pushed me hard, using real datasets and real model training instead of toy examples. That project work is what got me noticed; I now work as a junior ML engineer at a small AI startup.',
  },
  {
    name: 'Zoya Khan',
    program: 'Cyber Security & Network Defense',
    category: 'security',
    batch: 'Batch SEC-01',
    outcome: 'Employed',
    outcomeColor: 'success',
    quote: "Cyber Security was one of TITAN's newest tracks when I joined, so batches were small, which meant a lot of direct time with mentors on real vulnerability labs. I landed a junior network security role at a regional ISP right after graduating.",
  },
];

export const OUTCOME_STYLES = {
  success: 'text-success-text bg-success-bg border-success-text/20',
  info: 'text-info-text bg-info-bg border-info-text/20',
  accent: 'text-accent-700 bg-accent-50 border-accent-200',
};

export const getTestimonialByCategory = (category) =>
  TESTIMONIALS.find((t) => t.category === category) || null;

export default TESTIMONIALS;
