const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Superhero = require('../models/superhero');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Add a superhero to favorites
router.post('/add', isAuthenticated, async (req, res) => {
  try {
    const { superheroId } = req.body;
    if (!superheroId) {
      return res.status(400).json({ error: 'Superhero ID is required' });
    }

    // Check if hero exists
    const hero = await Superhero.findOne({ id: superheroId });
    if (!hero) {
      return res.status(404).json({ error: 'Superhero not found' });
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
      userId: req.session.user.id,
      superheroId
    });

    if (existingFavorite) {
      return res.status(409).json({ error: 'Superhero already in favorites' });
    }

    // Add to favorites
    const favorite = new Favorite({
      userId: req.session.user.id,
      superheroId,
      description: req.body.description || ''
    });

    await favorite.save();
    res.status(201).json({ message: 'Added to favorites', favorite });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// Remove from favorites
router.delete('/remove/:superheroId', isAuthenticated, async (req, res) => {
  try {
    const { superheroId } = req.params;
    
    const result = await Favorite.findOneAndDelete({
      userId: req.session.user.id,
      superheroId
    });

    if (!result) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// Update favorite description
router.put('/update/:superheroId', isAuthenticated, async (req, res) => {
  try {
    const { superheroId } = req.params;
    const { description } = req.body;

    if (description === undefined) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const favorite = await Favorite.findOneAndUpdate(
      { userId: req.session.user.id, superheroId },
      { description },
      { new: true }
    );

    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Description updated', favorite });
  } catch (error) {
    console.error('Error updating favorite:', error);
    res.status(500).json({ error: 'Failed to update favorite' });
  }
});

// Get user's favorites
router.get('/user', isAuthenticated, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.session.user.id })
      .sort('-createdAt');
    
    // Get superhero details for each favorite
    const favoritesWithDetails = await Promise.all(
      favorites.map(async (fav) => {
        const hero = await Superhero.findOne({ id: fav.superheroId });
        return {
          favorite: fav,
          superhero: hero
        };
      })
    );
    
    res.json(favoritesWithDetails);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Get top favorites across all users
router.get('/top/:limit', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    
    // Aggregate to count favorites by superhero
    const topFavorites = await Favorite.aggregate([
      { $group: { 
          _id: '$superheroId', 
          count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);
    
    // Get superhero details for each top favorite
    const topFavoritesWithDetails = await Promise.all(
      topFavorites.map(async (item) => {
        const hero = await Superhero.findOne({ id: item._id });
        return {
          superhero: hero,
          count: item.count
        };
      })
    );
    
    res.json(topFavoritesWithDetails);
  } catch (error) {
    console.error('Error fetching top favorites:', error);
    res.status(500).json({ error: 'Failed to fetch top favorites' });
  }
});

module.exports = router;
