const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const generateSampleData = require('./utils/generateSampleData');

let mongod;

const quickStart = async () => {
  try {
    console.log('🚀 Quick Start - Using In-Memory Database');
    console.log('This is perfect for testing and development!\n');

    // Start in-memory MongoDB
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    console.log('📡 Starting in-memory MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to in-memory MongoDB');

    // Generate sample data
    console.log('🌱 Generating sample data...');
    await generateSampleData();
    console.log('✅ Sample data created!\n');

    console.log('🎉 Quick start completed successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│  Admin: admin@healthcare.com / admin123    │');
    console.log('│  Patient: patient1@example.com / password123│');
    console.log('│  Doctor: doctor1@healthcare.com / doctor123│');
    console.log('└─────────────────────────────────────────────┘\n');

    console.log('⚠️  Note: This uses in-memory database');
    console.log('   Data will be lost when you restart the server');
    console.log('   For persistent data, fix your MongoDB connection\n');

    console.log('🚀 Now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Quick start failed:', error);
    if (mongod) {
      await mongod.stop();
    }
    process.exit(1);
  }
};

// Handle cleanup
process.on('SIGINT', async () => {
  if (mongod) {
    await mongod.stop();
  }
  process.exit(0);
});

quickStart();
