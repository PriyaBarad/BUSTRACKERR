// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
// } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { useRouter } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import strings from '../../locales/strings';

// type Bus = {
//   _id: string;
//   source: string;
//   destination: string;
//   via: string;
//   busNumber: string;
//   timings: string[];
// };

// function getTodayDate() {
//   const today = new Date();
//   return today.toLocaleDateString('en-IN', {
//     weekday: 'long',
//     day: '2-digit',
//     month: 'long',
//     year: 'numeric',
//   });
// }

// export default function HomeScreen() {
//   const [source, setSource] = useState('');
//   const [destination, setDestination] = useState('');
//   const [lang, setLang] = useState<'en' | 'mr'>('en');
//   const [filteredBuses, setFilteredBuses] = useState<Bus[]>([]);
//   const [availableSources, setAvailableSources] = useState<string[]>([]);
//   const [availableDestinations, setAvailableDestinations] = useState<string[]>([]);
//   const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
//   const router = useRouter();

//   useEffect(() => {
//     const getLangAndStops = async () => {
//       const storedLang = await AsyncStorage.getItem('language');
//       const languageKey = storedLang === 'mr' ? 'mr' : 'en';
//       setLang(languageKey);

//       try {
//         const res = await fetch('http://10.1.65.155:5000/api/routes/stops');
//         const data = await res.json();
//         console.log('🎯 Data from /stops:', data);

//         setAvailableSources((data?.sources || []).sort());
//         setAvailableDestinations((data?.destinations || []).sort());
//       } catch (err) {
//         console.error('❌ Error fetching stops:', err);
//         const fallback = ['Solapur', 'Pune', 'Mumbai'];
//         setAvailableSources(fallback);
//         setAvailableDestinations(fallback);
//       }
//     };

//     getLangAndStops();
//   }, []);

//   const handleFindBuses = async () => {
//     if (!source || !destination || source === destination) {
//       Alert.alert(strings[lang].fillBoth);
//       return;
//     }

//     try {
//       const res = await fetch(
//         `http://10.1.65.155:5000/api/routes/search?source=${source}&destination=${destination}`
//       );
//       const data = await res.json();

//       if (res.ok) {
//         setFilteredBuses(data);
//         setSelectedBus(null);
//         if (data.length === 0) {
//           Alert.alert(
//             lang === 'mr' ? 'कोणतीही बस सापडली नाही' : 'No buses found'
//           );
//         }
//       } else {
//         Alert.alert('Error', data.message || 'Something went wrong');
//       }
//     } catch (error) {
//       console.error(error);
//       Alert.alert('Server Error', 'Please check your backend connection.');
//     }
//   };

//   const handleBusSelect = (bus: Bus) => {
//     setSelectedBus(bus);
//   };

//   const handleLiveMap = async (busNumber: string) => {
//   try {
//     const encodedBusNumber = encodeURIComponent(busNumber.trim()); // ✅ Handles spaces
//     const url = `http://10.1.65.155:5000/api/routes/deviceId?busNumber=${encodedBusNumber}`;

//     console.log("🌐 Fetching deviceId from:", url);

//     const response = await fetch(url);
//     const data = await response.json();

//     console.log("🚍 Device ID API response:", data);

//     if (data.deviceId) {
//       router.push({
//       pathname: "/map",
//       params: {
//       deviceId: data.deviceId,
//       busNumber: busNumber, // Pass it here
//   },
// });
//     } else {
//       Alert.alert("Error", "Device ID not found.");
//     }
//   } catch (error) {
//     console.error("❌ Fetch deviceId error:", (error as Error).message);
//     Alert.alert("Error", "Unable to fetch device ID.");
//   }
// };


//   return (
//     <View style={styles.container}>
//       <View style={styles.card}>
//         <TouchableOpacity
//           style={styles.profileIcon}
//           onPress={() => router.push('/profile')}
//         >
//           <Text style={styles.profileEmoji}>👤</Text>
//         </TouchableOpacity>

//         <Text style={styles.logo}>🚌 {strings[lang].appTitle}</Text>
//         <Text style={styles.subtitle}>{strings[lang].corporation}</Text>
//         <Text style={styles.date}>{getTodayDate()}</Text>

//         <Text style={styles.sectionTitle}>{strings[lang].findBus}</Text>

//         <Text style={styles.label}>{strings[lang].source}</Text>
//         <Picker
//           selectedValue={source}
//           onValueChange={(value) => setSource(value)}
//           style={styles.picker}
//         >
//           <Picker.Item label={strings[lang].selectSource} value="" />
//           {availableSources.map((src) => (
//             <Picker.Item key={src} label={src} value={src} />
//           ))}
//         </Picker>

//         <Text style={styles.label}>{strings[lang].destination}</Text>
//         <Picker
//           selectedValue={destination}
//           onValueChange={(value) => setDestination(value)}
//           style={styles.picker}
//         >
//           <Picker.Item label={strings[lang].selectDestination} value="" />
//           {availableDestinations.map((dst) => (
//             <Picker.Item key={dst} label={dst} value={dst} />
//           ))}
//         </Picker>

//         <TouchableOpacity style={styles.findButton} onPress={handleFindBuses}>
//           <Text style={styles.findButtonText}>
//             {strings[lang].findBuses}
//           </Text>
//         </TouchableOpacity>

//         {filteredBuses.map((bus) => (
//           <TouchableOpacity
//             key={bus._id}
//             onPress={() => handleBusSelect(bus)}
//             style={[
//               styles.busItem,
//               selectedBus?.busNumber === bus.busNumber && styles.selectedCard,
//             ]}
//           >
//             <Text style={styles.busText}>🚌 Bus No.: {bus.busNumber}</Text>
//             <Text style={styles.busText}>🧭 Via: {bus.via}</Text>
//             <Text style={styles.busText}>🕒 Timings: {bus.timings.join(', ')}</Text>
//           </TouchableOpacity>
//         ))}

//         <View style={styles.navRow}>
//         <NavButton
//           label={strings[lang].liveMap}
//           onPress={() => {
//       if (selectedBus) {
//         handleLiveMap(selectedBus.busNumber);
//       } else {
//         Alert.alert('Please select a bus first');
//       }
//     }}
//   />
//   <NavButton
//     label={strings[lang].routeInfo}
//     onPress={() => router.push('./busRoutes')}
//   />
// </View>
//       </View>
//       <Text style={styles.footer}>© 2025 {strings[lang].corporation}</Text>
//     </View>
//   );
// }

// function NavButton({
//   label,
//   onPress,
// }: {
//   label: string;
//   onPress: () => void;
// }) {
//   return (
//     <TouchableOpacity style={styles.navButton} onPress={onPress}>
//       <Text style={styles.navButtonText}>{label}</Text>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     paddingTop: 40,
//     flex: 1,
//     backgroundColor: '#f2f4f8',
//     alignItems: 'center',
//   },
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 20,
//     paddingTop: 36,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOpacity: 0.08,
//     shadowRadius: 6,
//     elevation: 4,
//     alignSelf: 'center',
//     width: '90%',
//     maxWidth: 400,
//     alignItems: 'center',
//     position: 'relative',
//   },
//   profileIcon: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     backgroundColor: '#f0f0f0',
//     padding: 6,
//     borderRadius: 20,
//   },
//   profileEmoji: { fontSize: 20 },
//   logo: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#2563EB',
//     marginBottom: 4,
//   },
//   subtitle: { fontSize: 14, color: '#555' },
//   date: { fontSize: 12, color: '#999', marginBottom: 20 },
//   sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
//   label: {
//     fontSize: 15,
//     color: '#111',
//     fontWeight: '600',
//     alignSelf: 'flex-start',
//     marginTop: 10,
//     marginBottom: 4,
//   },
//   picker: {
//     width: '100%',
//     height: 48,
//     backgroundColor: '#e0e0e0',
//     borderRadius: 6,
//     paddingHorizontal: 8,
//     color: '#000',
//     marginBottom: 10,
//   },
//   findButton: {
//     backgroundColor: '#2563EB',
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 10,
//     width: '100%',
//   },
//   findButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   busItem: {
//     padding: 10,
//     backgroundColor: '#E6F0FF',
//     borderRadius: 6,
//     marginVertical: 4,
//     width: '100%',
//   },
//   selectedCard: {
//     borderWidth: 2,
//     borderColor: '#2563EB',
//     backgroundColor: '#dceeff',
//   },
//   busText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1E40AF',
//   },
//   navRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     width: '100%',
//     marginTop: 20,
//   },
//   navButton: {
//     backgroundColor: '#f9f9f9',
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 10,
//     flex: 1,
//     alignItems: 'center',
//     marginHorizontal: 5,
//     elevation: 2,
//   },
//   navButtonText: {
//     fontWeight: '600',
//     color: '#2563EB',
//   },
//   footer: {
//     fontSize: 12,
//     color: '#999',
//   },
// });



import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import strings from '../../locales/strings';

function getTodayDate() {
  const today = new Date();
  return today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function HomeScreen() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [lang, setLang] = useState<'en' | 'mr'>('en');
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [availableDestinations, setAvailableDestinations] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const getLangAndStops = async () => {
      const storedLang = await AsyncStorage.getItem('language');
      setLang(storedLang === 'mr' ? 'mr' : 'en');

      try {
        const res = await fetch('http://192.168.36.52:5000/api/routes/stops');
        const data = await res.json();
        setAvailableSources((data?.sources || []).sort());
        setAvailableDestinations((data?.destinations || []).sort());
      } catch (err) {
        console.error('❌ Error fetching stops:', err);
        const fallback = ['Solapur', 'Pune', 'Mumbai'];
        setAvailableSources(fallback);
        setAvailableDestinations(fallback);
      }
    };

    getLangAndStops();
  }, []);

  const handleFindBuses = () => {
    if (!source || !destination || source === destination) {
      Alert.alert(strings[lang].fillBoth);
      return;
    }

    router.push({
      pathname: '/busResult',
      params: { source, destination },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>🚌 {strings[lang].appTitle}</Text>
        <Text style={styles.subtitle}>{strings[lang].corporation}</Text>
        <Text style={styles.date}>{getTodayDate()}</Text>

        <Text style={styles.sectionTitle}>{strings[lang].findBus}</Text>

        <Text style={styles.label}>{strings[lang].source}</Text>
        <Picker
          selectedValue={source}
          onValueChange={(value) => setSource(value)}
          style={styles.picker}
        >
          <Picker.Item label={strings[lang].selectSource} value="" />
          {availableSources.map((src) => (
            <Picker.Item key={src} label={src} value={src} />
          ))}
        </Picker>

        <Text style={styles.label}>{strings[lang].destination}</Text>
        <Picker
          selectedValue={destination}
          onValueChange={(value) => setDestination(value)}
          style={styles.picker}
        >
          <Picker.Item label={strings[lang].selectDestination} value="" />
          {availableDestinations.map((dst) => (
            <Picker.Item key={dst} label={dst} value={dst} />
          ))}
        </Picker>

        <TouchableOpacity style={styles.findButton} onPress={handleFindBuses}>
          <Text style={styles.findButtonText}>{strings[lang].findBuses}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>© 2025 {strings[lang].corporation}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    flex: 1,
    backgroundColor: '#f2f4f8',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    paddingTop: 36,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: '#555' },
  date: { fontSize: 12, color: '#999', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  label: {
    fontSize: 15,
    color: '#111',
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 4,
  },
  picker: {
    width: '100%',
    height: 48,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 8,
    color: '#000',
    marginBottom: 10,
  },
  findButton: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  findButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    fontSize: 12,
    color: '#999',
  },
});
