// import React from 'react';
// import { View, Text, StyleSheet, Image } from 'react-native';

// export default function Header() {
//   return (
//     <View style={styles.header}>
//       <Text style={styles.title}>Track My Bus</Text>
//       <Image
//         source={require('../assets/images/transport-logo.jpeg')}
//         style={styles.logo}
//         resizeMode="contain"
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   header: {
//     width: '100%',
//     height: 80,
//     backgroundColor: '#fff',
//     paddingHorizontal: 16,
//     paddingTop: 20,
//     paddingBottom: 10,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   logo: {
//   width: 60,
//   height: 60,
//   borderRadius: 50, // half of width/height for perfect circle

// },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#093596ff',
//     flex: 1,
//     textAlign: 'center',
//   },
// });



import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function Header() {
  return (
    <View style={styles.header}>
      {/* Empty View to balance the logo */}
      <View style={{ width: 60, height: 60 }} /> 

      <Text style={styles.title}>Track My Bus</Text>

      <Image
        source={require('../assets/images/transport-logo.jpeg')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 80,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // space between left empty view, title, and logo
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    paddingHorizontal: 16,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30, // half of width/height
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#093596ff',
    textAlign: 'center',
  },
});
