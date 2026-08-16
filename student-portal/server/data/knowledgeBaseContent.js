// Source content for the TITAN Knowledge Base PDF + RAG chunks. Plain data,
// no logic — generateKnowledgeBasePdf.js turns this into a PDF, and
// buildEmbeddings.js turns the same SECTIONS array into retrieval chunks,
// so the PDF a human reads and what the bot retrieves from never drift
// apart the way two independently-maintained copies would.
//
// Campuses/courses below are the real catalog (server/models/Campus.js
// seed data, Student.COURSES in server/models/Student.js). Admissions
// process, fees, and support-offering details are NOT stored anywhere in
// the system (confirmed — no eligibility/fee model exists), so those
// sections are written as reasonable, generic institute-onboarding
// content. Flagged with an EDITABLE ASSUMPTION note so whoever owns this
// content can correct specifics (real fee amounts, real intake dates,
// etc.) before this goes in front of real applicants.

const CAMPUSES = [
  { name: 'Saylani TITAN Sukkur Campus', city: 'Sukkur' },
  { name: 'Saylani TITAN Karachi Campus', city: 'Karachi' },
  { name: 'Lahore Model Town Campus', city: 'Lahore' },
  { name: 'Islamabad G-9 Campus', city: 'Islamabad' },
  { name: 'Multan Campus', city: 'Multan' },
];

const COURSES = [
  'Web Development',
  'AI & Data Science',
  'Graphic Designing',
  'Mobile App Development (Flutter)',
  'Digital Marketing',
  'UI/UX Design',
  'Cybersecurity Fundamentals',
];

const SECTIONS = [
  {
    title: 'About TITAN',
    body: `TITAN — Taj Institute of Technology & Applied Networks — is a technical training institute offering free, industry-focused courses in software development, design, marketing, and cybersecurity. TITAN operates across multiple campuses in Pakistan and combines classroom instruction with hands-on projects, attendance-tracked batches, quizzes and assignments, and a digital Student Portal where enrolled students manage their entire learning journey.`,
  },
  {
    title: 'Our Campuses',
    body: `TITAN currently operates ${CAMPUSES.length} campuses: ${CAMPUSES.map((c) => `${c.name} in ${c.city}`).join('; ')}. Each campus runs its own batches per course, subject to seat availability. Prospective students should apply through the campus nearest to them, though transfers between campuses can be requested through the admissions team.`,
  },
  {
    title: 'Courses Offered',
    body: `TITAN offers the following courses: ${COURSES.join(', ')}. Each course runs in structured batches with a fixed schedule, a dedicated trainer, attendance tracking, quizzes, assignments, and a final course completion certificate for students who complete the course successfully. Course availability varies by campus and current batch capacity — not every course is guaranteed to be running at every campus at every time.`,
  },
  {
    title: 'Eligibility Criteria',
    body: `[Editable assumption — no eligibility rules are stored in the system; these are standard institute norms and should be confirmed/edited by TITAN staff before publishing.] General eligibility to apply to TITAN: applicants should have at least completed Matriculation (or equivalent); some advanced courses may prefer Intermediate or higher. A valid CNIC (or B-Form for minors) is required for enrollment. There is no strict upper age limit, but applicants are typically expected to be at least 16 years old. Basic literacy in English is helpful but not mandatory for most courses. Access to a laptop/computer is recommended, especially for technical courses like Web Development, AI & Data Science, and Cybersecurity Fundamentals.`,
  },
  {
    title: 'Admission Process',
    body: `[Editable assumption — confirm exact steps with the admissions team.] Applicants apply online through the TITAN public website by filling out the application form with their personal details, selected campus, and preferred course, and uploading required documents (CNIC, photo, and educational certificates where applicable). The Admissions team reviews applications and either approves or rejects them based on seat availability and eligibility. Once approved, the applicant is assigned to a batch and given login credentials for the Student Portal, where they can track attendance, take quizzes, submit assignments, and monitor their overall progress.`,
  },
  {
    title: 'What TITAN Provides',
    body: `[Editable assumption — confirm exact offerings with TITAN staff.] TITAN provides free, structured technical training led by experienced trainers, a digital Student Portal for tracking attendance, grades, quizzes, assignments, and course progress, a digital Skill Passport / Certificate on successful course completion, and access to a Job Portal listing openings from partner employers for graduating students to apply to directly. Students can also raise academic questions through the "Ask a Doubt" peer/trainer forum inside the Student Portal.`,
  },
  {
    title: 'Student Portal Features',
    body: `Enrolled TITAN students get access to a dedicated Student Portal covering: Courses (enrolled course details), Skill Passport, Dashboard, Progress tracking, Attendance history and self check-in, Payment/fee status where applicable, Assignments, Quizzes, Resources shared by their trainer, "Ask a Doubt" (a peer/trainer Q&A forum for academic questions), and a Leaderboard and Certificate page once course requirements are met.`,
  },
  {
    title: 'Contact & Support',
    body: `For questions not covered here — including exact fee structures (TITAN's core courses are generally offered free of cost, though this should be confirmed per campus/course), current intake dates, or campus-specific details — prospective and current students should contact the relevant campus's admissions office directly, or reach out through the "Check Application Status" page on the TITAN website.`,
  },
];

module.exports = { CAMPUSES, COURSES, SECTIONS };
