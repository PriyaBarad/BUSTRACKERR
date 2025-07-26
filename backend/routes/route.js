// const express = require('express');
// const router = express.Router();
// const Route = require('../models/Route'); // ✅ Import the model

// // ✅ Fetch all unique stops from DB
// router.get('/stops', async (req, res) => {
//   try {
//     const routes = await Route.find({}, 'stops'); // Only fetch 'stops' field
//     let allStops = [];

//     routes.forEach(route => {
//       allStops = allStops.concat(route.stops);
//     });

//     // Get unique stops
//     const uniqueStops = [...new Set(allStops)];

//     res.status(200).json({ stops: uniqueStops });
//   } catch (err) {
//     console.error('Error fetching stops:', err);
//     res.status(500).json({ error: 'Failed to fetch stops from database' });
//   }
// });

// module.exports = router;

// routes/route.js
const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const Gps = require('../models/Gps');

router.get('/stops', async (req, res) => {
  try {
    const routes = await Route.find();
    console.log('🛠 All Routes:', routes); // ✅ Add this

    const sources = [...new Set(routes.map(r => r.source))];
    const destinations = [...new Set(routes.map(r => r.destination))];

    console.log('✅ Sources:', sources);
    console.log('✅ Destinations:', destinations);

    res.json({ sources, destinations });
  } catch (err) {
    console.error('❌ Error fetching stops:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/search', async (req, res) => {
  const { source, destination } = req.query;

  try {
    const matchedRoutes = await Route.find({ source, destination });
    res.json(matchedRoutes);
  } catch (err) {
    console.error('❌ Error fetching routes:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// router.get('/gps/:deviceId', async (req, res) => {
//   try {
//     const latest = await Gps.findOne({ deviceId: req.params.deviceId }).sort({ timestamp: -1 });

//     if (!latest) {
//       return res.status(404).json({ message: 'No location found' });
//     }

//     res.json({
//       latitude: latest.latitude,
//       longitude: latest.longitude,
//       timestamp: latest.timestamp
//     });
//   } catch (error) {
//     console.error('❌ GPS fetch error:', error.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// router.get('/deviceId', async (req, res) => {
//   const { busNumber } = req.query;

//   if (!busNumber) {
//     return res.status(400).json({ error: 'Missing busNumber' });
//   }

//   try {
//     const route = await Route.findOne({ busNumber });

//     if (!route) {
//       return res.status(404).json({ error: 'Bus not found' });
//     }

//     res.json({ deviceId: route.deviceId });
//   } catch (error) {
//     console.error('❌ Error fetching deviceId:', error.message);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


router.get('/deviceId', async (req, res) => {
  const { busNumber } = req.query;

  if (!busNumber) {
    return res.status(400).json({ error: 'Missing busNumber' });
  }

  try {
    const route = await Route.findOne({ busNumber });

    if (!route) {
      return res.status(404).json({ error: 'Bus not found' });  // ← here
    }

    res.json({ deviceId: route.deviceId });
  } catch (error) {
    console.error('❌ Error fetching deviceId:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/bus/:busNumber', async (req, res) => {
  try {
    const busNumber = req.params.busNumber;
    const route = await Route.findOne({ busNumber });

    if (!route) return res.status(404).json({ error: 'Route not found' });

    res.json(route);
  } catch (err) {
    console.error('Error fetching route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/all', async (req, res) => {
  try {
    const allRoutes = await Route.find();
    res.json(allRoutes);
  } catch (err) {
    console.error('❌ Error fetching all routes:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
