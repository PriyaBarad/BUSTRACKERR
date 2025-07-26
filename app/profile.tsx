import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import strings from '../locales/strings';

export default function ProfileScreen() {
  const [lang, setLang] = useState<'en' | 'mr'>('en');
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const langStored = await AsyncStorage.getItem('language');
      setLang(langStored === 'mr' ? 'mr' : 'en');

      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };

    loadData();
  }, []);

  const toggleLanguage = async () => {
    const newLang = lang === 'en' ? 'mr' : 'en';
    await AsyncStorage.setItem('language', newLang);
    setLang(newLang);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header Row inside card */}
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={() => router.push('/home')}>
            <Text style={styles.backText}>← {strings[lang].home}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Info */}
        <Text style={styles.profileIcon}>👤</Text>
        <Text style={styles.nameText}>{user?.name || 'Name not available'}</Text>
        <Text style={styles.phoneText}>{user?.phone || 'Phone not available'}</Text>

        {/* Language Switcher */}
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Text>{lang === 'en' ? 'Change Language to Marathi' : 'इंग्रजीमध्ये बदला'}</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🔒 {strings[lang].logout}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    flex: 1,
    backgroundColor: '#f1f3f6',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '95%',
    maxWidth: 500,
    elevation: 4,
    alignItems: 'center',
    position: 'relative',
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#2563EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
    marginRight: 30, // space to balance the back arrow
  },
  profileIcon: {
    fontSize: 48,
    marginVertical: 10,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  langBtn: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutBtn: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
