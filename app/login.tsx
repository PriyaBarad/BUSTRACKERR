// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   Platform,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRouter } from 'expo-router';
// import strings from '../locales/strings';

// export default function LoginScreen() {
//   const [lang, setLang] = useState<'en' | 'mr'>('en');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [password, setPassword] = useState('');
//   const router = useRouter();

//   useEffect(() => {
//     const getLanguage = async () => {
//       const storedLang = await AsyncStorage.getItem('language');
//       setLang(storedLang === 'mr' ? 'mr' : 'en');
//     };
//     getLanguage();
//   }, []);

//   const handleLogin = async () => {
//     if (!phoneNumber || !password) {
//       Alert.alert(lang === 'mr' ? 'कृपया सर्व माहिती भरा' : 'Please fill in all fields');
//       return;
//     }

//     try {
//       // ✅ Platform-safe local IP
//       // const API_BASE = Platform.OS === 'android' ? 'http://10.1.79.76:5000' : 'http://localhost:5000';
//       const API_URL = 'http://192.168.36.52:5000/api/users/login';

//       console.log("📤 Sending Login:", { phone: phoneNumber, password }); // debug log

//       const response = await fetch(API_URL, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           phone: phoneNumber,
//           password,
//         }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         await AsyncStorage.setItem('user', JSON.stringify(data.user));
//         console.log("✅ Login successful, navigating to /home...");
//         router.push('./home');
//       } else {
//         const isUserNotRegistered = data?.message === 'Invalid phone number or password';
//         Alert.alert(
//           isUserNotRegistered
//             ? lang === 'mr' ? 'वापरकर्ता नोंदणीकृत नाही' : 'User not registered'
//             : lang === 'mr' ? 'लॉगिन अयशस्वी' : 'Login Failed',
//           data?.message || (lang === 'mr' ? 'कृपया माहिती तपासा' : 'Please check your credentials')
//         );
//       }
//     } catch (error) {
//       console.error('❌ Login Error:', error);
//       Alert.alert(
//         lang === 'mr' ? 'सर्व्हर त्रुटी' : 'Server Error',
//         lang === 'mr' ? 'नेटवर्क तपासा' : 'Please check your network'
//       );
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.box}>
//         <Text style={styles.title}>BusTracker Login</Text>
//         <Text style={styles.subtitle}>
//           {lang === 'mr' ? 'तुमची बस कधीही ट्रॅक करा!' : 'Track your ride live, anytime!'}
//         </Text>

//         <TextInput
//           style={styles.input}
//           placeholder={strings[lang].phoneNumber}
//           keyboardType="phone-pad"
//           value={phoneNumber}
//           onChangeText={setPhoneNumber}
//         />

//         <TextInput
//           style={styles.input}
//           placeholder={strings[lang].password}
//           secureTextEntry
//           value={password}
//           onChangeText={setPassword}
//         />

//         <TouchableOpacity style={styles.button} onPress={handleLogin}>
//           <Text style={styles.buttonText}>🚀 {strings[lang].signIn}</Text>
//         </TouchableOpacity>

//         <Text style={styles.footer}>
//           {lang === 'mr' ? 'खाते नाहीये?' : "Don't have an account?"}{' '}
//           <Text style={styles.link} onPress={() => router.replace('/register')}>
//             {lang === 'mr' ? 'खाते तयार करा' : 'Create one'}
//           </Text>
//         </Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f2f2f2',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   box: {
//     width: '100%',
//     maxWidth: 400,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 25,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 6,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#555',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   input: {
//     width: '100%',
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     marginBottom: 12,
//     fontSize: 16,
//   },
//   button: {
//     backgroundColor: '#007BFF',
//     paddingVertical: 12,
//     borderRadius: 8,
//     width: '100%',
//     marginTop: 10,
//   },
//   buttonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 16,
//     textAlign: 'center',
//   },
//   footer: {
//     marginTop: 15,
//     fontSize: 14,
//     color: '#333',
//   },
//   link: {
//     color: '#007BFF',
//     fontWeight: 'bold',
//   },
// });





import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import strings from '../locales/strings';

export default function LoginScreen() {
  const [lang, setLang] = useState<'en' | 'mr'>('en');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    const getLanguage = async () => {
      const storedLang = await AsyncStorage.getItem('language');
      setLang(storedLang === 'mr' ? 'mr' : 'en');
    };
    getLanguage();
  }, []);

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert(lang === 'mr' ? 'कृपया सर्व माहिती भरा' : 'Please fill in all fields');
      return;
    }

    try {
      const API_URL = 'http://192.168.36.52:5000/api/users/login';

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        router.push('./home');
      } else {
        const isUserNotRegistered = data?.message === 'Invalid phone number or password';
        Alert.alert(
          isUserNotRegistered
            ? lang === 'mr' ? 'वापरकर्ता नोंदणीकृत नाही' : 'User not registered'
            : lang === 'mr' ? 'लॉगिन अयशस्वी' : 'Login Failed',
          data?.message || (lang === 'mr' ? 'कृपया माहिती तपासा' : 'Please check your credentials')
        );
      }
    } catch (error) {
      console.error('❌ Login Error:', error);
      Alert.alert(
        lang === 'mr' ? 'सर्व्हर त्रुटी' : 'Server Error',
        lang === 'mr' ? 'नेटवर्क तपासा' : 'Please check your network'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        {/* Back Button inside the box */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.backButtonText}>← {lang === 'mr' ? 'मागे' : 'Back'}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>BusTracker Login</Text>
        <Text style={styles.subtitle}>
          {lang === 'mr' ? 'तुमची बस कधीही ट्रॅक करा!' : 'Track your ride live, anytime!'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder={strings[lang].phoneNumber}
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        <TextInput
          style={styles.input}
          placeholder={strings[lang].password}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>🚀 {strings[lang].signIn}</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          {lang === 'mr' ? 'खाते नाहीये?' : "Don't have an account?"}{' '}
          <Text style={styles.link} onPress={() => router.replace('/register')}>
            {lang === 'mr' ? 'खाते तयार करा' : 'Create one'}
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    paddingTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 15,
  },
  backButtonText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    marginTop: 15,
    fontSize: 14,
    color: '#333',
  },
  link: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
});
