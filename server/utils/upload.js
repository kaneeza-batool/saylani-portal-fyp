const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
for (const sub of ['resumes', 'photos']) {
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

module.exports = upload;
