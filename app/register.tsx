import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Animated,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import strings from '../locales/strings';
import { useTheme } from '../components/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../constants/Api';

const { width } = Dimensions.get('window');

const showAlert = (title: string, message: string = '', buttons?: any[]) => {
  if (Platform.OS === 'web') {
    alert(message ? `${title}\n${message}` : title);
    if (buttons && buttons.length > 0) {
      const okButton = buttons.find(b => b.onPress);
      if (okButton && okButton.onPress) {
        okButton.onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function RegisterScreen() {
  const [lang, setLang] = useState<'en' | 'mr'>('en');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const [secureConfirmEntry, setSecureConfirmEntry] = useState(true);
  const router = useRouter();

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  useEffect(() => {
    const getLanguage = async () => {
      const storedLang = await AsyncStorage.getItem('language');
      setLang(storedLang === 'mr' ? 'mr' : 'en');
    };
    getLanguage();
  }, []);

  const toggleLanguage = async () => {
    const newLang = lang === 'en' ? 'mr' : 'en';
    setLang(newLang);
    await AsyncStorage.setItem('language', newLang);
  };

  const handleRegister = async () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^[789]\d{9}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{6,}$/;

    if (!fullName || !phoneNumber || !password || !confirmPassword) {
      showAlert(
        lang === 'mr' ? 'कृपया सर्व माहिती भरा' : 'Please fill in all fields',
        '',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (!nameRegex.test(fullName)) {
      showAlert(
        lang === 'mr' ? 'पूर्ण नाव फक्त अक्षरे असावे' : 'Full name should only contain letters',
        '',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (!phoneRegex.test(phoneNumber)) {
      showAlert(
        lang === 'mr'
          ? 'फोन नंबर ७, ८ किंवा ९ ने सुरु होणारा आणि १० अंकी असावा'
          : 'Phone number must start with 7, 8, or 9 and be 10 digits long',
        '',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (!passwordRegex.test(password)) {
      showAlert(
        lang === 'mr'
          ? 'पासवर्डमध्ये एक मोठा अक्षर, एक विशेष चिन्ह आणि एक लहान अक्षर असावे'
          : 'Password must include at least one uppercase letter, one special character, and one lowercase letter',
        '',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (password !== confirmPassword) {
      showAlert(
        lang === 'mr' ? 'पासवर्ड जुळत नाहीत' : 'Passwords do not match',
        '',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      const API_URL = `${API_BASE_URL}/api/users/register`;
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

      if (response.ok) {
        setFullName('');
        setPhoneNumber('');
        setPassword('');
        setConfirmPassword('');

        showAlert(
          lang === 'mr' ? 'नोंदणी यशस्वी झाली' : 'Registration Successful',
          lang === 'mr' ? 'आपले खाते लॉगिन करा' : 'Login your account',
          [
            {
              text: 'OK',
              onPress: () => router.push('/login'),
            },
          ]
        );
      } else if (data?.message?.includes('exists')) {
        showAlert(
          lang === 'mr' ? 'हा वापरकर्ता आधीच नोंदणीकृत आहे' : 'This user already exists',
          '',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        showAlert(
          lang === 'mr' ? 'नोंदणी अयशस्वी' : 'Registration Failed',
          data?.message || (lang === 'mr' ? 'कृपया पुन्हा प्रयत्न करा' : 'Please try again'),
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      showAlert(
        lang === 'mr' ? 'सर्व्हर त्रुटी' : 'Server Error',
        lang === 'mr' ? 'कृपया नेटवर्क तपासा' : 'Please check your network',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    router.push('/login');
  };

  return (
    <View style={[styles.root, isDark && styles.darkRoot]}>
      <LinearGradient
        colors={isDark ? ['#0a0f1d', '#0d1527', '#0a0f1d'] : ['#eef4ff', '#fdfbf7', '#eef4ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />



      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Actions Row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[styles.backButtonCircle, isDark && styles.darkHeaderButton]}
              onPress={() => router.replace('/login')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="chevron-left" size={28} color={isDark ? '#f8fafc' : '#0f172a'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langTogglePill, isDark && styles.darkHeaderButton]}
              onPress={toggleLanguage}
              activeOpacity={0.8}
            >
              <MaterialIcons name="translate" size={16} color={isDark ? '#38bdf8' : '#1058d1'} style={{ marginRight: 6 }} />
              <Text style={[styles.langToggleText, isDark && styles.darkAccentText]}>
                {lang === 'en' ? 'मराठी' : 'English'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.container}>
            <View style={styles.content}>
              {/* Logo and Brand Header */}
              <View style={styles.logoRow}>
                <Image
                  source={require('../assets/images/smt-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <View style={styles.titleContainer}>
                  <Text style={[styles.title, isDark && styles.darkTitle]}>Track My Bus</Text>
                </View>
              </View>

              <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
                {strings[lang].tagline}
              </Text>

              <View style={styles.formContainer}>
                {/* Full Name Input */}
                <View
                  style={[
                    styles.inputContainer,
                    isDark && styles.darkInputContainer,
                    isNameFocused && styles.inputFocused,
                    isNameFocused && isDark && styles.darkInputFocused
                  ]}
                >
                  <MaterialIcons
                    name="person-outline"
                    size={22}
                    color={isNameFocused ? (isDark ? '#38bdf8' : '#1058d1') : (isDark ? '#64748b' : '#7a8b9e')}
                    style={styles.inputIcon}
                  />
                  <View style={styles.inputBody}>
                    <Text style={styles.inputLabel}>{strings[lang].fullName}</Text>
                    <TextInput
                      style={[styles.input, isDark && styles.darkInputText]}
                      placeholder="John Doe"
                      placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      onFocus={() => setIsNameFocused(true)}
                      onBlur={() => setIsNameFocused(false)}
                    />
                  </View>
                </View>

                {/* Phone Number Input */}
                <View
                  style={[
                    styles.inputContainer,
                    isDark && styles.darkInputContainer,
                    isPhoneFocused && styles.inputFocused,
                    isPhoneFocused && isDark && styles.darkInputFocused
                  ]}
                >
                  <MaterialIcons
                    name="phone"
                    size={22}
                    color={isPhoneFocused ? (isDark ? '#38bdf8' : '#1058d1') : (isDark ? '#64748b' : '#7a8b9e')}
                    style={styles.inputIcon}
                  />
                  <View style={styles.inputBody}>
                    <Text style={styles.inputLabel}>{strings[lang].phoneNumber}</Text>
                    <TextInput
                      style={[styles.input, isDark && styles.darkInputText]}
                      placeholder="+91 9876543210"
                      placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      autoCapitalize="none"
                      onFocus={() => setIsPhoneFocused(true)}
                      onBlur={() => setIsPhoneFocused(false)}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View
                  style={[
                    styles.inputContainer,
                    isDark && styles.darkInputContainer,
                    isPasswordFocused && styles.inputFocused,
                    isPasswordFocused && isDark && styles.darkInputFocused
                  ]}
                >
                  <MaterialIcons
                    name="lock-outline"
                    size={22}
                    color={isPasswordFocused ? (isDark ? '#38bdf8' : '#1058d1') : (isDark ? '#64748b' : '#7a8b9e')}
                    style={styles.inputIcon}
                  />
                  <View style={styles.inputBody}>
                    <Text style={styles.inputLabel}>{strings[lang].password}</Text>
                    <TextInput
                      style={[styles.input, isDark && styles.darkInputText]}
                      placeholder="••••••••"
                      placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                      secureTextEntry={secureEntry}
                      value={password}
                      onChangeText={setPassword}
                      autoCapitalize="none"
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setSecureEntry(!secureEntry)}
                    style={styles.eyeIcon}
                  >
                    <MaterialIcons
                      name={secureEntry ? 'visibility-off' : 'visibility'}
                      size={22}
                      color={isPasswordFocused ? (isDark ? '#38bdf8' : '#1058d1') : (isDark ? '#64748b' : '#7a8b9e')}
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password Input */}
                <View
                  style={[
                    styles.inputContainer,
                    isDark && styles.darkInputContainer,
                    isConfirmPasswordFocused && styles.inputFocused,
                    isConfirmPasswordFocused && isDark && styles.darkInputFocused
                  ]}
                >
                  <MaterialIcons
                    name="lock-outline"
                    size={22}
                    color={isConfirmPasswordFocused ? (isDark ? '#38bdf8' : '#1058d1') : (isDark ? '#64748b' : '#7a8b9e')}
                    style={styles.inputIcon}
                  />
                  <View style={styles.inputBody}>
                    <Text style={styles.inputLabel}>{strings[lang].confirmPassword}</Text>
                    <TextInput
                      style={[styles.input, isDark && styles.darkInputText]}
                      placeholder="••••••••"
                      placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                      secureTextEntry={secureConfirmEntry}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      autoCapitalize="none"
                      onFocus={() => setIsConfirmPasswordFocused(true)}
                      onBlur={() => setIsConfirmPasswordFocused(false)}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setSecureConfirmEntry(!secureConfirmEntry)}
                    style={styles.eyeIcon}
                  >
                    <MaterialIcons
                      name={secureConfirmEntry ? 'visibility-off' : 'visibility'}
                      size={22}
                      color={isConfirmPasswordFocused ? (isDark ? '#38bdf8' : '#1058d1') : (isDark ? '#64748b' : '#7a8b9e')}
                    />
                  </TouchableOpacity>
                </View>

                {/* Create Account Button */}
                <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%', marginTop: 16 }}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      isDark && styles.darkButton,
                      isLoading && styles.buttonDisabled
                    ]}
                    onPress={handleRegister}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {strings[lang].createButton}
                      </Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Links Row */}
                <View style={styles.linksRow}>
                  <View style={styles.footerCenter}>
                    <Text style={[styles.footerRightText, isDark && styles.darkSubtitle]}>
                      {strings[lang].alreadyRegistered}{' '}
                    </Text>
                    <TouchableOpacity onPress={goToLogin}>
                      <Text style={[styles.footerRightLink, isDark && styles.darkAccentText]}>
                        {strings[lang].signIn}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Powered By Bottom Brand */}
          <Text style={[styles.poweredBy, isDark && styles.darkSubtitle]}>
            Powered by MIT Vishwaprayag University
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#faf8f5', 
  },
  topRightGlowOuter: {
    position: 'absolute',
    top: -150,
    right: -150,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: '#eef4ff',
    opacity: 0.8,
  },
  topRightGlowInner: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#dbeafe',
    opacity: 0.6,
  },
  topRightNetwork: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 300,
    height: 300,
  },
  bottomLeftGlowOuter: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: '#eef4ff',
    opacity: 0.8,
  },
  bottomLeftGlowInner: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#dbeafe',
    opacity: 0.6,
  },
  bottomLeftNetwork: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 300,
    height: 300,
  },
  constellationLine: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: '#a5cbfb',
    opacity: 0.45,
  },
  constellationNode: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#60a5fa',
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'ios' ? 48 : 36,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: width > 500 ? 440 : '100%',
    alignSelf: 'center',
    marginBottom: 36,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  langTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  langToggleText: {
    color: '#1058d1',
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    width: width > 500 ? 440 : '100%',
    alignSelf: 'center',
  },
  content: {
    width: '100%',
  },
  logoRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 35,
    fontWeight: '800',
    color: '#0b2d64',
    letterSpacing: -0.6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14.5,
    color: '#5c6f84',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: '#cee0fc',
    paddingHorizontal: 24,
    marginBottom: 20,
    height: 72,
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 14,
  },
  inputBody: {
    flex: 1,
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    color: '#7a8b9e',
    fontWeight: '600',
    marginBottom: 2,
  },
  input: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
    height: 24,
    padding: 0,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: '#1058d1', 
    paddingVertical: 18,
    borderRadius: 36, 
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: '#1058d1',
    fontSize: 14,
    fontWeight: '600',
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  footerCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  footerRightText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  footerRightLink: {
    color: '#1058d1',
    fontWeight: '700',
    fontSize: 13,
  },
  poweredBy: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 64,
    marginBottom: 16,
    opacity: 0.8,
  },

  // Focus Styles
  inputFocused: {
    borderColor: '#1058d1',
    shadowColor: '#1058d1',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  // Dark Mode support overrides
  darkRoot: {
    backgroundColor: '#090d16',
  },
  darkHeaderButton: {
    backgroundColor: '#151f32',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  darkTitle: {
    color: '#f8fafc',
  },
  darkSubtitle: {
    color: '#94a3b8',
  },
  darkText: {
    color: '#f8fafc',
  },
  darkInputContainer: {
    backgroundColor: '#151f32',
    borderColor: '#1e293b',
  },
  darkInputText: {
    color: '#f8fafc',
  },
  darkInputFocused: {
    backgroundColor: '#151f32',
    borderColor: '#38bdf8',
  },
  darkButton: {
    backgroundColor: '#0284c7',
    shadowColor: '#0284c7',
  },
  darkAccentText: {
    color: '#38bdf8',
  },
  darkGlowOuter: {
    backgroundColor: '#0f172a',
    opacity: 0.4,
  },
  darkGlowInner: {
    backgroundColor: '#1e293b',
    opacity: 0.3,
  },
  darkConstellationLine: {
    backgroundColor: '#38bdf8',
    opacity: 0.3,
  },
  darkConstellationNode: {
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    backgroundColor: '#090d16',
  },
});
