const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  via: {
    type: String,
    required: true,
  },
  busNumber: {
    type: String,
    required: true,
  },
  timings: {
    type: [String],
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
  },
});

// Force collection name to be 'routes'
module.exports = mongoose.model('Route', routeSchema, 'routes');
