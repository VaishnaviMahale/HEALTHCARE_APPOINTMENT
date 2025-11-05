// Load environment variables with explicit path
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Debug logging
console.log('🔍 Debug: __dirname:', __dirname);
console.log('🔍 Debug: Current working directory:', process.cwd());
console.log('🔍 Debug: .env file path:', path.join(__dirname, '.env'));

// Check if .env file exists
const fs = require('fs');
const envPath = path.join(__dirname, '.env');
console.log('🔍 Debug: .env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('🔍 Debug: .env file size:', envContent.length, 'bytes');
  console.log('🔍 Debug: First line of .env:', envContent.split('\n')[0]);
}

console.log('🔍 Debug: MONGODB_URI value:', process.env.MONGODB_URI);
console.log('🔍 Debug: MONGODB_URI type:', typeof process.env.MONGODB_URI);
console.log('🔍 Debug: All env vars starting with MONGO:', 
  Object.keys(process.env).filter(key => key.includes('MONGO')));

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import services
const reminderService = require('./services/reminderService');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://healthcareUser:HealthCare%40123@cluster0.qeidxjx.mongodb.net/healthcare_appointment_db?retryWrites=true&w=majority&appName=Cluster0';
console.log('🔍 Using MongoDB URI:', mongoUri ? 'Found' : 'Not found');
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
    // Start reminder service after DB connection
    reminderService.startReminderSchedule();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Healthcare Appointment System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', medicalRecordRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;
