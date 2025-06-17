require('dotenv').config(); // Load .env from root directory
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();

// Improved MongoDB connection with retry logic
const connectToDatabase = async (retries = 5) => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/superhero', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    if (retries > 0) {
      console.log(`Retrying connection in 5 seconds... (${retries} attempts left)`);
      setTimeout(() => connectToDatabase(retries - 1), 5000);
    } else {
      console.error('Failed to connect to MongoDB after multiple attempts');
      process.exit(1); // Exit with error
    }
  }
};

// Connect to MongoDB
connectToDatabase();

// Request logger middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Body parser setup - improved
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session setup with explicit error handling
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey123',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 3600000 // 1 hour
  }
}));

// Make user available in all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
const heroRoutes = require('./routes/superheroes');
const userRoutes = require('./routes/users');

app.use('/', heroRoutes);
app.use('/users', userRoutes);

// Catch-all error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Render the error page with details
  res.status(500).render('error', {
    error: 'Something went wrong',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later',
    returnUrl: '/',
    user: req.session && req.session.user ? req.session.user : null
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Consider graceful shutdown here if needed
});
