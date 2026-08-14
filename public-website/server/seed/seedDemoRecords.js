// One-off, re-runnable seed script for the 3 public self-service lookup
// pages (Entry Test Status, Check Result, Download ID Card). This repo has
// no shared database with the Student Portal / Sub-Admin Portal yet, so
// these are this project's own realistic demo records — not a mirror of
// any other app's data. Safe to re-run: each persona's prior records
// (matched by cnic) are cleared before re-inserting.
//
// Run with: npm run seed  (from server/)
require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Application = require('../models/Application');
const EntryTestApplicant = require('../models/EntryTestApplicant');
const AcademicResult = require('../models/AcademicResult');
const StudentIdCard = require('../models/StudentIdCard');

function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TITAN-${year}-${random}`;
}

function generateCardId() {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TITAN-ID-${year}-${random}`;
}

function daysFromNow(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

// Ali Raza / 4230112345671 is the same CNIC already hinted at as the
// fullName+CNIC placeholder pair on the Enroll Now form — reused here on
// purpose so one consistent demo identity threads through the whole
// apply -> entry test -> result -> ID card pipeline.
const PERSONAS = [
  {
    fullName: 'Ali Raza',
    fatherName: 'Muhammad Raza',
    cnic: '4230112345671',
    email: 'ali.raza.demo@example.com',
    phone: '03001234567',
    selectedProgram: 'Web Engineering with AI Tools (Full-Stack)',
    batch: 'WD-14',
    campus: 'Saylani TITAN Sukkur Campus',
    story: 'Full success path: entry test passed, final result published, ID card issued.',
    entryTest: { testStatus: 'completed', testResult: 'pass', score: 85, testDateOffset: -70, testCenter: 'Sukkur Campus' },
    academicResult: { examName: 'Final Assessment — Web Engineering with AI Tools', resultStatus: 'pass', score: 92, publishedOffset: -10 },
    idCard: true,
  },
  {
    fullName: 'Bilal Ahmed',
    fatherName: 'Nasir Ahmed',
    cnic: '4230198765432',
    email: 'bilal.ahmed.demo@example.com',
    phone: '03011234567',
    selectedProgram: 'Web Engineering with AI Tools (Full-Stack)',
    batch: 'WD-14',
    campus: 'Saylani TITAN Sukkur Campus',
    story: 'Same batch as Ali — matches the WD-14 alum already featured on Success Stories.',
    entryTest: { testStatus: 'completed', testResult: 'pass', score: 79, testDateOffset: -70, testCenter: 'Sukkur Campus' },
    academicResult: { examName: 'Final Assessment — Web Engineering with AI Tools', resultStatus: 'pass', score: 88, publishedOffset: -10 },
    idCard: true,
  },
  {
    fullName: 'Ayesha Raza',
    fatherName: 'Tariq Raza',
    cnic: '4230187654321',
    email: 'ayesha.raza.demo@example.com',
    phone: '03021234567',
    selectedProgram: 'Python for Data Analysis & Analytics',
    batch: 'AI-05',
    campus: 'Saylani TITAN Zamzama Campus',
    story: 'AI-05 alum already featured on Success Stories — this time at the Karachi campus.',
    entryTest: { testStatus: 'completed', testResult: 'pass', score: 91, testDateOffset: -140, testCenter: 'Zamzama Campus, Karachi' },
    academicResult: { examName: 'Final Assessment — Python for Data Analysis & Analytics', resultStatus: 'pass', score: 95, publishedOffset: -60 },
    idCard: true,
  },
  {
    fullName: 'Fatima Noor',
    fatherName: 'Imran Noor',
    cnic: '4230111222333',
    email: 'fatima.noor.demo@example.com',
    phone: '03031234567',
    selectedProgram: 'Web Engineering with AI Tools (Full-Stack)',
    batch: 'WD-16',
    campus: 'Saylani TITAN Sukkur Campus',
    story: "Just applied — entry test is scheduled but hasn't happened yet.",
    entryTest: { testStatus: 'scheduled', testResult: 'pending', score: undefined, testDateOffset: 12, testCenter: 'Sukkur Campus' },
    academicResult: null,
    idCard: false,
  },
  {
    fullName: 'Zubair Khan',
    fatherName: 'Aslam Khan',
    cnic: '4230144455566',
    email: 'zubair.khan.demo@example.com',
    phone: '03041234567',
    selectedProgram: 'Cloud Operations & DevOps Systems',
    batch: '',
    campus: 'Saylani TITAN Sukkur Campus',
    story: "Didn't clear the entry test — no academic record or ID card follows.",
    entryTest: { testStatus: 'completed', testResult: 'fail', score: 38, testDateOffset: -20, testCenter: 'Sukkur Campus' },
    academicResult: null,
    idCard: false,
  },
  {
    fullName: 'Sana Malik',
    fatherName: 'Rafiq Malik',
    cnic: '4230177788899',
    email: 'sana.malik.demo@example.com',
    phone: '03051234567',
    selectedProgram: 'Python for Data Analysis & Analytics',
    batch: 'AI-06',
    campus: 'Saylani TITAN Zamzama Campus',
    story: 'Currently enrolled — ID card already issued, final result still pending.',
    entryTest: { testStatus: 'completed', testResult: 'pass', score: 79, testDateOffset: -45, testCenter: 'Zamzama Campus, Karachi' },
    academicResult: { examName: 'Final Assessment — Python for Data Analysis & Analytics', resultStatus: 'pending', score: undefined, publishedOffset: undefined },
    idCard: true,
  },
];

async function seed() {
  await connectDB();

  const cnics = PERSONAS.map((p) => p.cnic);

  // Clear only this seed's own prior records so re-running is safe and
  // doesn't touch real visitor-submitted Applications/ContactSubmissions.
  await Promise.all([
    Application.deleteMany({ cnic: { $in: cnics } }),
    EntryTestApplicant.deleteMany({ cnic: { $in: cnics } }),
    AcademicResult.deleteMany({ cnic: { $in: cnics } }),
    StudentIdCard.deleteMany({ cnic: { $in: cnics } }),
  ]);

  for (const persona of PERSONAS) {
    const referenceNumber = generateReferenceNumber();

    const application = await Application.create({
      fullName: persona.fullName,
      fatherName: persona.fatherName,
      cnic: persona.cnic,
      phone: persona.phone,
      email: persona.email,
      address: 'Seeded demo record — address not collected for this flow',
      dateOfBirth: new Date('2000-01-01'),
      gender: 'other',
      lastQualification: "Bachelor's",
      selectedProgram: persona.selectedProgram,
      preferredBatch: persona.batch,
      hasLaptop: true,
      referenceNumber,
      status: persona.idCard ? 'accepted' : 'pending',
    });

    await EntryTestApplicant.create({
      application: application._id,
      fullName: persona.fullName,
      cnic: persona.cnic,
      referenceNumber,
      selectedProgram: persona.selectedProgram,
      testStatus: persona.entryTest.testStatus,
      testDate: daysFromNow(persona.entryTest.testDateOffset),
      testCenter: persona.entryTest.testCenter,
      testResult: persona.entryTest.testResult,
      score: persona.entryTest.score,
    });

    if (persona.academicResult) {
      await AcademicResult.create({
        application: application._id,
        fullName: persona.fullName,
        cnic: persona.cnic,
        referenceNumber,
        selectedProgram: persona.selectedProgram,
        batch: persona.batch,
        examName: persona.academicResult.examName,
        resultStatus: persona.academicResult.resultStatus,
        score: persona.academicResult.score,
        publishedDate: persona.academicResult.publishedOffset !== undefined
          ? daysFromNow(persona.academicResult.publishedOffset)
          : undefined,
      });
    }

    if (persona.idCard) {
      await StudentIdCard.create({
        application: application._id,
        fullName: persona.fullName,
        cnic: persona.cnic,
        referenceNumber,
        program: persona.selectedProgram,
        batch: persona.batch,
        campus: persona.campus,
        cardId: generateCardId(),
        issueDate: daysFromNow(-30),
        validUntil: daysFromNow(335),
        status: 'active',
      });
    }

    console.log(`Seeded ${persona.fullName} (${persona.cnic}) — ${persona.story}`);
  }

  console.log('\nDemo CNICs for testing:');
  PERSONAS.forEach((p) => console.log(`  ${p.cnic} — ${p.fullName} — ${p.story}`));

  await mongoose.disconnect();
  console.log('\nSeed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
