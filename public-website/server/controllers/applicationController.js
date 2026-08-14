const crypto = require('crypto');
const Application = require('../models/Application');
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
      preferredBatch, hasLaptop,
    } = req.body;

    if (!fullName?.trim()) return res.status(400).json({ message: 'Full name is required' });
    if (!fatherName?.trim()) return res.status(400).json({ message: "Father's name is required" });
    if (!CNIC_RE.test(cnic || '')) return res.status(400).json({ message: 'CNIC must be exactly 13 digits' });
    if (!PHONE_RE.test(phone || '')) return res.status(400).json({ message: 'A valid phone number is required' });
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ message: 'A valid email is required' });
    if (!address?.trim()) return res.status(400).json({ message: 'Address is required' });
    if (!dateOfBirth) return res.status(400).json({ message: 'Date of birth is required' });
    if (!GENDERS.includes(gender)) return res.status(400).json({ message: 'Gender is required' });
    if (!lastQualification?.trim()) return res.status(400).json({ message: 'Last qualification is required' });
    if (!selectedProgram?.trim()) return res.status(400).json({ message: 'Please select a program' });

    // referenceNumber is random + unique-indexed; retry on the (rare)
    // collision rather than failing the whole application.
    let application;
    for (let attempt = 0; attempt < 3 && !application; attempt++) {
      try {
        application = await Application.create({
          fullName: fullName.trim(),
          fatherName: fatherName.trim(),
          cnic: cnic.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          address: address.trim(),
          dateOfBirth,
          gender,
          lastQualification: lastQualification.trim(),
          selectedProgram: selectedProgram.trim(),
          preferredBatch: preferredBatch?.trim() || '',
          hasLaptop: !!hasLaptop,
          referenceNumber: generateReferenceNumber(),
        });
      } catch (err) {
        if (err.code === 11000 && attempt < 2) continue;
        throw err;
      }
    }

    await sendApplicationConfirmation(application.email, application.fullName, application.referenceNumber, application.selectedProgram);

    return res.status(201).json({ application });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to submit application', error: err.message });
  }
};
