const mongoose = require('mongoose');
const generateSampleData = require('./utils/generateSampleData');
require('dotenv').config();

const setup = async () => {
  try {
    console.log('🚀 Starting Healthcare Appointment System Setup...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Generate sample data
    console.log('🌱 Generating sample data...');
    await generateSampleData();
    console.log('\n✅ Sample data generated successfully!\n');

    console.log('🎉 Setup completed successfully!\n');
    console.log('📋 Sample Login Credentials:');
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│  Admin: admin@healthcare.com / admin123    │');
    console.log('│  Patient: patient1@example.com / password123│');
    console.log('│  Doctor: doctor1@healthcare.com / doctor123│');
    console.log('└─────────────────────────────────────────────┘\n');

    console.log('🚀 You can now start the server with: npm run dev');
    console.log('🌐 Frontend should be started with: npm start (in frontend folder)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

setup();
