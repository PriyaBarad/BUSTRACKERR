import React, { useEffect, useState, useRef } from 'react';
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
  Image,
  Animated
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import strings from '../locales/strings';
import { useTheme } from '../components/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../constants/Api';

export const options = {
  headerShown: false,
};

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

export default function LoginScreen() {
  const [lang, setLang] = useState<'en' | 'mr'>('en');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const router = useRouter();

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [secureNewPassword, setSecureNewPassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);

  const [isForgotPhoneFocused, setIsForgotPhoneFocused] = useState(false);
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
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

  const toggleLanguage = async () => {
    const newLang = lang === 'en' ? 'mr' : 'en';
    setLang(newLang);
    await AsyncStorage.setItem('language', newLang);
  };

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      showAlert(
        lang === 'mr' ? 'कृपया सर्व माहिती भरा' : 'Please fill in all fields',
        '',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      const API_URL = `${API_BASE_URL}/api/users/login`;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await Promise.all([
          AsyncStorage.setItem('user', JSON.stringify(data.user)),
          AsyncStorage.setItem('userLoggedIn', 'true'),
        ]);
        router.replace('./home');
      } else {
        const isUserNotRegistered = data?.message === 'Invalid phone number or password' || data?.message === 'Invalid credentials';
        showAlert(
          isUserNotRegistered
            ? lang === 'mr' ? 'वापरकर्ता नोंदणीकृत नाही' : 'User not registered'
            : lang === 'mr' ? 'लॉगिन अयशस्वी' : 'Login Failed',
          data?.message || (lang === 'mr' ? 'कृपया माहिती तपासा' : 'Please check your credentials'),
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('❌ Login Error:', error);
      showAlert(
        lang === 'mr' ? 'सर्व्हर त्रुटी' : 'Server Error',
        lang === 'mr' ? 'नेटवर्क तपासा' : 'Please check your network',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async () => {
    if (!forgotPhone || !newPassword || !confirmPassword) {
      showAlert(
        lang === 'mr' ? 'कृपया सर्व माहिती भरा' : 'Please fill in all fields',
        '',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert(
        lang === 'mr' ? 'पासवर्ड जुळत नाही' : 'Passwords do not match',
        '',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setIsResetting(true);
    try {
      const API_URL = `${API_BASE_URL}/api/users/forgot-password`;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert(
          lang === 'mr' ? 'यशस्वी' : 'Success',
          lang === 'mr' ? 'पासवर्ड यशस्वीरित्या बदलला आहे!' : 'Password reset successfully!',
          [{
            text: 'OK',
            onPress: () => {
              setShowForgotPassword(false);
              setForgotPhone('');
              setNewPassword('');
              setConfirmPassword('');
            }
          }]
        );
      } else {
        showAlert(
          lang === 'mr' ? 'त्रुटी' : 'Error',
          data?.message || (lang === 'mr' ? 'पासवर्ड बदलण्यात अडचण आली' : 'Failed to reset password'),
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Forgot Password Error:', error);
      showAlert(
        lang === 'mr' ? 'सर्व्हर त्रुटी' : 'Server Error',
        lang === 'mr' ? 'नेटवर्क तपासा' : 'Please check your network',
        [{ text: 'OK' }]
      );
    } finally {
      setIsResetting(false);
    }
  };

  if (checkingLogin) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.darkRoot]}>
        <ActivityIndicator size="large" color={isDark ? '#38bdf8' : '#1d4ed8'} />
        <Text style={[styles.loadingText, isDark && styles.darkText]}>
          {lang === 'mr' ? 'लोड करत आहे...' : 'Loading...'}
        </Text>
      </View>
    );
  }

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
              onPress={() => {
                if (showForgotPassword) {
                  setShowForgotPassword(false);
                } else {
                  router.replace('/(tabs)');
                }
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="chevron-left" size={28} color={isDark ? '#f8fafc' : '#0f172a'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langTogglePill, isDark && styles.darkHeaderButton]}
              onPress={toggleLanguage}
              activeOpacity={0.8}
            >
              <MaterialIcons name="translate" size={16} color={isDark ? '#38bdf8' : '#1d4ed8'} style={{ marginRight: 6 }} />
              <Text style={[styles.langToggleText, isDark && styles.darkAccentText]}>
                {lang === 'en' ? 'मराठी' : 'English'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Container Wrapper */}
          <View style={styles.container}>
            {/* Logo and Brand Header */}
            <View style={styles.logoRow}>
              <Image
                source={require('../assets/images/smt-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.titleContainer}>
                <Text style={[styles.title, isDark && styles.darkTitle]}>
                  {showForgotPassword
                    ? (lang === 'mr' ? 'रिसेट पासवर्ड' : 'Reset Password')
                    : 'Track My Bus'}
                </Text>
              </View>
            </View>

            <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
              {showForgotPassword
                ? (lang === 'mr' ? 'पासवर्ड बदलण्यासाठी खालील माहिती भरा' : 'Enter your details to reset password')
                : (lang === 'mr' ? 'तुमची बस कधीही ट्रॅक करा!' : 'Track your ride live, anytime!')}
            </Text>

            {!showForgotPassword ? (
              // Login Form
              <View style={styles.formContainer}>
                {/* Phone Input */}
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

                {/* Sign In Button */}
                <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%', marginTop: 16 }}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      isDark && styles.darkButton,
                      isLoading && styles.buttonDisabled
                    ]}
                    onPress={handleLogin}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {strings[lang].signIn}
                      </Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Links Row */}
                <View style={styles.linksRow}>
                  <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() => setShowForgotPassword(true)}
                  >
                    <Text style={[styles.forgotPasswordText, isDark && styles.darkAccentText]}>
                      {lang === 'mr' ? 'पासवर्ड विसरलात?' : 'Forgot password?'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.footerRight}>
                    <Text style={[styles.footerRightText, isDark && styles.darkSubtitle]}>
                      {lang === 'mr' ? 'खाते नाहीये?' : "Don't have an account?"}
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/register')}>
                      <Text style={[styles.footerRightLink, isDark && styles.darkAccentText]}>
                        {lang === 'mr' ? 'खाते तयार करा' : 'Create one'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              // Forgot Password Form
              <View style={styles.formContainer}>
                {/* Phone Input */}
                <View
                  style={[
                    styles.inputContainer,
                    isDark && styles.darkInputContainer,
                    isForgotPhoneFocused && styles.inputFocused,
                    isForgotPhoneFocused && isDark && styles.darkInputFocused
                  ]}
                >
                  <MaterialIcons
                    name="phone"
                    size={22}
                    color={isForgotPhoneFocused ? (isDark ? '#38bdf8' : '#1058d1') : (isDark ? '#64748b' : '#7a8b9e')}
                    style={styles.inputIcon}
                  />
                  <View style={styles.inputBody}>
                    <Text style={styles.inputLabel}>{strings[lang].phoneNumber}</Text>
                    <TextInput
                      style={[styles.input, isDark && styles.darkInputText]}
                      placeholder="+91 9876543210"
                      placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                      keyboardType="phone-pad"
                      value={forgotPhone}
                      onChangeText={setForgotPhone}
                      autoCapitalize="none"
                      onFocus={() => setIsForgotPhoneFocused(true)}
                      onBlur={() => setIsForgotPhoneFocused(false)}
                    />
                  </View>
                </View>

                {/* New Password Input */}
                <View
                  style={[
                    styles.inputContainer,
                    isDark && styles.darkInputContainer,
                    isNewPasswordFocused && styles.inputFocused,
                    isNewPasswordFocused && isDark && styles.darkInputFocused
                  ]}
                >
                  <MaterialIcons
                    name="lock-outline"
                    size={22}
                    color={isNewPasswordFocused ? (isDark ? '#38bdf8' : '#1058d1') : (isDark ? '#64748b' : '#7a8b9e')}
                    style={styles.inputIcon}
                  />
                  <View style={styles.inputBody}>
                    <Text style={styles.inputLabel}>{lang === 'mr' ? 'नवीन पासवर्ड' : 'New Password'}</Text>
                    <TextInput
                      style={[styles.input, isDark && styles.darkInputText]}
                      placeholder="••••••••"
                      placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                      secureTextEntry={secureNewPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      autoCapitalize="none"
                      onFocus={() => setIsNewPasswordFocused(true)}
                      onBlur={() => setIsNewPasswordFocused(false)}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setSecureNewPassword(!secureNewPassword)}
                    style={styles.eyeIcon}
                  >
                    <MaterialIcons
                      name={secureNewPassword ? 'visibility-off' : 'visibility'}
                      size={22}
                      color={isNewPasswordFocused ? (isDark ? '#38bdf8' : '#1058d1') : (isDark ? '#64748b' : '#7a8b9e')}
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm New Password Input */}
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
                    <Text style={styles.inputLabel}>{lang === 'mr' ? 'पासवर्डची खात्री करा' : 'Confirm Password'}</Text>
                    <TextInput
                      style={[styles.input, isDark && styles.darkInputText]}
                      placeholder="••••••••"
                      placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                      secureTextEntry={secureConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      autoCapitalize="none"
                      onFocus={() => setIsConfirmPasswordFocused(true)}
                      onBlur={() => setIsConfirmPasswordFocused(false)}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <MaterialIcons
                      name={secureConfirmPassword ? 'visibility-off' : 'visibility'}
                      size={22}
                      color={isConfirmPasswordFocused ? (isDark ? '#38bdf8' : '#1058d1') : (isDark ? '#64748b' : '#7a8b9e')}
                    />
                  </TouchableOpacity>
                </View>

                {/* Submit Reset Button */}
                <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%', marginTop: 16 }}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      isDark && styles.darkButton,
                      isResetting && styles.buttonDisabled
                    ]}
                    onPress={handleForgotPasswordSubmit}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isResetting}
                    activeOpacity={0.85}
                  >
                    {isResetting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {lang === 'mr' ? 'पासवर्ड बदला' : 'Reset Password'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Back to Login Link */}
                <TouchableOpacity
                  style={styles.backToLogin}
                  onPress={() => setShowForgotPassword(false)}
                >
                  <Text style={[styles.forgotPasswordText, isDark && styles.darkAccentText]}>
                    {lang === 'mr' ? 'लॉगिनवर परत जा' : 'Back to login'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf8f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1058d1',
    fontWeight: '500',
  },
  container: {
    width: width > 500 ? 440 : '100%',
    alignSelf: 'center',
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
  backToLogin: {
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 4,
  },
  footerRight: {
    alignItems: 'flex-end',
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
    marginTop: 2,
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