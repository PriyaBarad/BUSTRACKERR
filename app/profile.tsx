import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import MenuDrawer from '../components/MenuDrawer';
import strings from '../locales/strings';

export default function ProfileScreen() {
  const [lang, setLang] = useState<'en' | 'mr'>('en');
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userLoggedIn');
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <MenuDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.push('/home')}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#2563eb" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{strings[lang]?.profile || 'Profile'}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setDrawerOpen(true)}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.profileIcon}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.nameText}>{user?.name || 'Name not available'}</Text>
            <Text style={styles.phoneText}>{user?.phone || 'Phone not available'}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.langBtn} 
            onPress={toggleLanguage}
            activeOpacity={0.85}
          >
            <Text style={styles.langBtnText}>
              {lang === 'en' ? '🌐 Change Language to Marathi' : '🌐 इंग्रजीमध्ये बदला'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Text style={styles.logoutText}>🔒 {strings[lang]?.logout || 'Logout'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f7',
    paddingTop: 50,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 15,
    width: '100%',
  },
  headerButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  profileIcon: {
    fontSize: 60,
  },
  userInfo: {
    alignItems: 'center',
    width: '100%',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  phoneText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    marginTop: 10,
  },
  langBtn: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  langBtnText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutBtn: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});






// import React, { useEffect, useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import { useRouter } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import strings from '../locales/strings';
// import { useTheme } from '../components/ThemeContext'; // Import theme context

// export default function ProfileScreen() {
//   const [lang, setLang] = useState<'en' | 'mr'>('en');
//   const [user, setUser] = useState<{ name: string; phone: string } | null>(null);
//   const router = useRouter();
//   const { theme, toggleTheme } = useTheme(); // Theme hook

//   useEffect(() => {
//     const loadData = async () => {
//       const langStored = await AsyncStorage.getItem('language');
//       setLang(langStored === 'mr' ? 'mr' : 'en');

//       const userData = await AsyncStorage.getItem('user');
//       if (userData) {
//         setUser(JSON.parse(userData));
//       }
//     };
//     loadData();
//   }, []);

//   const toggleLanguage = async () => {
//     const newLang = lang === 'en' ? 'mr' : 'en';
//     await AsyncStorage.setItem('language', newLang);
//     setLang(newLang);
//   };

//   const handleLogout = async () => {
//     try {
//       await AsyncStorage.removeItem('user');
//       await AsyncStorage.removeItem('userLoggedIn');
//       router.replace('/');
//     } catch (error) {
//       console.error('Logout error:', error);
//     }
//   };

//   return (
//     <View style={[styles.container, theme === 'dark' && { backgroundColor: '#0f172a' }]}>
//       <View style={[styles.card, theme === 'dark' && { backgroundColor: '#1e293b' }]}>
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity 
//             onPress={() => router.push('/home')}
//             style={styles.backButton}
//             activeOpacity={0.7}
//           >
//             <Text style={[styles.backText, theme === 'dark' && { color: '#60a5fa' }]}>{strings[lang]?.home || 'Home'}</Text>
//           </TouchableOpacity>
//           <View style={styles.titleContainer}>
//             <Text style={[styles.title, theme === 'dark' && { color: '#f8fafc' }]}>{strings[lang]?.profile || 'Profile'}</Text>
//           </View>
//         </View>

//         {/* Profile Section */}
//         <View style={styles.profileSection}>
//           <View style={[styles.avatarCircle, theme === 'dark' && { backgroundColor: '#2563eb' }]}>
//             <Text style={styles.profileIcon}>👤</Text>
//           </View>
//           <View style={styles.userInfo}>
//             <Text style={[styles.nameText, theme === 'dark' && { color: '#f8fafc' }]}>{user?.name || 'Name not available'}</Text>
//             <Text style={[styles.phoneText, theme === 'dark' && { color: '#94a3b8' }]}>{user?.phone || 'Phone not available'}</Text>
//           </View>
//         </View>

//         {/* Actions */}
//         <View style={styles.actionsContainer}>

//           {/* Language Button */}
//           <TouchableOpacity 
//             style={styles.langBtn} 
//             onPress={toggleLanguage}
//             activeOpacity={0.85}
//           >
//             <Text style={styles.langBtnText}>
//               {lang === 'en' ? '🌐 Change Language to Marathi' : '🌐 इंग्रजीमध्ये बदला'}
//             </Text>
//           </TouchableOpacity>

//           {/* NEW: Change Theme Button */}
//           <TouchableOpacity
//             style={[styles.langBtn, { backgroundColor: '#facc15' }]}
//             onPress={toggleTheme}
//             activeOpacity={0.85}
//           >
//             <Text style={[styles.langBtnText, { color: '#1f2937' }]}>
//               {theme === 'light' ? '🌙 Switch to Dark Theme' : '☀️ Switch to Light Theme'}
//             </Text>
//           </TouchableOpacity>

//           {/* Logout Button */}
//           <TouchableOpacity 
//             style={styles.logoutBtn} 
//             onPress={handleLogout}
//             activeOpacity={0.85}
//           >
//             <Text style={styles.logoutText}>🔒 {strings[lang]?.logout || 'Logout'}</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// }

// // You can reuse the same styles from your original code
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#eef2f7',
//     paddingTop: 50,
//     alignItems: 'center',
//   },
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: 20,
//     width: '90%',
//     maxWidth: 400,
//     padding: 25,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.08,
//     shadowRadius: 16,
//     elevation: 6,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 25,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e2e8f0',
//     paddingBottom: 15,
//     width: '100%',
//   },
//   backButton: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//     backgroundColor: '#f1f5f9',
//   },
//   backText: {
//     fontSize: 16,
//     color: '#2563eb',
//     fontWeight: '600',
//   },
//   titleContainer: {
//     flex: 1,
//     alignItems: 'center',
//     marginRight: 40,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#0f172a',
//     textAlign: 'center',
//   },
//   profileSection: {
//     alignItems: 'center',
//     marginBottom: 30,
//     width: '100%',
//   },
//   avatarCircle: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: '#e0f2fe',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//     shadowColor: '#38bdf8',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 10,
//     elevation: 6,
//   },
//   profileIcon: {
//     fontSize: 60,
//   },
//   userInfo: {
//     alignItems: 'center',
//     width: '100%',
//   },
//   nameText: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#0f172a',
//     marginBottom: 6,
//     textAlign: 'center',
//   },
//   phoneText: {
//     fontSize: 16,
//     color: '#64748b',
//     textAlign: 'center',
//   },
//   actionsContainer: {
//     width: '100%',
//     marginTop: 10,
//   },
//   langBtn: {
//     backgroundColor: '#f8fafc',
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     marginBottom: 15,
//     alignItems: 'center',
//     shadowColor: '#94a3b8',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//   },
//   langBtnText: {
//     color: '#334155',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   logoutBtn: {
//     backgroundColor: '#2563eb',
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     shadowColor: '#2563eb',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 6,
//   },
//   logoutText: {
//     color: '#ffffff',
//     fontWeight: '700',
//     fontSize: 16,
//   },
// });
