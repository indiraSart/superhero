const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Superhero = require('../models/superhero');
const Favorite = require('../models/Favorite');

//to check if user is authenticated
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
    console.log('Registration attempt with data:', { 
      username: req.body.username,
      email: req.body.email,
      passwordProvided: !!req.body.password 
    });
    
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      console.log('Missing required fields');
      return res.render('register', { error: 'All fields are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('User already exists:', existingUser.username);
      return res.render('register', { error: 'Username or email already exists' });
    }
    
    // Create new user
    console.log('Creating new user');
    const user = new User({ username, email, password });
    
    try {
      await user.save();
      console.log('User registered successfully:', username);
      return res.redirect('/users/login');
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      return res.render('register', { error: `Registration failed: ${saveError.message}` });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.render('register', { error: 'Registration failed - please try again' });
  }
});

// Login routes
router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt with data:', { 
      username: req.body.username,
      passwordProvided: !!req.body.password 
    });
    
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.render('login', { error: 'Username and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.render('login', { error: 'Invalid username or password' });
    }
    
    console.log(`User found: ${username}`);
    
    // Check password
    try {
      const isMatch = await user.comparePassword(password);
      console.log(`Password match: ${isMatch}`);
      
      if (!isMatch) {
        return res.render('login', { error: 'Invalid username or password' });
      }
      
      // Create a minimal session
      req.session.user = {
        id: user._id,
        username: user.username,
        email: user.email
      };
      
      console.log('Session user set:', req.session.user);
      
      return req.session.save(err => {
        if (err) {
          console.error('Session save error:', err);
          return res.render('login', { error: 'Login successful but session error occurred' });
        }
        console.log('Session saved, redirecting to profile');
        return res.redirect('/users/profile');
      });
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      return res.render('login', { error: 'Error verifying password' });
    }
  } catch (error) {
    console.error('Login error details:', error);
    return res.render('login', { error: 'Login failed - please try again' });
  }
});

router.get('/test', (req, res) => {
  res.send('User routes are working!');
});

// Profile route with better validation and error handling
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    console.log('Profile route accessed with session user ID:', req.session.user.id);
    
    // Get the user data
    const userData = await User.findById(req.session.user.id);
    if (!userData) {
      console.error('User not found in database');
      req.session.destroy();
      return res.redirect('/users/login');
    }
    
    // Set basic profile data that won't fail
    const templateData = {
      user: userData,
      heroes: [],
      favoriteHero: null,
      message: req.query.message,
      userFavorites: []
    };
    
    // Get user's favorites with superhero details
    try {
      const favorites = await Favorite.find({ userId: userData._id }).sort('-createdAt');
      
      if (favorites.length > 0) {
        // Get all superhero details at once
        const superheroIds = favorites.map(fav => fav.superheroId);
        const heroes = await Superhero.find({ id: { $in: superheroIds } });
        
        // Map favorites to include hero details
        templateData.userFavorites = favorites.map(fav => {
          const hero = heroes.find(h => h.id === fav.superheroId);
          return {
            favorite: fav,
            superhero: hero
          };
        }).filter(item => item.superhero); // Filter out any missing heroes
      }
    } catch (favError) {
      console.error('Error loading user favorites:', favError);
    }
    
    // Try to get heroes, but don't fail if it doesn't work
    try {
      templateData.heroes = await Superhero.find().select('id name').sort('name');
    } catch (heroError) {
      console.error('Error loading heroes (continuing anyway):', heroError);
    }
    
    // Try to get favorite hero if one is set
    if (userData.favoriteHero) {
      try {
        templateData.favoriteHero = await Superhero.findOne({ id: userData.favoriteHero });
      } catch (favError) {
        console.error('Error loading favorite hero (continuing anyway):', favError);
      }
    }
    
    return res.render('profile', templateData);
  } catch (error) {
    console.error('Error in profile route:', error);
    return res.render('error', {
      error: 'Profile Error',
      message: 'Unable to load your profile. Please try logging in again.',
      returnUrl: '/users/login'
    });
  }
});

// Update profile route - completely revised
router.post('/update-profile', isAuthenticated, async (req, res) => {
  console.log('Update profile route reached');
  console.log('Request body:', req.body);
  
  try {
    if (!req.body) {
      console.error('No request body received');
      return res.status(400).send('No data received');
    }
    
    const { description, gender, favoriteHero } = req.body;
    console.log(`Updating user ${req.session.user.id} with:`, { description, gender, favoriteHero });
    
    // Prepare update object with only the fields that should be updated
    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (gender !== undefined) updateData.gender = gender;
    if (favoriteHero !== undefined) updateData.favoriteHero = favoriteHero;
    
    console.log('Final update data:', updateData);
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      console.error('User not found for update');
      return res.status(404).send('User not found');
    }
    
    console.log('User updated successfully:', updatedUser);
    
    // Update session user data
    req.session.user = {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      description: updatedUser.description,
      gender: updatedUser.gender,
      favoriteHero: updatedUser.favoriteHero
    };
    
    // Redirect to profile page with success message
    res.redirect('/users/profile?message=Profile+updated+successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).send(`Error updating profile: ${error.message}`);
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
