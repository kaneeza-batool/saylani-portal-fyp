const crypto = require('crypto');
const Application = require('../models/Application');
const Student = require('../models/Student');
const { sendApplicationConfirmation } = require('../utils/mailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CNIC_RE = /^\d{13}$/;
const PHONE_RE = /^[\d+\-\s]{7,15}$/;
const GENDERS = ['male', 'female', 'other'];

function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TITAN-${year}-${random}`;
}

exports.submitApplication = async (req, res) => {
  try {
    const {
      fullName, fatherName, cnic, phone, email, address,
      dateOfBirth, gender, lastQualification, selectedProgram,
      preferredBatch, hasLaptop, course, campusId,
    } = req.body;

    // Stored as 13 bare digits — same normalization as Student.js's own
    // pre-validate hook, applied here too so the duplicate check below
    // compares like-for-like regardless of how the client formatted it.
    const normalizedCnic = String(cnic || '').replace(/\D/g, '');

    if (!fullName?.trim()) return res.status(400).json({ message: 'Full name is required' });
    if (!fatherName?.trim()) return res.status(400).json({ message: "Father's name is required" });
    if (!CNIC_RE.test(normalizedCnic)) return res.status(400).json({ message: 'CNIC must be exactly 13 digits' });
    if (!PHONE_RE.test(phone || '')) return res.status(400).json({ message: 'A valid phone number is required' });
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ message: 'A valid email is required' });
    if (!address?.trim()) return res.status(400).json({ message: 'Address is required' });
    if (!dateOfBirth) return res.status(400).json({ message: 'Date of birth is required' });
    if (!GENDERS.includes(gender)) return res.status(400).json({ message: 'Gender is required' });
    if (!lastQualification?.trim()) return res.status(400).json({ message: 'Last qualification is required' });
    if (!selectedProgram?.trim()) return res.status(400).json({ message: 'Please select a program' });
    if (!Student.COURSES.includes(course)) return res.status(400).json({ message: 'Please select a valid course' });
    if (!campusId) return res.status(400).json({ message: 'Please select a campus' });

    // All optional — the form never requires any of these (see EnrollNow.jsx's
    // Documents step), so most applications will have none set. CNIC front
    // and back are separate fields/files, not one "scan" — a CNIC has two
    // sides and an applicant needs to be able to attach both.
    const photoUrl = req.files?.photo?.[0] ? `/uploads/applications/${req.files.photo[0].filename}` : '';
    const cnicFrontUrl = req.files?.cnicFront?.[0] ? `/uploads/applications/${req.files.cnicFront[0].filename}` : '';
    const cnicBackUrl = req.files?.cnicBack?.[0] ? `/uploads/applications/${req.files.cnicBack[0].filename}` : '';

    // Friendly duplicate check before create — Student.cnic is
    // unique-indexed, but that alone would surface as a raw 500/E11000.
    const existingStudent = await Student.findOne({ cnic: normalizedCnic });
    if (existingStudent) {
      return res.status(409).json({ message: 'An application with this CNIC already exists.' });
    }

    // The Student record is what the Admissions Queue actually reads —
    // status: 'pending' lands it there directly. No password/onboarding
    // yet; the applicant sets one later via Create Password.
    const student = await Student.create({
      name: fullName.trim(),
      father: fatherName.trim(),
      cnic: normalizedCnic,
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      address: address.trim(),
      dateOfBirth,
      gender,
      lastQualification: lastQualification.trim(),
      course,
      campus: campusId,
      status: 'pending',
      hasCompletedOnboarding: false,
      hasLaptop: !!hasLaptop,
      applicationPhotoUrl: photoUrl,
      applicationCnicFrontUrl: cnicFrontUrl,
      applicationCnicBackUrl: cnicBackUrl,
    });

    // referenceNumber is random + unique-indexed; retry on the (rare)
    // collision rather than failing the whole application. Kept alongside
    // the Student record as a lightweight submission receipt — cheap to
    // keep, but non-fatal if it fails, since the Student is what matters.
    let application = null;
    try {
      for (let attempt = 0; attempt < 3 && !application; attempt++) {
        try {
          application = await Application.create({
            fullName: fullName.trim(),
            fatherName: fatherName.trim(),
            cnic: normalizedCnic,
            phone: phone.trim(),
            email: email.trim().toLowerCase(),
            address: address.trim(),
            dateOfBirth,
            gender,
            lastQualification: lastQualification.trim(),
            selectedProgram: selectedProgram.trim(),
            preferredBatch: preferredBatch?.trim() || '',
            hasLaptop: !!hasLaptop,
            photoUrl,
            cnicFrontUrl,
            cnicBackUrl,
            referenceNumber: generateReferenceNumber(),
          });
        } catch (err) {
          if (err.code === 11000 && attempt < 2) continue;
          throw err;
        }
      }
    } catch (err) {
      console.error('Application record (receipt) failed to save — Student was still created:', err.message);
    }

    const responseApplication = application || {
      fullName: student.name,
      selectedProgram: selectedProgram.trim(),
      email: student.email,
      referenceNumber: null,
    };

    if (application) {
      await sendApplicationConfirmation(application.email, application.fullName, application.referenceNumber, application.selectedProgram);
    }

    return res.status(201).json({ application: responseApplication, student });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to submit application', error: err.message });
  }
};
