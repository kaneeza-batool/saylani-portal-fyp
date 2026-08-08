require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const studentRoutes = require('./routes/studentRoutes');
const campusRoutes = require('./routes/campusRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const courseRoutes = require('./routes/courseRoutes');
const employerRoutes = require('./routes/employerRoutes');
const subAdminRoutes = require('./routes/subAdminRoutes');
const slotRoutes = require('./routes/slotRoutes');
const quizRoutes = require('./routes/quizRoutes');
const jobRoutes = require('./routes/jobRoutes');
const trainerAttendanceRoutes = require('./routes/trainerAttendanceRoutes');
const attendanceRequestRoutes = require('./routes/attendanceRequestRoutes');
const studentAttendanceRoutes = require('./routes/studentAttendanceRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/admin', dashboardRoutes);
app.use('/api/admin/students', studentRoutes);
app.use('/api/admin/campuses', campusRoutes);
app.use('/api/admin/trainers', trainerRoutes);
app.use('/api/admin/courses', courseRoutes);
app.use('/api/admin/employers', employerRoutes);
app.use('/api/admin/subadmins', subAdminRoutes);
app.use('/api/admin/slots', slotRoutes);
app.use('/api/admin/quizzes', quizRoutes);
app.use('/api/admin/jobs', jobRoutes);
app.use('/api/admin/trainer-attendance', trainerAttendanceRoutes);
app.use('/api/admin/attendance-requests', attendanceRequestRoutes);
app.use('/api/admin/student-attendance', studentAttendanceRoutes);
app.use('/api/admin/audit-logs', auditLogRoutes);
app.use('/api/admin/reports', reportsRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    dbState: mongoose.connection.readyState,
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
