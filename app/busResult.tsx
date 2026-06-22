import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_BASE_URL } from '../constants/Api';
import { useTheme } from '../components/ThemeContext';
import MenuDrawer from '../components/MenuDrawer';

interface BusResult {
  busNumber: string;
  via: string;
  source: string;
  destination: string;
  timings?: string[];
  busType?: string;
  estimatedDuration?: number;
  distance?: number;
}

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const convertTimeToMinutes = (timeStr: string): number => {
  try {
    const cleaned = timeStr.trim();
    const match = cleaned.match(/^(\d+):(\d+)\s*(AM|PM)?$/i);
    if (!match) return 0;
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3];
    
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    
    return hours * 60 + minutes;
  } catch (err) {
    console.error('Error parsing time:', timeStr, err);
    return 0;
  }
};

const getNextTiming = (timings: string[], targetTimeStr: string): string | null => {
  if (!timings || timings.length === 0) return null;
  if (!targetTimeStr) return timings[0];
  
  const targetMins = convertTimeToMinutes(targetTimeStr);
  const sortedTimings = [...timings].sort((a, b) => convertTimeToMinutes(a) - convertTimeToMinutes(b));
  
  const upcoming = sortedTimings.find(t => convertTimeToMinutes(t) >= targetMins);
  return upcoming || sortedTimings[0];
};

const calculateArrivalTime = (departureTimeStr: string, durationMinutes: number): string => {
  if (!departureTimeStr) return '';
  try {
    const cleaned = departureTimeStr.trim();
    const match = cleaned.match(/^(\d+):(\d+)\s*(AM|PM)?$/i);
    if (!match) return '';
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3];
    
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    
    let arrivalHours = Math.floor(totalMinutes / 60) % 24;
    const arrivalMinutes = totalMinutes % 60;
    
    let arrivalAmpm = '';
    if (ampm) {
      arrivalAmpm = arrivalHours >= 12 ? ' PM' : ' AM';
      arrivalHours = arrivalHours % 12;
      arrivalHours = arrivalHours ? arrivalHours : 12;
    }
    
    const arrivalMinutesStr = String(arrivalMinutes).padStart(2, '0');
    const arrivalHoursStr = String(arrivalHours).padStart(2, '0');
    
    return `${arrivalHoursStr}:${arrivalMinutesStr}${arrivalAmpm}`;
  } catch (err) {
    console.error('Error calculating arrival time:', err);
    return '';
  }
};

const sortBusesByTime = (buses: BusResult[], targetTimeStr: string): BusResult[] => {
  const targetMinutes = convertTimeToMinutes(targetTimeStr);
  
  return [...buses].sort((a, b) => {
    const aTimings = a.timings || [];
    const bTimings = b.timings || [];
    
    if (aTimings.length === 0 && bTimings.length === 0) return 0;
    if (aTimings.length === 0) return 1;
    if (bTimings.length === 0) return -1;
    
    const getBestTimingMinutes = (timings: string[]): number => {
      const minutesList = timings.map(convertTimeToMinutes).filter(m => m > 0);
      if (minutesList.length === 0) return 9999;
      
      const futureTimings = minutesList.filter(m => m >= targetMinutes);
      if (futureTimings.length > 0) {
        return Math.min(...futureTimings);
      }
      return Math.min(...minutesList);
    };
    
    return getBestTimingMinutes(aTimings) - getBestTimingMinutes(bTimings);
  });
};

export default function BusResultScreen() {
  const params = useLocalSearchParams<{ source?: string; destination?: string; date?: string; time?: string }>();
  const router = useRouter();

  const source = params?.source?.toString().trim();
  const destination = params?.destination?.toString().trim();
  const searchDate = params?.date?.toString();
  const searchTime = params?.time?.toString();

  const [rawResults, setRawResults] = useState<BusResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<BusResult[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters and Sorting modes
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening_night'>('all');
  const [sortMode, setSortMode] = useState<'time' | 'duration'>('time');

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (source && destination) {
      fetchBusData();
    } else {
      setLoading(false);
    }
  }, [source, destination]);

  // Handle local sorting and filtering of results
  useEffect(() => {
    let processed = [...rawResults];

    // 1. Time Filter
    if (timeFilter !== 'all') {
      processed = processed.filter((bus) => {
        const timings = bus.timings || [];
        if (timings.length === 0) return false;
        
        // Use the first departure time or next departure time for sorting/filter
        const refTime = getNextTiming(timings, searchTime || '06:00 AM') || timings[0];
        const mins = convertTimeToMinutes(refTime);

        if (timeFilter === 'morning') {
          return mins >= 360 && mins < 720; // 6 AM - 12 PM
        } else if (timeFilter === 'afternoon') {
          return mins >= 720 && mins < 1020; // 12 PM - 5 PM
        } else if (timeFilter === 'evening_night') {
          return mins >= 1020 || mins < 360; // 5 PM - 6 AM
        }
        return true;
      });
    }

    // 2. Sorting Mode
    if (sortMode === 'time') {
      processed = sortBusesByTime(processed, searchTime || '06:00 AM');
    } else if (sortMode === 'duration') {
      processed.sort((a, b) => (a.estimatedDuration || 0) - (b.estimatedDuration || 0));
    }

    setFilteredResults(processed);
  }, [rawResults, timeFilter, sortMode]);

  const fetchBusData = async () => {
    try {
      const response = await axios.get<BusResult[]>(
        `${API_BASE_URL}/api/routes/busroutes`,
        { params: { source, destination } }
      );
      setRawResults(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch bus data. Please try again.');
      console.error('Error fetching bus results:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBusData();
  };

  const handleTrackLive = async (busNumber: string) => {
    try {
      const selectedData = rawResults.find(
        (bus) => bus.busNumber.trim() === busNumber.trim()
      );

      if (!selectedData) {
        Alert.alert('Error', 'Bus details not found.');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/routes/device-from-bus`,
        { params: { busNumber: selectedData.busNumber.trim() } }
      );

      const { deviceId } = response.data;

      if (!deviceId) {
        Alert.alert('Live Status Unavailable', 'Device is offline or not installed on this bus.');
        return;
      }

      router.push({
        pathname: '/verticalMap',
        params: {
          deviceId,
          busNumber: selectedData.busNumber,
          source: selectedData.source,
          via: selectedData.via,
          destination: selectedData.destination,
        },
      });
    } catch (error) {
      console.error('Failed to fetch device ID:', error);
      Alert.alert('Error', 'Unable to fetch live status at this moment.');
    }
  };

  const renderItem = ({ item }: { item: BusResult }) => {
    const intermediateStops = item.via ? item.via.split(',').map((s) => s.trim()) : [];
    const targetNextTime = searchTime ? getNextTiming(item.timings || [], searchTime) : (item.timings?.[0] || null);

    return (
      <View style={[styles.card, isDark && styles.darkCard, isTablet && { padding: 24 }]}>
        {/* Card Header (Bus Info) */}
        <View style={styles.busHeader}>
          <View style={styles.busNumberRow}>
            <View style={[styles.busIconCircle, isDark && styles.darkIconCircle]}>
              <Ionicons name="bus" size={18} color={isDark ? '#38bdf8' : '#1058d1'} />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.busNumber, isDark && styles.darkInputText]}>{item.busNumber}</Text>
              <Text style={styles.busType}>{item.busType || 'Ordinary'}</Text>
            </View>
          </View>

          {/* Time Estimate Badge */}
          {item.estimatedDuration ? (
            <View style={[styles.durationBadge, isDark && styles.darkDurationBadge]}>
              <Ionicons name="time-outline" size={14} color={isDark ? '#60a5fa' : '#1058d1'} style={{ marginRight: 4 }} />
              <Text style={[styles.durationText, isDark && styles.darkInputText]}>{item.estimatedDuration} mins</Text>
            </View>
          ) : null}
        </View>

        {/* Intermediate stops list as subtext */}
        {intermediateStops.length > 0 ? (
          <Text style={[styles.viaText, isDark && styles.darkViaText]}>
            Via: {intermediateStops.join(', ')}
          </Text>
        ) : null}

        {/* Journey Schedule Timeline Panel (Departure/Duration/Arrival) */}
        {targetNextTime ? (
          <View style={[styles.timelinePanel, isDark && styles.darkTimelinePanel]}>
            <View style={styles.timelineCol}>
              <Text style={styles.timelineLabel}>DEPARTURE</Text>
              <Text style={[styles.timelineValue, isDark && styles.darkInputText]}>{targetNextTime}</Text>
              <Text style={styles.timelineStation} numberOfLines={1}>{item.source}</Text>
            </View>

            <View style={styles.timelineMiddleCol}>
              <Text style={styles.timelineDurationText}>{item.estimatedDuration || 0} mins</Text>
              <View style={styles.timelineLineRow}>
                <View style={[styles.timelineDot, { backgroundColor: isDark ? '#38bdf8' : '#1058d1' }]} />
                <View style={[styles.timelineDottedConnector, isDark && styles.darkTimelineDottedConnector]} />
                <Ionicons name="chevron-forward" size={14} color={isDark ? '#38bdf8' : '#1058d1'} />
              </View>
              <Text style={styles.timelineDistanceText}>{item.distance || 0} km</Text>
            </View>

            <View style={styles.timelineCol}>
              <Text style={styles.timelineLabel}>ARRIVAL</Text>
              <Text style={[styles.timelineValue, isDark && styles.darkInputText]}>
                {calculateArrivalTime(targetNextTime, item.estimatedDuration || 0)}
              </Text>
              <Text style={styles.timelineStation} numberOfLines={1}>{item.destination}</Text>
            </View>
          </View>
        ) : null}

        {/* Timings Pills Scroll */}
        {item.timings?.length ? (
          <View style={styles.timingsWrapper}>
            <Text style={[styles.timingsTitle, isDark && styles.darkInputText]}>Departures:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timingsScroll}>
              {item.timings.map((time, idx) => {
                const isNext = time === targetNextTime;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.timingChip,
                      isNext && styles.timingChipNext,
                      isDark && styles.darkTimingChip,
                      isDark && isNext && styles.darkTimingChipNext,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timingText,
                        isNext && styles.timingTextNext,
                        isDark && styles.darkTimingText,
                        isDark && isNext && { color: '#ffffff' }
                      ]}
                    >
                      {time}
                    </Text>
                    {isNext && <Text style={styles.nextBadgeText}>Next</Text>}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.trackButton, isDark && styles.darkTrackButton]}
          onPress={() => handleTrackLive(item.busNumber)}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.trackButtonText}>Live Track Route</Text>
        </TouchableOpacity>
      </View>
    );
  };

    return (
      <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
        <View style={[styles.topHeader, isDark && styles.darkTopHeader]}>
          <TouchableOpacity onPress={() => router.push('/home')} style={[styles.headerButton, isDark && styles.darkHeaderButton]}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#1e293b'} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Image source={require('../assets/images/smt-logo.png')} style={styles.topLogo} />
            <Text style={[styles.topAppName, isDark && styles.darkInputText]}>Track My Bus</Text>
          </View>

          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={[styles.headerButton, isDark && styles.darkHeaderButton]}>
            <Ionicons name="menu" size={24} color={isDark ? '#f8fafc' : '#1e293b'} />
          </TouchableOpacity>
        </View>

        <View style={[styles.container, isDark && styles.darkRoot]}>
          <MenuDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
        {/* Interactive Top Filters and Sorting Bar */}
        <View style={styles.filtersContainer}>
          <Text style={[styles.filterSectionLabel, isDark && styles.darkInputText]}>Departure Period:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptionsScroll}>
            <TouchableOpacity
              style={[styles.filterChip, timeFilter === 'all' && styles.filterChipActive]}
              onPress={() => setTimeFilter('all')}
            >
              <Text style={[styles.filterChipText, timeFilter === 'all' && styles.filterChipTextActive]}>All day</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, timeFilter === 'morning' && styles.filterChipActive]}
              onPress={() => setTimeFilter('morning')}
            >
              <Ionicons name="sunny-outline" size={14} color={timeFilter === 'morning' ? '#fff' : '#64748b'} style={{ marginRight: 4 }} />
              <Text style={[styles.filterChipText, timeFilter === 'morning' && styles.filterChipTextActive]}>Morning</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, timeFilter === 'afternoon' && styles.filterChipActive]}
              onPress={() => setTimeFilter('afternoon')}
            >
              <Ionicons name="partly-sunny-outline" size={14} color={timeFilter === 'afternoon' ? '#fff' : '#64748b'} style={{ marginRight: 4 }} />
              <Text style={[styles.filterChipText, timeFilter === 'afternoon' && styles.filterChipTextActive]}>Afternoon</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, timeFilter === 'evening_night' && styles.filterChipActive]}
              onPress={() => setTimeFilter('evening_night')}
            >
              <Ionicons name="moon-outline" size={14} color={timeFilter === 'evening_night' ? '#fff' : '#64748b'} style={{ marginRight: 4 }} />
              <Text style={[styles.filterChipText, timeFilter === 'evening_night' && styles.filterChipTextActive]}>Evening/Night</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.sortingRow}>
            <Text style={[styles.filterSectionLabel, isDark && styles.darkInputText, { marginBottom: 0 }]}>Sort By:</Text>
            <View style={styles.sortToggleContainer}>
              <TouchableOpacity
                style={[styles.sortButton, sortMode === 'time' && styles.sortButtonActive]}
                onPress={() => setSortMode('time')}
              >
                <Text style={[styles.sortButtonText, sortMode === 'time' && styles.sortButtonTextActive]}>Timings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortButton, sortMode === 'duration' && styles.sortButtonActive]}
                onPress={() => setSortMode('duration')}
              >
                <Text style={[styles.sortButtonText, sortMode === 'duration' && styles.sortButtonTextActive]}>Duration</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <FlatList
          data={loading ? [] : filteredResults}
          keyExtractor={(item) => item.busNumber}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.headerContainer}>
                <Text style={[styles.title, isDark && styles.darkInputText]}>Available Buses</Text>
                <Text style={styles.subtitle}>
                  {source} → {destination}
                  {searchDate || searchTime ? `\n${searchDate || ''} ${searchTime ? `at ${searchTime}` : ''}` : ''}
                </Text>
              </View>

              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1058d1" />
                  <Text style={[styles.loadingText, isDark && styles.darkInputText]}>Finding matching buses...</Text>
                </View>
              )}

              {!loading && filteredResults.length === 0 && (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="bus-outline" size={48} color="#1058d1" />
                  </View>
                  <Text style={styles.emptyText}>No buses match your filter criteria</Text>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRefresh}
                  >
                    <Ionicons name="refresh" size={20} color="#FFF" />
                    <Text style={styles.refreshText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!loading && filteredResults.length > 0 && (
                <Text style={styles.resultsCount}>{filteredResults.length} buses found</Text>
              )}
            </>
          }
          ListFooterComponent={
            <Text style={[styles.footerText, isDark && styles.darkText]}>Powered by MIT Vishwaprayag University</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    opacity: 0.08,
  },
  darkConstellationLine: {
    backgroundColor: '#38bdf8',
    opacity: 0.18,
  },
  constellationNode: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1058d1',
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  darkConstellationNode: {
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    backgroundColor: '#090d16',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 2,
  },
  darkTopHeader: {
    backgroundColor: '#090d16',
    borderBottomColor: '#1e293b',
  },
  topLogo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 8,
  },
  topAppName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0b2d64',
    letterSpacing: 0.5,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkHeaderButton: {
    backgroundColor: '#1e293b',
  },
  container: {
    flex: 1,
    backgroundColor: '#faf8f5',
    zIndex: 1,
  },
  darkRoot: {
    backgroundColor: '#090d16',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 5,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5c6f84',
    marginBottom: 8,
  },
  filterOptionsScroll: {
    paddingBottom: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#1058d1',
    borderColor: '#1058d1',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  sortingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  sortToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    padding: 3,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  sortButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  sortButtonTextActive: {
    color: '#1058d1',
    fontWeight: '700',
  },
  viaText: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 12,
    marginTop: -4,
    paddingHorizontal: 2,
  },
  darkViaText: {
    color: '#94a3b8',
  },
  headerContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0b2d64',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14.5,
    color: '#5c6f84',
    fontWeight: '500',
    lineHeight: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#1058d1',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    backgroundColor: '#f1f5f9',
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1058d1',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
    marginTop: 20,
  },
  refreshText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  resultsCount: {
    fontSize: 14,
    color: '#5c6f84',
    marginBottom: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  darkCard: {
    backgroundColor: '#151f32',
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOpacity: 0.25,
  },
  busHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  busNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkIconCircle: {
    backgroundColor: '#1e293b',
  },
  busNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0b2d64',
  },
  busType: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  darkDurationBadge: {
    backgroundColor: '#1e293b',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1058d1',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  stepperStop: {
    flex: 1,
    alignItems: 'center',
  },
  stepperDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 6,
  },
  stepperText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
    width: '100%',
  },
  stepperLine: {
    width: 24,
    height: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginTop: -16,
  },
  darkStepperLine: {
    backgroundColor: '#334155',
  },
  timingsWrapper: {
    marginBottom: 18,
  },
  timingsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5c6f84',
    marginBottom: 8,
  },
  timingsScroll: {
    flexDirection: 'row',
  },
  timingChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  darkTimingChip: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  timingChipNext: {
    backgroundColor: '#e8f5e9',
    borderColor: '#a5d6a7',
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkTimingChipNext: {
    backgroundColor: '#1b5e20',
    borderColor: '#2e7d32',
  },
  timingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  darkTimingText: {
    color: '#cbd5e1',
  },
  timingTextNext: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  nextBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 6,
  },
  trackButton: {
    backgroundColor: '#1058d1',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#1058d1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  darkTrackButton: {
    backgroundColor: '#38bdf8',
    shadowColor: '#38bdf8',
  },
  trackButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#64748b',
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '500',
  },
  darkText: {
    color: '#94a3b8',
  },
  darkInputText: {
    color: '#f8fafc',
  },
  timelinePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 14,
  },
  darkTimelinePanel: {},
  timelineCol: {
    flex: 1,
    alignItems: 'center',
  },
  timelineLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timelineValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0b2d64',
    marginBottom: 4,
  },
  timelineStation: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    width: '100%',
  },
  timelineMiddleCol: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  timelineDurationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1058d1',
    marginBottom: 4,
  },
  timelineLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineDottedConnector: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#1058d1',
    borderStyle: 'dashed',
    marginHorizontal: 4,
  },
  darkTimelineDottedConnector: {
    borderColor: '#38bdf8',
  },
  timelineDistanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
  },
});