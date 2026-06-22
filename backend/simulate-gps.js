const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Gps = require('./models/Gps');

const deviceId = 'beb9e30742a95ae0';

const routeStops = [
  { lat: 17.67730, lng: 75.91791, name: 'Rajendra Chowk' },
  { lat: 17.67809, lng: 75.91569, name: 'Kanna Chowk' },
  { lat: 17.67861, lng: 75.91094, name: 'Kontam Chowk' },
  { lat: 17.68095, lng: 75.90591, name: 'Balives' },
  { lat: 17.67966, lng: 75.89874, name: 'Shivaji Chowk' },
  { lat: 17.68508, lng: 75.89297, name: 'Juna Puna Naka' },
  { lat: 17.69473, lng: 75.87725, name: 'Bale Corner' },
  { lat: 17.70711, lng: 75.87863, name: 'Ambika Nagar' },
  { lat: 17.71210, lng: 75.87941, name: 'Mardi Fata' },
  { lat: 17.72109, lng: 75.88248, name: 'Bhogaon' },
  { lat: 17.73952, lng: 75.88890, name: 'Ganapati' },
  { lat: 17.76873, lng: 75.89310, name: 'Banegaon' },
  { lat: 17.79211, lng: 75.89689, name: 'Lodhi Wasti' },
  { lat: 17.80073, lng: 75.90025, name: 'Mardi' },
  { lat: 17.82034, lng: 75.89782, name: 'Kashid Mala' },
  { lat: 17.83579, lng: 75.89563, name: 'Narotewadi' },
  { lat: 17.84675, lng: 75.90324, name: 'Odha' },
  { lat: 17.84871, lng: 75.90495, name: 'Wadgaon' },
];

// Interpolate points for smooth movement
const steps = [];

// 1. Forward simulation (Rajendra Chowk -> Wadgaon)
for (let i = 0; i < routeStops.length - 1; i++) {
  const current = routeStops[i];
  const next = routeStops[i + 1];
  
  const numInterp = 5;
  for (let j = 0; j < numInterp; j++) {
    const lat = current.lat + (next.lat - current.lat) * (j / numInterp);
    const lng = current.lng + (next.lng - current.lng) * (j / numInterp);
    steps.push({ lat, lng, segment: `Forward: ${current.name} -> ${next.name}` });
  }
}
steps.push({ 
  lat: routeStops[routeStops.length - 1].lat, 
  lng: routeStops[routeStops.length - 1].lng, 
  segment: 'Forward Destination: Wadgaon' 
});

// 2. Return simulation (Wadgaon -> Rajendra Chowk)
for (let i = routeStops.length - 1; i > 0; i--) {
  const current = routeStops[i];
  const next = routeStops[i - 1];
  
  const numInterp = 5;
  for (let j = 0; j < numInterp; j++) {
    const lat = current.lat + (next.lat - current.lat) * (j / numInterp);
    const lng = current.lng + (next.lng - current.lng) * (j / numInterp);
    steps.push({ lat, lng, segment: `Return: ${current.name} -> ${next.name}` });
  }
}
steps.push({ 
  lat: routeStops[0].lat, 
  lng: routeStops[0].lng, 
  segment: 'Return Destination: Rajendra Chowk' 
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ GPS Simulator Connected to MongoDB');
    console.log(`Starting simulation for device: ${deviceId} with ${steps.length} coordinates...`);
    
    let currentIndex = 0;
    
    const updateLocation = async () => {
      const coord = steps[currentIndex];
      try {
        const update = await Gps.findOneAndUpdate(
          { deviceId },
          { 
            latitude: coord.lat, 
            longitude: coord.lng,
            timestamp: new Date()
          },
          { upsert: true, new: true }
        );
        console.log(`[SIMULATOR] Bus moved to ${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)} (${coord.segment})`);
      } catch (err) {
        console.error('❌ Error updating simulated location:', err);
      }
      currentIndex = (currentIndex + 1) % steps.length;
    };

    // Run first update immediately
    updateLocation();

    // Repeat every 6 seconds
    setInterval(updateLocation, 6000);
  })
  .catch(err => {
    console.error('❌ Connection error in GPS simulator:', err);
  });
