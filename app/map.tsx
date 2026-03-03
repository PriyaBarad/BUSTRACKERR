
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   TouchableOpacity,
//   Animated,
// } from 'react-native';
// import MapView, { MarkerAnimated } from 'react-native-maps';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import axios from 'axios';

// export default function MapScreen() {
//   const { busNumber, deviceId, source, via, destination } = useLocalSearchParams();

//   // Resolve possible array values from params
//   const resolvedBusNumber = Array.isArray(busNumber) ? busNumber[0] : busNumber;
//   const resolvedDeviceId = Array.isArray(deviceId) ? deviceId[0] : deviceId;
//   const resolvedSource = Array.isArray(source) ? source[0] : source;
//   const resolvedVia = Array.isArray(via) ? via[0] : via;
//   const resolvedDestination = Array.isArray(destination) ? destination[0] : destination;

//   const [loading, setLoading] = useState(true);
//   const [hasData, setHasData] = useState(false);
//   const mapRef = useRef<MapView>(null);
//   const router = useRouter();

//   // Animated values for latitude and longitude
//   const latitude = useRef(new Animated.Value(17.6599)).current;
//   const longitude = useRef(new Animated.Value(75.9064)).current;

//   const defaultRegion = {
//     latitude: 17.6599,
//     longitude: 75.9064,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   };

//   useEffect(() => {
//     const fetchLocation = async () => {
//       try {
//         const res = await axios.get(`http://10.34.28.52:5000/api/routes/location/${resolvedBusNumber}`);
//         const { lat, lng } = res.data;

//         if (!isNaN(lat) && !isNaN(lng)) {
//           setHasData(true);

//           Animated.timing(latitude, {
//             toValue: lat,
//             duration: 1000,
//             useNativeDriver: false,
//           }).start();

//           Animated.timing(longitude, {
//             toValue: lng,
//             duration: 1000,
//             useNativeDriver: false,
//           }).start();

//           mapRef.current?.animateToRegion({
//             latitude: lat,
//             longitude: lng,
//             latitudeDelta: 0.01,
//             longitudeDelta: 0.01,
//           }, 1000);
//         } else {
//           setHasData(false);
//         }
//       } catch (err) {
//         console.error('❌ Failed to fetch location:', err);
//         Alert.alert('Error fetching GPS location');
//         setHasData(false);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (resolvedBusNumber) {
//       fetchLocation();
//       const interval = setInterval(fetchLocation, 10000);
//       return () => clearInterval(interval);
//     }
//   }, [resolvedBusNumber]);

//   return (
//     <SafeAreaView style={styles.container}>
//       <MapView
//         ref={mapRef}
//         style={styles.map}
//         initialRegion={defaultRegion}
//       >
//         {hasData && (
//           <MarkerAnimated
//             coordinate={{
//               latitude: latitude as unknown as number,
//               longitude: longitude as unknown as number,
//             }}
//             title="Bus Location"
//             description={`Bus Number: ${resolvedBusNumber}`}
//           />
//         )}
//       </MapView>

//       {!hasData && !loading && (
//         <Text style={styles.noData}>No live location found</Text>
//       )}

//       {loading && (
//         <ActivityIndicator size="large" color="blue" style={styles.loader} />
//       )}

//       <TouchableOpacity
//         style={styles.routeButton}
//         onPress={() =>
//           router.push({
//             pathname: '/verticalMap',
//             params: { 
//               busNumber: resolvedBusNumber,
//               deviceId: resolvedDeviceId,
//               source: resolvedSource,
//               via: resolvedVia,
//               destination: resolvedDestination,
//             },
//           })
//         }
//       >
//         <Text style={styles.buttonText}>📍 Show Route</Text>
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   map: { flex: 1 },
//   loader: {
//     position: 'absolute',
//     top: '50%',
//     alignSelf: 'center',
//   },
//   noData: {
//     position: 'absolute',
//     top: 20,
//     alignSelf: 'center',
//     backgroundColor: '#fff',
//     padding: 6,
//     borderRadius: 6,
//     color: '#888',
//   },
//   routeButton: {
//     position: 'absolute',
//     bottom: 20,
//     left: 20,
//     backgroundColor: '#fff',
//     padding: 10,
//     borderRadius: 8,
//     elevation: 4,
//   },
//   buttonText: {
//     color: '#2563EB',
//     fontWeight: '600',
//   },
// });
