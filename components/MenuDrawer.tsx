import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Platform,
  Modal,
  KeyboardAvoidingView,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './ThemeContext';
import { API_BASE_URL } from '../constants/Api';
import strings from '../locales/strings';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const { height: windowHeight } = Dimensions.get('window');

export default function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [lang, setLang] = useState<'en' | 'mr'>('en');
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);
  
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const drawerAnimation = useRef(new Animated.Value(-280)).current;

  useEffect(() => {
    const loadUserData = async () => {
      const storedLang = await AsyncStorage.getItem('language');
      setLang(storedLang === 'mr' ? 'mr' : 'en');
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    
    if (isOpen) {
      loadUserData();
      Animated.timing(drawerAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(drawerAnimation, {
        toValue: -280,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userLoggedIn');
      onClose();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleChangePasswordSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert(lang === 'mr' ? 'कृपया सर्व माहिती भरा' : 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(lang === 'mr' ? 'पासवर्ड जुळत नाहीत' : 'Passwords do not match');
      return;
    }
    if (!user || !user.phone) {
      Alert.alert(lang === 'mr' ? 'वापरकर्ता तपशील आढळले नाहीत' : 'User details not found');
      return;
    }
    setPasswordLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, newPassword }),
      });
      if (response.ok) {
        Alert.alert(
          lang === 'mr' ? 'पासवर्ड यशस्वीरित्या बदलला' : 'Password changed successfully',
          '',
          [{
            text: 'OK', onPress: () => {
              setChangePasswordModalVisible(false);
              setNewPassword('');
              setConfirmPassword('');
              onClose();
            }
          }]
        );
      } else {
        const data = await response.json();
        Alert.alert(lang === 'mr' ? 'अयशस्वी' : 'Failed', data.message || 'Error occurred');
      }
    } catch (err) {
      console.error(err);
      Alert.alert(lang === 'mr' ? 'सर्व्हर त्रुटी' : 'Server error');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <View style={styles.drawerOverlay}>
        <TouchableOpacity style={styles.drawerDismiss} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.drawerContent, isDark && styles.darkDrawer, { left: drawerAnimation }]}>
          <View style={{ flex: 1 }}>
            {/* Drawer Header */}
            <View style={[styles.drawerHeader, isDark && styles.darkDrawerHeader]}>
              <Image source={require('../assets/images/smt-logo.png')} style={styles.drawerLogo} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.drawerLogoText, isDark && styles.darkText]}>SMT Bus Tracker</Text>
                <Text style={styles.drawerUserText}>{user?.name || 'Welcome'}</Text>
              </View>
            </View>

            {/* Drawer Links */}
            <View style={styles.drawerLinks}>
              <TouchableOpacity style={styles.drawerLinkItem} onPress={() => { onClose(); router.push('/home'); }}>
                <Ionicons name="home-outline" size={22} color={isDark ? '#60a5fa' : '#1058d1'} style={styles.drawerLinkIcon} />
                <Text style={[styles.drawerLinkText, isDark && styles.darkInputText]}>Home Page</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerLinkItem} onPress={() => { onClose(); router.push('/profile'); }}>
                <Ionicons name="person-outline" size={22} color={isDark ? '#60a5fa' : '#1058d1'} style={styles.drawerLinkIcon} />
                <Text style={[styles.drawerLinkText, isDark && styles.darkInputText]}>My Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerLinkItem} onPress={() => { setChangePasswordModalVisible(true); }}>
                <Ionicons name="lock-closed-outline" size={22} color={isDark ? '#60a5fa' : '#1058d1'} style={styles.drawerLinkIcon} />
                <Text style={[styles.drawerLinkText, isDark && styles.darkInputText]}>Change Password</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerLinkItem} onPress={() => { setAboutModalVisible(true); }}>
                <Ionicons name="information-circle-outline" size={22} color={isDark ? '#60a5fa' : '#1058d1'} style={styles.drawerLinkIcon} />
                <Text style={[styles.drawerLinkText, isDark && styles.darkInputText]}>About SMC Bus</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Drawer Logout */}
          <TouchableOpacity style={styles.drawerLogout} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#ff3b30" style={styles.drawerLinkIcon} />
            <Text style={styles.drawerLogoutText}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* CHANGE PASSWORD MODAL */}
      <Modal visible={changePasswordModalVisible} animationType="slide" transparent onRequestClose={() => setChangePasswordModalVisible(false)}>
        <View style={styles.modalCenteredView}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalViewContainer}>
            <View style={[styles.modalView, isDark && styles.darkCard]}>
              <Text style={[styles.modalTitle, isDark && styles.darkTitle]}>Change Password</Text>

              <Text style={[styles.modalLabel, isDark && styles.darkTitle]}>New Password</Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.darkInput]}
                secureTextEntry
                placeholder="Enter new password"
                placeholderTextColor="#94a3b8"
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={[styles.modalLabel, isDark && styles.darkTitle]}>Confirm New Password</Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.darkInput]}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setChangePasswordModalVisible(false)}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSubmit]}
                  onPress={handleChangePasswordSubmit}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalButtonSubmitText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ABOUT MODAL */}
      <Modal visible={aboutModalVisible} animationType="fade" transparent onRequestClose={() => setAboutModalVisible(false)}>
        <View style={styles.modalCenteredView}>
          <View style={[styles.modalView, isDark && styles.darkCard, { width: '85%', alignItems: 'center' }]}>
            <Image source={require('../assets/images/smt-logo.png')} style={styles.aboutLogo} />
            <Text style={[styles.modalTitle, isDark && styles.darkTitle, { marginTop: 12, marginBottom: 8, textAlign: 'center' }]}>SMC City Bus Tracker</Text>
            <Text style={[styles.aboutText, isDark && styles.darkText]}>
              Solapur Municipal Corporation City Bus service (SMT) is proud to provide smart live GPS bus tracking.
            </Text>
            <Text style={[styles.aboutTextSubtitle, isDark && styles.darkText]}>
              App Version: 1.0.0{'\n'}
              Powered by: MIT Vishwaprayag University
            </Text>

            <TouchableOpacity
              style={[styles.modalButtonSubmit, { width: '100%', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 20 }]}
              onPress={() => setAboutModalVisible(false)}
            >
              <Text style={styles.modalButtonSubmitText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 13, 22, 0.5)',
    zIndex: 9999,
    flexDirection: 'row',
  },
  drawerDismiss: {
    flex: 1,
  },
  drawerContent: {
    width: 280,
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    paddingTop: Platform.OS === 'ios' ? 64 : 40,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  darkDrawer: {
    backgroundColor: '#151f32',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 20,
    marginBottom: 20,
  },
  darkDrawerHeader: {
    borderBottomColor: '#1e293b',
  },
  drawerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  drawerLogoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0b2d64',
  },
  drawerUserText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  drawerLinks: {
    marginTop: 10,
  },
  drawerLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  drawerLinkIcon: {
    marginRight: 14,
    width: 24,
  },
  drawerLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  drawerLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  drawerLogoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ff3b30',
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10000,
  },
  modalViewContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalView: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  darkCard: {
    backgroundColor: '#151f32',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0b2d64',
    marginBottom: 20,
  },
  darkTitle: {
    color: '#f8fafc',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5c6f84',
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  darkInput: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    color: '#f8fafc',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
  modalButton: {
    flex: 0.48,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalButtonCancelText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '700',
  },
  modalButtonSubmit: {
    backgroundColor: '#1058d1',
  },
  modalButtonSubmitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  aboutLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  aboutText: {
    fontSize: 14.5,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    fontWeight: '500',
  },
  aboutTextSubtitle: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
    fontWeight: '600',
  },
  darkText: {
    color: '#f8fafc',
  },
  darkInputText: {
    color: '#cbd5e1',
  },
});
