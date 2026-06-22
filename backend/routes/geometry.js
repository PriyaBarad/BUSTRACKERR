const express = require('express');
const axios   = require('axios');
const router  = express.Router();

const Route    = require('../models/Route');
const Bus      = require('../models/Bus');
const BusRoute = require('../models/BusRoute');

/**
 * GET /api/geometry/bus/:busNumber
 *
 * Returns a road-following polyline for the bus route as an array of
 * { latitude, longitude } objects.
 *
 * Strategy:
 *   1. Look up Bus → BusRoute → Route in MongoDB.
 *   2. If Route.roadGeometry is already cached (> 50 points), return it.
 *   3. Otherwise, call the OSRM public routing API with all stop coordinates.
 *   4. Persist the result in Route.roadGeometry for future requests.
 *   5. If OSRM fails, fall back to straight-line stop coordinates.
 */
router.get('/bus/:busNumber', async (req, res) => {
  const { busNumber } = req.params;

  try {
    // ── 1. Resolve bus → route ──────────────────────────────────────────────
    const bus = await Bus.findOne({ busNumber }).lean();
    if (!bus) return res.status(404).json({ error: 'Bus not found' });

    const busRouteDoc = await BusRoute.findOne({ bus: bus._id })
      .populate('route')
      .lean();
    if (!busRouteDoc?.route) {
      return res.status(404).json({ error: 'No route linked to this bus' });
    }

    const route = busRouteDoc.route;

    // ── 2. Return cached geometry ──────────────────────────────────────────
    if (route.roadGeometry && route.roadGeometry.length > 50) {
      const points = route.roadGeometry.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));
      return res.json({ points, cached: true });
    }

    // ── 3. Build waypoint list ─────────────────────────────
    let coordsToRoute = [];
    if (route.pathWaypoints && route.pathWaypoints.length > 0) {
      coordsToRoute = route.pathWaypoints.map(w => ({
        latitude: Number(w.latitude),
        longitude: Number(w.longitude)
      }));
    } else {
      coordsToRoute = (route.trips?.[0]?.stops || []).filter(
        s => s.latitude && s.longitude
      ).map(s => ({
        latitude: parseFloat(s.latitude),
        longitude: parseFloat(s.longitude)
      }));
    }

    if (coordsToRoute.length < 2) {
      return res.status(400).json({ error: 'Route has fewer than 2 coordinates' });
    }

    // ── 4. Call OSRM ────────────────────────────────────────────────────────
    // Coordinate format: longitude,latitude (note: OSRM uses lng,lat order)
    const waypointStr = coordsToRoute
      .map(c => `${c.longitude},${c.latitude}`)
      .join(';');

    const osrmUrl =
      `https://router.project-osrm.org/route/v1/driving/${waypointStr}` +
      `?overview=full&geometries=geojson`;

    console.log(`[geometry] Fetching OSRM route for ${busNumber}…`);

    const osrmRes = await axios.get(osrmUrl, {
      timeout: 15_000,
      headers: { 'User-Agent': 'BusTracker-App/1.0' },
    });

    const geoCoords = osrmRes.data?.routes?.[0]?.geometry?.coordinates;

    if (!geoCoords || geoCoords.length === 0) {
      throw new Error('OSRM returned empty geometry');
    }

    // ── 5. Persist & respond ────────────────────────────────────────────────
    await Route.findByIdAndUpdate(route._id, { roadGeometry: geoCoords });
    console.log(
      `[geometry] Cached ${geoCoords.length} road points for route ${route._id}`
    );

    const points = geoCoords.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    return res.json({ points, cached: false });

  } catch (err) {
    console.error('[geometry] OSRM fetch failed:', err.message);

    // ── 6. Graceful fallback: straight-line stop coords/waypoints ────────────────────
    try {
      const bus      = await Bus.findOne({ busNumber }).lean();
      const busRoute = await BusRoute.findOne({ bus: bus._id })
        .populate('route')
        .lean();
      let fallbackPoints = [];
      const routeDoc = busRoute?.route;
      if (routeDoc?.pathWaypoints && routeDoc.pathWaypoints.length > 0) {
        fallbackPoints = routeDoc.pathWaypoints.map(w => ({
          latitude: Number(w.latitude),
          longitude: Number(w.longitude)
        }));
      } else {
        const stops = (routeDoc?.trips?.[0]?.stops || []).filter(
          s => s.latitude && s.longitude
        );
        fallbackPoints = stops.map(s => ({
          latitude:  parseFloat(s.latitude),
          longitude: parseFloat(s.longitude),
        }));
      }
      return res.json({ points: fallbackPoints, fallback: true });
    } catch (fallbackErr) {
      return res.status(500).json({ error: 'Failed to compute route geometry' });
    }
  }
});

/**
 * POST /api/geometry/bus/:busNumber/clear
 * Clears the cached roadGeometry polyline for the route.
 */
router.post('/bus/:busNumber/clear', async (req, res) => {
  const { busNumber } = req.params;

  try {
    const bus = await Bus.findOne({ busNumber });
    if (!bus) return res.status(404).json({ error: 'Bus not found' });

    const busRouteDoc = await BusRoute.findOne({ bus: bus._id });
    if (!busRouteDoc) return res.status(404).json({ error: 'No route linked to this bus' });

    await Route.findByIdAndUpdate(busRouteDoc.route, { roadGeometry: [] });
    console.log(`[geometry] Cleared cache for route ${busRouteDoc.route}`);

    return res.json({ message: 'Geometry cache cleared successfully' });
  } catch (err) {
    console.error('[geometry] Cache clear failed:', err.message);
    return res.status(500).json({ error: 'Failed to clear cache' });
  }
});

module.exports = router;
