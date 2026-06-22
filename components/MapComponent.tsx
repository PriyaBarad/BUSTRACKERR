import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

interface MapComponentProps {
  currentLocation: { latitude: number; longitude: number } | null;
  routePoints: { latitude: number; longitude: number }[];
  stops: {
    name: string;
    latitude?: number;
    longitude?: number;
    reached?: boolean;
  }[];
  nextStopIndex: number;
  busNumber: string;
  currentSpeed: number | null;
  latitudeDelta: number;
  longitudeDelta: number;
  zoomIn: () => void;
  zoomOut: () => void;
  isDark: boolean;
}

export default function MapComponent({
  currentLocation,
  routePoints,
  stops,
  nextStopIndex,
  latitudeDelta,
  isDark,
}: MapComponentProps) {
  const tileLayerUrl = 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
  const attribution = '&copy; Google Maps';

  const leafletZoom = Math.max(1, Math.min(20, Math.round(15 - Math.log2(latitudeDelta / 0.015))));
  const iframeRef = useRef<any>(null);

  // Generate initial HTML document once on mount (or when dark mode toggles)
  const initialSrcDoc = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: ${isDark ? '#090d16' : '#faf8f5'};
    }
    .bus-marker {
      background: none;
      border: none;
    }
    ${isDark ? `
    .leaflet-tile {
      filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(90%);
    }
    ` : ''}
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      zoomControl: false
    });

    L.tileLayer('${tileLayerUrl}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3'],
      attribution: '${attribution}'
    }).addTo(map);

    let hasCentered = false;
    let lastZoom = null;
    let routePolyline = null;
    let stopMarkers = [];
    let busMarker = null;

    function renderMap(data) {
      const { routePoints, stops, currentLocation, nextStopIndex, zoomLevel } = data;

      // 1. Draw route polyline
      if (routePolyline) {
        map.removeLayer(routePolyline);
        routePolyline = null;
      }
      if (routePoints && routePoints.length > 0) {
        const latlngs = routePoints.map(p => [p.latitude, p.longitude]);
        routePolyline = L.polyline(latlngs, {color: '#1058d1', weight: 4}).addTo(map);
      }

      // 2. Fit bounds once initially to show the entire route
      if (!hasCentered) {
        if (routePoints && routePoints.length > 0) {
          const latlngs = routePoints.map(p => [p.latitude, p.longitude]);
          map.fitBounds(L.polyline(latlngs).getBounds(), { padding: [30, 30] });
          hasCentered = true;
        } else if (currentLocation) {
          map.setView([currentLocation.latitude, currentLocation.longitude], zoomLevel);
          hasCentered = true;
        } else {
          map.setView([17.6599, 75.9064], zoomLevel);
        }
      }

      // 3. Handle external manual zoom triggers from parent controls
      if (lastZoom !== null && zoomLevel !== lastZoom) {
        map.setZoom(zoomLevel);
      }
      lastZoom = zoomLevel;

      // 3. Clear stop markers
      stopMarkers.forEach(m => map.removeLayer(m));
      stopMarkers = [];

      // 4. Add stop markers
      if (stops) {
        stops.forEach((stop, idx) => {
          if (stop.latitude && stop.longitude) {
            const isNext = idx === nextStopIndex;
            let color = '#94a3b8'; // grey
            if (stop.reached) {
              color = '#43a047'; // green
            } else if (isNext) {
              color = '#e53935'; // red
            }
            
            const marker = L.circleMarker([stop.latitude, stop.longitude], {
              radius: isNext ? 8 : 6,
              fillColor: color,
              color: '#ffffff',
              weight: 2,
              fillOpacity: 1
            }).addTo(map).bindPopup(stop.name + (stop.reached ? ' (Passed)' : isNext ? ' (Next Stop)' : ''));
            stopMarkers.push(marker);
          }
        });
      }

      // 5. Add bus live marker
      if (busMarker) {
        map.removeLayer(busMarker);
        busMarker = null;
      }
      if (currentLocation) {
        const busIcon = L.divIcon({
          className: 'bus-marker',
          html: '<div style="background-color: #1058d1; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🚌</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        busMarker = L.marker([currentLocation.latitude, currentLocation.longitude], {icon: busIcon})
          .addTo(map)
          .bindPopup('Bus Live Location');
      }
    }

    // Initial render
    renderMap({
      routePoints: ${JSON.stringify(routePoints)},
      stops: ${JSON.stringify(stops)},
      currentLocation: ${JSON.stringify(currentLocation)},
      nextStopIndex: ${nextStopIndex},
      zoomLevel: ${leafletZoom}
    });

    // Listen for updates from parent React component
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'updateLocation') {
        renderMap(event.data);
      }
    });
  </script>
</body>
</html>
    `;
  }, [isDark]);

  // Push updates to iframe without reloading
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({
          type: 'updateLocation',
          routePoints,
          stops,
          currentLocation,
          nextStopIndex,
          zoomLevel: leafletZoom
        }, '*');
      } catch (e) {
        console.warn('postMessage to Leaflet iframe failed:', e);
      }
    }
  }, [routePoints, stops, currentLocation, nextStopIndex, leafletZoom]);

  // @ts-ignore
  const Iframe = 'iframe';

  return (
    <View style={styles.container}>
      <Iframe
        ref={iframeRef}
        srcDoc={initialSrcDoc}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#faf8f5',
  },
});
