const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  superheroId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to ensure a user can't favorite the same hero twice
favoriteSchema.index({ userId: 1, superheroId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
