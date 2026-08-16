const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
for (const sub of ['resumes', 'photos', 'resources']) {
  const full = path.join(UPLOAD_ROOT, sub);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
}

const RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(UPLOAD_ROOT, file.fieldname === 'resume' ? 'resumes' : 'photos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (file.fieldname === 'resume' && !RESUME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Resume must be a PDF or Word document'));
  }
  if (file.fieldname === 'photo' && !PHOTO_TYPES.includes(file.mimetype)) {
    return cb(new Error('Photo must be a JPG, PNG, or WEBP image'));
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Course material a trainer shares with their students — deliberately more
// permissive than RESUME_TYPES/PHOTO_TYPES above (slides, docs, zipped
// project files, images all need to fit here), own storage dir, bigger
// size ceiling since these are teaching materials, not form uploads.
const RESOURCE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
];

const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(UPLOAD_ROOT, 'resources')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const resourceUpload = multer({
  storage: resourceStorage,
  fileFilter: (req, file, cb) => {
    if (!RESOURCE_TYPES.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type. Upload a PDF, Office document, image, or ZIP file.'));
    }
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

module.exports = upload;
module.exports.resourceUpload = resourceUpload;
