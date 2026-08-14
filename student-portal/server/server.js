require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const feeRoutes = require('./routes/feeRoutes');
const quizRoutes = require('./routes/quizRoutes');
const progressRoutes = require('./routes/progressRoutes');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const agendaRoutes = require('./routes/agendaRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const skillPassportRoutes = require('./routes/skillPassportRoutes');
const questionRoutes = require('./routes/questionRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
// Bumped from the default 100kb so base64-encoded avatar uploads fit —
// see studentController's simplification note on avatar storage.
app.use(express.json({ limit: '6mb' }));
app.use(cookieParser());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignment', assignmentRoutes);
app.use('/api/fee', feeRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/skill-passport', skillPassportRoutes);
app.use('/api/questions', questionRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

connectDB().catch((err) => {
  console.error('MongoDB connection failed:', err.message);
});
