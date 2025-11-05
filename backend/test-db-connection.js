const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('Connection string:', process.env.MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔧 Fix suggestions:');
      console.log('1. Check your username and password in the connection string');
      console.log('2. Ensure your IP address is whitelisted in MongoDB Atlas');
      console.log('3. Verify the database user has proper permissions');
      console.log('4. Try using local MongoDB: mongodb://127.0.0.1:27017/healthcare_appointment_db');
    }
    
    process.exit(1);
  }
};

testConnection();
