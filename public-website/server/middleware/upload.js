const multer = require('multer');
const cloudinaryStorage = require('../utils/cloudinaryStorage');

// Course images and application documents used to live on local disk
// (multer.diskStorage) — that's an ephemeral filesystem on Railway/most
// PaaS hosts, wiped on every redeploy. Switched to Cloudinary so uploads
// actually survive a deploy. req.file(s).path is now the Cloudinary
// secure_url directly (see adminCourseController.js / applicationController.js
// — they used to build `/uploads/...` from req.file.filename, now they just
// store req.file.path as-is).

const storage = cloudinaryStorage({
  params: (req, file) => ({
    folder: 'titan-portal/courses',
    public_id: `course-${req.params.id}-${Date.now()}`,
    resource_type: 'image',
  }),
});

// Explicit allowlist rather than `mimetype.startsWith('image/')` — that
// would also admit image/svg+xml, and Cloudinary accounts created after
// Feb 2018 block delivery of SVG under resource_type 'image' by default
// (an XSS precaution), so an uploaded SVG would silently 403 on the site.
const COURSE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!COURSE_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new Error('Course image must be a JPG, PNG, WEBP, or GIF file.'));
    }
    cb(null, true);
  },
});

// Optional documents on the admission application form: a photo and both
// sides of the CNIC (front and back are separate fields — a CNIC has two
// sides and an applicant needs to be able to attach both, not just one).
// Same Cloudinary pattern as the course-image upload above, its own folder
// and mimetypes (a CNIC scan can reasonably be a PDF scan, not just a photo
// of the card — resource_type 'auto' lets Cloudinary store either kind).
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CNIC_SCAN_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const applicationStorage = cloudinaryStorage({
  params: (req, file) => ({
    folder: 'titan-portal/applications',
    public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    resource_type: 'auto',
  }),
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
