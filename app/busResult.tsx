import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';

interface BusResult {
  busNumber: string;
  via: string;
  source: string;
  destination: string;
  timings?: string[];
}

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

const BusResultScreen = () => {
  const params = useLocalSearchParams<{ source?: string; destination?: string }>();
  const router = useRouter();

  const source = params?.source?.toString().trim();
  const destination = params?.destination?.toString().trim();

  const [results, setResults] = useState<BusResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (source && destination) {
      fetchBusData();
    } else {
      setLoading(false);
    }
  }, [source, destination]);

  const fetchBusData = async () => {
    try {
      const response = await axios.get<BusResult[]>(
        'http://10.34.28.52:5000/api/routes/busroutes',
        { params: { source, destination } }
      );
      setResults(response.data);
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

  const fetchDeviceAndNavigate = async (target: 'map' | 'verticalMap') => {
    if (!selectedBus) {
      Alert.alert('Select a Bus', 'Please select a bus to view live data.');
      return;
    }

    try {
      const selectedData = results.find(
        (bus) => bus.busNumber.trim() === selectedBus.trim()
      );

      if (!selectedData) {
        Alert.alert('Error', 'Selected bus details not found.');
        return;
      }

      const response = await axios.get(
        'http://10.34.28.52:5000/api/routes/device-from-bus',
        { params: { busNumber: selectedData.busNumber.trim() } }
      );

      const { deviceId } = response.data;

      if (!deviceId) {
        Alert.alert('Error', 'Device ID not found for the selected bus.');
        return;
      }

      router.push({
        pathname: target === 'verticalMap' ? '/verticalMap' : '/map',
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
      Alert.alert('Error', 'Unable to fetch device data for selected bus.');
    }
  };

  const renderItem = ({ item }: { item: BusResult }) => {
    const isSelected = selectedBus === item.busNumber;

    return (
      <TouchableOpacity
        onPress={() => setSelectedBus(item.busNumber)}
        style={[
          styles.card,
          isSelected && styles.selectedCard,
          isTablet && { padding: 24 },
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.busHeader}>
          <View style={styles.busNumberContainer}>
            <Ionicons name="bus" size={20} color="#FFF" />
            <Text style={styles.busNumber}>{item.busNumber}</Text>
          </View>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark" size={16} color="#FFF" />
            </View>
          )}
        </View>
        
        <View style={styles.routeContainer}>
          <View style={styles.locationDot}>
            <Ionicons name="ellipse" size={8} color="#E53935" />
          </View>
          <Text style={styles.routeText}>{item.source}</Text>
        </View>
        
        <View style={styles.viaContainer}>
          <View style={styles.dottedLine} />
          <Text style={styles.viaText}>Via {item.via}</Text>
        </View>
        
        <View style={styles.routeContainer}>
          <View style={styles.locationDot}>
            <Ionicons name="ellipse" size={8} color="#43A047" />
          </View>
          <Text style={styles.routeText}>{item.destination}</Text>
        </View>

        {item.timings?.length ? (
          <View style={styles.timingsContainer}>
            <Ionicons name="time-outline" size={16} color="#5E7EB6" />
            <Text style={styles.timingsText}>
              {item.timings.join(', ')}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
  <SafeAreaView style={styles.safeArea}>
    

    <View style={styles.container}>
      <FlatList
        data={loading ? [] : results}
        keyExtractor={(item) => item.busNumber}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/home')}
              activeOpacity={0.6}
            >
              <Ionicons name="arrow-back" size={20} color="#FFF" />
              <Text style={styles.backButtonText}></Text>
            </TouchableOpacity>

            <View style={styles.headerContainer}>
              <Text style={styles.title}>Available Buses</Text>
              <Text style={styles.subtitle}>
                {source} → {destination}
              </Text>
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3A7FC4" />
                <Text style={styles.loadingText}>Finding buses...</Text>
              </View>
            )}

            {!loading && results.length === 0 && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="bus-outline" size={48} color="#A3B8D8" />
                </View>
                <Text style={styles.emptyText}>No buses found for this route</Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={handleRefresh}
                >
                  <Ionicons name="refresh" size={20} color="#FFF" />
                  <Text style={styles.refreshText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && results.length > 0 && (
              <Text style={styles.resultsCount}>{results.length} buses found</Text>
            )}
          </>
        }
      />

      {/* Fixed bottom buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.verticalMapButton]}
          onPress={() => fetchDeviceAndNavigate('verticalMap')}
          disabled={!selectedBus}
          activeOpacity={0.7}
        >
          <Ionicons name="map-outline" size={20} color="#FFF" />
          <Text style={styles.buttonText}>Route View</Text>
        </TouchableOpacity>

       
      </View>
    </View>
  </SafeAreaView>
);

};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2A5C8D',
  },
   container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    paddingTop: 16,
    overflow: 'hidden',
  },
  backButton: {
    top: 10,
  flexDirection: 'row',
  alignItems: 'center',
  padding: 5,
  marginLeft: 4, // was 10
  alignSelf: 'flex-start',
  backgroundColor: 'rgba(28, 114, 195, 1)',
  borderRadius: 20,
  paddingHorizontal: 12,
},
  backButtonText: {
    fontSize: 16,
    color: '#192536ff',
    marginLeft: 6,
    fontWeight: '500',
  },
  headerContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
    left : -15,
  },
  subtitle: {
    top: 2,
    fontSize: isTablet ? 18 : 16,
    color: '#5E7EB6',
    fontWeight: '500',
    left : -15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    backgroundColor: '#EBF2FF',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#5E7EB6',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A7FC4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 24,
    shadowColor: '#3A7FC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  refreshText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  resultsCount: {
    fontSize: 14,
    color: '#5E7EB6',
    marginBottom: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#3A7FC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E9F0FF',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#3A7FC4',
    backgroundColor: '#F5F9FF',
  },
  busHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  busNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A7FC4',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  busNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 8,
  },
  selectedBadge: {
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 6,
  },
  locationDot: {
    width: 16,
    alignItems: 'center',
  },
  routeText: {
    fontSize: 16,
    color: '#34495E',
    marginLeft: 8,
    fontWeight: '500',
  },
  viaContainer: {
    marginBottom: 8,
    marginLeft: 12,
  },
  dottedLine: {
    borderLeftWidth: 2,
    borderLeftColor: '#D1DDF0',
    height: 16,
    marginLeft: 7,
    marginBottom: 4,
    borderStyle: 'dotted',
  },
  viaText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  timingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  timingsText: {
    fontSize: 14,
    color: '#5E7EB6',
    marginLeft: 8,
    fontWeight: '500',
  },
  buttonContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 16,
  backgroundColor: '#FFF',
  borderTopWidth: 1,
  borderTopColor: '#ECF0F1',
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  paddingBottom: Platform.select({ ios: 30, android: 16 }),
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 10,
},

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  verticalMapButton: {
    backgroundColor: '#3A7FC4',
  },
  liveMapButton: {
    backgroundColor: '#2ECC71',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default BusResultScreen;
