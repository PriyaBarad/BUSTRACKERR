// // import React, { useEffect, useState, useRef,  } from 'react';
// // import {
// //   View,
// //   Text,
// //   StyleSheet,
// //   ScrollView,
// //   ActivityIndicator,
// //   Image,
// //   Animated,
// //   TouchableOpacity,
// //   Dimensions,
// // } from 'react-native';
// // import { useFocusEffect } from 'expo-router';
// // import { useLocalSearchParams, useRouter } from 'expo-router';
// // import Header from '../components/Header';
// // import axios from 'axios';
// // import { Ionicons } from '@expo/vector-icons';

// // const STOP_HEIGHT = 110;
// // const DOT_SIZE = 16;
// // const BUS_ICON_SIZE = 28;
// // const { height: windowHeight } = Dimensions.get('window');
// // const MOVEMENT_THRESHOLD = 0.0003; // ~30 meters
// // const STOP_PRECISION = 0.0001; // ~10 meters precision for stop matching

// // type Stop = {
// //   name: string;
// //   timingOffset: string;
// //   latitude?: number;
// //   longitude?: number;
// //   isSource?: boolean;
// //   isDestination?: boolean;
// //   reached?: boolean;
// //   eta?: string;
// //   delayInMinutes?: number;
// // };

// // type Trip = {
// //   sourceTime: string;
// //   destinationTime: string;
// //   stops: {
// //     name: string;
// //     timingOffset: string;
// //     latitude: number;
// //     longitude: number;
// //   }[];
// // };

// // export default function VerticalMap() {
// //   const router = useRouter();
// //   const params = useLocalSearchParams();
// //   const busNumber = (params.busNumber as string) || '';
// //   const source = (params.source as string) || '';
// //   const destination = (params.destination as string) || '';
// //   const via = (params.via as string) || '';
// //   const deviceId = (params.deviceId as string) || '';
// //   const buses = params.buses ? JSON.parse(params.buses as string) : [];

// //   const [trips, setTrips] = useState<Trip[]>([]);
// //   const [selectedTripIndex, setSelectedTripIndex] = useState(0);
// //   const [stops, setStops] = useState<Stop[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [locationLoading, setLocationLoading] = useState(false);
// //   const [locationError, setLocationError] = useState<string | null>(null);
// //   const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
// //   const [previousLocation, setPreviousLocation] = useState<{
// //     latitude: number;
// //     longitude: number;
// //     timestamp: number;
// //   } | null>(null);
// //   const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
// //   const [currentStopIndex, setCurrentStopIndex] = useState(0);
// //   const busPosition = useRef(new Animated.Value(0)).current;
// //   const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

// //   // Fetch trips when component mounts or busNumber changes
// //   useEffect(() => {
// //     const fetchTrips = async () => {
// //       if (!busNumber) return;
      
// //       setLoading(true);
// //       try {
// //         const response = await axios.get(`http://10.34.28.52:5000/api/routes/trips/${busNumber}`);
        
// //         const tripsData = response.data?.trips || response.data || [];
        
// //         const normalizedTrips: Trip[] = tripsData.map((trip: any) => ({
// //           sourceTime: trip.sourceTime,
// //           destinationTime: trip.destinationTime,
// //           stops: trip.stops?.map((stop: any) => ({
// //             name: stop.name,
// //             timingOffset: stop.timingOffset,
// //             latitude: stop.latitude,
// //             longitude: stop.longitude
// //           })) || []
// //         }));
        
// //         setTrips(normalizedTrips);
        
// //         if (normalizedTrips.length > 0) {
// //           setSelectedTripIndex(0);
// //         }
// //       } catch (error) {
// //         console.error('Error fetching trips:', error);
// //         setLocationError('Failed to load trip data');
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchTrips();
// //   }, [busNumber]);

// //   // Update stops when selected trip changes
// //   useEffect(() => {
// //     if (trips.length === 0 || selectedTripIndex >= trips.length) return;

// //     const selectedTrip = trips[selectedTripIndex];
    
// //     const stopsWithTerminals: Stop[] = [
// //       {
// //         name: source || 'Source',
// //         timingOffset: selectedTrip.sourceTime,
// //         isSource: true,
// //         reached: false
// //       },
// //       ...selectedTrip.stops.map(stop => ({
// //         ...stop,
// //         reached: false
// //       })),
// //       {
// //         name: destination || 'Destination',
// //         timingOffset: selectedTrip.destinationTime,
// //         isDestination: true,
// //         reached: false
// //       }
// //     ];

// //     setStops(stopsWithTerminals);
// //     setCurrentStopIndex(0);
// //     busPosition.setValue(0);
// //     setDirection('forward');
// //     setCurrentLocation(null);
// //     setPreviousLocation(null);
// //     setCurrentSpeed(null);
// //   }, [selectedTripIndex, trips, source, destination]);

// //   // Bus location update effect
// //   useEffect(() => {
// //     if (!busNumber || stops.length === 0 || !deviceId) return;

// //     let isMounted = true;
// //     let intervalId: NodeJS.Timeout; // Changed to NodeJS.Timeout

// //     const fetchAndAnimate = async () => {
// //       if (!isMounted) return;
      
// //       try {
// //         setLocationLoading(true);
// //         setLocationError(null);
        
// //         const locationRes = await axios.get(`http://10.34.28.52:5000/api/routes/location/${busNumber}`);
        
// //         if (!isMounted) return;
        
// //         const location = {
// //           latitude: locationRes.data.lat,
// //           longitude: locationRes.data.lng,
// //           timestamp: Date.now()
// //         };

// //         // Validate location data
// //         if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
// //           throw new Error('Invalid location values');
// //         }

// //         // Check if we've moved significantly
// //         let hasMovedSignificantly = true;
// //         if (previousLocation) {
// //           const distance = calculateDistance(
// //             previousLocation.latitude,
// //             previousLocation.longitude,
// //             location.latitude,
// //             location.longitude
// //           );
// //           hasMovedSignificantly = distance > MOVEMENT_THRESHOLD;
          
// //           // Calculate speed if we've moved
// //           if (hasMovedSignificantly) {
// //             const timeHours = (Date.now() - previousLocation.timestamp) / (1000 * 60 * 60);
// //             const speed = distance / timeHours;
// //             setCurrentSpeed(prev => prev ? (prev * 0.7 + speed * 0.3) : speed);
// //           }
// //         }

// //         setPreviousLocation(location);
// //         setCurrentLocation(location);

// //         const updatedStops = [...stops];
// //         let newStopIndex = currentStopIndex;
// //         let hasReachedExactStop = false;

// //         // 1. First check for exact stop matches
// //         for (let i = 0; i < stops.length; i++) {
// //           const stop = stops[i];
// //           if (stop.latitude && stop.longitude) {
// //             // High precision match (coordinates match exactly or within 10 meters)
// //             const distance = calculateDistance(
// //               location.latitude,
// //               location.longitude,
// //               stop.latitude,
// //               stop.longitude
// //             );
            
// //             if (distance < STOP_PRECISION) {
// //               updatedStops[i].reached = true;
// //               updatedStops[i].eta = 'Reached';
// //               newStopIndex = i;
// //               hasReachedExactStop = true;
// //               break;
// //             }
// //           }
// //         }

// //         // Only update position if we've moved significantly or reached a stop
// //         if (hasMovedSignificantly || hasReachedExactStop) {
// //           // Update state if we reached a new stop
// //           if (hasReachedExactStop && newStopIndex !== currentStopIndex) {
// //             setStops(updatedStops);
// //             setCurrentStopIndex(newStopIndex);
            
// //             // Slow animation to the new stop (3 seconds)
// //             const targetPosition = newStopIndex * STOP_HEIGHT;
// //             Animated.timing(busPosition, {
// //               toValue: targetPosition,
// //               duration: 3000,
// //               useNativeDriver: false,
// //             }).start();
// //           }
// //           // If between stops, calculate progress
// //           else if (currentStopIndex < stops.length - 1) {
// //             const currentStop = stops[currentStopIndex];
// //             const nextStop = stops[currentStopIndex + 1];
            
// //             if (currentStop?.latitude && currentStop?.longitude && 
// //                 nextStop?.latitude && nextStop?.longitude) {
// //               const progress = calculateProgress(
// //                 currentStop,
// //                 nextStop,
// //                 location
// //               );
              
// //               // Very slow interpolation between stops (5 seconds)
// //               const targetPosition = currentStopIndex * STOP_HEIGHT + (progress * STOP_HEIGHT);
// //               Animated.timing(busPosition, {
// //                 toValue: targetPosition,
// //                 duration: 5000,
// //                 useNativeDriver: false,
// //               }).start();
// //             }
// //           }
// //         }

// //         // Update ETAs for upcoming stops
// //         if (currentSpeed && currentSpeed > 0) {
// //           for (let i = currentStopIndex + 1; i < stops.length; i++) {
// //             const stop = stops[i];
// //             if (stop.latitude && stop.longitude) {
// //               const distanceToStop = calculateDistance(
// //                 location.latitude,
// //                 location.longitude,
// //                 stop.latitude,
// //                 stop.longitude
// //               );
              
// //               const hoursToStop = distanceToStop / currentSpeed;
// //               const minutesToStop = Math.round(hoursToStop * 60);
              
// //               updatedStops[i].eta = minutesToStop <= 0 
// //                 ? 'Arriving now' 
// //                 : `ETA: ${minutesToStop} min`;
// //               updatedStops[i].delayInMinutes = minutesToStop;
// //             }
// //           }
// //           setStops(updatedStops);
// //         }

// //       } catch (err) {
// //         if (isMounted) {
// //           console.error('Error fetching location:', err);
// //           setLocationError('Error updating bus location');
// //         }
// //       } finally {
// //         if (isMounted) {
// //           setLocationLoading(false);
// //         }
// //       }
// //     };

// //     fetchAndAnimate();
// //     intervalId = setInterval(fetchAndAnimate, 50000);

// //     return () => {
// //       isMounted = false;
// //       clearInterval(intervalId);
// //     };
// //   }, [busNumber, stops, currentStopIndex, deviceId, previousLocation]);

// //   const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
// //     const toRad = (x: number) => x * Math.PI / 180;
// //     const R = 6371;
// //     const dLat = toRad(lat2 - lat1);
// //     const dLon = toRad(lon2 - lon1);
// //     const a =
// //       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
// //       Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
// //       Math.sin(dLon / 2) * Math.sin(dLon / 2);
// //     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// //     return R * c;
// //   };

// //   const calculateProgress = (
// //     currentStop: Stop, 
// //     nextStop: Stop, 
// //     location: { latitude: number; longitude: number }
// //   ): number => {
// //     if (!currentStop.latitude || !currentStop.longitude || 
// //         !nextStop.latitude || !nextStop.longitude) return 0;
        
// //     const totalDistance = calculateDistance(
// //       currentStop.latitude, 
// //       currentStop.longitude, 
// //       nextStop.latitude, 
// //       nextStop.longitude
// //     );
    
// //     const coveredDistance = calculateDistance(
// //       currentStop.latitude, 
// //       currentStop.longitude, 
// //       location.latitude, 
// //       location.longitude
// //     );
    
// //     return Math.min(1, Math.max(0, coveredDistance / totalDistance));
// //   };

// //   const handleTripSelect = (index: number) => {
// //     setSelectedTripIndex(index);
// //   };

// //   return (
// //     <View style={styles.container}>
// //       <Header />

// //       <View style={styles.card}>
// //         <View style={styles.backButtonContainer}>
// //           <TouchableOpacity
// //             onPress={() =>
// //               router.push({
// //                 pathname: '/busResult',
// //                 params: {
// //                   source,
// //                   destination,
// //                   via,
// //                   buses: JSON.stringify(buses),
// //                 },
// //               })
// //             }
// //             style={styles.backButton}
// //           >
// //             <Ionicons name="arrow-back" size={24} color="#fff" />
// //           </TouchableOpacity>
// //         </View>

// //         {trips.length > 0 && (
// //           <View style={styles.tripSelectorContainer}>
// //             <Text style={styles.tripSelectorTitle}>Select Trip:</Text>
// //             <ScrollView 
// //               horizontal 
// //               showsHorizontalScrollIndicator={false}
// //               contentContainerStyle={styles.tripButtonsContainer}
// //             >
// //               {trips.map((trip, index) => (
// //                 <TouchableOpacity
// //                   key={index}
// //                   style={[
// //                     styles.tripButton,
// //                     selectedTripIndex === index && styles.tripButtonSelected
// //                   ]}
// //                   onPress={() => handleTripSelect(index)}
// //                 >
// //                   <Text style={[
// //                     styles.tripButtonText,
// //                     selectedTripIndex === index && styles.tripButtonTextSelected
// //                   ]}>
// //                     Trip {index + 1}
// //                   </Text>
// //                   <Text style={styles.tripTimeText}>
// //                     {trip.sourceTime} - {trip.destinationTime}
// //                   </Text>
// //                 </TouchableOpacity>
// //               ))}
// //             </ScrollView>
// //           </View>
// //         )}

// //         <View style={styles.busInfoContainer}>
// //           <View style={styles.busNumberContainer}>
// //             <Text style={styles.busNumber}>Bus {busNumber}</Text>
// //           </View>
// //           <View style={styles.routeInfoContainer}>
// //             <View style={styles.routeRow}>
// //               <Ionicons name="location" size={16} color="#4CAF50" />
// //               <Text style={styles.routeText}>{source || 'Loading...'}</Text>
// //               {trips[selectedTripIndex] && (
// //                 <Text style={styles.timeText}> - {trips[selectedTripIndex].sourceTime}</Text>
// //               )}
// //             </View>
// //             {via && (
// //               <View style={styles.routeRow}>
// //                 <Ionicons name="swap-vertical" size={16} color="#FF9800" />
// //                 <Text style={styles.routeText}>Via: {via}</Text>
// //               </View>
// //             )}
// //             <View style={styles.routeRow}>
// //               <Ionicons name="flag" size={16} color="#F44336" />
// //               <Text style={styles.routeText}>{destination || 'Loading...'}</Text>
// //               {trips[selectedTripIndex] && (
// //                 <Text style={styles.timeText}> - {trips[selectedTripIndex].destinationTime}</Text>
// //               )}
// //             </View>
// //           </View>
// //         </View>

// //         {loading ? (
// //           <View style={styles.loadingContainer}>
// //             <ActivityIndicator size="large" color="#5E8D48" />
// //             <Text style={styles.loadingText}>Loading route information...</Text>
// //           </View>
// //         ) : (
// //           <View style={styles.contentContainer}>
// //             <ScrollView
// //               contentContainerStyle={[styles.scroll, { minHeight: windowHeight * 0.6 }]}
// //               showsVerticalScrollIndicator={true}
// //             >
// //               <View style={{ height: stops.length * STOP_HEIGHT }}>
// //                 <Animated.View style={[styles.busIconContainer, { top: busPosition }]}>
// //                   <Image
// //                     source={require('../assets/images/bus-icon.png')}
// //                     style={[
// //                       styles.busIcon,
// //                       { transform: [{ rotate: direction === 'forward' ? '0deg' : '180deg' }] }
// //                     ]}
// //                     resizeMode="contain"
// //                   />
// //                   <View style={styles.currentLocationPulse} />
// //                 </Animated.View>

// //                 {stops.map((stop, index) => (
// //                   <View key={index} style={[styles.stopContainer, { top: index * STOP_HEIGHT }]}>
// //                     <View style={styles.lineContainer}>
// //                       <View
// //                         style={[
// //                           styles.dot,
// //                           stop.reached && styles.reachedDot,
// //                           stop.isSource && !stop.reached && styles.sourceDot,
// //                           stop.isDestination && !stop.reached && styles.destinationDot,
// //                         ]}
// //                       />
// //                       {index !== stops.length - 1 && (
// //                         <View style={styles.verticalLine}>
// //                           {stop.reached && (
// //                             <View style={[styles.reachedLine, { height: STOP_HEIGHT }]} />
// //                           )}
// //                         </View>
// //                       )}
// //                     </View>
// //                     <View style={styles.stopInfo}>
// //                       <View style={styles.stopHeader}>
// //                         <Text style={styles.stopName}>{stop.name}</Text>
// //                         {stop.reached ? (
// //                           <View style={styles.reachedBadge}>
// //                             <Text style={styles.reachedText}>Reached</Text>
// //                           </View>
// //                         ) : stop.eta ? (
// //                           <View style={[
// //                             styles.etaBadge,
// //                             stop.delayInMinutes && stop.delayInMinutes > 5 ? styles.delayedBadge : styles.onTimeBadge
// //                           ]}>
// //                             <Text style={styles.etaText}>{stop.eta}</Text>
// //                           </View>
// //                         ) : null}
// //                       </View>
// //                       <Text style={styles.arrivalTime}>
// //                         {stop.isSource
// //                           ? `Departure: ${stop.timingOffset}`
// //                           : stop.isDestination
// //                             ? `Arrival: ${stop.timingOffset}`
// //                             : `Scheduled: ${stop.timingOffset}`}
// //                       </Text>
// //                     </View>
// //                   </View>
// //                 ))}
// //               </View>
// //             </ScrollView>

// //             {locationLoading && (
// //               <View style={styles.locationLoadingContainer}>
// //                 <ActivityIndicator size="small" color="#5E8D48" />
// //                 <Text style={styles.locationLoadingText}>Updating bus location...</Text>
// //               </View>
// //             )}

// //             {locationError && (
// //               <View style={styles.errorContainer}>
// //                 <Ionicons name="warning" size={20} color="#fff" />
// //                 <Text style={styles.errorText}>{locationError}</Text>
// //               </View>
// //             )}
// //           </View>
// //         )}
// //       </View>
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: '#f5f7fa',
// //   },
// //   card: {
// //     margin: 16,
// //     padding: 20,
// //     borderRadius: 16,
// //     backgroundColor: 'white',
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 6,
// //     elevation: 3,
// //     flex: 1,
// //   },
// //   contentContainer: {
// //     flex: 1,
// //   },
// //   backButtonContainer: {
// //     position: 'absolute',
// //     top: 16,
// //     right: 16,
// //     zIndex: 10,
// //   },
// //   backButton: {
// //     backgroundColor: '#5E8D48',
// //     width: 40,
// //     height: 40,
// //     borderRadius: 20,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.2,
// //     shadowRadius: 4,
// //   },
// //   tripSelectorContainer: {
// //     marginBottom: 16,
// //   },
// //   tripSelectorTitle: {
// //     fontSize: 16,
// //     fontWeight: '600',
// //     color: '#333',
// //     marginBottom: 8,
// //   },
// //   tripButtonsContainer: {
// //     paddingBottom: 8,
// //   },
// //   tripButton: {
// //     paddingVertical: 8,
// //     paddingHorizontal: 16,
// //     borderRadius: 20,
// //     borderWidth: 1,
// //     borderColor: '#5E8D48',
// //     marginRight: 8,
// //     alignItems: 'center',
// //   },
// //   tripButtonSelected: {
// //     backgroundColor: '#5E8D48',
// //   },
// //   tripButtonText: {
// //     fontSize: 14,
// //     color: '#5E8D48',
// //     fontWeight: '600',
// //   },
// //   tripButtonTextSelected: {
// //     color: '#fff',
// //   },
// //   tripTimeText: {
// //     fontSize: 12,
// //     color: '#757575',
// //     marginTop: 2,
// //   },
// //   busInfoContainer: {
// //     marginBottom: 24,
// //   },
// //   busNumberContainer: {
// //     backgroundColor: '#5E8D48',
// //     paddingVertical: 8,
// //     paddingHorizontal: 16,
// //     borderRadius: 20,
// //     alignSelf: 'flex-start',
// //     marginBottom: 16,
// //   },
// //   busNumber: {
// //     fontSize: 20,
// //     fontWeight: 'bold',
// //     color: 'white',
// //   },
// //   routeInfoContainer: {
// //     backgroundColor: '#f8f9fa',
// //     borderRadius: 12,
// //     padding: 16,
// //   },
// //   routeRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     marginBottom: 8,
// //   },
// //   routeText: {
// //     fontSize: 16,
// //     color: '#555',
// //     marginLeft: 8,
// //   },
// //   timeText: {
// //     fontSize: 14,
// //     color: '#757575',
// //     marginLeft: 4,
// //     fontStyle: 'italic',
// //   },
// //   scroll: {
// //     position: 'relative',
// //     paddingBottom: 20,
// //   },
// //   stopContainer: {
// //     position: 'absolute',
// //     flexDirection: 'row',
// //     alignItems: 'flex-start',
// //     left: 0,
// //     right: 0,
// //     paddingRight: 10,
// //   },
// //   lineContainer: {
// //     width: 40,
// //     alignItems: 'center',
// //     paddingTop: 4,
// //   },
// //   verticalLine: {
// //     width: 3,
// //     height: STOP_HEIGHT,
// //     backgroundColor: '#e0e0e0',
// //     position: 'relative',
// //     marginTop: 4,
// //   },
// //   reachedLine: {
// //     position: 'absolute',
// //     width: 3,
// //     backgroundColor: '#5E8D48',
// //     top: 0,
// //     left: 0,
// //   },
// //   dot: {
// //     width: DOT_SIZE,
// //     height: DOT_SIZE,
// //     borderRadius: DOT_SIZE / 2,
// //     backgroundColor: '#bdbdbd',
// //     borderWidth: 3,
// //     borderColor: '#fff',
// //     marginVertical: 4,
// //   },
// //   reachedDot: {
// //     backgroundColor: '#5E8D48',
// //     borderColor: '#e8f5e9',
// //   },
// //   sourceDot: {
// //     backgroundColor: '#2196F3',
// //     borderColor: '#e3f2fd',
// //   },
// //   destinationDot: {
// //     backgroundColor: '#F44336',
// //     borderColor: '#ffebee',
// //   },
// //   stopInfo: {
// //     flex: 1,
// //     paddingLeft: 16,
// //     paddingTop: 4,
// //   },
// //   stopHeader: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     marginBottom: 4,
// //   },
// //   stopName: {
// //     fontSize: 16,
// //     fontWeight: '600',
// //     color: '#333',
// //     flexShrink: 1,
// //   },
// //   arrivalTime: {
// //     fontSize: 13,
// //     color: '#757575',
// //   },
// //   reachedBadge: {
// //     backgroundColor: '#e8f5e9',
// //     paddingHorizontal: 8,
// //     paddingVertical: 4,
// //     borderRadius: 12,
// //     marginLeft: 8,
// //   },
// //   reachedText: {
// //     color: '#5E8D48',
// //     fontSize: 12,
// //     fontWeight: '600',
// //   },
// //   etaBadge: {
// //     paddingHorizontal: 8,
// //     paddingVertical: 4,
// //     borderRadius: 12,
// //     marginLeft: 8,
// //   },
// //   onTimeBadge: {
// //     backgroundColor: '#e3f2fd',
// //   },
// //   delayedBadge: {
// //     backgroundColor: '#ffebee',
// //   },
// //   etaText: {
// //     fontSize: 12,
// //     fontWeight: '600',
// //   },
// //   busIconContainer: {
// //     position: 'absolute',
// //     left: DOT_SIZE / 2 - BUS_ICON_SIZE / 2 + 20,
// //     zIndex: 2,
// //   },
// //   busIcon: {
// //     width: BUS_ICON_SIZE,
// //     height: BUS_ICON_SIZE,
// //     tintColor: '#5E8D48',
// //   },
// //   currentLocationPulse: {
// //     position: 'absolute',
// //     width: 12,
// //     height: 12,
// //     borderRadius: 6,
// //     backgroundColor: '#FF5722',
// //     left: DOT_SIZE / 2 - 6 + 20,
// //     top: DOT_SIZE / 2 - 6,
// //     shadowColor: '#FF5722',
// //     shadowOffset: { width: 0, height: 0 },
// //     shadowOpacity: 0.8,
// //     shadowRadius: 4,
// //   },
// //   loadingContainer: {
// //     alignItems: 'center',
// //     paddingVertical: 40,
// //   },
// //   loadingText: {
// //     marginTop: 16,
// //     color: '#5E8D48',
// //     fontSize: 16,
// //   },
// //   locationLoadingContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     paddingVertical: 12,
// //   },
// //   locationLoadingText: {
// //     marginLeft: 8,
// //     color: '#5E8D48',
// //     fontSize: 14,
// //   },
// //   errorContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     backgroundColor: '#F44336',
// //     padding: 12,
// //     borderRadius: 8,
// //     marginTop: 8,
// //   },
// //   errorText: {
// //     color: '#fff',
// //     marginLeft: 8,
// //     fontSize: 14,
// //   },
// // });




// import React, { useEffect, useState, useRef,  } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   Image,
//   Animated,
//   TouchableOpacity,
//   Dimensions,
// } from 'react-native';
// import { useFocusEffect } from 'expo-router';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import Header from '../components/Header';
// import axios from 'axios';
// import { Ionicons } from '@expo/vector-icons';

// const STOP_HEIGHT = 110;
// const DOT_SIZE = 16;
// const BUS_ICON_SIZE = 28;
// const { height: windowHeight } = Dimensions.get('window');
// const MOVEMENT_THRESHOLD = 0.0003; // ~30 meters
// const STOP_PRECISION = 0.0001; // ~10 meters precision for stop matching

// type Stop = {
//   name: string;
//   timingOffset: string;
//   latitude?: number;
//   longitude?: number;
//   isSource?: boolean;
//   isDestination?: boolean;
//   reached?: boolean;
//   eta?: string;
//   delayInMinutes?: number;
// };

// type Trip = {
//   sourceTime: string;
//   destinationTime: string;
//   stops: {
//     name: string;
//     timingOffset: string;
//     latitude: number;
//     longitude: number;
//   }[];
// };

// export default function VerticalMap() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const busNumber = (params.busNumber as string) || '';
//   const source = (params.source as string) || '';
//   const destination = (params.destination as string) || '';
//   const via = (params.via as string) || '';
//   const deviceId = (params.deviceId as string) || '';
//   const buses = params.buses ? JSON.parse(params.buses as string) : [];

//   const [trips, setTrips] = useState<Trip[]>([]);
//   const [selectedTripIndex, setSelectedTripIndex] = useState(0);
//   const [stops, setStops] = useState<Stop[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [locationLoading, setLocationLoading] = useState(false);
//   const [locationError, setLocationError] = useState<string | null>(null);
//   const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [previousLocation, setPreviousLocation] = useState<{
//     latitude: number;
//     longitude: number;
//     timestamp: number;
//   } | null>(null);
//   const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
//   const [currentStopIndex, setCurrentStopIndex] = useState(0);
//   const busPosition = useRef(new Animated.Value(0)).current;
//   const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

//   // Fetch trips when component mounts or busNumber changes
//   useEffect(() => {
//     const fetchTrips = async () => {
//       if (!busNumber) return;
      
//       setLoading(true);
//       try {
//         const response = await axios.get(`http://10.34.28.52:5000/api/routes/trips/${busNumber}`);
        
//         const tripsData = response.data?.trips || response.data || [];
        
//         const normalizedTrips: Trip[] = tripsData.map((trip: any) => ({
//           sourceTime: trip.sourceTime,
//           destinationTime: trip.destinationTime,
//           stops: trip.stops?.map((stop: any) => ({
//             name: stop.name,
//             timingOffset: stop.timingOffset,
//             latitude: stop.latitude,
//             longitude: stop.longitude
//           })) || []
//         }));
        
//         setTrips(normalizedTrips);
        
//         if (normalizedTrips.length > 0) {
//           setSelectedTripIndex(0);
//         }
//       } catch (error) {
//         console.error('Error fetching trips:', error);
//         setLocationError('Failed to load trip data');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTrips();
//   }, [busNumber]);

//   // Update stops when selected trip changes
//   useEffect(() => {
//     if (trips.length === 0 || selectedTripIndex >= trips.length) return;

//     const selectedTrip = trips[selectedTripIndex];
    
//     const stopsWithTerminals: Stop[] = [
//       {
//         name: source || 'Source',
//         timingOffset: selectedTrip.sourceTime,
//         isSource: true,
//         reached: false
//       },
//       ...selectedTrip.stops.map(stop => ({
//         ...stop,
//         reached: false
//       })),
//       {
//         name: destination || 'Destination',
//         timingOffset: selectedTrip.destinationTime,
//         isDestination: true,
//         reached: false
//       }
//     ];

//     setStops(stopsWithTerminals);
//     setCurrentStopIndex(0);
//     busPosition.setValue(0);
//     setDirection('forward');
//     setCurrentLocation(null);
//     setPreviousLocation(null);
//     setCurrentSpeed(null);
//   }, [selectedTripIndex, trips, source, destination]);

//   // Bus location update effect
//   useEffect(() => {
//     if (!busNumber || stops.length === 0 || !deviceId) return;

//     let isMounted = true;
//     let intervalId: NodeJS.Timeout; // Changed to NodeJS.Timeout

//     const fetchAndAnimate = async () => {
//       if (!isMounted) return;
      
//       try {
//         setLocationLoading(true);
//         setLocationError(null);
        
//         const locationRes = await axios.get(`http://10.34.28.52:5000/api/routes/location/${busNumber}`);
        
//         if (!isMounted) return;
        
//         const location = {
//           latitude: locationRes.data.lat,
//           longitude: locationRes.data.lng,
//           timestamp: Date.now()
//         };

//         // Validate location data
//         if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
//           throw new Error('Invalid location values');
//         }

//         // Check if we've moved significantly
//         let hasMovedSignificantly = true;
//         if (previousLocation) {
//           const distance = calculateDistance(
//             previousLocation.latitude,
//             previousLocation.longitude,
//             location.latitude,
//             location.longitude
//           );
//           hasMovedSignificantly = distance > MOVEMENT_THRESHOLD;
          
//           // Calculate speed if we've moved
//           if (hasMovedSignificantly) {
//             const timeHours = (Date.now() - previousLocation.timestamp) / (1000 * 60 * 60);
//             const speed = distance / timeHours;
//             setCurrentSpeed(prev => prev ? (prev * 0.7 + speed * 0.3) : speed);
//           }
//         }

//         setPreviousLocation(location);
//         setCurrentLocation(location);

//         const updatedStops = [...stops];
//         let newStopIndex = currentStopIndex;
//         let hasReachedExactStop = false;

//         // 1. First check for exact stop matches
//         for (let i = 0; i < stops.length; i++) {
//           const stop = stops[i];
//           if (stop.latitude && stop.longitude) {
//             // High precision match (coordinates match exactly or within 10 meters)
//             const distance = calculateDistance(
//               location.latitude,
//               location.longitude,
//               stop.latitude,
//               stop.longitude
//             );
            
//             if (distance < STOP_PRECISION) {
//               updatedStops[i].reached = true;
//               updatedStops[i].eta = 'Reached';
//               newStopIndex = i;
//               hasReachedExactStop = true;
//               break;
//             }
//           }
//         }

//         // Only update position if we've moved significantly or reached a stop
//         if (hasMovedSignificantly || hasReachedExactStop) {
//           // Update state if we reached a new stop
//           if (hasReachedExactStop && newStopIndex !== currentStopIndex) {
//             setStops(updatedStops);
//             setCurrentStopIndex(newStopIndex);
            
//             // Slow animation to the new stop (3 seconds)
//             const targetPosition = newStopIndex * STOP_HEIGHT;
//             Animated.timing(busPosition, {
//               toValue: targetPosition,
//               duration: 3000,
//               useNativeDriver: false,
//             }).start();
//           }
//           // If between stops, calculate progress
//           else if (currentStopIndex < stops.length - 1) {
//             const currentStop = stops[currentStopIndex];
//             const nextStop = stops[currentStopIndex + 1];
            
//             if (currentStop?.latitude && currentStop?.longitude && 
//                 nextStop?.latitude && nextStop?.longitude) {
//               const progress = calculateProgress(
//                 currentStop,
//                 nextStop,
//                 location
//               );
              
//               // Very slow interpolation between stops (5 seconds)
//               const targetPosition = currentStopIndex * STOP_HEIGHT + (progress * STOP_HEIGHT);
//               Animated.timing(busPosition, {
//                 toValue: targetPosition,
//                 duration: 5000,
//                 useNativeDriver: false,
//               }).start();
//             }
//           }
//         }

//         // Update ETAs for upcoming stops
//         if (currentSpeed && currentSpeed > 0) {
//           for (let i = currentStopIndex + 1; i < stops.length; i++) {
//             const stop = stops[i];
//             if (stop.latitude && stop.longitude) {
//               const distanceToStop = calculateDistance(
//                 location.latitude,
//                 location.longitude,
//                 stop.latitude,
//                 stop.longitude
//               );
              
//               const hoursToStop = distanceToStop / currentSpeed;
//               const minutesToStop = Math.round(hoursToStop * 60);
              
//               updatedStops[i].eta = minutesToStop <= 0 
//                 ? 'Arriving now' 
//                 : `ETA: ${minutesToStop} min`;
//               updatedStops[i].delayInMinutes = minutesToStop;
//             }
//           }
//           setStops(updatedStops);
//         }

//       } catch (err) {
//         if (isMounted) {
//           console.error('Error fetching location:', err);
//           setLocationError('Error updating bus location');
//         }
//       } finally {
//         if (isMounted) {
//           setLocationLoading(false);
//         }
//       }
//     };

//     fetchAndAnimate();
//     intervalId = setInterval(fetchAndAnimate, 50000);

//     return () => {
//       isMounted = false;
//       clearInterval(intervalId);
//     };
//   }, [busNumber, stops, currentStopIndex, deviceId, previousLocation]);

//   const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
//     const toRad = (x: number) => x * Math.PI / 180;
//     const R = 6371;
//     const dLat = toRad(lat2 - lat1);
//     const dLon = toRad(lon2 - lon1);
//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
//       Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   };

//   const calculateProgress = (
//     currentStop: Stop, 
//     nextStop: Stop, 
//     location: { latitude: number; longitude: number }
//   ): number => {
//     if (!currentStop.latitude || !currentStop.longitude || 
//         !nextStop.latitude || !nextStop.longitude) return 0;
        
//     const totalDistance = calculateDistance(
//       currentStop.latitude, 
//       currentStop.longitude, 
//       nextStop.latitude, 
//       nextStop.longitude
//     );
    
//     const coveredDistance = calculateDistance(
//       currentStop.latitude, 
//       currentStop.longitude, 
//       location.latitude, 
//       location.longitude
//     );
    
//     return Math.min(1, Math.max(0, coveredDistance / totalDistance));
//   };

//   const handleTripSelect = (index: number) => {
//     setSelectedTripIndex(index);
//   };

//   return (
//     <View style={styles.container}>
//       <Header />

//       <View style={styles.card}>
//         <View style={styles.backButtonContainer}>
//           <TouchableOpacity
//             onPress={() =>
//               router.push({
//                 pathname: '/busResult',
//                 params: {
//                   source,
//                   destination,
//                   via,
//                   buses: JSON.stringify(buses),
//                 },
//               })
//             }
//             style={styles.backButton}
//           >
//             <Ionicons name="arrow-back" size={24} color="#fff" />
//           </TouchableOpacity>
//         </View>

//         {trips.length > 0 && (
//           <View style={styles.tripSelectorContainer}>
//             <Text style={styles.tripSelectorTitle}>Select Trip:</Text>
//             <ScrollView 
//               horizontal 
//               showsHorizontalScrollIndicator={false}
//               contentContainerStyle={styles.tripButtonsContainer}
//             >
//               {trips.map((trip, index) => (
//                 <TouchableOpacity
//                   key={index}
//                   style={[
//                     styles.tripButton,
//                     selectedTripIndex === index && styles.tripButtonSelected
//                   ]}
//                   onPress={() => handleTripSelect(index)}
//                 >
//                   <Text style={[
//                     styles.tripButtonText,
//                     selectedTripIndex === index && styles.tripButtonTextSelected
//                   ]}>
//                     Trip {index + 1}
//                   </Text>
//                   <Text style={styles.tripTimeText}>
//                     {trip.sourceTime} - {trip.destinationTime}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </View>
//         )}

//         <View style={styles.busInfoContainer}>
//           <View style={styles.busNumberContainer}>
//             <Text style={styles.busNumber}>Bus {busNumber}</Text>
//           </View>
//           <View style={styles.routeInfoContainer}>
//             <View style={styles.routeRow}>
//               <Ionicons name="location" size={16} color="#4CAF50" />
//               <Text style={styles.routeText}>{source || 'Loading...'}</Text>
//               {trips[selectedTripIndex] && (
//                 <Text style={styles.timeText}> - {trips[selectedTripIndex].sourceTime}</Text>
//               )}
//             </View>
//             {via && (
//               <View style={styles.routeRow}>
//                 <Ionicons name="swap-vertical" size={16} color="#FF9800" />
//                 <Text style={styles.routeText}>Via: {via}</Text>
//               </View>
//             )}
//             <View style={styles.routeRow}>
//               <Ionicons name="flag" size={16} color="#F44336" />
//               <Text style={styles.routeText}>{destination || 'Loading...'}</Text>
//               {trips[selectedTripIndex] && (
//                 <Text style={styles.timeText}> - {trips[selectedTripIndex].destinationTime}</Text>
//               )}
//             </View>
//           </View>
//         </View>

//         {loading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#5E8D48" />
//             <Text style={styles.loadingText}>Loading route information...</Text>
//           </View>
//         ) : (
//           <View style={styles.contentContainer}>
//             <ScrollView
//               contentContainerStyle={[styles.scroll, { minHeight: windowHeight * 0.6 }]}
//               showsVerticalScrollIndicator={true}
//             >
//               <View style={{ height: stops.length * STOP_HEIGHT }}>
//                 <Animated.View style={[styles.busIconContainer, { top: busPosition }]}>
//                   <Image
//                     source={require('../assets/images/bus-icon.png')}
//                     style={[
//                       styles.busIcon,
//                       { transform: [{ rotate: direction === 'forward' ? '0deg' : '180deg' }] }
//                     ]}
//                     resizeMode="contain"
//                   />
//                   <View style={styles.currentLocationPulse} />
//                 </Animated.View>

//                 {stops.map((stop, index) => (
//                   <View key={index} style={[styles.stopContainer, { top: index * STOP_HEIGHT }]}>
//                     <View style={styles.lineContainer}>
//                       <View
//                         style={[
//                           styles.dot,
//                           stop.reached && styles.reachedDot,
//                           stop.isSource && !stop.reached && styles.sourceDot,
//                           stop.isDestination && !stop.reached && styles.destinationDot,
//                         ]}
//                       />
//                       {index !== stops.length - 1 && (
//                         <View style={styles.verticalLine}>
//                           {stop.reached && (
//                             <View style={[styles.reachedLine, { height: STOP_HEIGHT }]} />
//                           )}
//                         </View>
//                       )}
//                     </View>
//                     <View style={styles.stopInfo}>
//                       <View style={styles.stopHeader}>
//                         <Text style={styles.stopName}>{stop.name}</Text>
//                         {stop.reached ? (
//                           <View style={styles.reachedBadge}>
//                             <Text style={styles.reachedText}>Reached</Text>
//                           </View>
//                         ) : stop.eta ? (
//                           <View style={[
//                             styles.etaBadge,
//                             stop.delayInMinutes && stop.delayInMinutes > 5 ? styles.delayedBadge : styles.onTimeBadge
//                           ]}>
//                             <Text style={styles.etaText}>{stop.eta}</Text>
//                           </View>
//                         ) : null}
//                       </View>
//                       <Text style={styles.arrivalTime}>
//                         {stop.isSource
//                           ? `Departure: ${stop.timingOffset}`
//                           : stop.isDestination
//                             ? `Arrival: ${stop.timingOffset}`
//                             : `Scheduled: ${stop.timingOffset}`}
//                       </Text>
//                     </View>
//                   </View>
//                 ))}
//               </View>
//             </ScrollView>

//             {locationLoading && (
//               <View style={styles.locationLoadingContainer}>
//                 <ActivityIndicator size="small" color="#5E8D48" />
//                 <Text style={styles.locationLoadingText}>Updating bus location...</Text>
//               </View>
//             )}

//             {locationError && (
//               <View style={styles.errorContainer}>
//                 <Ionicons name="warning" size={20} color="#fff" />
//                 <Text style={styles.errorText}>{locationError}</Text>
//               </View>
//             )}
//           </View>
//         )}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f7fa',
//   },
//   card: {
//     margin: 16,
//     padding: 20,
//     borderRadius: 16,
//     backgroundColor: 'white',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 3,
//     flex: 1,
//   },
//   contentContainer: {
//     flex: 1,
//   },
//   backButtonContainer: {
//     position: 'absolute',
//     top: 16,
//     right: 16,
//     zIndex: 10,
//   },
//   backButton: {
//     backgroundColor: '#5E8D48',
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   tripSelectorContainer: {
//     marginBottom: 16,
//   },
//   tripSelectorTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 8,
//   },
//   tripButtonsContainer: {
//     paddingBottom: 8,
//   },
//   tripButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#5E8D48',
//     marginRight: 8,
//     alignItems: 'center',
//   },
//   tripButtonSelected: {
//     backgroundColor: '#5E8D48',
//   },
//   tripButtonText: {
//     fontSize: 14,
//     color: '#5E8D48',
//     fontWeight: '600',
//   },
//   tripButtonTextSelected: {
//     color: '#fff',
//   },
//   tripTimeText: {
//     fontSize: 12,
//     color: '#757575',
//     marginTop: 2,
//   },
//   busInfoContainer: {
//     marginBottom: 24,
//   },
//   busNumberContainer: {
//     backgroundColor: '#5E8D48',
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//     alignSelf: 'flex-start',
//     marginBottom: 16,
//   },
//   busNumber: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: 'white',
//   },
//   routeInfoContainer: {
//     backgroundColor: '#f8f9fa',
//     borderRadius: 12,
//     padding: 16,
//   },
//   routeRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   routeText: {
//     fontSize: 16,
//     color: '#555',
//     marginLeft: 8,
//   },
//   timeText: {
//     fontSize: 14,
//     color: '#757575',
//     marginLeft: 4,
//     fontStyle: 'italic',
//   },
//   scroll: {
//     position: 'relative',
//     paddingBottom: 20,
//   },
//   stopContainer: {
//     position: 'absolute',
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     left: 0,
//     right: 0,
//     paddingRight: 10,
//   },
//   lineContainer: {
//     width: 40,
//     alignItems: 'center',
//     paddingTop: 4,
//   },
//   verticalLine: {
//     width: 3,
//     height: STOP_HEIGHT,
//     backgroundColor: '#e0e0e0',
//     position: 'relative',
//     marginTop: 4,
//   },
//   reachedLine: {
//     position: 'absolute',
//     width: 3,
//     backgroundColor: '#5E8D48',
//     top: 0,
//     left: 0,
//   },
//   dot: {
//     width: DOT_SIZE,
//     height: DOT_SIZE,
//     borderRadius: DOT_SIZE / 2,
//     backgroundColor: '#bdbdbd',
//     borderWidth: 3,
//     borderColor: '#fff',
//     marginVertical: 4,
//   },
//   reachedDot: {
//     backgroundColor: '#5E8D48',
//     borderColor: '#e8f5e9',
//   },
//   sourceDot: {
//     backgroundColor: '#2196F3',
//     borderColor: '#e3f2fd',
//   },
//   destinationDot: {
//     backgroundColor: '#F44336',
//     borderColor: '#ffebee',
//   },
//   stopInfo: {
//     flex: 1,
//     paddingLeft: 16,
//     paddingTop: 4,
//   },
//   stopHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   stopName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     flexShrink: 1,
//   },
//   arrivalTime: {
//     fontSize: 13,
//     color: '#757575',
//   },
//   reachedBadge: {
//     backgroundColor: '#e8f5e9',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     marginLeft: 8,
//   },
//   reachedText: {
//     color: '#5E8D48',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   etaBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     marginLeft: 8,
//   },
//   onTimeBadge: {
//     backgroundColor: '#e3f2fd',
//   },
//   delayedBadge: {
//     backgroundColor: '#ffebee',
//   },
//   etaText: {
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   busIconContainer: {
//     position: 'absolute',
//     left: DOT_SIZE / 2 - BUS_ICON_SIZE / 2 + 20,
//     zIndex: 2,
//   },
//   busIcon: {
//     width: BUS_ICON_SIZE,
//     height: BUS_ICON_SIZE,
//     tintColor: '#5E8D48',
//   },
//   currentLocationPulse: {
//     position: 'absolute',
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#FF5722',
//     left: DOT_SIZE / 2 - 6 + 20,
//     top: DOT_SIZE / 2 - 6,
//     shadowColor: '#FF5722',
//     shadowOffset: { width: 0, height: 0 },
//     shadowOpacity: 0.8,
//     shadowRadius: 4,
//   },
//   loadingContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   loadingText: {
//     marginTop: 16,
//     color: '#5E8D48',
//     fontSize: 16,
//   },
//   locationLoadingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//   },
//   locationLoadingText: {
//     marginLeft: 8,
//     color: '#5E8D48',
//     fontSize: 14,
//   },
//   errorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F44336',
//     padding: 12,
//     borderRadius: 8,
//     marginTop: 8,
//   },
//   errorText: {
//     color: '#fff',
//     marginLeft: 8,
//     fontSize: 14,
//   },
// });






import React, { useEffect, useState, useRef,  } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '../components/Header';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const STOP_HEIGHT = 110;
const DOT_SIZE = 16;
const BUS_ICON_SIZE = 28;
const { height: windowHeight } = Dimensions.get('window');
const MOVEMENT_THRESHOLD = 0.0003; // ~30 meters
const STOP_PRECISION = 0.0001; // ~10 meters precision for stop matching

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

export default function VerticalMap() {
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
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [previousLocation, setPreviousLocation] = useState<{
    latitude: number;
    longitude: number;
    timestamp: number;
  } | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const busPosition = useRef(new Animated.Value(0)).current;
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Fetch trips when component mounts or busNumber changes
  useEffect(() => {
    const fetchTrips = async () => {
      if (!busNumber) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`http://10.16.129.6:5000/api/routes/trips/${busNumber}`);
        
        const tripsData = response.data?.trips || response.data || [];
        
        const normalizedTrips: Trip[] = tripsData.map((trip: any) => ({
          sourceTime: trip.sourceTime,
          destinationTime: trip.destinationTime,
          stops: trip.stops?.map((stop: any) => ({
            name: stop.name,
            timingOffset: stop.timingOffset,
            latitude: stop.latitude,
            longitude: stop.longitude
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

  // Update stops when selected trip changes
  useEffect(() => {
    if (trips.length === 0 || selectedTripIndex >= trips.length) return;

    const selectedTrip = trips[selectedTripIndex];
    
    const stopsWithTerminals: Stop[] = [
      {
        name: source || 'Source',
        timingOffset: selectedTrip.sourceTime,
        isSource: true,
        reached: false
      },
      ...selectedTrip.stops.map(stop => ({
        ...stop,
        reached: false
      })),
      {
        name: destination || 'Destination',
        timingOffset: selectedTrip.destinationTime,
        isDestination: true,
        reached: false
      }
    ];

    setStops(stopsWithTerminals);
    setCurrentStopIndex(0);
    busPosition.setValue(0);
    setDirection('forward');
    setCurrentLocation(null);
    setPreviousLocation(null);
    setCurrentSpeed(null);
  }, [selectedTripIndex, trips, source, destination]);

  // Bus location update effect
  useEffect(() => {
    if (!busNumber || stops.length === 0 || !deviceId) return;

    let isMounted = true;
    let intervalId: NodeJS.Timeout; // Changed to NodeJS.Timeout

    const fetchAndAnimate = async () => {
      if (!isMounted) return;
      
      try {
        setLocationLoading(true);
        setLocationError(null);
        
        const locationRes = await axios.get(`http://10.16.129.6:5000/api/routes/location/${busNumber}`);
        
        if (!isMounted) return;
        
        const location = {
          latitude: locationRes.data.lat,
          longitude: locationRes.data.lng,
          timestamp: Date.now()
        };

        // Validate location data
        if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
          throw new Error('Invalid location values');
        }

        // Check if we've moved significantly
        let hasMovedSignificantly = true;
        if (previousLocation) {
          const distance = calculateDistance(
            previousLocation.latitude,
            previousLocation.longitude,
            location.latitude,
            location.longitude
          );
          hasMovedSignificantly = distance > MOVEMENT_THRESHOLD;
          
          // Calculate speed if we've moved
          if (hasMovedSignificantly) {
            const timeHours = (Date.now() - previousLocation.timestamp) / (1000 * 60 * 60);
            const speed = distance / timeHours;
            setCurrentSpeed(prev => prev ? (prev * 0.7 + speed * 0.3) : speed);
          }
        }

        setPreviousLocation(location);
        setCurrentLocation(location);

        const updatedStops = [...stops];
        let newStopIndex = currentStopIndex;
        let hasReachedExactStop = false;

        // 1. First check for exact stop matches
        for (let i = 0; i < stops.length; i++) {
          const stop = stops[i];
          if (stop.latitude && stop.longitude) {
            // High precision match (coordinates match exactly or within 10 meters)
            const distance = calculateDistance(
              location.latitude,
              location.longitude,
              stop.latitude,
              stop.longitude
            );
            
            if (distance < STOP_PRECISION) {
              updatedStops[i].reached = true;
              updatedStops[i].eta = 'Reached';
              newStopIndex = i;
              hasReachedExactStop = true;
              break;
            }
          }
        }

        // Only update position if we've moved significantly or reached a stop
        if (hasMovedSignificantly || hasReachedExactStop) {
          // Update state if we reached a new stop
          if (hasReachedExactStop && newStopIndex !== currentStopIndex) {
            setStops(updatedStops);
            setCurrentStopIndex(newStopIndex);
            
            // Slow animation to the new stop (3 seconds)
            const targetPosition = newStopIndex * STOP_HEIGHT;
            Animated.timing(busPosition, {
              toValue: targetPosition,
              duration: 3000,
              useNativeDriver: false,
            }).start();
          }
          // If between stops, calculate progress
          else if (currentStopIndex < stops.length - 1) {
            const currentStop = stops[currentStopIndex];
            const nextStop = stops[currentStopIndex + 1];
            
            if (currentStop?.latitude && currentStop?.longitude && 
                nextStop?.latitude && nextStop?.longitude) {
              const progress = calculateProgress(
                currentStop,
                nextStop,
                location
              );
              
              // Very slow interpolation between stops (5 seconds)
              const targetPosition = currentStopIndex * STOP_HEIGHT + (progress * STOP_HEIGHT);
              Animated.timing(busPosition, {
                toValue: targetPosition,
                duration: 5000,
                useNativeDriver: false,
              }).start();
            }
          }
        }

        // Update ETAs for upcoming stops
        if (currentSpeed && currentSpeed > 0) {
          for (let i = currentStopIndex + 1; i < stops.length; i++) {
            const stop = stops[i];
            if (stop.latitude && stop.longitude) {
              const distanceToStop = calculateDistance(
                location.latitude,
                location.longitude,
                stop.latitude,
                stop.longitude
              );
              
              const hoursToStop = distanceToStop / currentSpeed;
              const minutesToStop = Math.round(hoursToStop * 60);
              
              updatedStops[i].eta = minutesToStop <= 0 
                ? 'Arriving now' 
                : `ETA: ${minutesToStop} min`;
              updatedStops[i].delayInMinutes = minutesToStop;
            }
          }
          setStops(updatedStops);
        }

      } catch (err) {
        if (isMounted) {
          console.error('Error fetching location:', err);
          setLocationError('Error updating bus location');
        }
      } finally {
        if (isMounted) {
          setLocationLoading(false);
        }
      }
    };

    fetchAndAnimate();
    intervalId = setInterval(fetchAndAnimate, 50000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [busNumber, stops, currentStopIndex, deviceId, previousLocation]);

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

  const calculateProgress = (
    currentStop: Stop, 
    nextStop: Stop, 
    location: { latitude: number; longitude: number }
  ): number => {
    if (!currentStop.latitude || !currentStop.longitude || 
        !nextStop.latitude || !nextStop.longitude) return 0;
        
    const totalDistance = calculateDistance(
      currentStop.latitude, 
      currentStop.longitude, 
      nextStop.latitude, 
      nextStop.longitude
    );
  
    const coveredDistance = calculateDistance(
      currentStop.latitude, 
      currentStop.longitude, 
      location.latitude, 
      location.longitude
    );
  
    return Math.min(1, Math.max(0, coveredDistance / totalDistance));
  };

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

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.card}>
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.busInfoContainer}>
          <View style={styles.busNumberContainer}>
            <Text style={styles.busNumber}>Bus {busNumber}</Text>
          </View>
          <View style={styles.routeInfoContainer}>
            <View style={styles.routeRow}>
              <Ionicons name="location" size={16} color="#4CAF50" />
              <Text style={styles.routeText}>{source || 'Loading...'}</Text>
              {trips[selectedTripIndex] && (
                <Text style={styles.timeText}> - {trips[selectedTripIndex].sourceTime}</Text>
              )}
            </View>
            {via && (
              <View style={styles.routeRow}>
                <Ionicons name="swap-vertical" size={16} color="#FF9800" />
                <Text style={styles.routeText}>Via: {via}</Text>
              </View>
            )}
            <View style={styles.routeRow}>
              <Ionicons name="flag" size={16} color="#F44336" />
              <Text style={styles.routeText}>{destination || 'Loading...'}</Text>
              {trips[selectedTripIndex] && (
                <Text style={styles.timeText}> - {trips[selectedTripIndex].destinationTime}</Text>
              )}
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5E8D48" />
            <Text style={styles.loadingText}>Loading route information...</Text>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            <ScrollView
              contentContainerStyle={[styles.scroll, { minHeight: windowHeight * 0.6 }]}
              showsVerticalScrollIndicator={true}
            >
              <View style={{ height: stops.length * STOP_HEIGHT }}>
                <Animated.View style={[styles.busIconContainer, { top: busPosition }]}>
                  <Image
                    source={require('../assets/images/bus-icon.png')}
                    style={[
                      styles.busIcon,
                      { transform: [{ rotate: direction === 'forward' ? '0deg' : '180deg' }] }
                    ]}
                    resizeMode="contain"
                  />
                  <View style={styles.currentLocationPulse} />
                </Animated.View>

                {stops.map((stop, index) => (
                  <View key={index} style={[styles.stopContainer, { top: index * STOP_HEIGHT }]}>
                    <View style={styles.lineContainer}>
                      <View
                        style={[
                          styles.dot,
                          stop.reached && styles.reachedDot,
                          stop.isSource && !stop.reached && styles.sourceDot,
                          stop.isDestination && !stop.reached && styles.destinationDot,
                        ]}
                      />
                      {index !== stops.length - 1 && (
                        <View style={styles.verticalLine}>
                          {stop.reached && (
                            <View style={[styles.reachedLine, { height: STOP_HEIGHT }]} />
                          )}
                        </View>
                      )}
                    </View>
                    <View style={styles.stopInfo}>
                      <View style={styles.stopHeader}>
                        <Text style={styles.stopName}>{stop.name}</Text>
                        {stop.reached ? (
                          <View style={styles.reachedBadge}>
                            <Text style={styles.reachedText}>Reached</Text>
                          </View>
                        ) : stop.eta ? (
                          <View style={[
                            styles.etaBadge,
                            stop.delayInMinutes && stop.delayInMinutes > 5 ? styles.delayedBadge : styles.onTimeBadge
                          ]}>
                            <Text style={styles.etaText}>{stop.eta}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.arrivalTime}>
                        {stop.isSource
                          ? `Departure: ${stop.timingOffset}`
                          : stop.isDestination
                            ? `Arrival: ${stop.timingOffset}`
                            : `Scheduled: ${stop.timingOffset}`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            {locationLoading && (
              <View style={styles.locationLoadingContainer}>
                <ActivityIndicator size="small" color="#5E8D48" />
                <Text style={styles.locationLoadingText}>Updating bus location...</Text>
              </View>
            )}

            {locationError && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={20} color="#fff" />
                <Text style={styles.errorText}>{locationError}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  backButtonContainer: {
    position: 'absolute',
    top: -75,
    left: 16,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: '#5E8D48',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  busInfoContainer: {
    marginBottom: 24,
  },
  busNumberContainer: {
    backgroundColor: '#5E8D48',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  busNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  routeInfoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  scroll: {
    position: 'relative',
    paddingBottom: 20,
  },
  stopContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-start',
    left: 0,
    right: 0,
    paddingRight: 10,
  },
  lineContainer: {
    width: 40,
    alignItems: 'center',
    paddingTop: 4,
  },
  verticalLine: {
    width: 3,
    height: STOP_HEIGHT,
    backgroundColor: '#e0e0e0',
    position: 'relative',
    marginTop: 4,
  },
  reachedLine: {
    position: 'absolute',
    width: 3,
    backgroundColor: '#5E8D48',
    top: 0,
    left: 0,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#bdbdbd',
    borderWidth: 3,
    borderColor: '#fff',
    marginVertical: 4,
  },
  reachedDot: {
    backgroundColor: '#5E8D48',
    borderColor: '#e8f5e9',
  },
  sourceDot: {
    backgroundColor: '#2196F3',
    borderColor: '#e3f2fd',
  },
  destinationDot: {
    backgroundColor: '#F44336',
    borderColor: '#ffebee',
  },
  stopInfo: {
    flex: 1,
    paddingLeft: 16,
    paddingTop: 4,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flexShrink: 1,
  },
  arrivalTime: {
    fontSize: 13,
    color: '#757575',
  },
  reachedBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  reachedText: {
    color: '#5E8D48',
    fontSize: 12,
    fontWeight: '600',
  },
  etaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  onTimeBadge: {
    backgroundColor: '#e3f2fd',
  },
  delayedBadge: {
    backgroundColor: '#ffebee',
  },
  etaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  busIconContainer: {
    position: 'absolute',
    left: DOT_SIZE / 2 - BUS_ICON_SIZE / 2 + 20,
    zIndex: 2,
  },
  busIcon: {
    width: BUS_ICON_SIZE,
    height: BUS_ICON_SIZE,
    tintColor: '#5E8D48',
  },
  currentLocationPulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF5722',
    left: DOT_SIZE / 2 - 6 + 20,
    top: DOT_SIZE / 2 - 6,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#5E8D48',
    fontSize: 16,
  },
  locationLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  locationLoadingText: {
    marginLeft: 8,
    color: '#5E8D48',
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
});
