import React, { useState, useContext } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, TextInput, ActivityIndicator, Alert, Platform
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import DashboardScreen from './DashboardScreen';
import FloatingDock from '../../components/FloatingDock';

export default function EditProfileScreen({ navigation }) {
  // ✅ 1. Pull in updateUser to sync the backend response instantly!
  const { user, updateUser } = useContext(AuthContext); 
  const [isLoading, setIsLoading] = useState(false);

  // --- FORM STATE ---
  const [name, setName] = useState(user?.name || '');
  
  const health = user?.baselineHealth || {};
  const [age, setAge] = useState(health.age?.toString() || '');
  const [weight, setWeight] = useState(health.weight?.toString() || '');
  const [height, setHeight] = useState(health.height?.toString() || '');
  const [dietaryPreference, setDietaryPreference] = useState(health.dietaryPreference || 'Standard');
  const [activityLevel, setActivityLevel] = useState(health.activityLevel || 'Moderate');

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updateData = {
        name,
        baselineHealth: {
          age: parseInt(age) || null,
          weight: parseInt(weight) || null,
          height: parseInt(height) || null,
          dietaryPreference,
          activityLevel,
        }
      };

      // ✅ 2. FIXED ROUTE: Using the correct '/users/auth/profile' path
      const response = await api.put('/user/profile', updateData);
      
      // ✅ 3. Instantly update the app's global state with the new DB data!
      await updateUser(response.data);
      
      Alert.alert("Calibration Complete", "Neural link updated successfully.");
      navigation.goBack();
      
    } catch (error) {
      console.log("Profile Update Error Details:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to sync biological data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Ambient Orbs */}
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Calibration</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* --- IDENTITY SECTION --- */}
        <Text style={styles.sectionTitle}>Identity Override</Text>
        <BlurView intensity={40} tint="dark" style={styles.formCard}>
          <Text style={styles.inputLabel}>FULL NAME</Text>
          <TextInput 
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter full name"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
        </BlurView>

        {/* --- BIOMETRICS SECTION --- */}
        <Text style={styles.sectionTitle}>Biological Metrics</Text>
        <BlurView intensity={40} tint="dark" style={styles.formCard}>
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>AGE</Text>
              <TextInput 
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="Years"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>WEIGHT (KG)</Text>
              <TextInput 
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>HEIGHT (CM)</Text>
              <TextInput 
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.inputLabel}>DIETARY PROTOCOL</Text>
          <View style={styles.pillContainer}>
            {['Standard', 'Keto', 'Vegan'].map(diet => (
              <TouchableOpacity 
                key={diet}
                style={[styles.pill, dietaryPreference === diet && styles.pillActive]}
                onPress={() => setDietaryPreference(diet)}
              >
                <Text style={[styles.pillText, dietaryPreference === diet && styles.pillTextActive]}>{diet}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </BlurView>

        {/* --- SAVE BUTTON --- */}
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#0F172A" />
          ) : (
            <Text style={styles.saveButtonText}>INITIALIZE CALIBRATION</Text>
          )}
        </TouchableOpacity>

        {/* Huge spacer to push content above the floating dock and keyboard */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* --- FLOATING BOTTOM NAVIGATION DOCK --- */}
      <View style={styles.dockWrapper}>
        <BlurView intensity={70} tint="dark" style={styles.dock}>
          
          {/* Home Tab */}
          <TouchableOpacity style={styles.dockIcon} onPress={() => navigation.navigate('DashboardScreen')}>
            <Ionicons name="home-outline" size={26} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          {/* Health/Biometrics Tab */}
          <TouchableOpacity style={styles.dockIcon} onPress={() => navigation.navigate('HealthScreen')}>
            <Ionicons name="heart-outline" size={26} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          {/* Floating Center Scanner FAB */}
          <View style={styles.fabContainer}>
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ScannerScreen')}>
              <Ionicons name="scan" size={30} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* History/Logs Tab */}
          <TouchableOpacity style={styles.dockIcon} onPress={() => navigation.navigate('HistoryScreen')}>
            <Ionicons name="time-outline" size={26} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          {/* Settings / Profile Tab (Active because we are editing it) */}
          <TouchableOpacity style={styles.dockIcon}>
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
  
  scrollView: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginTop: 10 },
  formCard: { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.85)', marginBottom: 24 },
  
  inputLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 8 },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%', marginBottom: 16 },

  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  pill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 8, marginBottom: 8 },
  pillActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  pillText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  pillTextActive: { color: '#0F172A', fontWeight: 'bold' },

  saveButton: { backgroundColor: '#38BDF8', width: '100%', paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginTop: 10 },
  saveButtonText: { color: '#0F172A', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  // --- FLOATING DOCK STYLES ---
  dockWrapper: { position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 20, left: 24, right: 24, alignItems: 'center' },
  dock: { flexDirection: 'row', height: 75, width: '100%', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: 38, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, overflow: 'visible' },
  dockIcon: { alignItems: 'center', justifyContent: 'center', padding: 10 },
  activeIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#38BDF8', marginTop: 4, position: 'absolute', bottom: 4 },
  fabContainer: { position: 'relative', top: -25 },
  fab: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#38BDF8', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#020617', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
});