import React, { useContext, useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image, Platform, ActivityIndicator 
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api'; // Make sure this path is correct!
import FloatingDock from '../../components/FloatingDock';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  
  // --- DYNAMIC DATA STATES ---
  const [recentScans, setRecentScans] = useState([]);
  const [isLoadingScans, setIsLoadingScans] = useState(true);

  // Fetch real scan history from your backend
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // NOTE: We will need to build this route in your backend next!
        const response = await api.get('/tracker/history?limit=5'); 
        setRecentScans(response.data);
      } catch (error) {
        console.log("History fetch error:", error.message);
        // Silently fail for now so the UI doesn't crash while we build the backend route
        setRecentScans([]); 
      } finally {
        setIsLoadingScans(false);
      }
    };

    fetchHistory();
  }, []);

  // Determine dynamic profile picture
  const profilePic = user?.profilePicture 
    ? { uri: user.profilePicture } 
    : { uri: `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=38BDF8&color=0F172A` };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* --- AMBIENT ORBS --- */}
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      {/* --- MASTER HEADER --- */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="scan-circle" size={28} color="#38BDF8" style={{ marginRight: 8 }} />
          <Text style={styles.headerLogo}>BioSync<Text style={{color: '#38BDF8'}}>AI</Text></Text>
        </View>
        
        {/* PROFILE LINK (Top Right) */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('UserProfileScreen')}
          onLongPress={logout} 
          style={styles.profileBtn}
        >
          <Image source={profilePic} style={styles.avatar} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* --- DYNAMIC GREETING --- */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>SYSTEM ONLINE</Text>
          <Text style={styles.userName}>Good morning, {user?.name?.split(' ')[0] || 'User'}.</Text>
        </View>

        {/* --- HERO SCANNER CARD --- */}
        <BlurView intensity={40} tint="dark" style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.iconRing}>
              <Ionicons name="barcode-outline" size={48} color="#38BDF8" />
            </View>
            <Text style={styles.heroTitle}>Awaiting Bio-Matter</Text>
            <Text style={styles.heroSub}>Initialize camera to analyze nutritional impact.</Text>
            
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => navigation.navigate('ScannerScreen')}
            >
              <Text style={styles.scanButtonText}>INITIATE SCAN</Text>
              <Ionicons name="chevron-forward" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* --- DYNAMIC BIOLOGICAL BASELINE --- */}
        <BlurView intensity={40} tint="dark" style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Biological Status</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="water" size={20} color="#38BDF8" style={{ marginBottom: 8 }} />
              <Text style={styles.statLabel}>GLUCOSE BASELINE</Text>
              {/* This can eventually be a dynamic calculation based on their scans */}
              <Text style={styles.statValue}>98 <Text style={styles.statUnit}>mg/dL</Text></Text> 
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statBox}>
              <Ionicons name="flame" size={20} color="#FBBF24" style={{ marginBottom: 8 }} />
              <Text style={styles.statLabel}>METABOLISM</Text>
              <Text style={[styles.statValue, { fontSize: 20 }]}>{user?.baselineHealth?.activityLevel || 'Pending'}</Text>
            </View>
          </View>
        </BlurView>

        {/* --- DYNAMIC HORIZONTAL RECENT SCANS --- */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Intelligence</Text>
          <TouchableOpacity onPress={() => navigation.navigate('HistoryScreen')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {isLoadingScans ? (
          <ActivityIndicator size="large" color="#38BDF8" style={{ marginTop: 20 }} />
        ) : recentScans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={32} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyStateText}>No scans found. Initiate a scan to begin logging.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {recentScans.map((scan) => (
              <BlurView key={scan._id} intensity={40} tint="dark" style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <View style={[styles.badge, { backgroundColor: scan.verdict === 'SPIKE' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(34, 197, 94, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: scan.verdict === 'SPIKE' ? '#F87171' : '#4ADE80' }]}>{scan.verdict}</Text>
                  </View>
                  {/* Dynamic Time Formatting can go here */}
                  <Text style={styles.historyTime}>Today</Text> 
                </View>
                <Text style={styles.historyFood}>{scan.foodName}</Text>
                <Text style={styles.historyImpact}>Est. {scan.glucoseImpact} mg/dL</Text>
              </BlurView>
            ))}
          </ScrollView>
        )}

        {/* Huge spacer so content scrolls completely above the floating dock */}
        <View style={{ height: 120 }} />

      </ScrollView>

      {/* --- FLOATING BOTTOM NAVIGATION DOCK --- */}
      <View style={styles.dockWrapper}>
        <BlurView intensity={70} tint="dark" style={styles.dock}>
          
          {/* Active Home Tab */}
          <TouchableOpacity style={styles.dockIcon}>
            <Ionicons name="home" size={26} color="#38BDF8" />
            <View style={styles.activeIndicator} />
          </TouchableOpacity>

          {/* Health/Biometrics Tab */}
          <TouchableOpacity 
            style={styles.dockIcon} 
            onPress={() => navigation.navigate('HealthScreen')}
          >
            <Ionicons name="heart-outline" size={26} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          {/* Floating Center Scanner FAB */}
          <View style={styles.fabContainer}>
            <TouchableOpacity 
              style={styles.fab}
              onPress={() => navigation.navigate('ScannerScreen')}
            >
              <Ionicons name="scan" size={30} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* History/Logs Tab */}
          <TouchableOpacity 
            style={styles.dockIcon} 
            onPress={() => navigation.navigate('HistoryScreen')}
          >
            <Ionicons name="time-outline" size={26} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          {/* Settings Tab */}
          <TouchableOpacity 
            style={styles.dockIcon}
            onPress={() => navigation.navigate('SettingsScreen')}
          >
            <Ionicons name="settings-outline" size={26} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

        </BlurView>
      </View>
        <FloatingDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  glowCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(56, 189, 248, 0.08)', top: -50, right: -100 },
  glowCircle2: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(14, 165, 233, 0.05)', bottom: -100, left: -150 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 10, zIndex: 10 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  profileBtn: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(56, 189, 248, 0.5)' },
  notificationDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#020617' },

  scrollView: { flex: 1, paddingHorizontal: 24 },
  
  greetingSection: { marginTop: 20, marginBottom: 30 },
  greetingText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
  userName: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 4, letterSpacing: -0.5 },

  heroCard: { borderRadius: 32, padding: 30, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', backgroundColor: 'rgba(15, 23, 42, 0.7)', marginBottom: 24, alignItems: 'center', overflow: 'hidden' },
  heroContent: { alignItems: 'center', width: '100%' },
  iconRing: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(56, 189, 248, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)' },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
  scanButton: { flexDirection: 'row', backgroundColor: '#38BDF8', width: '100%', paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  scanButtonText: { color: '#0F172A', fontSize: 16, fontWeight: '900', letterSpacing: 1, marginRight: 8 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5, marginBottom: 20 },
  seeAllText: { color: '#38BDF8', fontSize: 14, fontWeight: '600', marginBottom: 16 },
  
  statsCard: { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.85)', marginBottom: 32 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'flex-start' },
  verticalDivider: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20 },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '900', textTransform: 'capitalize' },
  statUnit: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  horizontalScroll: { overflow: 'visible' },
  historyCard: { width: 240, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.85)', marginRight: 16 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  historyTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },
  historyFood: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  historyImpact: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },

  emptyState: { alignItems: 'center', paddingVertical: 30, backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' },
  emptyStateText: { color: 'rgba(255,255,255,0.4)', marginTop: 12, fontSize: 14, fontWeight: '600' },

  // --- NEW FLOATING DOCK STYLES ---
  dockWrapper: { position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 20, left: 24, right: 24, alignItems: 'center' },
  dock: { flexDirection: 'row', height: 75, width: '100%', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: 38, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, overflow: 'visible' },
  dockIcon: { alignItems: 'center', justifyContent: 'center', padding: 10 },
  activeIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#38BDF8', marginTop: 4, position: 'absolute', bottom: 4 },
  fabContainer: { position: 'relative', top: -25 },
  fab: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#38BDF8', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#020617', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
});