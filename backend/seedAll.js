const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Bus = require('./models/Bus');
const Route = require('./models/Route');
const BusRoute = require('./models/BusRoute');
const PosMachine = require('./models/PosMachine');
const BusPos = require('./models/BusPos');
const Gps = require('./models/Gps');

const deviceId = 'beb9e30742a95ae0';
const busNumber = 'MH 13 DF 1691';

const solapurStops = [
  { name: 'Rajendra Chowk', timingOffset: '08:00', latitude: '17.67730', longitude: '75.91791', sequence: 1 },
  { name: 'Kanna Chowk',    timingOffset: '08:02', latitude: '17.67809', longitude: '75.91569', sequence: 2 },
  { name: 'Kontam Chowk',   timingOffset: '08:05', latitude: '17.67861', longitude: '75.91094', sequence: 3 },
  { name: 'Balives',        timingOffset: '08:08', latitude: '17.68095', longitude: '75.90591', sequence: 4 },
  { name: 'Shivaji Chowk',  timingOffset: '08:10', latitude: '17.67966', longitude: '75.89874', sequence: 5 },
  { name: 'Juna Puna Naka', timingOffset: '08:15', latitude: '17.68508', longitude: '75.89297', sequence: 6 },
  { name: 'Bale Corner',    timingOffset: '08:20', latitude: '17.69473', longitude: '75.87725', sequence: 7 },
  { name: 'Ambika Nagar',   timingOffset: '08:25', latitude: '17.70711', longitude: '75.87863', sequence: 8 },
  { name: 'Mardi Fata',     timingOffset: '08:28', latitude: '17.71210', longitude: '75.87941', sequence: 9 },
  { name: 'Bhogaon',        timingOffset: '08:32', latitude: '17.72109', longitude: '75.88248', sequence: 10 },
  { name: 'Ganapati',       timingOffset: '08:35', latitude: '17.73952', longitude: '75.88890', sequence: 11 },
  { name: 'Banegaon',       timingOffset: '08:40', latitude: '17.76873', longitude: '75.89310', sequence: 12 },
  { name: 'Lodhi Wasti',    timingOffset: '08:42', latitude: '17.79211', longitude: '75.89689', sequence: 13 },
  { name: 'Mardi',          timingOffset: '08:45', latitude: '17.80073', longitude: '75.90025', sequence: 14 },
  { name: 'Kashid Mala',    timingOffset: '08:47', latitude: '17.82034', longitude: '75.89782', sequence: 15 },
  { name: 'Narotewadi',     timingOffset: '08:50', latitude: '17.83579', longitude: '75.89563', sequence: 16 },
  { name: 'Odha',           timingOffset: '08:55', latitude: '17.84675', longitude: '75.90324', sequence: 17 },
  { name: 'Wadgaon',        timingOffset: '09:00', latitude: '17.84871', longitude: '75.90495', sequence: 18 },
];

// Intermediate coordinates along Solapur-Pune Highway to bypass OSRM loop:
const solapurPathWaypoints = [
  { latitude: 17.67730, longitude: 75.91791 }, // Rajendra Chowk
  { latitude: 17.67809, longitude: 75.91569 }, // Kanna Chowk
  { latitude: 17.67861, longitude: 75.91094 }, // Kontam Chowk
  { latitude: 17.68095, longitude: 75.90591 }, // Balives
  { latitude: 17.67966, longitude: 75.89874 }, // Shivaji Chowk
  { latitude: 17.68508, longitude: 75.89297 }, // Juna Puna Naka
  // Intermediate road points bypassing wrong routing detours:
  { latitude: 17.68812, longitude: 75.88795 }, 
  { latitude: 17.69123, longitude: 75.88210 },
  { latitude: 17.69473, longitude: 75.87725 }, // Bale Corner
  { latitude: 17.70711, longitude: 75.87863 }, // Ambika Nagar
  { latitude: 17.71210, longitude: 75.87941 }, // Mardi Fata
  { latitude: 17.72109, longitude: 75.88248 }, // Bhogaon
  { latitude: 17.73952, longitude: 75.88890 }, // Ganapati
  { latitude: 17.76873, longitude: 75.89310 }, // Banegaon
  { latitude: 17.79211, longitude: 75.89689 }, // Lodhi Wasti
  { latitude: 17.80073, longitude: 75.90025 }, // Mardi
  { latitude: 17.82034, longitude: 75.89782 }, // Kashid Mala
  { latitude: 17.83579, longitude: 75.89563 }, // Narotewadi
  { latitude: 17.84675, longitude: 75.90324 }, // Odha
  { latitude: 17.84871, longitude: 75.90495 }, // Wadgaon
];

// Helper to generate stops with proper sequence & relative timingOffset for any trip
const generateStopsForTrip = (stopsList, startHour, startMinute, isReturn = false) => {
  const list = isReturn ? [...stopsList].reverse() : stopsList;
  
  const getMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };
  
  const forwardStartMin = getMinutes(stopsList[0].timingOffset);
  const forwardOffsets = stopsList.map(s => getMinutes(s.timingOffset) - forwardStartMin);
  const totalDuration = forwardOffsets[forwardOffsets.length - 1];
  
  return list.map((stop, idx) => {
    let offsetMins = 0;
    if (isReturn) {
      const forwardIdx = stopsList.length - 1 - idx;
      offsetMins = totalDuration - forwardOffsets[forwardIdx];
    } else {
      offsetMins = forwardOffsets[idx];
    }
    
    const totalMinutes = startHour * 60 + startMinute + offsetMins;
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    
    return {
      name: stop.name,
      timingOffset: timeString,
      latitude: stop.latitude,
      longitude: stop.longitude,
      sequence: idx + 1
    };
  });
};

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
 
    console.log('Cleaning existing collection data...');
    await Bus.deleteMany({});
    await Route.deleteMany({});
    await BusRoute.deleteMany({});
    await PosMachine.deleteMany({});
    await BusPos.deleteMany({});
    await Gps.deleteMany({});
 
    console.log('Inserting Bus...');
    const bus = await Bus.create({
      busNumber,
      type: 'Ordinary',
      capacity: 40,
      registrationNumber: busNumber,
      status: 'Active'
    });
 
    console.log('Inserting Route with 10 Forward & Return Trips/Stops...');
    const route = await Route.create({
      source: 'Rajendra Chowk',
      destination: 'Wadgaon',
      via: 'Mardi',
      distance: 26,
      estimatedDuration: 75,
      isActive: true,
      pathWaypoints: solapurPathWaypoints,
      trips: [
        // 1. Forward 8:00 AM
        {
          sourceTime: '08:00 AM',
          destinationTime: '09:15 AM',
          stops: generateStopsForTrip(solapurStops, 8, 0, false),
          direction: 'forward'
        },
        // 2. Return 9:30 AM
        {
          sourceTime: '09:30 AM',
          destinationTime: '10:45 AM',
          stops: generateStopsForTrip(solapurStops, 9, 30, true),
          direction: 'return'
        },
        // 3. Forward 11:00 AM
        {
          sourceTime: '11:00 AM',
          destinationTime: '12:15 PM',
          stops: generateStopsForTrip(solapurStops, 11, 0, false),
          direction: 'forward'
        },
        // 4. Return 12:30 PM
        {
          sourceTime: '12:30 PM',
          destinationTime: '01:45 PM',
          stops: generateStopsForTrip(solapurStops, 12, 30, true),
          direction: 'return'
        },
        // 5. Forward 2:30 PM
        {
          sourceTime: '02:30 PM',
          destinationTime: '03:45 PM',
          stops: generateStopsForTrip(solapurStops, 14, 30, false),
          direction: 'forward'
        },
        // 6. Return 4:00 PM
        {
          sourceTime: '04:00 PM',
          destinationTime: '05:15 PM',
          stops: generateStopsForTrip(solapurStops, 16, 0, true),
          direction: 'return'
        },
        // 7. Forward 4:30 PM
        {
          sourceTime: '04:30 PM',
          destinationTime: '05:45 PM',
          stops: generateStopsForTrip(solapurStops, 16, 30, false),
          direction: 'forward'
        },
        // 8. Return 6:00 PM
        {
          sourceTime: '06:00 PM',
          destinationTime: '07:15 PM',
          stops: generateStopsForTrip(solapurStops, 18, 0, true),
          direction: 'return'
        },
        // 9. Forward 7:00 PM
        {
          sourceTime: '07:00 PM',
          destinationTime: '08:15 PM',
          stops: generateStopsForTrip(solapurStops, 19, 0, false),
          direction: 'forward'
        },
        // 10. Return 8:30 PM
        {
          sourceTime: '08:30 PM',
          destinationTime: '09:45 PM',
          stops: generateStopsForTrip(solapurStops, 20, 30, true),
          direction: 'return'
        }
      ]
    });
 
    console.log('Creating BusRoute mapping with 10 timings...');
    await BusRoute.create({
      bus: bus._id,
      route: route._id,
      timings: [
        '08:00 AM', '09:30 AM', 
        '11:00 AM', '12:30 PM', 
        '02:30 PM', '04:00 PM', 
        '04:30 PM', '06:00 PM', 
        '07:00 PM', '08:30 PM'
      ],
      status: 'Active'
    });
 
    console.log('Creating POS Machine...');
    const pos = await PosMachine.create({
      deviceId,
      model: 'A920',
      vendor: 'Pax'
    });
 
    console.log('Creating BusPos mapping...');
    await BusPos.create({
      bus: bus._id,
      posMachine: pos._id
    });
 
    console.log('Seeding initial GPS location...');
    await Gps.create({
      deviceId,
      latitude: 17.67730,
      longitude: 75.91791,
      timestamp: new Date()
    });
 
    console.log('\n🚀 Database seeded successfully with correct links!');
    console.log(`- Bus Number: ${busNumber}`);
    console.log(`- Device ID: ${deviceId}`);
    console.log(`- Route ID: ${route._id}`);
    console.log(`- Total Scheduled Trips: 10 (5 Forward, 5 Return)`);
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Seeding failed:', err);
  });
