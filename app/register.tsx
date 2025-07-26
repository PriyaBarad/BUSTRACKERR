// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRouter } from 'expo-router';
// import strings from '../locales/strings';

// export default function RegisterScreen() {
//   const [lang, setLang] = useState<'en' | 'mr'>('en');
//   const router = useRouter();

//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');

//   useEffect(() => {
//     const getLanguage = async () => {
//       const storedLang = await AsyncStorage.getItem('language');
//       setLang(storedLang === 'mr' ? 'mr' : 'en');
//     };
//     getLanguage();
//   }, []);

//   const handleRegister = async () => {
//     const nameRegex = /^[A-Za-z\s]+$/;
//     const phoneRegex = /^[789]\d{9}$/;
//     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{6,}$/;

//     if (!fullName || !phoneNumber || !password || !confirmPassword) {
//       Alert.alert(
//         lang === 'mr' ? 'कृपया सर्व माहिती भरा' : 'Please fill in all fields'
//       );
//       return;
//     }

//     if (!nameRegex.test(fullName)) {
//       Alert.alert(
//         lang === 'mr' ? 'पूर्ण नाव फक्त अक्षरे असावे' : 'Full name should only contain letters'
//       );
//       return;
//     }

//     if (!phoneRegex.test(phoneNumber)) {
//       Alert.alert(
//         lang === 'mr'
//           ? 'फोन नंबर ७, ८ किंवा ९ ने सुरु होणारा आणि १० अंकी असावा'
//           : 'Phone number must start with 7, 8, or 9 and be 10 digits long'
//       );
//       return;
//     }

//     if (!passwordRegex.test(password)) {
//       Alert.alert(
//         lang === 'mr'
//           ? 'पासवर्डमध्ये एक मोठा अक्षर, एक विशेष चिन्ह आणि एक लहान अक्षर असावे'
//           : 'Password must include at least one uppercase letter, one special character, and one lowercase letter'
//       );
//       return;
//     }

//     if (password !== confirmPassword) {
//       Alert.alert(
//         lang === 'mr' ? 'पासवर्ड जुळत नाहीत' : 'Passwords do not match'
//       );
//       return;
//     }

//     try {
//       const API_URL = 'http://localhost:5000/api/users/register';

//       const response = await fetch(API_URL, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           name: fullName,
//           phone: phoneNumber,
//           password,
//         }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setFullName('');
//         setPhoneNumber('');
//         setPassword('');
//         setConfirmPassword('');

//         console.log('✅ Registration successful. Navigating to login...');
//         Alert.alert(
//           lang === 'mr' ? 'नोंदणी यशस्वी झाली' : 'Registration Successful',
//           lang === 'mr' ? 'आपले खाते लॉगिन करा' : 'Login your account',
//           [
//             {
//               text: 'OK',
//               onPress: () => router.push('/login'), // ✅ Changed from replace to push
//             },
//           ]
//         );
//       } else if (data?.message === 'This user already exists') {
//         Alert.alert(
//           lang === 'mr' ? 'हा वापरकर्ता आधीच नोंदणीकृत आहे' : 'This user already exists'
//         );
//       } else {
//         Alert.alert(
//           lang === 'mr' ? 'नोंदणी अयशस्वी' : 'Registration Failed',
//           data?.message || (lang === 'mr' ? 'कृपया पुन्हा प्रयत्न करा' : 'Please try again')
//         );
//       }
//     } catch (error) {
//       console.error('❌ Registration error:', error);
//       Alert.alert(
//         lang === 'mr' ? 'सर्व्हर त्रुटी' : 'Server Error',
//         lang === 'mr' ? 'कृपया नेटवर्क तपासा' : 'Please check your network'
//       );
//     }
//   };

//   const goToLogin = () => {
//     console.log('🔁 Navigating to login page...');
//     router.push('/login'); // ✅ Changed to push
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.box}>
//         <Text style={styles.title}>{strings[lang].createAccount}</Text>
//         <Text style={styles.subtitle}>{strings[lang].tagline}</Text>

//         <TextInput
//           style={styles.input}
//           placeholder={strings[lang].fullName}
//           value={fullName}
//           onChangeText={setFullName}
//         />
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
//         <TextInput
//           style={styles.input}
//           placeholder={strings[lang].confirmPassword}
//           secureTextEntry
//           value={confirmPassword}
//           onChangeText={setConfirmPassword}
//         />

//         <TouchableOpacity style={styles.button} onPress={handleRegister}>
//           <Text style={styles.buttonText}>{strings[lang].createButton}</Text>
//         </TouchableOpacity>

//         <Text style={styles.footer}>
//           {strings[lang].alreadyRegistered}{' '}
//           <Text style={styles.signIn} onPress={goToLogin}>
//             {strings[lang].signIn}
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
//   signIn: {
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import strings from '../locales/strings';

export default function RegisterScreen() {
  const [lang, setLang] = useState<'en' | 'mr'>('en');
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const getLanguage = async () => {
      const storedLang = await AsyncStorage.getItem('language');
      setLang(storedLang === 'mr' ? 'mr' : 'en');
    };
    getLanguage();
  }, []);

  const handleRegister = async () => {
  const nameRegex = /^[A-Za-z\s]+$/;
  const phoneRegex = /^[789]\d{9}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{6,}$/;

  if (!fullName || !phoneNumber || !password || !confirmPassword) {
    Alert.alert(lang === 'mr' ? 'कृपया सर्व माहिती भरा' : 'Please fill in all fields');
    return;
  }

  if (!nameRegex.test(fullName)) {
    Alert.alert(lang === 'mr' ? 'पूर्ण नाव फक्त अक्षरे असावे' : 'Full name should only contain letters');
    return;
  }

  if (!phoneRegex.test(phoneNumber)) {
    Alert.alert(lang === 'mr'
      ? 'फोन नंबर ७, ८ किंवा ९ ने सुरु होणारा आणि १० अंकी असावा'
      : 'Phone number must start with 7, 8, or 9 and be 10 digits long');
    return;
  }

  if (!passwordRegex.test(password)) {
    Alert.alert(lang === 'mr'
      ? 'पासवर्डमध्ये एक मोठा अक्षर, एक विशेष चिन्ह आणि एक लहान अक्षर असावे'
      : 'Password must include at least one uppercase letter, one special character, and one lowercase letter');
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert(lang === 'mr' ? 'पासवर्ड जुळत नाहीत' : 'Passwords do not match');
    return;
  }

  try {
    const API_URL = 'http://192.168.36.52:5000/api/users/register';
    console.log('📡 Calling API:', API_URL);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fullName, phone: phoneNumber, password }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    console.log('📥 API Response:', data);

    if (response.ok) {
      // ✅ Clear the form fields
      setFullName('');
      setPhoneNumber('');
      setPassword('');
      setConfirmPassword('');

      Alert.alert(
        lang === 'mr' ? 'नोंदणी यशस्वी झाली' : 'Registration Successful',
        lang === 'mr' ? 'आपले खाते लॉगिन करा' : 'Login your account',
        [
          {
            text: 'OK',
            onPress: () => router.push('/login'), // ✅ Go to login after clearing
          },
        ]
      );
    } else if (data?.message?.includes('exists')) {
      Alert.alert(
        lang === 'mr' ? 'हा वापरकर्ता आधीच नोंदणीकृत आहे' : 'This user already exists'
      );
    } else {
      Alert.alert(
        lang === 'mr' ? 'नोंदणी अयशस्वी' : 'Registration Failed',
        data?.message || (lang === 'mr' ? 'कृपया पुन्हा प्रयत्न करा' : 'Please try again')
      );
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    Alert.alert(
      lang === 'mr' ? 'सर्व्हर त्रुटी' : 'Server Error',
      lang === 'mr' ? 'कृपया नेटवर्क तपासा' : 'Please check your network'
    );
  }
};

  const goToLogin = () => {
    console.log('🔁 Navigating to login page...');
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>{strings[lang].createAccount}</Text>
        <Text style={styles.subtitle}>{strings[lang].tagline}</Text>

        <TextInput
          style={styles.input}
          placeholder={strings[lang].fullName}
          value={fullName}
          onChangeText={setFullName}
        />
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
        <TextInput
          style={styles.input}
          placeholder={strings[lang].confirmPassword}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>{strings[lang].createButton}</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          {strings[lang].alreadyRegistered}{' '}
          <Text style={styles.signIn} onPress={goToLogin}>
            {strings[lang].signIn}
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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
  signIn: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
});
