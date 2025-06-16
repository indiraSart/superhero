const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/users/login');
};

// Register routes
router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.render('register', { error: 'Username or email already exists' });
    }
    
    // Create new user
    const user = new User({ username, email, password });
    await user.save();
    
    res.redirect('/users/login');
  } catch (error) {
    res.render('register', { error: 'Registration failed' });
  }
});

// Login routes
router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Login attempt for username: ${username}`);
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.render('login', { error: 'Invalid username or password' });
    }
    
    console.log(`User found: ${username}`);
    
    // Check password
    const isMatch = await user.comparePassword(password);
    console.log(`Password match: ${isMatch}`);
    
    if (!isMatch) {
      return res.render('login', { error: 'Invalid username or password' });
    }
    
    // Save user to session
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };
    
    console.log(`User authenticated: ${username}`);
    res.redirect('/users/profile');
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    res.render('login', { error: `Login failed: ${error.message}` });
  }
});

// Profile route
router.get('/profile', isAuthenticated, (req, res) => {
  res.render('profile', { user: req.session.user });
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
