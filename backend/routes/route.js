const express = require('express');
const router = express.Router();
// const mongoose = require("mongoose"); // removed unused import

const Route = require('../models/Route');
const BusRoute = require('../models/BusRoute');
const Bus = require('../models/Bus');
const Gps = require('../models/gps');
const BusPos = require('../models/BusPos');
const PosMachine = require('../models/PosMachine');

// ✅ Get all unique sources and destinations
router.get('/stops', async (req, res) => {
  try {
    const routes = await Route.find();
    const sources = [...new Set(routes.map(r => r.source))];
    const destinations = [...new Set(routes.map(r => r.destination))];
    res.json({ sources, destinations });
  } catch (err) {
    console.error('❌ Error fetching stops:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ Search route by source & destination
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

// ✅ Get all routes
router.get('/all', async (req, res) => {
  try {
    const allRoutes = await Route.find();
    res.json(allRoutes);
  } catch (err) {
    console.error('❌ Error fetching all routes:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// ✅ Get all buses on a particular route
router.get('/busroutes', async (req, res) => {
  const { source, destination } = req.query;
  try {
    const matchedRoute = await Route.findOne({
      source: source?.trim(),
      destination: destination?.trim(),
    });

    if (!matchedRoute) return res.json([]);

    const busRoutes = await BusRoute.find({ route: matchedRoute._id });

    const results = [];
    for (const busRoute of busRoutes) {
      const bus = await Bus.findById(busRoute.bus);
      if (bus) {
        results.push({
          busNumber: bus.busNumber,
          via: matchedRoute.via,
          source: matchedRoute.source,
          destination: matchedRoute.destination,
          timings: busRoute.timings,
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('❌ Error fetching bus route info:', error);
    res.status(500).send('Server Error');
  }
});



// ✅ Get deviceId using busNumber
router.get('/device-from-bus', async (req, res) => {
  const { busNumber } = req.query;

  try {
    const bus = await Bus.findOne({ busNumber });
    if (!bus) return res.status(404).json({ error: 'Bus not found' });

    const busPos = await BusPos.findOne({ bus: bus._id });
    if (!busPos) return res.status(404).json({ error: 'BusPos entry not found' });

    const pos = await PosMachine.findById(busPos.posMachine);
    if (!pos) return res.status(404).json({ error: 'POS Machine not found' });

    res.json({ deviceId: pos.deviceId });
  } catch (error) {
    console.error('❌ Error in device-from-bus:', error);
    res.status(500).json({ error: 'Server error' });
  }
});




// ✅ Fetch stops and deviceId by busNumber
router.get('/fetch-stops', async (req, res) => {
  const { busNumber } = req.query;

  try {
    const bus = await Bus.findOne({ busNumber });
    if (!bus) return res.status(404).json({ error: 'Bus not found' });

    const busRoute = await BusRoute.findOne({ bus: bus._id });
    if (!busRoute) return res.status(404).json({ error: 'BusRoute not found' });

    const route = await Route.findById(busRoute.route);
    if (!route) return res.status(404).json({ error: 'Route not found for this bus' });

    const busPos = await BusPos.findOne({ bus: bus._id });
    const posMachine = busPos && await PosMachine.findById(busPos.posMachine);
    const deviceId = posMachine?.deviceId || null;

    res.json({
      busNumber: bus.busNumber,
      source: route.source,
      via: route.via,
      destination: route.destination,
      stops: route.stops,
      deviceId,
    });

  } catch (error) {
    console.error('❌ Error in /fetch-stops:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});



// ✅ Fixed Route: Get live location of a bus
router.get('/location/:busNumber', async (req, res) => {
  try {
    const { busNumber } = req.params;
    console.log(`🚌 Fetching location for busNumber: ${busNumber}`);

    const bus = await Bus.findOne({ busNumber });
    if (!bus) {
      console.log('❌ Bus not found');
      return res.status(404).json({ error: 'Bus not found' });
    }
    console.log('✅ Found Bus:', bus._id);

    const busPos = await BusPos.findOne({ bus: bus._id });
    if (!busPos) {
      console.log('❌ BusPos not found');
      return res.status(404).json({ error: 'BusPos not found' });
    }
    console.log('✅ Found BusPos:', busPos);

    const posMachine = await PosMachine.findById(busPos.posMachine);
    if (!posMachine) {
      console.log('❌ PosMachine not found');
      return res.status(404).json({ error: 'PosMachine not found' });
    }
    console.log('✅ Found PosMachine with deviceId:', posMachine.deviceId);

    const gpsData = await Gps.findOne({ deviceId: posMachine.deviceId }).sort({ timestamp: -1 });
    if (!gpsData) {
      console.log('❌ GPS data not found for deviceId:', posMachine.deviceId);
      return res.status(404).json({ error: 'GPS location not found' });
    }
    console.log('✅ Found GPS data:', gpsData);

    res.json({
      lat: gpsData.latitude,
      lng: gpsData.longitude,
      timestamp: gpsData.timestamp
    });

  } catch (error) {
    console.error('❌ Error fetching live location:', error);
    res.status(500).json({ error: 'Server error' });
  }
});







router.get('/stops/:busNumber', async (req, res) => {
  try {
    const { busNumber } = req.params;

    // Find bus by busNumber
    const bus = await Bus.findOne({ busNumber }).lean();
    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    // Find busRoute by bus _id
    const busRoute = await BusRoute.findOne({ bus: bus._id }).lean();
    if (!busRoute) return res.status(404).json({ message: 'BusRoute not found' });

    // Find route by route id in busRoute
    const route = await Route.findById(busRoute.route).lean();
    if (!route) return res.status(404).json({ message: 'Route not found' });

    // Assuming you want stops of the first trip for simplicity
    const firstTrip = route.trips[0];
    if (!firstTrip) return res.status(404).json({ message: 'No trips found' });

    // Map stops to only name and timingOffset
    const stops = firstTrip.stops.map(stop => ({
      name: stop.name,
      timingOffset: stop.timingOffset,
      latitude: stop.latitude,
      longitude: stop.longitude,
    }));

    res.json({
      sourceTime: firstTrip.sourceTime,
      destinationTime: firstTrip.destinationTime,
      stops,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});




// ✅ API: Get current GPS location for a bus by its busNumber
// router.get('/location/:busNumber', async (req, res) => {
//   try {
//     const { busNumber } = req.params;

//     const bus = await Bus.findOne({ busNumber });
//     if (!bus) return res.status(404).json({ error: 'Bus not found' });

//     const busPos = await BusPos.findOne({ bus: bus._id });
//     if (!busPos) return res.status(404).json({ error: 'Bus position not found' });

//     const posMachine = await PosMachine.findById(busPos.pos);
//     if (!posMachine) return res.status(404).json({ error: 'Pos machine not found' });

//     const gps = await Gps.findOne({ deviceId: posMachine.deviceId }).sort({ updatedAt: -1 });
//     if (!gps || !gps.location) return res.status(404).json({ error: 'GPS data not found' });

//     res.json({ location: gps.location });
//   } catch (err) {
//     console.error('❌ Error in /location API:', err);
//     res.status(500).send('Server Error');
//   }
// });


// GET trips by busNumber with full details
router.get('/trips/:busNumber', async (req, res) => {
  try {
    const { busNumber } = req.params;

    // Step 1: Find bus
    const bus = await Bus.findOne({ busNumber });
    if (!bus) return res.status(404).json({ error: 'Bus not found' });

    // Step 2: Find bus route
    const busRoute = await BusRoute.findOne({ bus: bus._id });
    if (!busRoute) return res.status(404).json({ error: 'Bus route not found' });

    // Step 3: Find route and trips
    const route = await Route.findById(busRoute.route);
    if (!route) return res.status(404).json({ error: 'Route not found' });

    // Step 4: Return full trip details
    const trips = route.trips.map(trip => ({
      source: route.source,
      destination: route.destination,
      sourceTime: trip.sourceTime,
      destinationTime: trip.destinationTime,
      stops: trip.stops.map(s => ({
        name: s.name,
        timingOffset: s.timingOffset,
        latitude: s.latitude,
        longitude: s.longitude
      }))
    }));

    res.json({ busNumber: bus.busNumber, trips });

  } catch (error) {
    console.error('❌ Error fetching trips:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// GET /api/trip-stops?routeId=123&tripIndex=0&deviceId=abc123
router.get('/trip-stops', async (req, res) => {
  try {
    const { routeId, tripIndex, deviceId } = req.query;

    // Fetch live bus location
    const gpsData = await Gps.findOne({ deviceId }).sort({ timestamp: -1 });
    if (!gpsData) return res.status(404).json({ message: "No GPS data found" });

    const liveLat = parseFloat(gpsData.latitude);
    const liveLng = parseFloat(gpsData.longitude);

    // Fetch route
    const route = await Route.findById(routeId);
    if (!route) return res.status(404).json({ message: "Route not found" });

    const trip = route.trips[tripIndex];
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    // Filter stops (exclude ones where bus is currently present)
    const filteredStops = trip.stops.filter(stop => {
      const stopLat = parseFloat(stop.latitude);
      const stopLng = parseFloat(stop.longitude);
      return stopLat !== liveLat || stopLng !== liveLng; // exclude matching stop
    });

    res.json({
      sourceTime: trip.sourceTime,
      destinationTime: trip.destinationTime,
      stops: filteredStops
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});






module.exports = router;