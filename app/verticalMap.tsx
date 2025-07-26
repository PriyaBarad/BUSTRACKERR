// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, ScrollView } from 'react-native';
// import { useLocalSearchParams } from 'expo-router';
// import axios from 'axios';
// import { Ionicons } from '@expo/vector-icons';
// import strings from '../locales/strings';

// type Language = 'en' | 'mr';

// type RouteType = {
//   source: string;
//   destination: string;
//   busNumber: string;
//   stops: { name: string; time: string }[];
// };

// const VerticalMapScreen = () => {
//   const params = useLocalSearchParams();
//   const busNumberParam = Array.isArray(params.busNumber) ? params.busNumber[0] : params.busNumber;
//   const langParam = Array.isArray(params.lang) ? params.lang[0] : params.lang;
//   const lang: Language = langParam === 'mr' ? 'mr' : 'en';
//   const [routeData, setRouteData] = useState<RouteType | null>(null);

//   useEffect(() => {
//     const fetchRouteData = async () => {
//       try {
//         const encodedBusNumber = encodeURIComponent(busNumberParam);
//         const url = `http://192.168.36.52:5000/api/routes/bus/${encodedBusNumber}`;
//         const response = await axios.get(url);
//         const route = response.data;
//         console.log('🚏 Route Data:', route);
//         setRouteData(route);
//       } catch (error) {
//         console.error('❌ Error fetching route data:', error);
//       }
//     };

//     fetchRouteData();
//   }, [busNumberParam]);

//   const localizedStrings = strings[lang];

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <View style={styles.card}>
//         <Text style={styles.title}>
//           <Ionicons name="bus" size={20} color="#000" /> {localizedStrings.routeInfo}
//         </Text>
//         <Text style={styles.subTitle}>
//           {localizedStrings.busNumber}: {routeData?.busNumber}
//         </Text>

//         {/* Timeline */}
//         <View style={styles.timelineContainer}>
//           {/* Source */}
//           <View style={styles.timelineRow}>
//             <View style={[styles.dot, { backgroundColor: 'green' }]} />
//             <Text style={styles.stopText}>{routeData?.source}</Text>
//           </View>

//           {/* Stops */}
//           {routeData?.stops?.map((stop, index) => (
//             <View key={`${stop.name}-${index}`} style={styles.timelineRow}>
//               <View style={[styles.dot, { backgroundColor: '#aaa' }]} />
//               <Text style={styles.stopText}>{stop.name} ({stop.time})</Text>
//             </View>
//           ))}

//           {/* Destination */}
//           <View style={styles.timelineRow}>
//             <View style={[styles.dot, { backgroundColor: 'red' }]} />
//             <Text style={styles.stopText}>{routeData?.destination}</Text>
//           </View>
//         </View>
//       </View>
//     </ScrollView>
//   );
// };

// export default VerticalMapScreen;

// const styles = StyleSheet.create({
//   container: {
//     padding: 16,
//   },
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     elevation: 3,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   subTitle: {
//     fontSize: 14,
//     color: '#555',
//     marginBottom: 16,
//   },
//   timelineContainer: {
//     borderLeftWidth: 2,
//     borderLeftColor: '#ccc',
//     paddingLeft: 20,
//   },
//   timelineRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 24,
//   },
//   dot: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     marginRight: 12,
//     marginLeft: -26, // push dot over the vertical line
//   },
//   stopText: {
//     fontSize: 16,
//   },
// });



// ... imports remain the same
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import strings from '../locales/strings';

type Language = 'en' | 'mr';

type RouteType = {
  source: string;
  destination: string;
  busNumber: string;
  stops: { name: string; time: string; delay?: string }[];
};

const VerticalMapScreen = () => {
  const params = useLocalSearchParams();
  const busNumberParam = Array.isArray(params.busNumber) ? params.busNumber[0] : params.busNumber;
  const langParam = Array.isArray(params.lang) ? params.lang[0] : params.lang;
  const lang: Language = langParam === 'mr' ? 'mr' : 'en';

  const [routeData, setRouteData] = useState<RouteType | null>(null);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        const encodedBusNumber = encodeURIComponent(busNumberParam);
        const url = `http://192.168.36.52:5000/api/routes/bus/${encodedBusNumber}`;
        const response = await axios.get(url);
        const route = response.data;
        console.log('🚏 Route Data:', route);
        setRouteData(route);
      } catch (error) {
        console.error('❌ Error fetching route data:', error);
      }
    };

    fetchRouteData();
  }, [busNumberParam]);

  useEffect(() => {
    if (routeData) {
      Animated.loop(
        Animated.timing(animation, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      ).start();
    }
  }, [routeData]);

  const localizedStrings = strings[lang];
  const totalStops = routeData?.stops?.length || 1;
  const animatedTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, totalStops * 80],
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          <Ionicons name="bus" size={20} color="#000" /> {localizedStrings.routeInfo}
        </Text>
        <Text style={styles.subTitle}>
          {localizedStrings.busNumber}: {routeData?.busNumber}
        </Text>

        <View style={styles.verticalMap}>
          <View style={styles.line} />

          <Animated.Image
            source={require('../assets/images/bus-icon.png')}
            style={[
              styles.busIcon,
              { transform: [{ translateY: animatedTranslateY }] },
            ]}
          />

          {/* Source with (Src) */}
          <View style={styles.stopWrapper}>
            <Text style={styles.dot}>●</Text>
              <Text style={styles.stopText}>
              <Text style={{ fontWeight: 'bold' }}>{routeData?.source}</Text> (Source)
            </Text>
          </View>

          {/* Intermediate Stops */}
          {routeData?.stops.map((stop, index) => (
            <View key={`${stop.name}-${index}`} style={styles.stopWrapper}>
              <Text style={styles.branch}>├</Text>
              <Text style={styles.stopText}>
                {stop.name} ({stop.time})
                {stop.delay ? ` - ${stop.delay}` : ''}
              </Text>
            </View>
          ))}

          {/* Destination with (Destination) */}
          <View style={styles.stopWrapper}>
            <Text style={styles.dot}>&#9679;</Text>
            <Text style={styles.stopText}>
            <Text style={{ fontWeight: 'bold' }}>{routeData?.destination}</Text> (Destination)
            </Text>
          </View>-
        </View>
      </View>
    </ScrollView>
  );
};

export default VerticalMapScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  verticalMap: {
    marginLeft: 30,
    position: 'relative',
  },
  line: {
    position: 'absolute',
    left: 10,
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: '#888',
  },
  busIcon: {
    position: 'absolute',
    left: 2,
    width: 24,
    height: 24,
    zIndex: 1,
  },
  stopWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
    paddingLeft: 0,
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    left: 6,
    fontSize: 14,
    color: 'green',
  },
  branch: {
    position: 'absolute',
    left: 4,
    fontSize: 16,
    color: '#333',
  },
  stopText: {
    marginLeft: 30,
    fontSize: 16,
    color: '#333',
  },
});
