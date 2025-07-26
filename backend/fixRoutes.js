const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Route = require('./models/Route');

// Connect to MongoDB and insert bus route
mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('✅ Connected to MongoDB');

  // OPTIONAL: Clear all old routes first
  await Route.deleteMany({});

  // Insert new route
  await Route.insertMany([
    {
      source: "Railway Station",
      destination: "Sangdari",
      via: "Booramani",
      busNumber: "MH 13 DF 1691", // ✅ must match your frontend
      timings: ["8:45 AM", "11:15 AM", "2:45 PM", "4:15 PM", "7:35 PM"],
      deviceId: "beb9e30742a95ae0" // ✅ used to fetch live map
    }
  ]);

  console.log('✅ Route inserted successfully!');
  mongoose.disconnect();
});
