require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const { computeMatchScore } = require('./matchScore');

// TITAN only posts jobs for its own two real campuses (Karachi, Sukkur) —
// this used to seed fictional outside companies (Zenith Softworks etc.) as
// a stand-in careers board, but that's not what this project actually is:
// TITAN itself is the employer, hiring trainers and staff, not a job board
// aggregating third-party listings. Job.company is written to match an
// Employer.companyName string purely for narrative consistency, not because
// the schema requires or enforces it (see models/Job.js, models/Employer.js
// — neither has a real ObjectId ref to the other).
const EMPLOYERS = [
  { companyName: 'TITAN', contactEmail: 'careers@titan.edu.pk', contactPhone: '021-3456701', city: 'Karachi', status: 'verified' },
];

// TITAN hires trainers and staff for its own two campuses — every posting
// below is company: 'TITAN' at either Karachi or Sukkur, the institute's
// only two real campuses (see README). requirements/description text still
// deliberately shares vocabulary with the JOB_APPLICATIONS skills/experience
// /education text further down, so computeMatchScore (imported above, same
// function the real apply flow uses) produces real, varied, non-zero scores
// rather than everything landing on null.
const JOBS = [
  {
    title: 'Web Development Trainer', company: 'TITAN', location: 'Karachi', type: 'Full-time', status: 'open', published: true,
    description: 'Teach the Web Development track — HTML/CSS/JavaScript through React and Node.js/Express/MongoDB — to enrolled students.',
    requirements: ['React', 'JavaScript', 'HTML', 'CSS', 'REST APIs', 'Git'],
  },
  {
    title: 'Backend Development Trainer', company: 'TITAN', location: 'Karachi', type: 'Full-time', status: 'open', published: true,
    description: 'Lead the backend half of the Web Development track — REST API design, databases, and server-side fundamentals.',
    requirements: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'JavaScript', 'Git'],
  },
  {
    title: 'AI & Data Science Trainer', company: 'TITAN', location: 'Sukkur', type: 'Full-time', status: 'open', published: true,
    description: 'Teach Python, statistics, and applied data analysis to the AI & Data Science cohort.',
    requirements: ['Python', 'SQL', 'Data Analysis', 'Statistics', 'Excel'],
  },
  {
    title: 'Machine Learning Trainer', company: 'TITAN', location: 'Sukkur', type: 'Full-time', status: 'open', published: true,
    description: 'Teach machine learning fundamentals and guide capstone projects for the AI & Data Science track.',
    requirements: ['Python', 'Machine Learning', 'Deep Learning', 'SQL', 'Statistics'],
  },
  {
    title: 'UI/UX Design Trainer', company: 'TITAN', location: 'Karachi', type: 'Full-time', status: 'open', published: true,
    description: 'Teach UX research, wireframing, and UI design in Figma to the UI/UX Design cohort.',
    requirements: ['Figma', 'UI Design', 'UX Research', 'Wireframing', 'Prototyping'],
  },
  {
    title: 'Graphic Design Trainer', company: 'TITAN', location: 'Karachi', type: 'Internship', status: 'open', published: true,
    description: 'Assist the design faculty with the Graphic Designing track — Photoshop, Illustrator, and branding fundamentals.',
    requirements: ['Adobe Photoshop', 'Illustrator', 'Branding', 'Typography'],
  },
  {
    title: 'Mobile App Development Trainer (Flutter)', company: 'TITAN', location: 'Sukkur', type: 'Full-time', status: 'open', published: true,
    description: 'Teach Flutter and Dart for cross-platform mobile development to the Mobile App Development cohort.',
    requirements: ['Flutter', 'Dart', 'Mobile App Development', 'REST APIs', 'Git'],
  },
  {
    title: 'Digital Marketing Trainer', company: 'TITAN', location: 'Sukkur', type: 'Full-time', status: 'open', published: true,
    description: 'Teach SEO, social media marketing, and paid advertising fundamentals to the Digital Marketing cohort.',
    requirements: ['SEO', 'Social Media Marketing', 'Google Ads', 'Content Marketing', 'Analytics'],
  },
  {
    title: 'Cybersecurity Trainer', company: 'TITAN', location: 'Sukkur', type: 'Full-time', status: 'closed', published: true,
    description: 'Teach networking, common threats, and defensive fundamentals for the Cybersecurity Fundamentals track.',
    requirements: ['Network Security', 'Penetration Testing', 'SIEM', 'Risk Assessment'],
  },
  {
    title: 'Full Stack Development Trainer', company: 'TITAN', location: 'Karachi', type: 'Contract', status: 'open', published: true,
    description: 'Cover the full-stack capstone module for the Web Development track on a contract basis.',
    requirements: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'REST APIs'],
  },
  {
    title: 'IT Lab Support Assistant', company: 'TITAN', location: 'Sukkur', type: 'Part-time', status: 'open', published: false,
    description: 'Maintain and troubleshoot lab computers and classroom AV/network equipment across sessions.',
    requirements: ['Manual Testing', 'Test Case Design', 'Bug Tracking', 'REST APIs'],
  },
  {
    title: 'Social Media & Content Coordinator', company: 'TITAN', location: 'Karachi', type: 'Internship', status: 'open', published: true,
    description: 'Manage day-to-day content and engagement across TITAN\'s social channels.',
    requirements: ['Social Media Marketing', 'Content Creation', 'Copywriting'],
  },
];

// Independent (non-student) applicants — plausible Pakistani names, mixed
// in with real titan-portal students fetched at seed time below so not
// every applicant is a Titan grad (realistic for a public careers page).
const OUTSIDE_APPLICANTS = [
  { fullName: 'Hassan Iqbal', email: 'hassan.iqbal.apply@example.com', phone: '0300-1112223' },
  { fullName: 'Mariam Yousaf', email: 'mariam.yousaf.apply@example.com', phone: '0301-2223334' },
  { fullName: 'Omar Farooqi', email: 'omar.farooqi.apply@example.com', phone: '0302-3334445' },
  { fullName: 'Zainab Riaz', email: 'zainab.riaz.apply@example.com', phone: '0333-4445556' },
  { fullName: 'Bilal Ahmed Khan', email: 'bilal.ahmedkhan.apply@example.com', phone: '0334-5556667' },
  { fullName: 'Hira Sultan', email: 'hira.sultan.apply@example.com', phone: '0345-6667778' },
];

const APPLICANT_PROFILES = [
  { education: 'BS Computer Science', experience: '1 year as a junior frontend developer building React apps.', skills: 'React, JavaScript, HTML, CSS, Git' },
  { education: 'BS Software Engineering', experience: '2 years building REST APIs with Node.js and Express.', skills: 'Node.js, Express, MongoDB, REST APIs, JavaScript' },
  { education: 'BS Data Science', experience: 'Internship doing data analysis and reporting in Python.', skills: 'Python, SQL, Data Analysis, Excel, Statistics' },
  { education: 'MS Artificial Intelligence', experience: '1 year research assistant on deep learning models.', skills: 'Python, Machine Learning, Deep Learning, Statistics' },
  { education: 'BS Design', experience: 'Freelance UI/UX design for small business clients.', skills: 'Figma, UI Design, UX Research, Wireframing, Prototyping' },
  { education: 'Intermediate, Fine Arts', experience: 'Freelance graphic design for social media pages.', skills: 'Adobe Photoshop, Illustrator, Branding, Typography' },
  { education: 'BS Computer Science', experience: '1 year building cross-platform apps with Flutter.', skills: 'Flutter, Dart, Mobile App Development, REST APIs, Git' },
  { education: 'BBA Marketing', experience: '1 year running paid social campaigns for local brands.', skills: 'SEO, Social Media Marketing, Google Ads, Content Marketing' },
  { education: 'BS Cybersecurity', experience: 'Internship in a SOC monitoring network traffic.', skills: 'Network Security, Risk Assessment, SIEM' },
  { education: 'BS Computer Science', experience: '3 years full stack development across React and Node.js.', skills: 'React, Node.js, MongoDB, REST APIs, JavaScript' },
  { education: 'BS Software Engineering', experience: 'Fresh graduate, coursework included manual QA testing.', skills: 'Manual Testing, Test Case Design, Bug Tracking' },
  { education: 'BS Media Studies', experience: 'Managed Instagram/Facebook pages for a local cafe chain.', skills: 'Social Media Marketing, Content Creation, Copywriting' },
];

const CAMPAIGNS = [
  { title: 'Scholarship Fund for Underprivileged Students', category: 'Education', description: 'Full-course scholarships for talented students who cannot afford tuition.', goalAmount: 2000000, status: 'active', published: true },
  { title: 'New Computer Lab Equipment', category: 'Infrastructure', description: 'Upgrading lab machines across campuses for hands-on technical training.', goalAmount: 800000, status: 'active', published: true },
  { title: 'Sukkur Campus Expansion', category: 'Infrastructure', description: 'Building two new classrooms to accommodate growing enrollment in Sukkur.', goalAmount: 5000000, status: 'active', published: true },
  { title: 'Winter Relief Drive for Students', category: 'Welfare', description: 'Warm clothing and heaters for students commuting through winter.', goalAmount: 300000, status: 'closed', published: true },
  { title: 'Digital Library Initiative', category: 'Education', description: 'Building an online library of course materials and reference books.', goalAmount: 1200000, status: 'active', published: false },
];

const DONOR_NAMES = [
  'Ahmed Raza Sheikh', 'Sana Malik', 'Imran Qureshi', 'Farah Naz', 'Tariq Mehmood', 'Ayesha Siddiqui',
  'Kamran Akhtar', 'Nadia Baig', 'Waseem Abbas', 'Rabia Noor', 'Salman Yousuf', 'Mehak Fatima',
  'Adnan Latif', 'Sobia Anjum', 'Faisal Hameed', 'Zara Shahid', 'Junaid Aslam', 'Iqra Bano',
  'Naveed Chaudhry', 'Sadia Parveen', 'Rizwan Haider', 'Nimra Javed', 'Shahid Iqbal', 'Amber Rasheed',
  'Usman Ghani', 'Alina Tariq', 'Fahad Rauf', 'Sundas Khan', 'Kashif Nawaz', 'Laiba Saleem',
];
const PAYMENT_METHODS = ['Bank Transfer', 'Easypaisa', 'JazzCash', 'Credit/Debit Card'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function seedEmployers() {
  const existing = await Employer.countDocuments();
  if (existing > 0) {
    console.log(`Employers: already has ${existing}. Skipping.`);
    return Employer.find();
  }
  const docs = await Employer.insertMany(EMPLOYERS);
  console.log(`Employers: seeded ${docs.length}.`);
  return docs;
}

async function seedJobs() {
  const existing = await Job.countDocuments();
  if (existing > 0) {
    console.log(`Jobs: already has ${existing}. Skipping.`);
    return Job.find();
  }
  const docs = await Job.insertMany(JOBS);
  console.log(`Jobs: seeded ${docs.length}.`);
  return docs;
}

// resumeUrl is required by the model and always a real upload in the live
// apply flow — this is an obvious placeholder path, not a fabricated file
// on disk (nothing exists at these paths, and they're named to make that
// clear rather than pretending a real resume was uploaded).
function placeholderResumeUrl(seed) {
  return `/uploads/resumes/seed-placeholder-${seed}.pdf`;
}

async function seedJobApplications(jobs, students) {
  const existing = await JobApplication.countDocuments();
  if (existing > 0) {
    console.log(`Job applications: already has ${existing}. Skipping.`);
    return;
  }

  const statuses = ['pending', 'pending', 'reviewed', 'shortlisted', 'rejected'];
  const applications = [];
  const total = 18;

  for (let i = 0; i < total; i += 1) {
    const job = jobs[i % jobs.length];
    const profileIdx = JOBS.findIndex((j) => j.title === job.title);
    // Bias applicant profile toward the job's own field ~60% of the time
    // (realistic overlap so matchScore isn't uniformly low), otherwise a
    // random profile (a mismatched applicant is realistic too).
    const profile = Math.random() < 0.6 ? APPLICANT_PROFILES[profileIdx] : pick(APPLICANT_PROFILES);

    // ~40% of applicants are real titan-portal students (own grads applying
    // to outside jobs); the rest are independent public applicants. Neither
    // is a real FK — see report on JobApplication having no Student ref.
    const useStudent = students.length > 0 && Math.random() < 0.4;
    const identity = useStudent
      ? { fullName: students[i % students.length].name, email: students[i % students.length].email, phone: students[i % students.length].phone }
      : pick(OUTSIDE_APPLICANTS);

    const matchScore = computeMatchScore(job, profile);

    applications.push({
      job: job._id,
      jobTitle: job.title,
      fullName: identity.fullName,
      email: identity.email,
      phone: identity.phone || '0300-0000000',
      address: '',
      education: profile.education,
      experience: profile.experience,
      skills: profile.skills,
      resumeUrl: placeholderResumeUrl(i + 1),
      photoUrl: '',
      status: pick(statuses),
      matchScore,
      createdAt: daysAgo(randomInt(1, 45)),
    });
  }

  const docs = await JobApplication.insertMany(applications);
  console.log(`Job applications: seeded ${docs.length}.`);
}

async function seedCampaigns() {
  const existing = await Campaign.countDocuments();
  if (existing > 0) {
    console.log(`Campaigns: already has ${existing}. Skipping.`);
    return Campaign.find();
  }
  const docs = await Campaign.insertMany(CAMPAIGNS);
  console.log(`Campaigns: seeded ${docs.length}.`);
  return docs;
}

// Confirmed-only sum is what the admin UI shows as campaign progress (see
// donationController.getCampaignSummary) — targetConfirmedFraction controls
// how close each campaign lands to its goal through the actual seeded
// amounts, not a stored field.
async function seedDonations(campaigns) {
  const existing = await Donation.countDocuments();
  if (existing > 0) {
    console.log(`Donations: already has ${existing}. Skipping.`);
    return;
  }

  const targets = {
    'Scholarship Fund for Underprivileged Students': 0.35, // early-mid
    'New Computer Lab Equipment': 0.55,
    'Sukkur Campus Expansion': 0.12, // early
    'Winter Relief Drive for Students': 0.97, // near goal (closed campaign)
    'Digital Library Initiative': 0.08, // just started
  };

  const donations = [];
  const donorCountPerCampaign = { small: 6, large: 5 };

  for (const campaign of campaigns) {
    const targetConfirmed = Math.round(campaign.goalAmount * (targets[campaign.title] ?? 0.3));
    const donorCount = randomInt(4, 7);
    // Split the target confirmed sum across donorCount confirmed donations,
    // with some natural variance rather than perfectly even slices.
    const weights = Array.from({ length: donorCount }, () => Math.random() + 0.3);
    const weightSum = weights.reduce((s, w) => s + w, 0);

    let runningConfirmed = 0;
    for (let i = 0; i < donorCount; i += 1) {
      const amount = Math.max(1000, Math.round(((weights[i] / weightSum) * targetConfirmed) / 500) * 500);
      runningConfirmed += amount;
      const anonymous = Math.random() < 0.2;
      donations.push({
        campaign: campaign._id,
        campaignTitle: campaign.title,
        donorName: pick(DONOR_NAMES),
        email: `donor${randomInt(1000, 9999)}@example.com`,
        phone: `03${randomInt(10, 49)}-${randomInt(1000000, 9999999)}`,
        amount,
        paymentMethod: pick(PAYMENT_METHODS),
        message: Math.random() < 0.3 ? 'Keep up the great work!' : '',
        anonymous,
        status: 'confirmed',
        createdAt: daysAgo(randomInt(2, 90)),
      });
    }

    // A couple of pending/rejected donations per campaign too — real flow,
    // not counted toward progress, so they don't affect the target above.
    const extraCount = randomInt(1, 2);
    for (let i = 0; i < extraCount; i += 1) {
      donations.push({
        campaign: campaign._id,
        campaignTitle: campaign.title,
        donorName: pick(DONOR_NAMES),
        email: `donor${randomInt(1000, 9999)}@example.com`,
        phone: `03${randomInt(10, 49)}-${randomInt(1000000, 9999999)}`,
        amount: Math.round(randomInt(2, 20) * 500),
        paymentMethod: pick(PAYMENT_METHODS),
        message: '',
        anonymous: false,
        status: Math.random() < 0.7 ? 'pending' : 'rejected',
        createdAt: daysAgo(randomInt(1, 10)),
      });
    }
  }

  const docs = await Donation.insertMany(donations);
  console.log(`Donations: seeded ${docs.length}.`);
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const employers = await seedEmployers();
  const jobs = await seedJobs();
  const students = await Student.find({ status: { $in: ['enrolled', 'completed'] } }).select('name email phone').lean();
  await seedJobApplications(jobs, students);
  const campaigns = await seedCampaigns();
  await seedDonations(campaigns);

  console.log(`\nDone. (${employers.length} employers, ${jobs.length} jobs available for linking.)`);
  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
