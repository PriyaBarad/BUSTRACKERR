import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../components/ThemeContext';
import { API_BASE_URL } from '../../constants/Api';
import MenuDrawer from '../../components/MenuDrawer';
import strings from '../../locales/strings';

const { height } = Dimensions.get('window');

function getTodayDateString() {
  const today = new Date();
  return today.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function getCurrentTimeString() {
  const date = new Date();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
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

  // Date and Time selection states
  const [searchDate, setSearchDate] = useState(getTodayDateString());
  const [searchTime, setSearchTime] = useState(getCurrentTimeString());

  // Modals visibility
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);

  // Custom Hamburger Drawer and Modals inside Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Search queries for autocomplete list
  const [sourceSearch, setSourceSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');

  // User details
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);

  // Recently Searched trips
  const [recentlySearched, setRecentlySearched] = useState<{ source: string; destination: string }[]>([]);

  // Nearby Bus Stops (mock recommendations)
  const nearbyStops = [
    'Mahaeswari Chowk',
    'Shivaji Maharaj Pul',
    'Solapur Rly Stn',
    'Siddheshwar Temple',
    'Navi Peth',
    'Hotgi Road',
  ];

  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('language');
        setLang(storedLang === 'mr' ? 'mr' : 'en');

        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }

        // Load recently searched
        const rsData = await AsyncStorage.getItem('recentlySearched');
        if (rsData) {
          setRecentlySearched(JSON.parse(rsData));
        }

        const res = await fetch(`${API_BASE_URL}/api/routes/all`);
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

    fetchInitialData();
  }, []);

  // Filter destinations based on selected source
  useEffect(() => {
    if (source) {
      const destinations = routesData
        .filter((route) => route.source.trim() === source.trim())
        .map((route) => route.destination);

      const uniqueDestinations = Array.from(new Set(destinations)).sort();
      setFilteredDestinations(uniqueDestinations);
    } else {
      setFilteredDestinations([]);
    }
  }, [source, routesData]);

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handleFindBuses = async () => {
    if (!source || !destination) {
      Alert.alert(
        strings[lang].fillBoth,
        '',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (source === destination) {
      Alert.alert(
        lang === 'mr' ? 'स्रोत आणि गंतव्य वेगळे असावे' : 'Source and destination must be different',
        '',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Save search route to recently searched list
    try {
      const updatedRS = [{ source, destination }, ...recentlySearched.filter(
        item => !(item.source === source && item.destination === destination)
      )].slice(0, 4); // Limit to 4 items

      setRecentlySearched(updatedRS);
      await AsyncStorage.setItem('recentlySearched', JSON.stringify(updatedRS));
    } catch (e) {
      console.error('Error saving recent search:', e);
    }

    router.push({
      pathname: '/busResult',
      params: { source, destination, date: searchDate, time: searchTime },
    });
  };

  const handleRecentSearchClick = (item: { source: string; destination: string }) => {
    setSource(item.source);
    setDestination(item.destination);
    router.push({
      pathname: '/busResult',
      params: { source: item.source, destination: item.destination, date: searchDate, time: searchTime },
    });
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userLoggedIn');
      setDrawerOpen(false);
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Autocomplete queries filters
  const filteredSources = availableSources.filter((s) =>
    s.toLowerCase().includes(sourceSearch.toLowerCase())
  );

  const filteredDestList = filteredDestinations.filter((d) =>
    d.toLowerCase().includes(destSearch.toLowerCase())
  );

  // Date and Time Helper Options generator
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const label = i === 0 ? 'Today, ' + d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) :
        i === 1 ? 'Tomorrow, ' + d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) :
          d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
      days.push(label);
    }
    return days;
  };

  const getHoursList = () => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const getMinutesList = () => ['00', '15', '30', '45'];

  const selectCustomTime = (hours: string, minutes: string, ampm: string) => {
    setSearchTime(`${hours}:${minutes} ${ampm}`);
    setTimeModalVisible(false);
  };

  const [selectedHours, setSelectedHours] = useState('10');
  const [selectedMinutes, setSelectedMinutes] = useState('30');
  const [selectedAmpm, setSelectedAmpm] = useState('AM');

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
        <StatusBar backgroundColor={isDark ? '#090d16' : '#1058d1'} barStyle="light-content" />
        <View style={[styles.loadingContainer, isDark && styles.darkRoot]}>
          <ActivityIndicator size="large" color="#1058d1" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading application...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      <StatusBar backgroundColor={isDark ? '#090d16' : '#1058d1'} barStyle="light-content" />



      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* HEADER BAR */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={[styles.headerButton, isDark && styles.darkHeaderButton]}>
            <Ionicons name="menu" size={26} color={isDark ? '#f8fafc' : '#1e293b'} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Image source={require('../../assets/images/smt-logo.png')} style={styles.logo} />
            <Text style={[styles.headerTitle, isDark && styles.darkTitle]}>Track My Bus</Text>
          </View>

          <TouchableOpacity onPress={() => router.push('/profile')} style={[styles.headerButton, isDark && styles.darkHeaderButton]}>
            <Ionicons name="person-circle-outline" size={28} color={isDark ? '#f8fafc' : '#1e293b'} />
          </TouchableOpacity>
        </View>

        {/* PLAN YOUR JOURNEY CARD */}
        <View style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.cardTitle, isDark && styles.darkTitle]}>Plan Your Journey</Text>

          {/* Connective Line UI */}
          <View style={styles.routeContainer}>
            <View style={styles.indicatorsCol}>
              <View style={styles.indicatorOuterDot}>
                <View style={styles.indicatorInnerDot} />
              </View>
              <View style={styles.routeLine} />
              <Ionicons name="location" size={22} color="#1058d1" />
            </View>

            <View style={styles.inputsCol}>
              {/* FROM (SOURCE) STATIONS INPUT */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>From:</Text>
                <TouchableOpacity
                  style={[styles.inputField, isDark && styles.darkInput]}
                  onPress={() => setSourceModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.inputText, !source && styles.inputPlaceholder, isDark && styles.darkInputText]}>
                    {source || 'Enter Source Station'}
                  </Text>
                  <Ionicons name="bus-outline" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* TO (DESTINATION) STATIONS INPUT */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>To:</Text>
                <TouchableOpacity
                  style={[styles.inputField, isDark && styles.darkInput]}
                  onPress={() => setDestinationModalVisible(true)}
                  activeOpacity={0.7}
                  disabled={!source}
                >
                  <Text style={[
                    styles.inputText,
                    !destination && styles.inputPlaceholder,
                    !source && styles.inputDisabled,
                    isDark && styles.darkInputText
                  ]}>
                    {destination || (!source ? 'Select Source First' : 'Enter Destination Station')}
                  </Text>
                  <Ionicons name="flag-outline" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Floating SWAP Button */}
            <TouchableOpacity onPress={handleSwap} style={styles.swapButton} activeOpacity={0.8}>
              <Ionicons name="swap-vertical" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* DATE & TIME SELECTORS */}
          <Text style={[styles.subLabel, isDark && styles.darkTitle]}>Date & Time</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity onPress={() => setDateModalVisible(true)} style={[styles.dateTimePill, isDark && styles.darkInput]}>
              <Ionicons name="calendar-outline" size={18} color="#1058d1" style={styles.pillIcon} />
              <Text style={[styles.pillText, isDark && styles.darkInputText]}>{searchDate}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setTimeModalVisible(true)} style={[styles.dateTimePill, isDark && styles.darkInput]}>
              <Ionicons name="time-outline" size={18} color="#1058d1" style={styles.pillIcon} />
              <Text style={[styles.pillText, isDark && styles.darkInputText]}>{searchTime}</Text>
            </TouchableOpacity>
          </View>

          {/* SEARCH BUTTON */}
          <TouchableOpacity onPress={handleFindBuses} style={styles.searchBusesButton} activeOpacity={0.85}>
            <Text style={styles.searchBusesButtonText}>SEARCH BUSES</Text>
          </TouchableOpacity>
        </View>

        {/* RECENTLY SEARCHED SECTION */}
        {recentlySearched.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, isDark && styles.darkTitle]}>Recently Searched</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {recentlySearched.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleRecentSearchClick(item)}
                  style={[styles.capsulePill, isDark && styles.darkCapsulePill]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bus" size={16} color="#1058d1" style={styles.capsuleIcon} />
                  <Text style={[styles.capsuleText, isDark && styles.darkInputText]}>
                    {item.source} → {item.destination}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* NEARBY BUS STOPS SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, isDark && styles.darkTitle]}>Nearby Bus Stops</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {nearbyStops.map((stop, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSource(stop);
                  setDestination('');
                }}
                style={[styles.capsulePill, isDark && styles.darkCapsulePill]}
                activeOpacity={0.7}
              >
                <Ionicons name="location" size={16} color="#e53935" style={styles.capsuleIcon} />
                <Text style={[styles.capsuleText, isDark && styles.darkInputText]}>{stop}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={[styles.footerText, isDark && styles.darkText]}>Powered by MIT Vishwaprayag University</Text>
      </ScrollView>

      {/* HAMBURGER DRAWER INTEGRATION */}
      <MenuDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* SEARCH/SELECTION MODAL: SOURCE STATIONS */}
      <Modal visible={sourceModalVisible} animationType="slide" transparent>
        <View style={styles.searchModalContainer}>
          <View style={[styles.searchModalContent, isDark && styles.darkCard]}>
            <View style={styles.searchModalHeader}>
              <Text style={[styles.searchModalTitle, isDark && styles.darkTitle]}>Select Source Station</Text>
              <TouchableOpacity onPress={() => { setSourceModalVisible(false); setSourceSearch(''); }}>
                <Ionicons name="close-circle" size={28} color={isDark ? '#ef4444' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBarContainer, isDark && styles.darkInput]}>
              <Ionicons name="search" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchBarInput, isDark && styles.darkInputText]}
                placeholder="Search source station..."
                placeholderTextColor="#94a3b8"
                value={sourceSearch}
                onChangeText={setSourceSearch}
                autoFocus
              />
            </View>

            {loadingSources ? (
              <ActivityIndicator color="#1058d1" style={{ margin: 20 }} />
            ) : (
              <ScrollView style={styles.stationsList} keyboardShouldPersistTaps="always">
                {filteredSources.map((station) => (
                  <TouchableOpacity
                    key={station}
                    style={[styles.stationItem, isDark && styles.darkStationItem]}
                    onPress={() => {
                      setSource(station);
                      setDestination('');
                      setSourceModalVisible(false);
                      setSourceSearch('');
                    }}
                  >
                    <Ionicons name="location" size={18} color="#1058d1" style={{ marginRight: 12 }} />
                    <Text style={[styles.stationItemText, isDark && styles.darkInputText]}>{station}</Text>
                  </TouchableOpacity>
                ))}
                {filteredSources.length === 0 && (
                  <Text style={styles.noResultsText}>No stations found</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* SEARCH/SELECTION MODAL: DESTINATION STATIONS */}
      <Modal visible={destinationModalVisible} animationType="slide" transparent>
        <View style={styles.searchModalContainer}>
          <View style={[styles.searchModalContent, isDark && styles.darkCard]}>
            <View style={styles.searchModalHeader}>
              <Text style={[styles.searchModalTitle, isDark && styles.darkTitle]}>Select Destination</Text>
              <TouchableOpacity onPress={() => { setDestinationModalVisible(false); setDestSearch(''); }}>
                <Ionicons name="close-circle" size={28} color={isDark ? '#ef4444' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBarContainer, isDark && styles.darkInput]}>
              <Ionicons name="search" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchBarInput, isDark && styles.darkInputText]}
                placeholder="Search destination..."
                placeholderTextColor="#94a3b8"
                value={destSearch}
                onChangeText={setDestSearch}
                autoFocus
              />
            </View>

            <ScrollView style={styles.stationsList} keyboardShouldPersistTaps="always">
              {filteredDestList.map((station) => (
                <TouchableOpacity
                  key={station}
                  style={[styles.stationItem, isDark && styles.darkStationItem]}
                  onPress={() => {
                    setDestination(station);
                    setDestinationModalVisible(false);
                    setDestSearch('');
                  }}
                >
                  <Ionicons name="location" size={18} color="#e53935" style={{ marginRight: 12 }} />
                  <Text style={[styles.stationItemText, isDark && styles.darkInputText]}>{station}</Text>
                </TouchableOpacity>
              ))}
              {filteredDestList.length === 0 && (
                <Text style={styles.noResultsText}>No destinations found for source: {source}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DATE PICKER MODAL */}
      <Modal visible={dateModalVisible} animationType="slide" transparent>
        <View style={styles.modalCenteredView}>
          <View style={[styles.modalView, isDark && styles.darkCard, { width: '85%' }]}>
            <Text style={[styles.modalTitle, isDark && styles.darkTitle, { marginBottom: 16 }]}>Select Date</Text>
            <ScrollView style={{ maxHeight: 300, width: '100%' }}>
              {getNext7Days().map((dayLabel) => (
                <TouchableOpacity
                  key={dayLabel}
                  style={[
                    styles.dateOptionItem,
                    searchDate === dayLabel && styles.dateOptionItemSelected,
                    isDark && styles.darkStationItem
                  ]}
                  onPress={() => {
                    setSearchDate(dayLabel);
                    setDateModalVisible(false);
                  }}
                >
                  <Ionicons name="calendar-outline" size={18} color={searchDate === dayLabel ? '#fff' : '#1058d1'} style={{ marginRight: 12 }} />
                  <Text style={[
                    styles.dateOptionText,
                    searchDate === dayLabel && { color: '#fff', fontWeight: '700' },
                    isDark && searchDate !== dayLabel && styles.darkInputText
                  ]}>
                    {dayLabel}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButtonCancel, { width: '100%', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 16 }]}
              onPress={() => setDateModalVisible(false)}
            >
              <Text style={styles.modalButtonCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TIME PICKER MODAL */}
      <Modal visible={timeModalVisible} animationType="slide" transparent>
        <View style={styles.modalCenteredView}>
          <View style={[styles.modalView, isDark && styles.darkCard, { width: '90%' }]}>
            <Text style={[styles.modalTitle, isDark && styles.darkTitle, { marginBottom: 16 }]}>Select Departure Time</Text>

            <View style={styles.timePickerContainer}>
              {/* Hours List */}
              <View style={styles.timePickerColumn}>
                <Text style={[styles.timePickerColLabel, isDark && styles.darkTitle]}>Hour</Text>
                <ScrollView style={styles.timePickerScroll} nestedScrollEnabled>
                  {getHoursList().map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.timeNumberItem, selectedHours === h && styles.timeNumberItemSelected]}
                      onPress={() => setSelectedHours(h)}
                    >
                      <Text style={[styles.timeNumberText, selectedHours === h && { color: '#fff', fontWeight: 'bold' }, isDark && selectedHours !== h && styles.darkInputText]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Minutes List */}
              <View style={styles.timePickerColumn}>
                <Text style={[styles.timePickerColLabel, isDark && styles.darkTitle]}>Min</Text>
                <ScrollView style={styles.timePickerScroll} nestedScrollEnabled>
                  {getMinutesList().map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.timeNumberItem, selectedMinutes === m && styles.timeNumberItemSelected]}
                      onPress={() => setSelectedMinutes(m)}
                    >
                      <Text style={[styles.timeNumberText, selectedMinutes === m && { color: '#fff', fontWeight: 'bold' }, isDark && selectedMinutes !== m && styles.darkInputText]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* AM/PM */}
              <View style={[styles.timePickerColumn, { flex: 0.8 }]}>
                <Text style={[styles.timePickerColLabel, isDark && styles.darkTitle]}>Period</Text>
                <TouchableOpacity
                  style={[styles.ampmButton, selectedAmpm === 'AM' && styles.ampmButtonActive]}
                  onPress={() => setSelectedAmpm('AM')}
                >
                  <Text style={[styles.ampmButtonText, selectedAmpm === 'AM' && { color: '#fff' }]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ampmButton, selectedAmpm === 'PM' && styles.ampmButtonActive, { marginTop: 12 }]}
                  onPress={() => setSelectedAmpm('PM')}
                >
                  <Text style={[styles.ampmButtonText, selectedAmpm === 'PM' && { color: '#fff' }]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setTimeModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={() => selectCustomTime(selectedHours, selectedMinutes, selectedAmpm)}
              >
                <Text style={styles.modalButtonSubmitText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },
  darkSafeArea: {
    backgroundColor: '#090d16',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
  },
  constellationLine: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: '#1058d1',
    opacity: 0.12,
  },
  darkConstellationLine: {
    backgroundColor: '#38bdf8',
    opacity: 0.25,
  },
  constellationNode: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1058d1',
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  darkConstellationNode: {
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    backgroundColor: '#090d16',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1058d1',
    fontWeight: '600',
  },
  darkRoot: {
    backgroundColor: '#090d16',
  },
  darkText: {
    color: '#94a3b8',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 36,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  darkHeaderButton: {
    backgroundColor: '#151f32',
    shadowColor: '#000',
    shadowOpacity: 0.25,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0b2d64',
    letterSpacing: -0.2,
  },
  darkTitle: {
    color: '#f8fafc',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginTop: 12,
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  darkCard: {
    backgroundColor: '#151f32',
    shadowColor: '#000',
    shadowOpacity: 0.35,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0b2d64',
    marginBottom: 24,
  },
  routeContainer: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 20,
  },
  indicatorsCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginRight: 16,
    width: 24,
  },
  indicatorOuterDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#1058d1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1058d1',
  },
  routeLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#cee0fc',
    marginVertical: 4,
  },
  inputsCol: {
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5c6f84',
    marginBottom: 6,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  darkInput: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  inputText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  darkInputText: {
    color: '#f8fafc',
  },
  inputPlaceholder: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  inputDisabled: {
    color: '#cbd5e1',
  },
  swapButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1058d1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  subLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5c6f84',
    marginBottom: 12,
    marginTop: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateTimePill: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    height: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillIcon: {
    marginRight: 8,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  searchBusesButton: {
    backgroundColor: '#1058d1',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  searchBusesButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0b2d64',
    marginBottom: 12,
    paddingLeft: 4,
  },
  horizontalScroll: {
    paddingLeft: 4,
    paddingRight: 16,
  },
  capsulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  darkCapsulePill: {
    backgroundColor: '#151f32',
    borderColor: '#1e293b',
  },
  capsuleIcon: {
    marginRight: 8,
  },
  capsuleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#64748b',
    marginTop: 40,
    marginBottom: 10,
    fontWeight: '500',
  },

  // Drawer styles
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 13, 22, 0.5)',
    zIndex: 100,
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
    flex: 1,
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

  // Modal styles
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0b2d64',
    marginBottom: 20,
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
    width: 70,
    height: 70,
    alignSelf: 'center',
    borderRadius: 35,
  },
  aboutText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  aboutTextSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 6,
    alignSelf: 'center',
  },

  // Search Modals (Autocomplete) styles
  searchModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  searchModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: height * 0.85,
    padding: 24,
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0b2d64',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  stationsList: {
    flex: 1,
  },
  stationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  darkStationItem: {
    borderBottomColor: '#334155',
  },
  stationItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  noResultsText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 30,
    fontWeight: '500',
  },

  // Date/Time specific selection styles
  dateOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
  },
  dateOptionItemSelected: {
    backgroundColor: '#1058d1',
  },
  dateOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  timePickerContainer: {
    flexDirection: 'row',
    height: 180,
    marginBottom: 20,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerColLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
  },
  timePickerScroll: {
    width: '100%',
  },
  timeNumberItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 4,
  },
  timeNumberItemSelected: {
    backgroundColor: '#1058d1',
  },
  timeNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  ampmButton: {
    paddingVertical: 14,
    width: '80%',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ampmButtonActive: {
    backgroundColor: '#1058d1',
    borderColor: '#1058d1',
  },
  ampmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
});