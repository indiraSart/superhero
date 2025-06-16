const express = require('express');
const router = express.Router();
const Superhero = require('../models/Superhero');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/users/login');
};

// GET / → homepage with 20 superheroes
router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    let query = {};
    
    if (search) {
      query = { 
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { 'biography.fullName': { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    console.log('Searching for heroes with query:', query);
    const heroes = await Superhero.find(query).limit(20);
    console.log(`Found ${heroes.length} heroes`);
    
    res.render('landing', { heroes, search });
  } catch (error) {
    console.error('Error loading heroes:', error);
    res.status(500).send(`Failed to load superheroes: ${error.message}`);
  }
});

// GET /superhero/:id → detailed view of one hero
router.get('/superhero/:id', async (req, res) => {
  try {
    const hero = await Superhero.findOne({ id: req.params.id });
    if (!hero) {
      return res.status(404).send('Superhero not found');
    }
    res.render('superhero', { hero });
  } catch (error) {
    res.status(500).send('Failed to load superhero details');
  }
});

// Profile route - redirect to the correct profile URL
router.get('/profile', isAuthenticated, (req, res) => {
  res.redirect('/users/profile');
});

module.exports = router;
