const fs = require('fs');
const path = require('path');

console.log('📝 Creating .env file...');

const envContent = `# Database Configuration
MONGODB_URI=your_mongodb_connection_string_here

# JWT Configuration
JWT_SECRET=your_secure_random_jwt_secret_here_min_32_characters
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Frontend URL
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100`;

const envPath = path.join(__dirname, '.env');

try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ .env file created successfully at:', envPath);

    // Test loading
    require('dotenv').config();

    console.log('\n🧪 Testing variables:');
    console.log('MONGODB_URI loaded:', !!process.env.MONGODB_URI);
    console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
    console.log('PORT loaded:', !!process.env.PORT);

    if (process.env.MONGODB_URI) {
        console.log('\n✅ SUCCESS! Environment variables are working');
        console.log('🚀 You can now run: npm run dev');
    } else {
        console.log('\n❌ Still having issues loading environment variables');
    }

} catch (error) {
    console.error('❌ Error creating .env file:', error.message);
}
