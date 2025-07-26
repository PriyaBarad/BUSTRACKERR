// // // // import React, { useEffect, useState } from 'react';
// // // // import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
// // // // import MapView, { Marker } from 'react-native-maps';
// // // // import { useLocalSearchParams } from 'expo-router';

// // // // export default function LiveMapScreen() {
// // // //   const { deviceId } = useLocalSearchParams();
// // // //   const resolvedDeviceId = Array.isArray(deviceId) ? deviceId[0] : deviceId;

// // // //   const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
// // // //   const [loading, setLoading] = useState(true);

// // // //   const defaultRegion = {
// // // //     latitude: 17.6599,
// // // //     longitude: 75.9064,
// // // //     latitudeDelta: 0.05,
// // // //     longitudeDelta: 0.05,
// // // //   };

// // // //   useEffect(() => {
// // // //     const fetchLocation = async () => {
// // // //       try {
// // // //         const response = await fetch(`http://192.168.36.52:5000/api/gps/${resolvedDeviceId}`);
// // // //         const text = await response.text();

// // // //         // Try to parse JSON
// // // //         let data;
// // // //         try {
// // // //           data = JSON.parse(text);
// // // //         } catch (jsonError) {
// // // //           console.error("❌ JSON parse failed. Possibly received HTML:", text.slice(0, 100));
// // // //           Alert.alert("Error", "Received unexpected response while fetching location.");
// // // //           return;
// // // //         }

// // // //         console.log("📍 GPS API response:", data);

// // // //         if (data.latitude && data.longitude) {
// // // //           setLocation({ latitude: data.latitude, longitude: data.longitude });
// // // //         } else {
// // // //           Alert.alert("Warning", "Live location not found. Showing default map.");
// // // //         }
// // // //       } catch (error) {
// // // //         console.error("❌ Fetch error:", (error as Error).message);
// // // //         Alert.alert("Error", "Failed to fetch location.");
// // // //       } finally {
// // // //         setLoading(false); // Always show map after fetch attempt
// // // //       }
// // // //     };

// // // //     if (resolvedDeviceId) {
// // // //       fetchLocation();
// // // //     } else {
// // // //       console.warn("⚠️ No deviceId passed to map screen.");
// // // //       setLoading(false); // Show map even if deviceId is missing
// // // //     }
// // // //   }, [resolvedDeviceId]);

// // // //   const mapRegion = location
// // // //     ? {
// // // //         ...location,
// // // //         latitudeDelta: 0.01,
// // // //         longitudeDelta: 0.01,
// // // //       }
// // // //     : defaultRegion;

// // // //   return (
// // // //     <View style={styles.container}>
// // // //       {loading && (
// // // //         <View style={styles.overlay}>
// // // //           <ActivityIndicator size="large" color="#0000ff" />
// // // //         </View>
// // // //       )}

// // // //       <MapView style={styles.map} initialRegion={mapRegion}>
// // // //         {location && (
// // // //           <Marker
// // // //             coordinate={location}
// // // //             title="Bus Location"
// // // //             description={`Device ID: ${resolvedDeviceId}`}
// // // //           />
// // // //         )}
// // // //       </MapView>
// // // //     </View>
// // // //   );
// // // // }

// // // // const styles = StyleSheet.create({
// // // //   container: {
// // // //     flex: 1,
// // // //   },
// // // //   map: {
// // // //     flex: 1,
// // // //   },
// // // //   overlay: {
// // // //     ...StyleSheet.absoluteFillObject,
// // // //     justifyContent: 'center',
// // // //     alignItems: 'center',
// // // //     backgroundColor: 'rgba(255,255,255,0.6)',
// // // //     zIndex: 1,
// // // //   },
// // // // });






// // // import React, { useEffect, useState } from 'react';
// // // import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
// // // import MapView, { Marker } from 'react-native-maps';
// // // import { useLocalSearchParams } from 'expo-router';

// // // export default function LiveMapScreen() {
// // //   const { deviceId } = useLocalSearchParams();
// // //   const resolvedDeviceId = Array.isArray(deviceId) ? deviceId[0] : deviceId;

// // //   const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
// // //   const [loading, setLoading] = useState(true);

// // //   const defaultRegion = {
// // //     latitude: 17.6599,
// // //     longitude: 75.9064,
// // //     latitudeDelta: 0.05,
// // //     longitudeDelta: 0.05,
// // //   };

// // //   useEffect(() => {
// // //     const fetchLocation = async () => {
// // //       try {
// // //         const response = await fetch(`http://192.168.36.52:5000/api/gps/${resolvedDeviceId}`);
// // //         const data = await response.json();
// // //         console.log("📍 GPS Data:", data);

// // //         let { latitude, longitude } = data;

// // //         // Auto-correct reversed lat/lng
// // //         if (latitude > 50) {
// // //           [latitude, longitude] = [longitude, latitude];
// // //         }

// // //         if (latitude && longitude) {
// // //           setLocation({ latitude, longitude });
// // //         }

// // //       } catch (error) {
// // //         console.error("❌ Fetch error:", (error as Error).message);
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     };

// // //     // Initial fetch
// // //     fetchLocation();

// // //     // Auto-refresh every 5 seconds
// // //     const intervalId = setInterval(fetchLocation, 5000);

// // //     // Cleanup interval on unmount
// // //     return () => clearInterval(intervalId);
// // //   }, [resolvedDeviceId]);

// // //   if (loading && !location) {
// // //     return (
// // //       <View style={styles.center}>
// // //         <ActivityIndicator size="large" color="#0000ff" />
// // //       </View>
// // //     );
// // //   }

// // //   const mapRegion = location
// // //     ? {
// // //         ...location,
// // //         latitudeDelta: 0.01,
// // //         longitudeDelta: 0.01,
// // //       }
// // //     : defaultRegion;

// // //   return (
// // //     <MapView style={styles.map} initialRegion={mapRegion}>
// // //       {location && (
// // //         <Marker
// // //           coordinate={location}
// // //           title="Bus Location"
// // //           description={`Device ID: ${resolvedDeviceId}`}
// // //         />
// // //       )}
// // //     </MapView>
// // //   );
// // // }

// // // const styles = StyleSheet.create({
// // //   map: {
// // //     flex: 1,
// // //   },
// // //   center: {
// // //     flex: 1,
// // //     justifyContent: 'center',
// // //     alignItems: 'center',
// // //   },
// // // });







// // import React, { useEffect, useState } from 'react';
// // import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
// // import MapView, { Marker } from 'react-native-maps';
// // import { useLocalSearchParams } from 'expo-router';

// // export default function LiveMapScreen() {
// //   const { deviceId } = useLocalSearchParams();
// //   const resolvedDeviceId = Array.isArray(deviceId) ? deviceId[0] : deviceId;

// //   const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
// //   const [loading, setLoading] = useState(true);

// //   const defaultRegion = {
// //     latitude: 17.6599,
// //     longitude: 75.9064,
// //     latitudeDelta: 0.05,
// //     longitudeDelta: 0.05,
// //   };

// //   useEffect(() => {
// //     const fetchLocation = async () => {
// //       try {
// //         const response = await fetch(`http://10.1.65.155:5000/api/gps/${resolvedDeviceId}`);
// //         const data = await response.json();
// //         console.log("📍 GPS Data:", data);

// //         const { latitude, longitude } = data;

// //         if (latitude && longitude) {
// //           setLocation({ latitude, longitude });
// //         } else {
// //           Alert.alert("Invalid GPS", "No location found for this bus.");
// //         }

// //       } catch (error) {
// //         console.error("❌ Fetch error:", (error as Error).message);
// //         Alert.alert("Error", "Could not fetch location.");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchLocation();

// //     const interval = setInterval(fetchLocation, 5000);

// //     return () => clearInterval(interval);
// //   }, [resolvedDeviceId]);

// //   if (loading && !location) {
// //     return (
// //       <View style={styles.center}>
// //         <ActivityIndicator size="large" color="#0000ff" />
// //       </View>
// //     );
// //   }

// //   const mapRegion = location
// //     ? {
// //         ...location,
// //         latitudeDelta: 0.01,
// //         longitudeDelta: 0.01,
// //       }
// //     : defaultRegion;

// //   return (
// //     <MapView style={styles.map} initialRegion={mapRegion}>
// //       {location && (
// //         <Marker
// //           coordinate={location}
// //           title="Bus Location"
// //           description={`Device ID: ${resolvedDeviceId}`}
// //         />
// //       )}
// //     </MapView>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   map: {
// //     flex: 1,
// //   },
// //   center: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// // });







// import React, { useEffect, useRef, useState } from 'react';
// import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
// import MapView, { Marker } from 'react-native-maps';
// import { useLocalSearchParams } from 'expo-router';

// export default function LiveMapScreen() {
//   const { deviceId } = useLocalSearchParams();
//   const resolvedDeviceId = Array.isArray(deviceId) ? deviceId[0] : deviceId;

//   const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [loading, setLoading] = useState(true);
//   const mapRef = useRef<MapView>(null);

//   useEffect(() => {
//     const fetchLocation = async () => {
//       try {
//         const response = await fetch(`http://10.1.65.155:5000/api/gps/${resolvedDeviceId}`);
//         const data = await response.json();
//         console.log("📍 GPS Data:", data);

//         const { latitude, longitude } = data;

//         if (latitude && longitude) {
//           const newLocation = { latitude, longitude };
//           setLocation(newLocation);

//           // Animate the map to new location
//           if (mapRef.current) {
//             mapRef.current.animateToRegion({
//               ...newLocation,
//               latitudeDelta: 0.01,
//               longitudeDelta: 0.01,
//             }, 1000);
//           }
//         } else {
//           Alert.alert("Invalid GPS", "No location found for this bus.");
//         }

//       } catch (error) {
//         console.error("❌ Fetch error:", (error as Error).message);
//         Alert.alert("Error", "Could not fetch location.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLocation();
//     const interval = setInterval(fetchLocation, 5000); // Refresh every 5 seconds
//     return () => clearInterval(interval);
//   }, [resolvedDeviceId]);

//   if (loading && !location) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#0000ff" />
//       </View>
//     );
//   }

//   return (
//     <MapView
//       ref={mapRef}
//       style={styles.map}
//       region={
//         location
//           ? {
//               ...location,
//               latitudeDelta: 0.01,
//               longitudeDelta: 0.01,
//             }
//           : undefined
//       }
//     >
//       {location && (
//         <Marker
//           coordinate={location}
//           title="Bus Location"
//           description={`Device ID: ${resolvedDeviceId}`}
//         />
//       )}
//     </MapView>
//   );
// }

// const styles = StyleSheet.create({
//   map: {
//     flex: 1,
//   },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function LiveMapScreen() {
  const { deviceId, busNumber } = useLocalSearchParams();
  const resolvedDeviceId = Array.isArray(deviceId) ? deviceId[0] : deviceId;
  const resolvedBusNumber = Array.isArray(busNumber) ? busNumber[0] : busNumber;

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!resolvedDeviceId) return;

    const fetchLocation = async () => {
      try {
        const res = await fetch(`http://192.168.36.52:5000/api/gps/${resolvedDeviceId}`);
        const data = await res.json();

        if (!data || !data.latitude || !data.longitude) {
          Alert.alert('No GPS data found for this device');
        } else {
          setLocation({ latitude: data.latitude, longitude: data.longitude });
        }
      } catch (error) {
        console.error('❌ Error fetching GPS location:', error);
        Alert.alert('Error fetching GPS data');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [resolvedDeviceId]);

  if (loading) {
    return <ActivityIndicator size="large" color="blue" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={location} title="Bus Location" />
        </MapView>
      ) : (
        <Text style={styles.noData}>No location data found.</Text>
      )}

      {/* Button to Navigate to verticalMap */}
      <TouchableOpacity
        style={styles.routeButton}
        onPress={() => router.push({ pathname: '/verticalMap', params: { busNumber: resolvedBusNumber } })}
      >
        <Text style={styles.buttonText}>📍 Show Route</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  noData: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  },
  routeButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#2563EB',
    fontWeight: '600',
  },
});
