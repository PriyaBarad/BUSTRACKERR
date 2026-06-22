import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  PanResponder,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../constants/Api';
import { useTheme } from '../components/ThemeContext';
import MapComponent from '../components/MapComponent';
import MenuDrawer from '../components/MenuDrawer';

const { height: windowHeight } = Dimensions.get('window');
// Distances are in kilometres (Haversine formula output)
const MOVEMENT_THRESHOLD = 0.030; // 30 metres — ignore GPS jitter smaller than this
const STOP_PRECISION    = 0.060; // 60 metres — geofence radius to mark a stop reached

// Helper to snap a coordinate to the nearest point on the route polyline
function snapToRoadGeometry(
  lat: number,
  lng: number,
  points: { latitude: number; longitude: number }[]
): { latitude: number; longitude: number } {
  if (!points || points.length < 2) {
    return { latitude: lat, longitude: lng };
  }

  let minDistanceSq = Infinity;
  let snappedLat = lat;
  let snappedLng = lng;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const x1 = p1.longitude;
    const y1 = p1.latitude;
    const x2 = p2.longitude;
    const y2 = p2.latitude;
    const px = lng;
    const py = lat;

    const dx = x2 - x1;
    const dy = y2 - y1;

    const lenSq = dx * dx + dy * dy;
    let t = 0;
    if (lenSq > 0) {
      t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const sx = x1 + t * dx;
    const sy = y1 + t * dy;

    const distSq = (px - sx) * (px - sx) + (py - sy) * (py - sy);

    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      snappedLat = sy;
      snappedLng = sx;
    }
  }

  return { latitude: snappedLat, longitude: snappedLng };
}

// Dynamic MapComponent handles platform specific map rendering

type Stop = {
  name: string;
  timingOffset: string;
  latitude?: number;
  longitude?: number;
  isSource?: boolean;
  isDestination?: boolean;
  reached?: boolean;
  eta?: string;
  delayInMinutes?: number;
};

type Trip = {
  sourceTime: string;
  destinationTime: string;
  stops: {
    name: string;
    timingOffset: string;
    latitude: number;
    longitude: number;
  }[];
};

export default function VerticalMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const busNumber = (params.busNumber as string) || '';
  const source = (params.source as string) || '';
  const destination = (params.destination as string) || '';
  const via = (params.via as string) || '';
  const deviceId = (params.deviceId as string) || '';
  const buses = params.buses ? JSON.parse(params.buses as string) : [];

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripIndex, setSelectedTripIndex] = useState(0);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [previousLocation, setPreviousLocation] = useState<{
    latitude: number;
    longitude: number;
    timestamp: number;
  } | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  
  /**
   * Stop state machine — two independent indices:
   *
   *  lastPassedStop  (-1)  The highest stop index the bus has definitively left.
   *                         Stops 0..lastPassedStop are shown as "Passed".
   *
   *  busAtStop       (-1)  The stop index the bus is CURRENTLY within the geofence
   *                         of.  -1 means the bus is between stops.
   *                         This stop is shown as "At Stop" (NOT "Passed").
   *
   * nextUpcomingStop = busAtStop >= 0 ? busAtStop + 1 : lastPassedStop + 1
   */
  const [lastPassedStop, setLastPassedStop] = useState(-1);
  const [busAtStop, setBusAtStop] = useState(-1);

  // Trip completion
  const [tripCompleted, setTripCompleted] = useState(false);
  const tripBannerAnim = useRef(new Animated.Value(0)).current;

  // Timeline bus translation & live pulsing ring animations
  const busYAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation loop for live bus indicator
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Adjustable map container height
  const mapHeightAnim = useRef(new Animated.Value(windowHeight * 0.42)).current;
  const startMapHeight = useRef(windowHeight * 0.42);
  const currentMapHeight = useRef(windowHeight * 0.42);

  // Sync current value ref
  useEffect(() => {
    const listenerId = mapHeightAnim.addListener(({ value }) => {
      currentMapHeight.current = value;
    });
    return () => {
      mapHeightAnim.removeListener(listenerId);
    };
  }, [mapHeightAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        startMapHeight.current = currentMapHeight.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const newHeight = startMapHeight.current + gestureState.dy;
        const clampedHeight = Math.max(
          windowHeight * 0.15,
          Math.min(windowHeight * 0.70, newHeight)
        );
        mapHeightAnim.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const finalHeight = startMapHeight.current + gestureState.dy;
        const snapPoints = [
          windowHeight * 0.15, // Stops fully expanded (map minimized)
          windowHeight * 0.42, // Default split screen
          windowHeight * 0.70, // Map expanded (stops minimized)
        ];
        
        const closest = snapPoints.reduce((prev, curr) =>
          Math.abs(curr - finalHeight) < Math.abs(prev - finalHeight) ? curr : prev
        );
        
        Animated.spring(mapHeightAnim, {
          toValue: closest,
          useNativeDriver: false,
          friction: 8,
          tension: 30,
        }).start();
      },
    })
  ).current;

  // Map Zoom State
  const [latitudeDelta, setLatitudeDelta] = useState(0.015);
  const [longitudeDelta, setLongitudeDelta] = useState(0.015);

  // Route polyline — planned stop coordinates (shows full route from the start)
  const [routePoints, setRoutePoints] = useState<{ latitude: number; longitude: number }[]>([]);

  // For the MapComponent ETA callout and the arriving panel.
  const nextUpcomingStopIndex = busAtStop >= 0
    ? Math.min(busAtStop + 1, stops.length - 1)
    : Math.min(lastPassedStop + 1, stops.length - 1);
  const nextStop = stops[nextUpcomingStopIndex];

  // Snapped location to keep the bus marker on the road
  const snappedLocation = useMemo(() => {
    if (!currentLocation) return null;
    return snapToRoadGeometry(currentLocation.latitude, currentLocation.longitude, routePoints);
  }, [currentLocation, routePoints]);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Fetch route trips data
  useEffect(() => {
    const fetchTrips = async () => {
      if (!busNumber) return;
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/routes/trips/${busNumber}`);
        const tripsData = response.data?.trips || response.data || [];
        
        const normalizedTrips: Trip[] = tripsData.map((trip: any) => ({
          sourceTime: trip.sourceTime,
          destinationTime: trip.destinationTime,
          stops: trip.stops?.map((stop: any) => ({
            name: stop.name,
            timingOffset: stop.timingOffset,
            latitude: Number(stop.latitude),
            longitude: Number(stop.longitude)
          })) || []
        }));
        
        setTrips(normalizedTrips);
        if (normalizedTrips.length > 0) {
          setSelectedTripIndex(0);
        }
      } catch (error) {
        console.error('Error fetching trips:', error);
        setLocationError('Failed to load trip data');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [busNumber]);

  // Sync stops list when trip index updates
  useEffect(() => {
    if (trips.length === 0 || selectedTripIndex >= trips.length) return;

    const selectedTrip = trips[selectedTripIndex];
    
    // Inject source and destination stop tags without duplicating if they are already in the stops list
    let stopsWithTerminals: Stop[] = [];

    if (selectedTrip.stops.length === 0) {
      stopsWithTerminals = [
        {
          name: source || 'Source',
          timingOffset: selectedTrip.sourceTime,
          isSource: true,
          reached: false,
        },
        {
          name: destination || 'Destination',
          timingOffset: selectedTrip.destinationTime,
          isDestination: true,
          reached: false,
        }
      ];
    } else {
      const dbStops = selectedTrip.stops;
      const firstDbStop = dbStops[0];
      const lastDbStop = dbStops[dbStops.length - 1];

      const normSource = (source || '').toLowerCase().trim();
      const normDest = (destination || '').toLowerCase().trim();

      const hasSourceInDb = firstDbStop && firstDbStop.name.toLowerCase().trim() === normSource;
      const hasDestInDb = lastDbStop && lastDbStop.name.toLowerCase().trim() === normDest;

      // Map existing stops, tagging matches
      stopsWithTerminals = dbStops.map((stop, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === dbStops.length - 1;

        return {
          ...stop,
          reached: false,
          isSource: (isFirst && hasSourceInDb) ? true : undefined,
          isDestination: (isLast && hasDestInDb) ? true : undefined,
        };
      });

      // Prepend source if not already present
      if (!hasSourceInDb) {
        stopsWithTerminals.unshift({
          name: source || 'Source',
          timingOffset: selectedTrip.sourceTime,
          isSource: true,
          reached: false,
          latitude: firstDbStop ? firstDbStop.latitude - 0.005 : undefined,
          longitude: firstDbStop ? firstDbStop.longitude - 0.005 : undefined,
        });
      } else {
        // Ensure the matching source stop has timingOffset updated if it is empty/undefined
        if (!stopsWithTerminals[0].timingOffset) {
          stopsWithTerminals[0].timingOffset = selectedTrip.sourceTime;
        }
      }

      // Append destination if not already present
      if (!hasDestInDb) {
        stopsWithTerminals.push({
          name: destination || 'Destination',
          timingOffset: selectedTrip.destinationTime,
          isDestination: true,
          reached: false,
          latitude: lastDbStop ? lastDbStop.latitude + 0.005 : undefined,
          longitude: lastDbStop ? lastDbStop.longitude + 0.005 : undefined,
        });
      } else {
        // Ensure the matching destination stop has timingOffset updated if it is empty/undefined
        const lastIdx = stopsWithTerminals.length - 1;
        if (!stopsWithTerminals[lastIdx].timingOffset) {
          stopsWithTerminals[lastIdx].timingOffset = selectedTrip.destinationTime;
        }
      }
    }

    setStops(stopsWithTerminals);
    // Reset stop state machine
    setLastPassedStop(-1);
    setBusAtStop(-1);
    setCurrentLocation(null);
    setPreviousLocation(null);
    setCurrentSpeed(null);
  }, [selectedTripIndex, trips, source, destination]);

  // ── Road-following polyline ────────────────────────────────────────────────
  // Uses stops.length (NOT the full stops array) as the dependency so this
  // effect only fires once when stops first load (length 0 → 18).
  // The polling loop updates individual stop.eta / stop.reached fields every
  // 6 s, which changes the stops array reference but NOT stops.length — so the
  // effect never re-runs during live tracking and the line never flickers.
  const geometryFetchedRef = React.useRef(false);

  useEffect(() => {
    if (stops.length === 0) return;
    if (geometryFetchedRef.current) return;   // already loaded — do nothing
    geometryFetchedRef.current = true;         // lock so no re-runs

    // Phase 1: instant straight-line fallback (18 points)
    const fallback = stops
      .filter(s => s.latitude && s.longitude)
      .map(s => ({ latitude: Number(s.latitude), longitude: Number(s.longitude) }));
    setRoutePoints(fallback);

    // Phase 2: upgrade to OSRM road-following geometry (async, 400+ points)
    axios
      .get(`${API_BASE_URL}/api/geometry/bus/${encodeURIComponent(busNumber)}`)
      .then(res => {
        if (res.data?.points && res.data.points.length > 2) {
          setRoutePoints(res.data.points);     // one-time upgrade, never resets
          console.log(
            `[route] Geometry loaded: ${res.data.points.length} pts` +
            (res.data.cached ? ' (cached)' : res.data.fallback ? ' (fallback)' : ' (OSRM)')
          );
        }
      })
      .catch(() => {
        console.log('[route] OSRM unavailable — keeping straight-line fallback');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops.length, busNumber]);

  // Animate trip-completion banner in
  useEffect(() => {
    if (tripCompleted) {
      Animated.spring(tripBannerAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 40,
      }).start();
    }
  }, [tripCompleted]);

  // ─── Live location polling ────────────────────────────────────────────────
  useEffect(() => {
    if (!busNumber || stops.length === 0 || !deviceId || tripCompleted) return;

    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const fetchAndAnimate = async () => {
      if (!isMounted) return;
      try {
        setLocationLoading(true);
        setLocationError(null);

        const locationRes = await axios.get(
          `${API_BASE_URL}/api/routes/location/${busNumber}`
        );
        if (!isMounted) return;

        const location = {
          latitude: Number(locationRes.data.lat),
          longitude: Number(locationRes.data.lng),
          timestamp: Date.now(),
        };

        if (isNaN(location.latitude) || isNaN(location.longitude)) {
          throw new Error('Invalid coordinates received from server');
        }

        // ── Speed calculation ──────────────────────────────────────────────
        if (previousLocation) {
          const dist = calculateDistance(
            previousLocation.latitude, previousLocation.longitude,
            location.latitude,        location.longitude
          );
          if (dist > MOVEMENT_THRESHOLD) {
            const hrs = (location.timestamp - previousLocation.timestamp) / 3_600_000;
            const spd = dist / hrs; // km/h
            setCurrentSpeed(prev => (prev ? prev * 0.7 + spd * 0.3 : spd));
          }
        }

        setPreviousLocation(location);
        setCurrentLocation(location);

        // Snap the current location to the nearest point on the road geometry
        const snapped = snapToRoadGeometry(location.latitude, location.longitude, routePoints);

        // ── Stop state machine ─────────────────────────────────────────────
        //
        // Scan stops FORWARD from (lastPassedStop + 1) to avoid re-triggering
        // stops behind the bus. We scan at most 4 stops ahead to stay O(1).
        let foundAtStop = -1;
        const scanFrom = Math.max(0, lastPassedStop + 1);
        const scanTo   = Math.min(stops.length, scanFrom + 4);

        for (let i = scanFrom; i < scanTo; i++) {
          const stop = stops[i];
          if (!stop.latitude || !stop.longitude) continue;
          const dist = calculateDistance(
            snapped.latitude, snapped.longitude,
            Number(stop.latitude), Number(stop.longitude)
          );
          if (dist < STOP_PRECISION) {
            foundAtStop = i;
            break;
          }
        }

        // State transitions
        if (foundAtStop !== busAtStop) {
          if (foundAtStop >= 0 && busAtStop >= 0 && foundAtStop > busAtStop) {
            // Moved from one stop's geofence into the NEXT — previous is now passed.
            setLastPassedStop(busAtStop);
          } else if (foundAtStop === -1 && busAtStop >= 0) {
            // Exited a stop's geofence without entering the next — mark it passed.
            setLastPassedStop(busAtStop);
          }
          setBusAtStop(foundAtStop);
        }

        // Rebuild stop display states
        const updatedStops = stops.map((s, i) => ({
          ...s,
          reached: i <= lastPassedStop,
          eta:     i <= lastPassedStop ? 'Reached' : s.eta,
        }));

        // ── ETA for upcoming stops ─────────────────────────────────────────
        const speedKmh = currentSpeed ?? 20;
        const etaFrom  = foundAtStop >= 0 ? foundAtStop + 1 : lastPassedStop + 1;
        for (let i = etaFrom; i < stops.length; i++) {
          const stop = stops[i];
          if (!stop.latitude || !stop.longitude) continue;
          const dist = calculateDistance(
            snapped.latitude, snapped.longitude,
            Number(stop.latitude), Number(stop.longitude)
          );
          const mins = Math.round((dist / speedKmh) * 60);
          updatedStops[i].eta = mins <= 0 ? 'Arriving soon' : `${mins} min`;
        }

        setStops(updatedStops);

        // ── Trip completion ────────────────────────────────────────────────
        // Trip is complete when the bus has PASSED the last stop
        // (i.e., lastPassedStop advances to the final index OR bus enters
        //  the final stop's geofence).
        const finalIdx = stops.length - 1;
        if ((lastPassedStop >= finalIdx || foundAtStop === finalIdx) && !tripCompleted) {
          setTripCompleted(true);
          clearInterval(intervalId);
        }

      } catch (err) {
        if (isMounted) {
          console.error('[LiveTrack] location fetch error:', err);
          setLocationError('GPS signal lost — retrying…');
        }
      } finally {
        if (isMounted) setLocationLoading(false);
      }
    };

    fetchAndAnimate();
    intervalId = setInterval(fetchAndAnimate, 6_000); // poll every 6 s

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [busNumber, stops, lastPassedStop, busAtStop, deviceId, previousLocation, currentSpeed, tripCompleted, routePoints]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Helper to calculate Y position of a stop node
  const getNodeY = useCallback((index: number) => {
    if (stops.length === 0) return 0;
    let y = 10; // timelineWrapper paddingVertical: 10
    for (let i = 0; i < index; i++) {
      const isAtThisStop = i === busAtStop;
      const isNextUpcoming = i === nextUpcomingStopIndex && !isAtThisStop;
      const rowHeight = (isAtThisStop || isNextUpcoming) ? 72 : 60;
      y += rowHeight + 16; // height + marginBottom
    }
    const isAtThisStop = index === busAtStop;
    const isNextUpcoming = index === nextUpcomingStopIndex && !isAtThisStop;
    const rowHeight = (isAtThisStop || isNextUpcoming) ? 72 : 60;
    return y + rowHeight / 2;
  }, [stops, busAtStop, nextUpcomingStopIndex]);

  // Live interpolated Y position for the bus marker on the vertical timeline
  const targetY = useMemo(() => {
    if (stops.length === 0) return 0;
    if (tripCompleted) {
      return getNodeY(stops.length - 1);
    }

    const currentIdx = busAtStop >= 0 ? busAtStop : lastPassedStop;

    if (currentIdx === -1) {
      return getNodeY(0);
    }

    const nextIdx = nextUpcomingStopIndex;
    if (nextIdx === currentIdx || nextIdx >= stops.length) {
      return getNodeY(currentIdx);
    }

    const currentStop = stops[currentIdx];
    const nextStop = stops[nextIdx];

    if (
      currentLocation &&
      currentStop.latitude && currentStop.longitude &&
      nextStop.latitude && nextStop.longitude
    ) {
      const d1 = calculateDistance(
        currentLocation.latitude, currentLocation.longitude,
        currentStop.latitude, currentStop.longitude
      );
      const d2 = calculateDistance(
        currentLocation.latitude, currentLocation.longitude,
        nextStop.latitude, nextStop.longitude
      );

      const total = d1 + d2;
      const p = total > 0 ? d1 / total : 0;
      const clampedP = Math.max(0, Math.min(1, p));

      const yStart = getNodeY(currentIdx);
      const yEnd = getNodeY(nextIdx);
      return yStart + clampedP * (yEnd - yStart);
    }

    return getNodeY(currentIdx);
  }, [currentLocation, stops, busAtStop, lastPassedStop, nextUpcomingStopIndex, tripCompleted, getNodeY]);

  // Smoothly animate the bus indicator vertical position
  useEffect(() => {
    Animated.timing(busYAnim, {
      toValue: targetY,
      duration: 1500, // Smooth transition duration
      useNativeDriver: true,
    }).start();
  }, [targetY, busYAnim]);

  const handleBackPress = () => {
    router.push({
      pathname: '/busResult',
      params: {
        source,
        destination,
        via,
        buses: JSON.stringify(buses),
      },
    });
  };

  // Map Zoom Controls
  const zoomIn = () => {
    setLatitudeDelta(prev => Math.max(0.002, prev * 0.5));
    setLongitudeDelta(prev => Math.max(0.002, prev * 0.5));
  };

  const zoomOut = () => {
    setLatitudeDelta(prev => Math.min(0.1, prev * 2.0));
    setLongitudeDelta(prev => Math.min(0.1, prev * 2.0));
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      <MenuDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {/* TOP PANE: DYNAMIC MAP VIEW */}
      <Animated.View style={[styles.mapContainer, { height: mapHeightAnim }]}>
        <MapComponent
          currentLocation={snappedLocation}
          routePoints={routePoints}
          stops={stops}
          nextStopIndex={nextUpcomingStopIndex}
          busNumber={busNumber}
          currentSpeed={currentSpeed}
          latitudeDelta={latitudeDelta}
          longitudeDelta={longitudeDelta}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          isDark={isDark}
        />

        {/* Floating Route info Overlay */}
        <View style={[styles.floatingRouteCard, isDark && styles.darkCard]}>
          <TouchableOpacity onPress={handleBackPress} style={styles.floatingBackBtn}>
            <Ionicons name="arrow-back" size={20} color={isDark ? '#fff' : '#0b2d64'} />
          </TouchableOpacity>
          <Text style={[styles.floatingRouteTitle, isDark && styles.darkInputText]} numberOfLines={1}>
            Route {busNumber}: {source} to {destination}
          </Text>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.floatingMenuBtn}>
            <Ionicons name="menu" size={22} color={isDark ? '#fff' : '#0b2d64'} />
          </TouchableOpacity>
        </View>

        {/* Zoom Controls Overlay */}
        <View style={styles.zoomControls}>
          <TouchableOpacity onPress={zoomIn} style={[styles.zoomBtn, isDark && styles.darkZoomBtn]}>
            <Ionicons name="add" size={20} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={zoomOut} style={[styles.zoomBtn, isDark && styles.darkZoomBtn]}>
            <Ionicons name="remove" size={20} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>

        {/* ETA & Bus Overlay Chip */}
        {nextStop && nextStop.eta ? (
          <View style={styles.etaOverlayChip}>
            <Text style={styles.etaOverlayText}>ETA: {nextStop.eta}</Text>
            <View style={styles.etaOverlayBusNum}>
              <Text style={styles.etaOverlayBusText}>{busNumber}</Text>
            </View>
          </View>
        ) : null}
      </Animated.View>

      {/* BOTTOM PANE: STOPS TIMELINE BOTTOM SHEET */}
      <View style={[styles.bottomSheet, isDark && styles.darkCard]}>
        {/* Swipe sheet drag handle area */}
        <View {...panResponder.panHandlers} style={styles.dragAreaContainer}>
          {/* Swipe sheet drag handle */}
          <View style={[styles.dragHandle, isDark && styles.darkDragHandle]} />

          {/* Sheet Title Row */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, isDark && styles.darkInputText]}>{busNumber} | {destination}</Text>
              <Text style={styles.sheetSubtitle}>Solapur Municipal Corporation</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveBadgeDot} />
              <Text style={styles.liveBadgeText}>LIVE TRACKING</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1058d1" />
            <Text style={[styles.loadingText, isDark && styles.darkInputText]}>Updating route details...</Text>
          </View>
        ) : (
          <>
            <ScrollView style={styles.stopsScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.timelineWrapper}>
                
                {/* Timeline Connector Line */}
                {stops.length > 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      isDark && styles.darkTimelineLine,
                      {
                        top: getNodeY(0),
                        height: Math.max(0, getNodeY(stops.length - 1) - getNodeY(0)),
                      }
                    ]}
                  />
                )}

                {/* Live custom animated bus indicator */}
                {currentLocation && stops.length > 0 && (
                  <Animated.View
                    style={[
                      styles.verticalBusIndicator,
                      {
                        transform: [{ translateY: busYAnim }],
                      },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.verticalBusPulseRing,
                        {
                          transform: [{ scale: pulseAnim }],
                        }
                      ]}
                    />
                    <View style={styles.verticalBusIconCircle}>
                      <Ionicons name="bus" size={12} color="#ffffff" />
                    </View>
                  </Animated.View>
                )}

                {stops.map((stop, index) => {
                  // ── 3-state display logic ──────────────────────────────
                  const isPassed       = index <= lastPassedStop;          // bus has left this stop
                  const isAtThisStop   = index === busAtStop;              // bus is here RIGHT NOW
                  const isNextUpcoming = index === nextUpcomingStopIndex   // next stop bus is heading to
                                        && !isAtThisStop;

                  return (
                    <View
                      key={index}
                      style={[
                        styles.stopRow,
                        isAtThisStop   && styles.stopRowAtBus,
                        isAtThisStop   && isDark && styles.darkStopRowAtBus,
                        isNextUpcoming && styles.stopRowNext,
                        isNextUpcoming && isDark && styles.darkStopRowNext,
                      ]}
                    >
                      {/* Node Dot / Bus indicator on line */}
                      <View style={styles.stopNodeCol}>
                        <View
                          style={[
                            styles.stopNodeDot,
                            isPassed      && styles.stopNodeDotPassed,
                            isAtThisStop  && styles.stopNodeDotActive,
                            stop.isSource && styles.stopNodeSource,
                            stop.isDestination && styles.stopNodeDest,
                          ]}
                        />
                      </View>

                      {/* Stop Details */}
                      <View style={styles.stopDetailsCol}>
                        <Text
                          style={[
                            styles.stopNameText,
                            isAtThisStop   && styles.stopNameTextAtBus,
                            isNextUpcoming && styles.stopNameTextNext,
                            isPassed       && styles.stopNameTextPassed,
                            isDark         && styles.darkInputText,
                            isPassed       && isDark && { color: '#64748b' },
                          ]}
                        >
                          {stop.name}
                        </Text>

                        {isAtThisStop && (
                          <Text style={styles.atBusHelperText}>Bus is here now</Text>
                        )}
                        {isNextUpcoming && (
                          <Text style={styles.nextStopHelperText}>
                            Scheduled at: {stop.timingOffset}
                          </Text>
                        )}
                      </View>

                      {/* ETA / Status chip */}
                      <View style={styles.stopEtaCol}>
                        {isPassed ? (
                          <Text style={styles.passedText}>Passed</Text>
                        ) : isAtThisStop ? (
                          <View style={styles.atBusBadge}>
                            <Ionicons name="radio-button-on" size={10} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.atBusBadgeText}>At Stop</Text>
                          </View>
                        ) : isNextUpcoming ? (
                          <View style={styles.nextBadgeCol}>
                            <Text style={styles.nextBadgeLabel}>Next Stop</Text>
                            <Text style={styles.nextBadgeEta}>ETA {stop.eta || '—'}</Text>
                          </View>
                        ) : (
                          <Text style={styles.upcomingEtaText}>
                            {stop.eta ? `ETA: ${stop.eta}` : stop.timingOffset}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {locationLoading && (
              <View style={styles.locationLoadingContainer}>
                <ActivityIndicator size="small" color={isDark ? '#38bdf8' : '#1058d1'} />
                <Text style={styles.locationLoadingText}>Updating bus location...</Text>
              </View>
            )}

            {locationError && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{locationError}</Text>
              </View>
            )}
          </>
        )}

        {/* BOTTOM ARRIVING SOON ALERTS PANEL */}
        {nextStop && !nextStop.reached && !tripCompleted && (
          <View style={[styles.arrivingAlertPanel, isDark && styles.darkAlertPanel]}>
            <View style={styles.arrivingHeader}>
              <Ionicons name="notifications" size={16} color={isDark ? '#38bdf8' : '#1058d1'} style={{ marginRight: 6 }} />
              <Text style={[styles.arrivingAlertText, isDark && styles.darkInputText]}>
                Arriving Soon: <Text style={{ fontWeight: '800' }}>{nextStop.name}</Text>
              </Text>
            </View>
            <View style={styles.arrivingProgressBarBg}>
              <View style={[styles.arrivingProgressBar, { width: '65%' }]} />
            </View>
          </View>
        )}

        {/* TRIP COMPLETED BANNER */}
        {tripCompleted && (
          <Animated.View
            style={[
              styles.tripCompletedBanner,
              isDark && styles.darkTripCompletedBanner,
              {
                transform: [{
                  translateY: tripBannerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [120, 0],
                  }),
                }],
                opacity: tripBannerAnim,
              },
            ]}
          >
            <View style={styles.tripCompletedIconCircle}>
              <Ionicons name="checkmark-circle" size={36} color="#22c55e" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.tripCompletedTitle, isDark && styles.darkInputText]}>
                Trip Completed!
              </Text>
              <Text style={styles.tripCompletedSub}>
                {busNumber}  •  {source} → {destination}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.tripCompletedBackBtn}
            >
              <Ionicons name="arrow-back" size={18} color="#fff" />
              <Text style={styles.tripCompletedBackText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  darkSafeArea: {
    backgroundColor: '#090d16',
  },
  mapContainer: {
    height: windowHeight * 0.42,
    position: 'relative',
    zIndex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webMapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkWebMap: {
    backgroundColor: '#151f32',
  },
  webMapText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0b2d64',
    letterSpacing: 1,
    marginBottom: 24,
    opacity: 0.7,
  },
  svgPathWrapper: {
    width: '85%',
    height: 60,
    position: 'relative',
    justifyContent: 'center',
  },
  svgLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  svgStopDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#94a3b8',
    marginTop: -6,
  },
  svgStopDotPassed: {
    backgroundColor: '#1058d1',
  },
  svgStopDotActive: {
    backgroundColor: '#e53935',
    transform: [{ scale: 1.2 }],
  },
  svgStopName: {
    position: 'absolute',
    top: 18,
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    width: 70,
    textAlign: 'center',
    left: -29,
  },
  svgBusIcon: {
    position: 'absolute',
    top: -24,
    left: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#94a3b8',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  mapDotReached: {
    backgroundColor: '#43a047',
  },
  mapDotNext: {
    backgroundColor: '#e53935',
    transform: [{ scale: 1.25 }],
  },
  mapBusMarkerCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1058d1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingRouteCard: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  floatingBackBtn: {
    marginRight: 10,
    padding: 2,
  },
  floatingRouteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0b2d64',
    flex: 1,
  },
  floatingMenuBtn: {
    marginLeft: 10,
    padding: 2,
  },
  zoomControls: {
    position: 'absolute',
    right: 14,
    top: '35%',
    flexDirection: 'column',
  },
  zoomBtn: {
    backgroundColor: '#ffffff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  darkZoomBtn: {
    backgroundColor: '#151f32',
  },
  etaOverlayChip: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  etaOverlayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  etaOverlayBusNum: {
    backgroundColor: '#1058d1',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  etaOverlayBusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Bottom Sheet stops list
  bottomSheet: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 2,
  },
  dragAreaContainer: {
    width: '100%',
    paddingBottom: 4,
  },
  dragHandle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  darkDragHandle: {
    backgroundColor: '#334155',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0b2d64',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1058d1',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  liveBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#39ff14',
    marginRight: 6,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  stopsScroll: {
    flex: 1,
  },
  timelineWrapper: {
    position: 'relative',
    paddingLeft: 24,
    paddingVertical: 10,
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    width: 2,
    backgroundColor: '#e2e8f0',
  },
  darkTimelineLine: {
    backgroundColor: '#334155',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    marginBottom: 16,
    paddingRight: 6,
  },
  stopRowNext: {
    backgroundColor: '#1058d1',
    borderRadius: 16,
    height: 72,
    paddingHorizontal: 12,
  },
  darkStopRowNext: {
    backgroundColor: '#1e3a8a',
  },
  // Green row: bus is physically AT this stop right now
  stopRowAtBus: {
    backgroundColor: '#16a34a',
    borderRadius: 16,
    height: 72,
    paddingHorizontal: 12,
  },
  darkStopRowAtBus: {
    backgroundColor: '#14532d',
  },
  stopNodeCol: {
    position: 'absolute',
    left: -24,
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#94a3b8',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  stopNodeDotPassed: {
    backgroundColor: '#43a047',
  },
  stopNodeSource: {
    borderColor: '#1058d1',
  },
  stopNodeDest: {
    borderColor: '#e53935',
  },
  busNodeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1058d1',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  stopNodeDotActive: {
    backgroundColor: '#22c55e',
    borderColor: '#ffffff',
    transform: [{ scale: 1.3 }],
  },
  verticalBusIndicator: {
    position: 'absolute',
    left: -4, // Centered at X = 8 (which is left: 7, width: 2)
    width: 24,
    height: 24,
    marginTop: -12, // center vertically on the target coordinate
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  verticalBusIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1058d1',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  verticalBusPulseRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 88, 209, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 88, 209, 0.4)',
  },
  stopDetailsCol: {
    flex: 1,
    paddingLeft: 12,
  },
  stopNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  stopNameTextPassed: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  stopNameTextNext: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  nextStopHelperText: {
    fontSize: 11,
    color: '#93c5fd',
    fontWeight: '600',
    marginTop: 2,
  },
  // "Bus is here now" subtitle on the green At-Stop row
  atBusHelperText: {
    fontSize: 11,
    color: '#bbf7d0',
    fontWeight: '600',
    marginTop: 2,
  },
  stopNameTextAtBus: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  // Green "At Stop" badge chip
  atBusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  atBusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  stopEtaCol: {
    alignItems: 'flex-end',
    width: 90,
  },
  passedText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  nextBadgeCol: {
    alignItems: 'flex-end',
  },
  nextBadgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
  },
  nextBadgeEta: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  upcomingEtaText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },

  // Arriving Alert Panel
  arrivingAlertPanel: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  darkAlertPanel: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  arrivingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  arrivingAlertText: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  arrivingProgressBarBg: {
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    overflow: 'hidden',
  },
  arrivingProgressBar: {
    height: '100%',
    backgroundColor: '#1058d1',
    borderRadius: 2,
  },
  darkCard: {
    backgroundColor: '#151f32',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  darkInputText: {
    color: '#f8fafc',
  },
  // GPS update indicator
  locationLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  locationLoadingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  // GPS error banner
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#1058d1',
    fontWeight: '600',
  },

  // ─── Trip Completion Banner ────────────────────────────────────────────────
  tripCompletedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#86efac',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  darkTripCompletedBanner: {
    backgroundColor: '#052e16',
    borderColor: '#166534',
  },
  tripCompletedIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripCompletedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 2,
  },
  tripCompletedSub: {
    fontSize: 12,
    color: '#4ade80',
    fontWeight: '600',
  },
  tripCompletedBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  tripCompletedBackText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
});
