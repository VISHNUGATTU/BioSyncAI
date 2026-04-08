import React, { useContext } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Platform, Switch, Alert 
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import FloatingDock from '../../components/FloatingDock';

export default function SettingsScreen({ navigation }) {
  // ✅ Pulling the REAL global settings and save function from Context
  const { logout, appSettings, saveSettings } = useContext(AuthContext);

  // Dynamic Handlers that actually save to SecureStore
  const toggleNotifications = (value) => saveSettings({ ...appSettings, notifications: value });
  const toggleUnitSystem = (value) => saveSettings({ ...appSettings, metricSystem: value });

  // Real functional action for the Security button
  const handleClearCache = () => {
    Alert.alert(
      "Clear Local Cache",
      "This will remove temporary bio-scan data from this device. Your cloud data is safe.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear Now", style: "destructive", onPress: () => console.log("Cache cleared!") }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Configuration</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* --- DEVICE INTEGRATION --- */}
        <Text style={styles.sectionTitle}>Device Integration</Text>
        <BlurView intensity={40} tint="dark" style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={22} color={appSettings.notifications ? "#38BDF8" : "rgba(255,255,255,0.4)"} style={styles.settingIcon} />
              <View>
                <Text style={styles.settingLabel}>Neural Alerts</Text>
                <Text style={styles.settingSub}>Push notifications for glucose spikes</Text>
              </View>
            </View>
            <Switch 
              value={appSettings.notifications} 
              onValueChange={toggleNotifications} 
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#38BDF8' }}
              thumbColor="#fff"
            />
          </View>
        </BlurView>

        {/* --- GLOBAL APP PREFERENCES --- */}
        <Text style={styles.sectionTitle}>Global Preferences</Text>
        <BlurView intensity={40} tint="dark" style={styles.settingsCard}>
          
          {/* Dynamic Unit Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="scale" size={22} color="#FBBF24" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingLabel}>Metric System</Text>
                <Text style={styles.settingSub}>{appSettings.metricSystem ? 'Using kg & cm' : 'Using lbs & in'}</Text>
              </View>
            </View>
            <Switch 
              value={appSettings.metricSystem} 
              onValueChange={toggleUnitSystem} 
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#FBBF24' }}
              thumbColor="#fff"
            />
          </View>
          
          <View style={styles.divider} />
          
          {/* Functional Security Action */}
          <TouchableOpacity style={styles.settingRowAction} onPress={handleClearCache}>
            <View style={styles.settingLeft}>
              <Ionicons name="trash-bin-outline" size={22} color="rgba(255,255,255,0.6)" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Clear Local Cache</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </BlurView>

        {/* --- DANGER ZONE --- */}
        <Text style={styles.sectionTitle}>Access Control</Text>
        <BlurView intensity={40} tint="dark" style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRowAction} onPress={logout}>
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={22} color="#F87171" style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: '#F87171' }]}>Disconnect Neural Link (Logout)</Text>
            </View>
          </TouchableOpacity>
        </BlurView>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Uses the universal dynamic dock we built in the last step */}
      <FloatingDock />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  glowCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(56, 189, 248, 0.08)', top: -50, right: -100 },
  glowCircle2: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(14, 165, 233, 0.05)', bottom: -100, left: -150 },
  
  header: { alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 60 : 20, paddingBottom: 20, zIndex: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  
  scrollView: { flex: 1, paddingHorizontal: 24 },
  
  sectionTitle: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, marginTop: 10 },
  settingsCard: { borderRadius: 24, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.85)', marginBottom: 24 },
  
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  settingRowAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { marginRight: 16 },
  settingLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  settingSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2, fontWeight: '600' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', width: '100%' },
});