
// // const express = require('express');
// // const mongoose = require('mongoose');
// // const dotenv = require('dotenv');
// // const cors = require('cors');

// // dotenv.config();

// // const app = express();

// // // ✅ Middleware
// // app.use(cors());
// // app.use(express.json());

// // // ✅ Import routes
// // const routeRoutes = require('./routes/route');
// // const userRoutes = require('./routes/user');
// // const gpsRoutes = require('./routes/gps');

// // // ✅ Mount routes
// // app.use('/api/routes', routeRoutes);  // e.g., /api/routes/device, /stops
// // app.use('/api/users', userRoutes);    // e.g., /api/users/register
// // app.use('/api', gpsRoutes);           // e.g., /api/gps

// // // ✅ Connect to MongoDB and start server
// // mongoose
// //   .connect(process.env.MONGO_URI)
// //   .then(() => {
// //     console.log('✅ Connected to MongoDB');
// //     app.listen(5000, '0.0.0.0', () => {
// //       console.log('🚀 Server running on http://0.0.0.0:5000');
// //     });
// //   })
// //   .catch((err) => {
// //     console.error('❌ MongoDB connection error:', err);
// //   });


// const express = require('express');
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const cors = require('cors');

// dotenv.config();

// const app = express();

// // ✅ Middleware
// app.use(cors());
// app.use(express.json());

// // ✅ Import routes
// const routeRoutes = require('./routes/route');
// const userRoutes = require('./routes/user');
// const gpsRoutes = require('./routes/gps');

// // ✅ Mount routes
// app.use('/api/routes', routeRoutes);  // /api/routes/deviceId etc.
// app.use('/api/users', userRoutes);    // /api/users/register etc.
// app.use('/api/gps', gpsRoutes);       // ✅ /api/gps/:deviceId

// // ✅ Connect to MongoDB and start server
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log('✅ Connected to MongoDB');
//     app.listen(5000, '0.0.0.0', () => {
//       console.log('🚀 Server running on http://0.0.0.0:5000');
//     });
//   })
//   .catch((err) => {
//     console.error('❌ MongoDB connection error:', err);
//   });




const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// ✅ Load environment variables
dotenv.config();

// ✅ Initialize app
const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Import route handlers
const routeRoutes = require('./routes/route');  // For bus routes
const userRoutes = require('./routes/user');    // For register/login
const gpsRoutes = require('./routes/gps');      // For GPS data

// ✅ Mount routes under /api
app.use('/api/routes', routeRoutes);  // /api/routes/deviceId, /bus/:busNumber
app.use('/api/users', userRoutes);    // /api/users/register, /login
app.use('/api/gps', gpsRoutes);       // /api/gps/location?deviceId=...

// ✅ Connect to MongoDB and start server
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log('✅ Connected to MongoDB');
//     app.listen(5000, '0.0.0.0', () => {
//       console.log('🚀 Server running at http://0.0.0.0:5000');
//     });
//   })
//   .catch((err) => {
//     console.error('❌ MongoDB connection error:', err);
//   });


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(5000, '0.0.0.0', () => {
      console.log('🚀 Server running at http://0.0.0.0:5000');
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
