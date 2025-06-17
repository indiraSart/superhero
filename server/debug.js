/**
 * Debug utility for testing database connectivity and models
 *
 * Run with: node debug.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Superhero = require('./models/superhero');

const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

async function runDiagnostics() {
  try {
    console.log('=== RUNNING DIAGNOSTICS ===');
    
    // TEST 1: MongoDB Connection
    console.log('\n1. Testing MongoDB Connection...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/superhero', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    
    // TEST 2: Check if User model works
    console.log('\n2. Testing User model...');
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users in database`);
    
    // TEST 3: Check if bcrypt works
    console.log('\n3. Testing bcrypt...');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('testpassword', salt);
    const match = await bcrypt.compare('testpassword', hash);
    console.log(`bcrypt hash created: ${hash.substring(0, 10)}...`);
    console.log(`bcrypt comparison works: ${match}`);
    
    // TEST 4: Testing User creation
    console.log('\n4. Testing User creation...');
    try {
      // First, delete test user if it exists
      await User.deleteOne({ username: testUser.username });
      
      // Create a test user
      const user = new User(testUser);
      await user.save();
      console.log('✅ Test user created successfully');
      
      // Clean up
      await User.deleteOne({ username: testUser.username });
      console.log('✅ Test user removed');
    } catch (userError) {
      console.error('❌ Error creating test user:', userError);
    }
    
    // TEST 5: Check if Superhero model works
    console.log('\n5. Testing Superhero model...');
    const heroCount = await Superhero.countDocuments();
    console.log(`Found ${heroCount} superheroes in database`);
    
    console.log('\n=== DIAGNOSTICS COMPLETE ===');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

// Run the diagnostics
runDiagnostics();
