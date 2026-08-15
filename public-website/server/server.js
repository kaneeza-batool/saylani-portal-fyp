require('dotenv').config();

// Refuse to boot against a local database rather than silently write demo
// data there — this app now runs on the shared MongoDB Atlas cluster the
// other TITAN apps use (its own database within that cluster, not shared
// collections — see config/db.js), and a localhost/127.0.0.1 target here
// is always a misconfigured .env, never an intentional local-dev setup.
const mongoUri = process.env.MONGO_URI || '';
if (!mongoUri || /^mongodb(\+srv)?:\/\/[^/]*(localhost|127\.0\.0\.1)/i.test(mongoUri)) {
  console.error(
    '\n[FATAL] MONGO_URI is missing or points at a local database (localhost/127.0.0.1).\n' +
      'This server requires the shared MongoDB Atlas connection string — a local mongod\n' +
      'is not a valid target, even for local development.\n\n' +
      'Set MONGO_URI in public-website/server/.env to the real Atlas connection string\n' +
      '(ask a teammate for it — never invent one). See .env.example for the required shape.\n'
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

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/contact', contactRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/entry-test', entryTestRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/id-cards', idCardRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/courses', adminCourseRoutes);

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

connectDB().catch((err) => {
  console.error('MongoDB connection failed:', err.message);
});
