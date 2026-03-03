import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import strings from '../locales/strings';
import Header from '../components/Header';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

export const options = {
  headerShown: false,
};

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [lang, setLang] = useState<'en' | 'mr'>('en');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const router = useRouter();

  

    useEffect(() => {
    const getLanguage = async () => {
      const storedLang = await AsyncStorage.getItem('language');
      setLang(storedLang === 'mr' ? 'mr' : 'en');
    };

    const checkLoginStatus = async () => {
      const loggedIn = await AsyncStorage.getItem('userLoggedIn');
      if (loggedIn === 'true') {
        router.replace('./home');
      } else {
        setCheckingLogin(false);
      }
    };

    getLanguage();
    checkLoginStatus();
  }, []);

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert(
        lang === 'mr' ? 'कृपया सर्व माहिती भरा' : 'Please fill in all fields',
        '',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      const API_URL = 'http://10.34.28.52:5000/api/users/login';
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('userLoggedIn', 'true');
        router.replace('./home');
      } else {
        const isUserNotRegistered = data?.message === 'Invalid phone number or password';
        Alert.alert(
          isUserNotRegistered
            ? lang === 'mr' ? 'वापरकर्ता नोंदणीकृत नाही' : 'User not registered'
            : lang === 'mr' ? 'लॉगिन अयशस्वी' : 'Login Failed',
          data?.message || (lang === 'mr' ? 'कृपया माहिती तपासा' : 'Please check your credentials'),
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('❌ Login Error:', error);
      Alert.alert(
        lang === 'mr' ? 'सर्व्हर त्रुटी' : 'Server Error',
        lang === 'mr' ? 'नेटवर्क तपासा' : 'Please check your network',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingLogin) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>
          {lang === 'mr' ? 'लोड करत आहे...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#f8f9fa', '#e9ecef']}
      style={styles.root}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Centered Container */}
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace('/(tabs)')}
                activeOpacity={0.7}
              >
                <MaterialIcons name="arrow-back" size={24} color="#6C63FF" />
                <Text style={styles.backButtonText}>
                  {lang === 'mr' ? 'मागे' : 'Back'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.logoContainer}>
                <Image
                   source={require('../assets/images/smt-logo.png')} 
                    style={styles.logo}
                />
                <Text style={styles.title}>Track My Bus</Text>
              </View>

              <Text style={styles.subtitle}>
                {lang === 'mr'
                  ? 'तुमची बस कधीही ट्रॅक करा!'
                  : 'Track your ride live, anytime!'}
              </Text>

              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="phone"
                    size={20}
                    color="#6C63FF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={strings[lang].phoneNumber}
                    placeholderTextColor="#adb5bd"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="lock"
                    size={20}
                    color="#6C63FF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={strings[lang].password}
                    placeholderTextColor="#adb5bd"
                    secureTextEntry={secureEntry}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setSecureEntry(!secureEntry)}
                    style={styles.eyeIcon}
                  >
                    <MaterialIcons
                      name={secureEntry ? "visibility-off" : "visibility"}
                      size={20}
                      color="#adb5bd"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {strings[lang].signIn}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => router.replace('/')}
                >
                  <Text style={styles.forgotPasswordText}>
                    {lang === 'mr' ? 'पासवर्ड विसरलात?' : 'Forgot password?'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {lang === 'mr' ? 'खाते नाहीये?' : "Don't have an account?"}
                </Text>
                <TouchableOpacity onPress={() => router.replace('/register')}>
                  <Text style={styles.footerLink}>
                    {lang === 'mr' ? 'खाते तयार करा' : 'Create one'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    width: width > 500 ? 450 : '90%', // Responsive width
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginVertical: 20,
  },
  content: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C63FF',
  },
  header: {
    marginBottom: 20,
  },
  logo: {
  width: 100,
  height: 100,
  borderRadius: 50, // half of width/height for perfect circle
},
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#495057',
    marginTop: 15,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#495057',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    marginTop: 10,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 5,
  },
  footerLink: {
    color: '#6C63FF',
    fontWeight: '600',
    fontSize: 15,
  },
});






