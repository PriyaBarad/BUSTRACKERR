const mongoose = require('mongoose');

const busPosSchema = new mongoose.Schema({
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true,
  },
  posMachine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PosMachine',
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('BusPos', busPosSchema);
