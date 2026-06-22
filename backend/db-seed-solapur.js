const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Route = require('./models/Route');

const routeId = '69bdc21a30c9d2d7663834c5';

const solapurStopsData = {
  'rajendra chowk': { lat: '17.67730', lng: '75.91791' },
  'kanna chowk':    { lat: '17.67809', lng: '75.91569' },
  'kontam chowk':   { lat: '17.67861', lng: '75.91094' },
  'balives':        { lat: '17.68095', lng: '75.90591' },
  'shivaji chowk':  { lat: '17.67966', lng: '75.89874' },
  'juna puna naka': { lat: '17.68508', lng: '75.89297' },
  'bale corner':    { lat: '17.69473', lng: '75.87725' },
  'ambika nagar':   { lat: '17.70711', lng: '75.87863' },
  'mardi fata':     { lat: '17.71210', lng: '75.87941' },
  'bhogaon':        { lat: '17.72109', lng: '75.88248' },
  'ganapati':       { lat: '17.73952', lng: '75.88890' },
  'banegaon':       { lat: '17.76873', lng: '75.89310' },
  'lodhi wasti':    { lat: '17.79211', lng: '75.89689' },
  'mardi':          { lat: '17.80073', lng: '75.90025' },
  'kashid mala':    { lat: '17.82034', lng: '75.89782' },
  'narotewadi':     { lat: '17.83579', lng: '75.89563' },
  'odha':           { lat: '17.84675', lng: '75.90324' },
  'wadgaon':        { lat: '17.84871', lng: '75.90495' },
};

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    const route = await Route.findById(routeId);
    if (!route) {
      console.error('❌ Route not found in database!');
      mongoose.disconnect();
      return;
    }

    console.log(`Updating route: ${route.source} -> ${route.destination}`);

    // Loop through trips and update stops inside each trip
    route.trips.forEach((trip) => {
      trip.stops.forEach((stop) => {
        const normName = stop.name.toLowerCase().trim();
        const coords = solapurStopsData[normName];
        if (coords) {
          stop.latitude = coords.lat;
          stop.longitude = coords.lng;
          console.log(`  Updated stop [${stop.name}] -> (${coords.lat}, ${coords.lng})`);
        } else {
          console.warn(`  ⚠️ No coordinates mapped for stop: ${stop.name}`);
        }
      });
    });

    await route.save();
    console.log('✅ Database route updated successfully!');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Database connection/update error:', err);
  });
