import React, { useState, useContext } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image, Platform 
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from './DashboardScreen';
import EditProfileScreen from './EditProfileScreen';
import FloatingDock from '../../components/FloatingDock';

export default function UserProfileScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  
  // State to toggle between the two views
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'medical'

  // Safe fallback data in case the user hasn't filled out their medical profile yet
  const healthData = user?.baselineHealth || {};
  const isMedicalEmpty = Object.keys(healthData).length === 0;

  // Determine dynamic profile picture
  const profilePic = user?.profilePicture 
    ? { uri: user.profilePicture } 
    : { uri: `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=38BDF8&color=0F172A` };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Ambient Orbs */}
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subject Profile</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('SettingsScreen')}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* --- AVATAR SECTION --- */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarRing}>
            <Image 
              source={profilePic} 
              style={styles.avatar} 
            />
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>PRIMARY USER</Text>
          </View>
        </View>

        {/* --- CUSTOM TAB SWITCHER --- */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'personal' && styles.activeTab]}
            onPress={() => setActiveTab('personal')}
          >
            <Ionicons name="person" size={16} color={activeTab === 'personal' ? '#0F172A' : '#38BDF8'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>IDENTITY</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'medical' && styles.activeTab]}
            onPress={() => setActiveTab('medical')}
          >
            <Ionicons name="pulse" size={16} color={activeTab === 'medical' ? '#0F172A' : '#FBBF24'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, activeTab === 'medical' && styles.activeTabText]}>BIOMETRICS</Text>
          </TouchableOpacity>
        </View>

        {/* --- CONTENT AREA --- */}
        {activeTab === 'personal' ? (
          <BlurView intensity={40} tint="dark" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>FULL NAME</Text>
              <Text style={styles.infoValue}>{user?.name || 'Not provided'}</Text>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SECURE EMAIL</Text>
              <Text style={styles.infoValue}>{user?.email || 'Not provided'}</Text>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ACCOUNT STATUS</Text>
              <Text style={[styles.infoValue, { color: '#4ADE80' }]}>Active & Verified</Text>
            </View>

           <TouchableOpacity 
  style={styles.editButton}
  onPress={() => navigation.navigate('EditBiometricsScreen')}
>
  <Text style={styles.editButtonText}>CALIBRATE BIOMETRICS</Text>
</TouchableOpacity>
          </BlurView>

        ) : (
          <BlurView intensity={40} tint="dark" style={styles.infoCard}>
            {isMedicalEmpty ? (
               <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                 <Ionicons name="warning-outline" size={40} color="#FBBF24" style={{ marginBottom: 10 }} />
                 <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Biometrics Not Calibrated</Text>
                 <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8 }}>
                   Update your biological baseline so the AI can accurately predict glucose spikes.
                 </Text>
               </View>
            ) : (
              <>
                <View style={styles.gridContainer}>
                  <View style={styles.gridItem}>
                    <Text style={styles.infoLabel}>AGE</Text>
                    <Text style={styles.infoValue}>{healthData.age || '--'}</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.infoLabel}>WEIGHT</Text>
                    <Text style={styles.infoValue}>{healthData.weight ? `${healthData.weight} kg` : '--'}</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.infoLabel}>HEIGHT</Text>
                    <Text style={styles.infoValue}>{healthData.height ? `${healthData.height} cm` : '--'}</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.infoLabel}>SEX</Text>
                    <Text style={styles.infoValue}>{healthData.biologicalSex || '--'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>DIETARY PROTOCOL</Text>
                  <Text style={[styles.infoValue, { color: '#38BDF8' }]}>{healthData.dietaryPreference || 'Standard'}</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>METABOLIC ACTIVITY</Text>
                  <Text style={styles.infoValue}>{healthData.activityLevel || 'Moderate'}</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>KNOWN ALLERGIES</Text>
                  {healthData.allergies?.length > 0 ? (
                    <View style={styles.tagContainer}>
                      {healthData.allergies.map((allergy, index) => (
                        <View key={index} style={styles.tag}><Text style={styles.tagText}>{allergy}</Text></View>
                      ))}
                    </View>
                  ) : <Text style={styles.infoValue}>None reported</Text>}
                </View>
              </>
            )}

            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfileScreen')}
            >
              <Text style={styles.editButtonText}>CALIBRATE BIOMETRICS</Text>
            </TouchableOpacity>
          </BlurView>
        )}

        {/* --- DANGER ZONE --- */}
        <View style={{ marginTop: 20 }}>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#F87171" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>DISCONNECT NEURAL LINK</Text>
          </TouchableOpacity>
        </View>

        {/* Huge spacer so content scrolls completely above the floating dock */}
        <View style={{ height: 120 }} />

      </ScrollView>

      {/* --- FLOATING BOTTOM NAVIGATION DOCK --- */}
      <View style={styles.dockWrapper}>
        <BlurView intensity={70} tint="dark" style={styles.dock}>
          
          {/* Home Tab */}
          <TouchableOpacity 
            style={styles.dockIcon}
            onPress={() => navigation.navigate('DashboardScreen')}
          >
            <Ionicons name="home-outline" size={26} color="rgba(255,255,255,0.4)" />
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

          {/* Settings Tab - Currently Active/Or acts as Profile Context */}
          <TouchableOpacity 
            style={styles.dockIcon}
          >
            <Ionicons name="person" size={26} color="#38BDF8" />
            <View style={styles.activeIndicator} />
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
  headerIcon: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  
  scrollView: { flex: 1, paddingHorizontal: 24 },
  
  avatarContainer: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  avatarRing: { padding: 4, borderRadius: 60, borderWidth: 2, borderColor: '#38BDF8', borderStyle: 'dashed', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#020617' },
  userName: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  roleBadge: { backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  roleText: { color: '#38BDF8', fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 16, padding: 6, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabButton: { flex: 1, flexDirection: 'row', paddingVertical: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#38BDF8', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  activeTabText: { color: '#0F172A', fontWeight: '900' },

  // Info Cards
  infoCard: { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.85)' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoCol: { paddingVertical: 12 },
  infoLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 4 },
  infoValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%' },

  // Grid for Biometrics
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingVertical: 12 },
  gridItem: { width: '45%', marginBottom: 16 },

  // Tags for Allergies/Conditions
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tag: { backgroundColor: 'rgba(248, 113, 113, 0.15)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.3)' },
  tagText: { color: '#F87171', fontSize: 12, fontWeight: 'bold' },

  // Buttons
  editButton: { width: '100%', paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  editButtonText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  logoutText: { color: '#FCA5A5', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

  // --- FLOATING DOCK STYLES ---
  dockWrapper: { position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 20, left: 24, right: 24, alignItems: 'center' },
  dock: { flexDirection: 'row', height: 75, width: '100%', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: 38, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, overflow: 'visible' },
  dockIcon: { alignItems: 'center', justifyContent: 'center', padding: 10 },
  activeIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#38BDF8', marginTop: 4, position: 'absolute', bottom: 4 },
  fabContainer: { position: 'relative', top: -25 },
  fab: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#38BDF8', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#020617', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
});