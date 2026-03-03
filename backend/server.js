const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import route handlers
const routeRoutes = require('./routes/route');  // bus routes
const userRoutes = require('./routes/user');    // register/login
const gpsRoutes = require('./routes/gps');      // GPS data

// Mount routes
app.use('/api/routes', routeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gps', gpsRoutes);

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
      console.log(`🚀 Server running at http://0.0.0.0:${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
