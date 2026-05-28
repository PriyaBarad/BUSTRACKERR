import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import strings from '../../locales/strings';

const { width } = Dimensions.get('window');

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
  const [routesData, setRoutesData] = useState<{ source: string; destination: string }[]>([]);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSources, setLoadingSources] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchRoutesAndLanguage = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('language');
        setLang(storedLang === 'mr' ? 'mr' : 'en');

        const res = await fetch('http://10.16.129.6:5000/api/routes/all');
        const data: { source: string; destination: string }[] = await res.json();

        setRoutesData(data);

        const sources = Array.from(new Set(data.map((r) => r.source))).sort();
        setAvailableSources(sources);
        setLoadingSources(false);
      } catch (err) {
        console.error('❌ Error fetching routes:', err);
        setAvailableSources([]);
        setRoutesData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutesAndLanguage();
  }, []);

  useEffect(() => {
    if (source) {
      const destinations = routesData
        .filter((route) => route.source === source)
        .map((route) => route.destination);

      const uniqueDestinations = Array.from(new Set(destinations)).sort();
      setFilteredDestinations(uniqueDestinations);
      setDestination('');
    } else {
      setFilteredDestinations([]);
      setDestination('');
    }
  }, [source, routesData]);

  const handleFindBuses = () => {
    if (!source || !destination || source === destination) {
      Alert.alert(
        strings[lang].fillBoth,
        '',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    router.push({
      pathname: '/busResult',
      params: { source, destination },
    });
  };

  const goToProfile = () => {
    router.push('/profile');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#1a73e8" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#1a73e8" barStyle="light-content" />

      <View style={styles.container}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={goToProfile}
            activeOpacity={0.7}
          >
            <MaterialIcons name="account-circle" size={28} color="#1a73e8" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            {/* Logo centered above title */}
            <Image
              source={require('../../assets/images/smt-logo.png')}
              style={styles.centerLogo}
              resizeMode="cover"
            />

            {/* Title in the center */}
            <Text style={styles.title}>{strings[lang].appTitle}</Text>

            <Text style={styles.subtitle}>{strings[lang].corporation}</Text>
            <View style={styles.dateContainer}>
              <MaterialIcons name="calendar-today" size={16} color="#1a73e8" />
              <Text style={styles.date}>{getTodayDate()}</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="search" size={22} color="#1a73e8" /> {strings[lang].findBus}
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <MaterialIcons name="location-on" size={18} color="#5f6368" />
                <Text style={styles.label}>{strings[lang].source}</Text>
              </View>
              {loadingSources ? (
                <View style={styles.loadingPicker}>
                  <ActivityIndicator color="#1a73e8" />
                </View>
              ) : (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={source}
                    onValueChange={(value) => setSource(value)}
                    style={styles.picker}
                    dropdownIconColor="#5f6368"
                  >
                    <Picker.Item
                      label={strings[lang].selectSource}
                      value=""
                      style={styles.placeholderItem}
                    />
                    {availableSources.map((src) => (
                      <Picker.Item key={src} label={src} value={src} />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <MaterialIcons name="location-off" size={18} color="#5f6368" />
                <Text style={styles.label}>{strings[lang].destination}</Text>
              </View>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={destination}
                  onValueChange={(value) => setDestination(value)}
                  style={styles.picker}
                  enabled={filteredDestinations.length > 0}
                  dropdownIconColor="#5f6368"
                >
                  <Picker.Item
                    label={
                      filteredDestinations.length === 0
                        ? strings[lang].selectSource
                        : strings[lang].selectDestination
                    }
                    value=""
                    style={styles.placeholderItem}
                  />
                  {filteredDestinations.map((dst) => (
                    <Picker.Item key={dst} label={dst} value={dst} />
                  ))}
                </Picker>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.findButton, (!source || !destination) && styles.disabledButton]}
              onPress={handleFindBuses}
              disabled={!source || !destination}
              activeOpacity={0.7}
            >
              <Text style={styles.findButtonText}>
                <MaterialIcons name="directions-bus" size={20} color="#fff" /> {strings[lang].findBuses}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>Powered by MIT Vishwaprayag University</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a73e8',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    // paddingTop: 10,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,

  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    width: width > 500 ? 450 : '90%',
    position: 'relative',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    fontSize: 24,
    height: 40,
    width: 40,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  centerLogo: {
    width: 150,
    height: 150,
    borderRadius: 40,
    marginBottom: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },

  date: {
    fontSize: 13,
    color: '#1a73e8',
    fontWeight: '500',
    marginLeft: 6,
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 20,
    textAlign: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: '#3c4043',
    fontWeight: '500',
    marginLeft: 6,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#202124',
    backgroundColor: '#fff',
  },
  placeholderItem: {
    color: '#9aa0a6',
  },
  findButton: {
    backgroundColor: '#1a73e8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#1a73e8',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ab4e0',
  },
  findButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  profileButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  footer: {
    fontSize: 12,
    color: '#5f6368',
    marginTop: 'auto',
    marginBottom: 16,
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
    color: '#1a73e8',
  },
  loadingPicker: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
  },
});