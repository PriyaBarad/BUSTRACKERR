const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  name: String,
  time: String,
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
  },
});

module.exports = mongoose.model('Bus', busSchema);