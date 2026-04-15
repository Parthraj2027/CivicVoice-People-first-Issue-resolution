
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const corsMiddleware = require('./middleware/corsMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');
const socialIssueRoutes = require('./routes/socialIssueRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const publicRoutes = require('./routes/publicRoutes');
const communityRoutes = require('./routes/communityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const alertRoutes = require('./routes/alertRoutes');

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/social-issues', socialIssueRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/alerts', alertRoutes);

app.get('/', (req, res) => {
  res.send('CivicVoice API running');
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
