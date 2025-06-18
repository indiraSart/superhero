const express = require('express');
const router = express.Router();
const Superhero = require('../models/superhero');
const Favorite = require('../models/Favorite');

//to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/users/login');
};

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
    const heroes = await Superhero.find(query).limit(30);
    console.log(`Found ${heroes.length} heroes`);
    
    // Get top 10 favorites
    let topFavorites = [];
    try {
      const topFavoriteCounts = await Favorite.aggregate([
        { $group: { _id: '$superheroId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      // Get superhero details for each favorite
      if (topFavoriteCounts.length > 0) {
        const superheroIds = topFavoriteCounts.map(item => item._id);
        const topHeroes = await Superhero.find({ id: { $in: superheroIds } });
        
        topFavorites = topFavoriteCounts.map(item => {
          const hero = topHeroes.find(h => h.id === item._id);
          return { superhero: hero, count: item.count };
        }).filter(item => item.superhero); // Filter out any that didn't match
      }
    } catch (favError) {
      console.error('Error fetching top favorites:', favError);
    }
    
    // Check which heroes are favorited by the current user
    let userFavorites = [];
    if (req.session.user) {
      userFavorites = await Favorite.find({ userId: req.session.user.id }).select('superheroId');
      userFavorites = userFavorites.map(fav => fav.superheroId);
    }
    
    res.render('landing', { heroes, search, topFavorites, userFavorites });
  } catch (error) {
    console.error('Error loading heroes:', error);
    res.status(500).send(`Failed to load superheroes: ${error.message}`);
  }
});

// GET / detailed view of one hero
router.get('/superhero/:id', async (req, res) => {
  try {
    const hero = await Superhero.findOne({ id: req.params.id });
    if (!hero) {
      return res.status(404).send('Superhero not found');
    }
    
    // Check if this hero is in user's favorites
    let isFavorite = false;
    let favoriteDetails = null;
    
    if (req.session.user) {
      favoriteDetails = await Favorite.findOne({ 
        userId: req.session.user.id,
        superheroId: hero.id
      });
      
      isFavorite = !!favoriteDetails;
    }
    
    res.render('superhero', { hero, isFavorite, favoriteDetails });
  } catch (error) {
    res.status(500).send('Failed to load superhero details');
  }
});

// Profile route - redirect to the correct profile URL
router.get('/profile', isAuthenticated, (req, res) => {
  res.redirect('/users/profile');
});

module.exports = router;
