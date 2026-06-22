import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiHost = () => {
  if (Platform.OS === 'web') {
    // On web, if the browser is running on localhost, use localhost.
    // If it's running on an IP address (like on a local network), use that IP.
    if (typeof window !== 'undefined' && window.location) {
      return window.location.hostname;
    }
    return 'localhost';
  }

  // On native (Android/iOS), try to get the Metro server's IP address dynamically
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }

  // Fallback to the current local machine IP address
  return '10.189.186.187';
};

export const API_BASE_URL = `http://${getApiHost()}:5000`;
