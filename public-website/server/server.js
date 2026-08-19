require('dotenv').config();

// public-website now creates Student documents directly in titan-portal —
// the same shared local MongoDB the main app (server/.env) and
// student-portal (student-portal/server/.env) both point at during local
// dev — so a localhost/127.0.0.1 target here is expected, not a
// misconfiguration. Only refuse to boot with no target at all.
const mongoUri = process.env.MONGO_URI || '';
if (!mongoUri) {
  console.error(
    '\n[FATAL] MONGO_URI is missing.\n' +
      'Set MONGO_URI in public-website/server/.env. See .env.example for the required shape.\n'
  );
  process.exit(1);
}

const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const contactRoutes = require('./routes/contactRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const entryTestRoutes = require('./routes/entryTestRoutes');
const resultRoutes = require('./routes/resultRoutes');
const idCardRoutes = require('./routes/idCardRoutes');
const courseRoutes = require('./routes/courseRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminCourseRoutes = require('./routes/adminCourseRoutes');
const adminEntryTestRoutes = require('./routes/adminEntryTestRoutes');
const adminResultRoutes = require('./routes/adminResultRoutes');
const adminIdCardRoutes = require('./routes/adminIdCardRoutes');
const adminContactRoutes = require('./routes/adminContactRoutes');
const enrollmentMetaRoutes = require('./routes/enrollmentMetaRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
// New course-image/application uploads go to Cloudinary now (see
// middleware/upload.js) — this only still serves whatever pre-existing
// files happen to be sitting in ./uploads from before that migration.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/contact', contactRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/entry-test', entryTestRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/id-cards', idCardRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/courses', adminCourseRoutes);
app.use('/api/admin/entry-test', adminEntryTestRoutes);
app.use('/api/admin/results', adminResultRoutes);
app.use('/api/admin/id-cards', adminIdCardRoutes);
app.use('/api/admin/contact-submissions', adminContactRoutes);
app.use('/api', enrollmentMetaRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5200;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

connectDB().catch((err) => {
  console.error('MongoDB connection failed:', err.message);
});
