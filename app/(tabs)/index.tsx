import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Buffer } from 'buffer';
import Header from '../../components/Header';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Set up Buffer globally if not already available
global.Buffer = global.Buffer || Buffer;

const { width } = Dimensions.get('window');

// Dynamic build info from app.config.js (injected at every build/start)
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const rawBuildDate = Constants.expoConfig?.extra?.buildDate;
const BUILD_DATE = rawBuildDate
  ? new Date(rawBuildDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  : 'N/A';

// Enhanced constants with more options
const COLORS = {
  primary: '#0066CC',
  primaryDark: '#0052A3',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  shadow: 'rgba(0, 0, 0, 0.08)',
  border: '#E9ECEF',
  success: '#28A745',
};

const SPACING = {
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
};

const FONT_SIZE = {
  small: 14,
  regular: 16,
  large: 20,
  xlarge: 24,
};

type LanguageOption = 'en' | 'mr';

const LANGUAGES = [
  { code: 'en', name: 'English', icon: 'language', textIcon: null },
  { code: 'mr', name: 'मराठी', icon: 'translate', textIcon: 'म' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption | null>(null);
  const [animation] = useState(new Animated.Value(0));

  const handleLanguageSelect = async (language: LanguageOption) => {
    setSelectedLanguage(language);
    setLoading(true);
    
    // Animation when language is selected
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    try {
      // Simulate network delay for better UX
      await Promise.all([
        AsyncStorage.setItem('language', language),
        new Promise(resolve => setTimeout(resolve, 800)), // Minimum loading time
      ]);
      
      router.replace('/login');
    } catch (error) {
      console.error('Failed to save language preference:', error);
      setLoading(false);
      setSelectedLanguage(null);
      animation.setValue(0);
    }
  };

  const buttonScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Image
            source={require('../../assets/images/smt-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          
          <Text style={styles.title}>Select Language</Text>
          <Text style={styles.subtitle}>भाषा निवडा</Text>
          
          <View style={styles.buttonContainer}>
            {LANGUAGES.map((lang) => (
              <Animated.View
                key={lang.code}
                style={[
                  selectedLanguage === lang.code && styles.selectedButton,
                  { transform: [{ scale: selectedLanguage === lang.code ? buttonScale : 1 }] }
                ]}
              >
                <LanguageButton 
                  language={lang.name}
                  icon={lang.icon}
                  textIcon={lang.textIcon}
                  selected={selectedLanguage === lang.code}
                  loading={loading && selectedLanguage === lang.code}
                  onPress={() => handleLanguageSelect(lang.code as LanguageOption)}
                />
              </Animated.View>
            ))}
          </View>
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Setting up your experience...</Text>
            </View>
          )}
        </View>
        
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Powered by MIT Vishwaprayag University</Text>
          <Text style={styles.footerMeta}>v{APP_VERSION}  •  Build: {BUILD_DATE}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface LanguageButtonProps {
  language: string;
  icon: string;
  selected: boolean;
  loading: boolean;
  onPress: () => void;
}

interface LanguageButtonProps {
  language: string;
  icon: string;
  textIcon?: string | null;
  selected: boolean;
  loading: boolean;
  onPress: () => void;
}

const LanguageButton = ({ language, icon, textIcon, selected, loading, onPress }: LanguageButtonProps) => (
  <TouchableOpacity 
    style={[
      styles.languageButton,
      selected && styles.languageButtonSelected,
    ]} 
    onPress={onPress}
    activeOpacity={0.8}
    disabled={loading}
  >
    {loading ? (
      <ActivityIndicator size="small" color={COLORS.white} />
    ) : (
      <>
        {textIcon ? (
          <Text style={[styles.textIconLabel, selected && styles.textIconLabelSelected]}>{textIcon}</Text>
        ) : (
          <MaterialIcons 
            name={icon as any} 
            size={20} 
            color={selected ? COLORS.white : COLORS.primary} 
            style={styles.buttonIcon}
          />
        )}
        <Text style={[
          styles.languageButtonText,
          selected && styles.languageButtonTextSelected,
        ]}>
          {language}
        </Text>
      </>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.medium,
    paddingBottom: SPACING.xlarge,
  },
  card: {
    width: width > 500 ? 420 : '88%',
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.medium,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logo: {
    width: 150,        // set width
    height: 150,       // set height
   
  },
  title: {
    fontSize: FONT_SIZE.xlarge,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.small,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.large,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginTop: SPACING.medium,
  },
  selectedButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  languageButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.medium,
    borderRadius: 8,
    width: '100%',
    marginBottom: SPACING.medium,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  languageButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  buttonIcon: {
    marginRight: SPACING.small,
  },
  languageButtonText: {
    color: COLORS.primary,
    fontWeight: '500',
    fontSize: FONT_SIZE.regular,
  },
  languageButtonTextSelected: {
    color: COLORS.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.small,
  },
  loadingText: {
    marginLeft: SPACING.small,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.small,
  },
  footerContainer: {
    marginTop: SPACING.large,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.small,
    textAlign: 'center',
    fontWeight: '500',
  },
  footerMeta: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.7,
  },
  textIconLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.small,
  },
  textIconLabelSelected: {
    color: COLORS.white,
  },
});
