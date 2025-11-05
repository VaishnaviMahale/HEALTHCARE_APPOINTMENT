const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging .env file...\n');

// Read the .env file
const envPath = path.join(__dirname, '.env');
console.log('Reading from:', envPath);

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('📄 Raw file content (first 200 characters):');
    console.log(JSON.stringify(content.substring(0, 200)));
    
    console.log('\n📝 Line by line analysis:');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        if (line.includes('MONGODB_URI')) {
            console.log(`Line ${index + 1}: Found MONGODB_URI line`);
            console.log(`  Length: ${line.length}`);
            console.log(`  Starts with: ${JSON.stringify(line.substring(0, 20))}`);
            console.log(`  Contains equals: ${line.includes('=')}`);
            
            if (line.includes('=')) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=');
                console.log(`  Key: "${key}"`);
                console.log(`  Value length: ${value.length}`);
                console.log(`  Value starts with: ${JSON.stringify(value.substring(0, 30))}`);
            }
        }
    });
} else {
    console.log('❌ .env file not found');
}

// Now try to load with dotenv
console.log('\n🔧 Loading with dotenv...');
require('dotenv').config();

console.log('Result:');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI length:', process.env.MONGODB_URI?.length || 0);

if (process.env.MONGODB_URI) {
    console.log('✅ SUCCESS: Environment variable loaded');
} else {
    console.log('❌ FAILED: Environment variable not loaded');
}
