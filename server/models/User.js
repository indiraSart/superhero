const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters']
  },
  description: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say', ''],
    default: ''
  },
  favoriteHero: {
    type: String, 
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) {
      return next();
    }
    
    console.log('Hashing password for user:', this.username);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Method to check password validity - with better error handling
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!candidatePassword) {
      console.error('No password provided for comparison');
      return false;
    }
    
    console.log('Comparing passwords for user:', this.username);
    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log(`Password comparison result: ${result}`);
    return result;
  } catch (error) {
    console.error(`Error comparing passwords: ${error.message}`);
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);
