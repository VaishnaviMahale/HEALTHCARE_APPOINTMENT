// Test environment variables
require('dotenv').config();

console.log('🔍 Testing Environment Variables...\n');

console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT FOUND');
console.log('PORT:', process.env.PORT || 'NOT FOUND');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 
    'Found: ' + process.env.MONGODB_URI.substring(0, 20) + '...' : 
    'NOT FOUND');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found (length: ' + process.env.JWT_SECRET.length + ')' : 'NOT FOUND');

console.log('\n📁 Current working directory:', process.cwd());
console.log('📄 Looking for .env file at:', process.cwd() + '/.env');

// Check if .env file exists
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
    console.log('✅ .env file found');
    
    // Read and display first few lines (without sensitive data)
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n').slice(0, 5);
    console.log('\n📝 First few lines of .env file:');
    lines.forEach((line, index) => {
        if (line.trim() && !line.startsWith('#')) {
            const [key] = line.split('=');
            console.log(`${index + 1}: ${key}=***`);
        } else {
            console.log(`${index + 1}: ${line}`);
        }
    });
} else {
    console.log('❌ .env file NOT found at expected location');
}

console.log('\n🔧 If MONGODB_URI is "NOT FOUND", check:');
console.log('1. .env file is in the backend folder');
console.log('2. No spaces around = in MONGODB_URI=value');
console.log('3. No quotes around the connection string');
console.log('4. File is saved as .env (not .env.txt)');
