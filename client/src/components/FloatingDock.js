import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function FloatingDock() {
  const navigation = useNavigation();
  const route = useRoute();
  const currentRoute = route.name;

  return (
    // pointerEvents="box-none" ensures the invisible wrapper doesn't block screen touches!
    <View style={styles.dockWrapper} pointerEvents="box-none">
      <BlurView intensity={80} tint="dark" style={styles.dock}>
        
        {/* Home */}
        <TouchableOpacity style={styles.dockIcon} onPress={() => navigation.navigate('DashboardScreen')}>
          <Ionicons name={currentRoute === 'DashboardScreen' ? "home" : "home-outline"} size={26} color={currentRoute === 'DashboardScreen' ? "#38BDF8" : "rgba(255,255,255,0.4)"} />
          {currentRoute === 'DashboardScreen' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        {/* Health */}
        <TouchableOpacity style={styles.dockIcon} onPress={() => navigation.navigate('HealthScreen')}>
          <Ionicons name={currentRoute === 'HealthScreen' ? "heart" : "heart-outline"} size={26} color={currentRoute === 'HealthScreen' ? "#38BDF8" : "rgba(255,255,255,0.4)"} />
          {currentRoute === 'HealthScreen' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        {/* FAB Scanner */}
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ScannerScreen')}>
            <Ionicons name="scan" size={30} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* History */}
        <TouchableOpacity style={styles.dockIcon} onPress={() => navigation.navigate('HistoryScreen')}>
          <Ionicons name={currentRoute === 'HistoryScreen' ? "time" : "time-outline"} size={26} color={currentRoute === 'HistoryScreen' ? "#38BDF8" : "rgba(255,255,255,0.4)"} />
          {currentRoute === 'HistoryScreen' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity style={styles.dockIcon} onPress={() => navigation.navigate('SettingsScreen')}>
          <Ionicons name={currentRoute === 'SettingsScreen' ? "settings" : "settings-outline"} size={26} color={currentRoute === 'SettingsScreen' ? "#38BDF8" : "rgba(255,255,255,0.4)"} />
          {currentRoute === 'SettingsScreen' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  dockWrapper: { 
    position: 'absolute', 
    bottom: Platform.OS === 'ios' ? 30 : 20, 
    left: 24, 
    right: 24, 
    alignItems: 'center',
    zIndex: 999, // ✅ FORCES dock to top layer
    elevation: 10 // ✅ FORCES touches to register on Android
  },
  dock: { flexDirection: 'row', height: 75, width: '100%', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: 38, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  dockIcon: { alignItems: 'center', justifyContent: 'center', padding: 10, position: 'relative' },
  activeIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#38BDF8', position: 'absolute', bottom: 2 },
  fabContainer: { position: 'relative', top: -25 },
  fab: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#38BDF8', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#020617', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
});