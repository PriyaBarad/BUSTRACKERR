// const mongoose = require('mongoose');

// const gpsSchema = new mongoose.Schema({
//   deviceId: { type: String, required: true },
//   latitude: { type: Number, required: true },
//   longitude: { type: Number, required: true },
//   timestamp: { type: Date, default: Date.now },
// });

// // ✅ This line fixes the OverwriteModelError
// const GpsModel = mongoose.models.Gps || mongoose.model('Gps', gpsSchema);

// module.exports = GpsModel;

const mongoose = require('mongoose');

const gpsSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// ✅ Fix OverwriteModelError by checking if already compiled
module.exports = mongoose.models.Gps || mongoose.model('Gps', gpsSchema);
