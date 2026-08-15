import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import useCourses from '../../hooks/useCourses';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5200';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CNIC_RE = /^\d{13}$/;
const PHONE_RE = /^[\d+\-\s]{7,15}$/;

const STEPS = ['Personal Info', 'Education', 'Program Selection', 'Review & Submit'];

const QUALIFICATIONS = ['Matric', 'Intermediate', "Bachelor's", "Master's", 'Other'];
const BATCH_OPTIONS = ['Morning', 'Evening', 'Weekend', 'Online-Only'];

const CATEGORY_LABELS = {
  all: 'All Categories',
  basic: 'Basic Computer Operations',
  web: 'Web Engineering',
  data: 'Data Intelligence',
  cloud: 'Cloud Infrastructure',
  security: 'Networking & Security',
  creative: 'Creative Assets',
  vocational: 'Vocational Skills',
};

function initialFormFromProgram(preselected) {
  return {
    fullName: '',
    fatherName: '',
    cnic: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    lastQualification: '',
    hasLaptop: '',
    selectedProgramId: preselected ? preselected.id : null,
    selectedProgram: preselected ? preselected.title : '',
    preferredBatch: '',
  };
}

function validateStep(step, form) {
  const errors = {};
  if (step === 0) {
    if (!form.fullName.trim()) errors.fullName = 'Full name is required.';
    if (!form.fatherName.trim()) errors.fatherName = "Father's name is required.";
    if (!CNIC_RE.test(form.cnic.trim())) errors.cnic = 'CNIC must be exactly 13 digits, no dashes.';
    if (!PHONE_RE.test(form.phone.trim())) errors.phone = 'Enter a valid phone number.';
    if (!form.email.trim()) errors.email = 'Email address is required.';
    else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    if (!form.dateOfBirth) errors.dateOfBirth = 'Date of birth is required.';
    if (!form.gender) errors.gender = 'Please select a gender.';
    if (!form.address.trim()) errors.address = 'Address is required.';
  } else if (step === 1) {
    if (!form.lastQualification) errors.lastQualification = 'Please select your last qualification.';
    if (form.hasLaptop === '') errors.hasLaptop = 'Please let us know if you have a laptop.';
  } else if (step === 2) {
    if (!form.selectedProgram) errors.selectedProgram = 'Please select a program to apply for.';
  }
  return errors;
}

function ProgressIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((label, idx) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold te-mono transition-colors ${
                idx < currentStep
                  ? 'bg-primary-800 text-white'
                  : idx === currentStep
                  ? 'bg-accent-500 text-white'
                  : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              {idx < currentStep ? '✓' : idx + 1}
            </div>
            <span className={`mt-1.5 text-[10px] font-semibold text-center max-w-[70px] leading-tight ${idx === currentStep ? 'text-neutral-900' : 'text-neutral-400'}`}>
              {label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`h-0.5 w-8 sm:w-16 mx-1 mb-4 transition-colors ${idx < currentStep ? 'bg-primary-800' : 'bg-neutral-100'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

const inputClass = 'w-full border border-neutral-200 p-2.5 text-sm outline-none transition-colors focus:border-primary-800';
const labelClass = 'block text-xs font-bold uppercase tracking-wider mb-1 text-neutral-600';
const errorClass = 'mt-1 text-xs text-danger-text';

const EnrollNow = () => {
  const [searchParams] = useSearchParams();
  const { courses } = useCourses();
  const preselectedId = searchParams.get('program');

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => initialFormFromProgram(null));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [serverError, setServerError] = useState('');
  const [application, setApplication] = useState(null);

  const [programSearch, setProgramSearch] = useState('');
  const [programCategory, setProgramCategory] = useState('all');

  // Once the course list has loaded, apply a ?program=<id> preselection
  // from a CourseCard/detail-page "Enroll Now" link, if present.
  useEffect(() => {
    if (!preselectedId || courses.length === 0 || form.selectedProgramId) return;
    const match = courses.find((t) => t._id === preselectedId);
    if (match) {
      setForm((prev) => ({ ...prev, selectedProgramId: match._id, selectedProgram: match.title }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedId, courses]);

  const filteredPrograms = courses.filter((track) => {
    const matchesCategory = programCategory === 'all' || track.category === programCategory;
    const matchesSearch = track.title.toLowerCase().includes(programSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const updateField = (field) => (e) => {
    const value = e.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCnicChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 13);
    setForm((prev) => ({ ...prev, cnic: digitsOnly }));
    setErrors((prev) => ({ ...prev, cnic: undefined }));
  };

  const selectProgram = (track) => {
    setForm((prev) => ({ ...prev, selectedProgramId: track._id, selectedProgram: track.title }));
    setErrors((prev) => ({ ...prev, selectedProgram: undefined }));
  };

  const goNext = () => {
    const stepErrors = validateStep(step, form);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setStatus('submitting');
    setServerError('');
    try {
      const res = await axios.post(`${API_URL}/api/applications`, {
        fullName: form.fullName,
        fatherName: form.fatherName,
        cnic: form.cnic,
        phone: form.phone,
        email: form.email,
        address: form.address,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        lastQualification: form.lastQualification,
        selectedProgram: form.selectedProgram,
        preferredBatch: form.preferredBatch,
        hasLaptop: form.hasLaptop === 'yes',
      });
      setApplication(res.data.application);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success' && application) {
    return (
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-success-bg text-success-text flex items-center justify-center mx-auto text-3xl">✓</div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-neutral-900">Application Submitted!</h1>
        <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
          Thanks, {application.fullName.split(' ')[0]}. We've received your application for{' '}
          <span className="font-semibold text-neutral-900">{application.selectedProgram}</span>. A confirmation email has been sent to {application.email}.
        </p>
        <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200" style={{ borderRadius: 'var(--radius-standard)' }}>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Your Reference Number</p>
          <p className="mt-1 text-xl font-black te-mono text-primary-800">{application.referenceNumber}</p>
          <p className="mt-2 text-xs text-neutral-500">Keep this number to check your application status later.</p>
        </div>
        <p className="mt-6 text-sm text-neutral-600">We'll review your application and get back to you within 48 hours.</p>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900">Enroll Now</h1>
        <p className="mt-3 text-sm text-neutral-600">Apply to TITAN in a few simple steps. It takes about 5 minutes.</p>
      </div>

      <ProgressIndicator currentStep={step} />

      <div className="p-6 sm:p-8 border border-neutral-200 bg-white shadow-sm" style={{ borderRadius: 'var(--radius-standard)' }}>
        {/* Step 0: Personal Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-neutral-900">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input type="text" value={form.fullName} onChange={updateField('fullName')} className={inputClass} style={{ borderRadius: 'var(--radius-standard)' }} placeholder="Ali Raza" />
                {errors.fullName && <p className={errorClass}>{errors.fullName}</p>}
              </div>
              <div>
                <label className={labelClass}>Father's Name</label>
                <input type="text" value={form.fatherName} onChange={updateField('fatherName')} className={inputClass} style={{ borderRadius: 'var(--radius-standard)' }} placeholder="Muhammad Raza" />
                {errors.fatherName && <p className={errorClass}>{errors.fatherName}</p>}
              </div>
              <div>
                <label className={labelClass}>CNIC (13 digits)</label>
                <input type="text" inputMode="numeric" value={form.cnic} onChange={handleCnicChange} className={inputClass} style={{ borderRadius: 'var(--radius-standard)' }} placeholder="4230112345671" />
                {errors.cnic && <p className={errorClass}>{errors.cnic}</p>}
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input type="tel" value={form.phone} onChange={updateField('phone')} className={inputClass} style={{ borderRadius: 'var(--radius-standard)' }} placeholder="03001234567" />
                {errors.phone && <p className={errorClass}>{errors.phone}</p>}
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input type="email" value={form.email} onChange={updateField('email')} className={inputClass} style={{ borderRadius: 'var(--radius-standard)' }} placeholder="ali@domain.com" />
                {errors.email && <p className={errorClass}>{errors.email}</p>}
              </div>
              <div>
                <label className={labelClass}>Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={updateField('dateOfBirth')} className={inputClass} style={{ borderRadius: 'var(--radius-standard)' }} />
                {errors.dateOfBirth && <p className={errorClass}>{errors.dateOfBirth}</p>}
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select value={form.gender} onChange={updateField('gender')} className={inputClass} style={{ borderRadius: 'var(--radius-standard)' }}>
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className={errorClass}>{errors.gender}</p>}
              </div>
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <textarea value={form.address} onChange={updateField('address')} rows={2} className={`${inputClass} resize-none`} style={{ borderRadius: 'var(--radius-standard)' }} placeholder="House #, Street, City" />
              {errors.address && <p className={errorClass}>{errors.address}</p>}
            </div>
          </div>
        )}

        {/* Step 1: Education */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-neutral-900">Education</h2>
            <div>
              <label className={labelClass}>Last Qualification</label>
              <select value={form.lastQualification} onChange={updateField('lastQualification')} className={inputClass} style={{ borderRadius: 'var(--radius-standard)' }}>
                <option value="">Select...</option>
                {QUALIFICATIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              {errors.lastQualification && <p className={errorClass}>{errors.lastQualification}</p>}
            </div>
            <div>
              <label className={labelClass}>Do you have a laptop?</label>
              <div className="flex gap-3">
                {['yes', 'no'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, hasLaptop: val }))}
                    className={`flex-1 py-2.5 text-sm font-semibold border transition-colors ${
                      form.hasLaptop === val ? 'bg-primary-800 text-white border-primary-800' : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                    style={{ borderRadius: 'var(--radius-standard)' }}
                  >
                    {val === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
              {errors.hasLaptop && <p className={errorClass}>{errors.hasLaptop}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Program Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-neutral-900">Select Your Program</h2>

            {form.selectedProgram && (
              <div className="p-3 bg-accent-50 border border-accent-500/30 text-sm font-semibold text-primary-800" style={{ borderRadius: 'var(--radius-standard)' }}>
                Selected: {form.selectedProgram}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={programSearch}
                onChange={(e) => setProgramSearch(e.target.value)}
                placeholder="Search programs..."
                className={`${inputClass} sm:flex-1`}
                style={{ borderRadius: 'var(--radius-standard)' }}
              />
              <select value={programCategory} onChange={(e) => setProgramCategory(e.target.value)} className={inputClass} style={{ borderRadius: 'var(--radius-standard)' }}>
                {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredPrograms.length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-6">No programs match your search.</p>
              )}
              {filteredPrograms.map((track) => (
                <button
                  key={track._id}
                  type="button"
                  onClick={() => selectProgram(track)}
                  className={`w-full text-left p-3 border flex items-center justify-between gap-3 transition-colors ${
                    form.selectedProgramId === track._id ? 'border-primary-800 bg-primary-50/40' : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                  style={{ borderRadius: 'var(--radius-standard)' }}
                >
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{track.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{CATEGORY_LABELS[track.category]} · {track.duration}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${form.selectedProgramId === track._id ? 'border-primary-800 bg-primary-800' : 'border-neutral-300'}`}>
                    {form.selectedProgramId === track._id && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
            {errors.selectedProgram && <p className={errorClass}>{errors.selectedProgram}</p>}

            <div>
              <label className={labelClass}>Preferred Batch / Timing</label>
              <select value={form.preferredBatch} onChange={updateField('preferredBatch')} className={inputClass} style={{ borderRadius: 'var(--radius-standard)' }}>
                <option value="">No preference</option>
                {BATCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-neutral-900">Review & Submit</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500">Full Name</span>
                <span className="font-semibold text-neutral-900">{form.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500">Father's Name</span>
                <span className="font-semibold text-neutral-900">{form.fatherName}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500">CNIC</span>
                <span className="font-semibold text-neutral-900">{form.cnic}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500">Phone</span>
                <span className="font-semibold text-neutral-900">{form.phone}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500">Email</span>
                <span className="font-semibold text-neutral-900">{form.email}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500">Date of Birth</span>
                <span className="font-semibold text-neutral-900">{form.dateOfBirth}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500">Gender</span>
                <span className="font-semibold text-neutral-900 capitalize">{form.gender}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500">Address</span>
                <span className="font-semibold text-neutral-900 text-right max-w-[60%]">{form.address}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500">Last Qualification</span>
                <span className="font-semibold text-neutral-900">{form.lastQualification}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500">Has Laptop</span>
                <span className="font-semibold text-neutral-900">{form.hasLaptop === 'yes' ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500">Selected Program</span>
                <span className="font-semibold text-neutral-900 text-right max-w-[60%]">{form.selectedProgram}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-neutral-500">Preferred Batch</span>
                <span className="font-semibold text-neutral-900">{form.preferredBatch || 'No preference'}</span>
              </div>
            </div>

            {status === 'error' && <p className="text-xs text-danger-text">{serverError}</p>}
          </div>
        )}

        {/* Navigation Footer */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="px-5 py-2.5 text-sm font-semibold text-neutral-700 border border-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
            style={{ borderRadius: 'var(--radius-standard)' }}
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="px-6 py-2.5 text-sm font-bold text-white bg-primary-800 hover:bg-primary-900 transition-colors"
              style={{ borderRadius: 'var(--radius-standard)' }}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === 'submitting'}
              className="px-6 py-2.5 text-sm font-bold text-white bg-accent-600 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ borderRadius: 'var(--radius-standard)' }}
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrollNow;
