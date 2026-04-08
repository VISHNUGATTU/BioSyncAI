import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, TouchableOpacity, Platform 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api'; 
import FloatingDock from '../../components/FloatingDock';

export default function HealthScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  // useFocusEffect ensures the data refreshes EVERY time you open this tab!
  useFocusEffect(
    useCallback(() => {
      const fetchSummary = async () => {
        try {
          const response = await api.get('/tracker/summary');
          setSummary(response.data);
        } catch (error) {
          console.log("Error fetching summary:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSummary();
    }, [])
  );

  if (isLoading || !summary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38BDF8" />
          <Text style={styles.loadingText}>CALCULATING METABOLICS...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return '#4ADE80'; // Green
    if (score >= 50) return '#FBBF24'; // Yellow
    return '#F87171'; // Red
  };

  const scoreColor = getScoreColor(summary.stabilityScore);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Glows based on your health! */}
      <View style={[styles.glowCircle1, { backgroundColor: scoreColor, opacity: 0.1 }]} />
      <View style={styles.glowCircle2} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Metabolic Core</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('UserProfileScreen')}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- MAIN SCORE RING --- */}
        <View style={styles.ringContainer}>
          <View style={[styles.outerRing, { borderColor: scoreColor }]}>
            <View style={styles.innerRing}>
              <Text style={[styles.scoreText, { color: scoreColor }]}>{summary.stabilityScore}</Text>
              <Text style={styles.scoreLabel}>STABILITY</Text>
            </View>
          </View>
          <Text style={styles.ringSubtext}>
            {summary.stabilityScore >= 80 ? "Optimal Glycemic Control" : "Warning: High Fluctuation Detected"}
          </Text>
        </View>

        {/* --- STATS GRID --- */}
        <View style={styles.statsGrid}>
          <BlurView intensity={40} tint="dark" style={styles.statCard}>
            <Ionicons name="flash" size={24} color="#38BDF8" style={styles.statIcon} />
            <Text style={styles.statValue}>+{summary.totalImpact}</Text>
            <Text style={styles.statLabel}>mg/dL Impact Today</Text>
          </BlurView>

          <BlurView intensity={40} tint="dark" style={styles.statCard}>
            <Ionicons name="water" size={24} color="#A78BFA" style={styles.statIcon} />
            <Text style={styles.statValue}>{summary.totalCarbs}g</Text>
            <Text style={styles.statLabel}>Carb Intake Today</Text>
          </BlurView>
        </View>

        {/* --- MEAL BREAKDOWN --- */}
        <Text style={styles.sectionTitle}>AI Verdict Breakdown</Text>
        <BlurView intensity={40} tint="dark" style={styles.breakdownCard}>
          
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.dot, { backgroundColor: '#4ADE80' }]} />
              <Text style={styles.breakdownText}>Optimal Meals</Text>
            </View>
            <Text style={styles.breakdownNumber}>{summary.optimalCount}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.dot, { backgroundColor: '#F87171' }]} />
              <Text style={styles.breakdownText}>Spikes Detected</Text>
            </View>
            <Text style={[styles.breakdownNumber, { color: '#F87171' }]}>{summary.spikeCount}</Text>
          </View>

        </BlurView>

      </ScrollView>

      <FloatingDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  glowCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: 100, alignSelf: 'center' },
  glowCircle2: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(56, 189, 248, 0.05)', bottom: -100, left: -150 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#38BDF8', marginTop: 16, fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 20, zIndex: 10 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  headerIcon: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },

  ringContainer: { alignItems: 'center', marginVertical: 30 },
  outerRing: { width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  innerRing: { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(15, 23, 42, 0.8)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  scoreText: { fontSize: 64, fontWeight: '900' },
  scoreLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold', letterSpacing: 3, marginTop: -5 },
  ringSubtext: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600', marginTop: 20, letterSpacing: 0.5 },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { flex: 1, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginHorizontal: 5, alignItems: 'center' },
  statIcon: { marginBottom: 10 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },

  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16, marginLeft: 4 },
  breakdownCard: { padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  breakdownText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  breakdownNumber: { color: '#fff', fontSize: 20, fontWeight: '900' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 8 }
});