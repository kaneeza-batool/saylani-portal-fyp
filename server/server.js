require('dotenv').config();

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
