// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';

// type Bus = {
//   _id: string;
//   source: string;
//   destination: string;
//   via: string;
//   busNumber: string;
//   timings: string[];
// };

// export default function BusResultsScreen() {
//   const { source, destination } = useLocalSearchParams();
//   const [buses, setBuses] = useState<Bus[]>([]);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     const fetchBuses = async () => {
//       try {
//         const res = await fetch(
//           `http://10.1.65.155:5000/api/routes/search?source=${source}&destination=${destination}`
//         );
//         const data = await res.json();

//         if (res.ok) {
//           setBuses(data);
//         } else {
//           Alert.alert('Error', data.message || 'Failed to fetch buses');
//         }
//       } catch (error) {
//         console.error(error);
//         Alert.alert('Server Error', 'Failed to connect to backend.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchBuses();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>🚌 Buses from {source} to {destination}</Text>

//       {loading ? (
//         <ActivityIndicator size="large" color="#2563EB" />
//       ) : buses.length === 0 ? (
//         <Text style={styles.noBusText}>No buses found.</Text>
//       ) : (
//         <ScrollView style={styles.scroll}>
//           {buses.map((bus) => (
//             <View key={bus._id} style={styles.busCard}>
//               <Text style={styles.busText}>🚍 Bus No.: {bus.busNumber}</Text>
//               <Text style={styles.busText}>🧭 Via: {bus.via}</Text>
//               <Text style={styles.busText}>🕒 Timings: {bus.timings.join(', ')}</Text>
//             </View>
//           ))}
//         </ScrollView>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     paddingTop: 50,
//     flex: 1,
//     backgroundColor: '#f2f4f8',
//     paddingHorizontal: 20,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 16,
//     color: '#1E3A8A',
//     textAlign: 'center',
//   },
//   scroll: {
//     marginTop: 10,
//   },
//   busCard: {
//     backgroundColor: '#E0ECFF',
//     padding: 14,
//     borderRadius: 10,
//     marginBottom: 12,
//   },
//   busText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1E40AF',
//     marginBottom: 4,
//   },
//   noBusText: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginTop: 40,
//     color: '#888',
//   },
// });




import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

type Bus = {
  _id: string;
  source: string;
  destination: string;
  via: string;
  busNumber: string;
  timings: string[];
};

export default function BusResultsScreen() {
  const { source, destination } = useLocalSearchParams();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await fetch(
          `http://192.168.36.52:5000/api/routes/search?source=${source}&destination=${destination}`
        );
        const data = await res.json();

        if (res.ok) {
          setBuses(data);
        } else {
          Alert.alert('Error', data.message || 'Failed to fetch buses');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Server Error', 'Failed to connect to backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, []);

  const handleLiveMap = async () => {
    if (!selectedBus) {
      Alert.alert('Please select a bus first');
      return;
    }

    try {
      const encodedBusNumber = encodeURIComponent(selectedBus.busNumber.trim());
      const response = await fetch(`http://192.168.36.52:5000/api/routes/deviceId?busNumber=${encodedBusNumber}`);
      const data = await response.json();

      if (data.deviceId) {
        router.push({
          pathname: '/map',
          params: {
            deviceId: data.deviceId,
            busNumber: selectedBus.busNumber,
          },
        });
      } else {
        Alert.alert('Device ID not found.');
      }
    } catch (error) {
      console.error('❌ Live Map fetch error:', error);
      Alert.alert('Error', 'Unable to fetch device ID.');
    }
  };

  const handleLiveRoute = async () => {
    if (!selectedBus) {
      Alert.alert('Please select a bus first');
      return;
    }

    try {
      const encodedBusNumber = encodeURIComponent(selectedBus.busNumber.trim());
      const response = await fetch(`http://192.168.36.52:5000/api/routes/deviceId?busNumber=${encodedBusNumber}`);
      const data = await response.json();

      if (data.deviceId) {
        router.push({
          pathname: '/verticalMap',
          params: {
            deviceId: data.deviceId,
            busNumber: selectedBus.busNumber,
          },
        });
      } else {
        Alert.alert('Device ID not found.');
      }
    } catch (error) {
      console.error('❌ Live Route fetch error:', error);
      Alert.alert('Error', 'Unable to fetch device ID.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚌 Buses from {source} to {destination}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" />
      ) : buses.length === 0 ? (
        <Text style={styles.noBusText}>No buses found.</Text>
      ) : (
        <ScrollView style={styles.scroll}>
          {buses.map((bus) => (
            <TouchableOpacity
              key={bus._id}
              style={[
                styles.busCard,
                selectedBus?.busNumber === bus.busNumber && styles.selectedCard,
              ]}
              onPress={() => setSelectedBus(bus)}
            >
              <Text style={styles.busText}>🚍 Bus No.: {bus.busNumber}</Text>
              <Text style={styles.busText}>🧭 Via: {bus.via}</Text>
              <Text style={styles.busText}>🕒 Timings: {bus.timings.join(', ')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Live Route and Live Map Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.navButton} onPress={handleLiveRoute}>
          <Text style={styles.navButtonText}>📍 Live Route</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={handleLiveMap}>
          <Text style={styles.navButtonText}>🗺️ Live Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    flex: 1,
    backgroundColor: '#f2f4f8',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1E3A8A',
    textAlign: 'center',
  },
  scroll: {
    marginTop: 10,
    marginBottom: 60,
  },
  busCard: {
    backgroundColor: '#E0ECFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#2563EB',
    backgroundColor: '#dceeff',
  },
  busText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  noBusText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  navButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
  },
  navButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
