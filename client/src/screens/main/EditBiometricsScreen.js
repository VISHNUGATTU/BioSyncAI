import React, { useState, useContext } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, TextInput, ActivityIndicator, Alert,Platform
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import FloatingDock from '../../components/FloatingDock';

export default function EditBiometricsScreen({ navigation }) {
  const { user, updateUser } = useContext(AuthContext); 
  const [isLoading, setIsLoading] = useState(false);

  const health = user?.baselineHealth || {};
  const [age, setAge] = useState(health.age?.toString() || '');
  const [weight, setWeight] = useState(health.weight?.toString() || '');
  const [height, setHeight] = useState(health.height?.toString() || '');
  const [biologicalSex, setBiologicalSex] = useState(health.biologicalSex || 'Male');
  const [dietaryPreference, setDietaryPreference] = useState(health.dietaryPreference || 'Standard');
  const [activityLevel, setActivityLevel] = useState(health.activityLevel || 'Moderate');
  
  // Convert arrays to comma-separated strings for easy editing
  const [allergies, setAllergies] = useState(health.allergies ? health.allergies.join(', ') : '');
  const [medicalConditions, setMedicalConditions] = useState(health.medicalConditions ? health.medicalConditions.join(', ') : '');

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Parse the comma-separated strings back into clean arrays
      const allergiesArray = allergies.split(',').map(item => item.trim()).filter(item => item !== '');
      const conditionsArray = medicalConditions.split(',').map(item => item.trim()).filter(item => item !== '');

      const updateData = {
        baselineHealth: {
          age: parseInt(age) || null,
          weight: parseInt(weight) || null,
          height: parseInt(height) || null,
          biologicalSex,
          dietaryPreference,
          activityLevel,
          allergies: allergiesArray,
          medicalConditions: conditionsArray
        }
      };

      const response = await api.put('/user/profile', updateData);
      await updateUser(response.data);
      Alert.alert("Calibration Complete", "Neural link updated successfully.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to sync biological data.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPills = (options, stateValue, stateSetter) => (
    <View style={styles.pillContainer}>
      {options.map(option => (
        <TouchableOpacity 
          key={option} style={[styles.pill, stateValue === option && styles.pillActive]}
          onPress={() => stateSetter(option)}
        >
          <Text style={[styles.pillText, stateValue === option && styles.pillTextActive]}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Calibration</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionTitle}>Physical Attributes</Text>
        <BlurView intensity={40} tint="dark" style={styles.formCard}>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>AGE</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="Years" placeholderTextColor="rgba(255,255,255,0.3)" />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>WEIGHT (KG)</Text>
              <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="0.0" placeholderTextColor="rgba(255,255,255,0.3)" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>HEIGHT (CM)</Text>
              <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="0.0" placeholderTextColor="rgba(255,255,255,0.3)" />
            </View>
          </View>
          
          <View style={styles.divider} />
          <Text style={styles.inputLabel}>BIOLOGICAL SEX</Text>
          {renderPills(['Male', 'Female', 'Other'], biologicalSex, setBiologicalSex)}
        </BlurView>

        <Text style={styles.sectionTitle}>Metabolic Profile</Text>
        <BlurView intensity={40} tint="dark" style={styles.formCard}>
          <Text style={styles.inputLabel}>DIETARY PROTOCOL</Text>
          {renderPills(['Standard', 'Keto', 'Vegan', 'Paleo'], dietaryPreference, setDietaryPreference)}
          
          <View style={styles.divider} />
          <Text style={styles.inputLabel}>ACTIVITY LEVEL</Text>
          {renderPills(['Sedentary', 'Moderate', 'Active', 'Athlete'], activityLevel, setActivityLevel)}
        </BlurView>

        <Text style={styles.sectionTitle}>Clinical Data</Text>
        <BlurView intensity={40} tint="dark" style={styles.formCard}>
          <Text style={styles.inputLabel}>KNOWN ALLERGIES (Comma separated)</Text>
          <TextInput 
            style={styles.input} value={allergies} onChangeText={setAllergies} 
            placeholder="e.g. Peanuts, Shellfish" placeholderTextColor="rgba(255,255,255,0.3)" 
          />
          
          <Text style={styles.inputLabel}>MEDICAL CONDITIONS (Comma separated)</Text>
          <TextInput 
            style={styles.input} value={medicalConditions} onChangeText={setMedicalConditions} 
            placeholder="e.g. Prediabetes, PCOS" placeholderTextColor="rgba(255,255,255,0.3)" 
          />
        </BlurView>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.saveButtonText}>INITIALIZE CALIBRATION</Text>}
        </TouchableOpacity>

        <View style={{ height: 140 }} />
      </ScrollView>
      <FloatingDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  glowCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(56, 189, 248, 0.08)', top: -50, right: -100 },
  glowCircle2: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(14, 165, 233, 0.05)', bottom: -100, left: -150 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 10, zIndex: 10 },
  headerIcon: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  scrollView: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginTop: 10 },
  formCard: { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.85)', marginBottom: 24 },
  inputLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 8 },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%', marginBottom: 16, marginTop: 8 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  pill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 8, marginBottom: 8 },
  pillActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  pillText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  pillTextActive: { color: '#0F172A', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#38BDF8', width: '100%', paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginTop: 10 },
  saveButtonText: { color: '#0F172A', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});