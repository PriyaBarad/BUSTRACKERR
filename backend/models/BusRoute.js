const mongoose = require('mongoose');

const busRouteSchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    timings: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      default: 'Active',
    },
    assignedBy: {
      type: String,
      default: 'System',
    },
    remarks: {
      type: String,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BusRoute', busRouteSchema);
