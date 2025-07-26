const express = require('express');
const router = express.Router();
const Gps = require('../models/Gps');

// ✅ GET latest GPS data for a deviceId
router.get('/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  try {
    const latest = await Gps.findOne({ deviceId }).sort({ timestamp: -1 });

    if (!latest) {
      return res.status(404).json({ error: 'No GPS data found' });
    }

    res.json({
      latitude: latest.latitude,
      longitude: latest.longitude,
      timestamp: latest.timestamp,
    });
  } catch (err) {
    console.error('❌ GPS fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
