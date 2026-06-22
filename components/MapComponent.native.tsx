import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

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
  busNumber,
  currentSpeed,
  latitudeDelta,
  longitudeDelta,
}: MapComponentProps) {
  return (
    <MapView
      style={styles.map}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      region={{
        latitude: currentLocation ? currentLocation.latitude : (routePoints[0]?.latitude || 17.6599),
        longitude: currentLocation ? currentLocation.longitude : (routePoints[0]?.longitude || 75.9064),
        latitudeDelta,
        longitudeDelta,
      }}
    >
      {routePoints.length > 1 && (
        <Polyline
          coordinates={routePoints}
          strokeColor="#1058d1"
          strokeWidth={4}
        />
      )}

      {/* Stop Markers */}
      {stops.map((stop, index) => {
        if (!stop.latitude || !stop.longitude) return null;
        const isNext = index === nextStopIndex;
        return (
          <Marker
            key={index}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={stop.name}
            description={stop.reached ? 'Passed' : isNext ? 'Next Stop' : 'Upcoming stop'}
          >
            <View style={[
              styles.mapDot,
              stop.reached && styles.mapDotReached,
              isNext && styles.mapDotNext
            ]} />
          </Marker>
        );
      })}

      {/* Live Bus Marker */}
      {currentLocation && (
        <Marker
          coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
          title={`Bus ${busNumber}`}
          description={`Speed: ${currentSpeed ? Math.round(currentSpeed) : 0} km/h`}
        >
          <View style={styles.mapBusMarkerCircle}>
            <Ionicons name="bus" size={16} color="#ffffff" />
          </View>
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
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
});
