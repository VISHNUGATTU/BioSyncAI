import React, { useState, useContext } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, TextInput, ActivityIndicator, Alert,Platform
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import FloatingDock from '../../components/FloatingDock';

export default function EditIdentityScreen({ navigation }) {
  const { user, updateUser } = useContext(AuthContext); 
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await api.put('/user/profile', { name });
      await updateUser(response.data);
      Alert.alert("Success", "Identity updated successfully.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to update identity.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Identity</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <BlurView intensity={40} tint="dark" style={styles.formCard}>
          <Text style={styles.inputLabel}>FULL NAME</Text>
          <TextInput 
            style={styles.input} value={name} onChangeText={setName}
            placeholder="Enter full name" placeholderTextColor="rgba(255,255,255,0.3)"
          />
          
          <Text style={styles.inputLabel}>SECURE EMAIL (Read Only)</Text>
          <View style={[styles.input, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
             <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>{user?.email}</Text>
          </View>
        </BlurView>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.saveButtonText}>SAVE IDENTITY</Text>}
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
  saveButton: { backgroundColor: '#38BDF8', width: '100%', paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginTop: 10 },
  saveButtonText: { color: '#0F172A', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});