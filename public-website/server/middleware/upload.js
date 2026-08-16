const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/courses');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `course-${req.params.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  },
});

// Optional documents on the admission application form: a photo and both
// sides of the CNIC (front and back are separate fields — a CNIC has two
// sides and an applicant needs to be able to attach both, not just one).
// Same disk-storage/size-cap pattern as the course-image upload above, its
// own subfolder and mimetypes (a CNIC scan can reasonably be a PDF scan,
// not just a photo of the card).
const applicationsDir = path.join(__dirname, '../uploads/applications');
if (!fs.existsSync(applicationsDir)) {
  fs.mkdirSync(applicationsDir, { recursive: true });
}

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CNIC_SCAN_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const applicationStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, applicationsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const applicationUpload = multer({
  storage: applicationStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'photo' && !PHOTO_TYPES.includes(file.mimetype)) {
      return cb(new Error('Photo must be a JPG, PNG, or WEBP image.'));
    }
    if ((file.fieldname === 'cnicFront' || file.fieldname === 'cnicBack') && !CNIC_SCAN_TYPES.includes(file.mimetype)) {
      return cb(new Error('CNIC scan must be a JPG, PNG, WEBP, or PDF file.'));
    }
    cb(null, true);
  },
});

module.exports = upload;
module.exports.applicationUpload = applicationUpload;
