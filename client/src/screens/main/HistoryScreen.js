import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform, FlatList, ScrollView, ActivityIndicator
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api'; 
import FloatingDock from '../../components/FloatingDock';

export default function HistoryScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('ALL'); 
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState([]); 

  // Fetch real data from MongoDB
  useEffect(() => {
    const fetchAllLogs = async () => {
      try {
        const response = await api.get('/tracker/history');
        setLogs(response.data);
      } catch (error) {
        console.log("Error fetching history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (activeFilter === 'ALL') return true;
    return log.verdict === activeFilter;
  });

  // ✅ FIXED: Restored the missing color-coding function
  const getVerdictStyle = (verdict) => {
    switch(verdict) {
      case 'SPIKE': return { color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)', icon: 'warning' };
      case 'OPTIMAL': return { color: '#4ADE80', bg: 'rgba(34, 197, 94, 0.15)', icon: 'checkmark-circle' };
      case 'MODERATE': return { color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)', icon: 'remove-circle' };
      default: return { color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', icon: 'information-circle' };
    }
  };

  const renderLogItem = ({ item }) => {
    const style = getVerdictStyle(item.verdict);
    
    // Format MongoDB timestamp to readable time
    const dateObj = new Date(item.createdAt);
    const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

    return (
      <BlurView intensity={40} tint="dark" style={styles.logCard}>
        <View style={styles.logLeft}>
          <View style={[styles.iconBox, { backgroundColor: style.bg }]}>
            <Ionicons name={style.icon} size={20} color={style.color} />
          </View>
          <View>
            <Text style={styles.foodName}>{item.foodName}</Text>
            <Text style={styles.timeText}>{dateString} {'•'} {timeString}</Text>
          </View>
        </View>
        
        <View style={styles.logRight}>
          <Text style={styles.impactText}>
             {item.glucoseImpact > 0 ? '+' : ''}{item.glucoseImpact}
             <Text style={{fontSize: 10, color: 'rgba(255,255,255,0.5)'}}> mg/dL</Text>
          </Text>
          <View style={[styles.badge, { backgroundColor: style.bg }]}>
            <Text style={[styles.badgeText, { color: style.color }]}>{item.verdict}</Text>
          </View>
        </View>
      </BlurView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Intelligence Logs</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', 'SPIKE', 'MODERATE', 'OPTIMAL'].map(filter => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterPill, activeFilter === filter && styles.activeFilterPill]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38BDF8" />
          <Text style={styles.loadingText}>Syncing Bio-Data...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item._id} // ✅ FIXED: MongoDB uses _id, not id
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyStateText}>No bio-logs found for this filter.</Text>
            </View>
          }
        />
      )}

      {/* ✅ FIXED: Removed the old hardcoded dock. We only use the dynamic one now. */}
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

  filterContainer: { paddingLeft: 24, paddingVertical: 16 },
  filterPill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 12 },
  activeFilterPill: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  filterText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  activeFilterText: { color: '#0F172A', fontWeight: '900' },

  listContainer: { paddingHorizontal: 24, paddingBottom: 140 }, 
  logCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.6)', marginBottom: 12 },
  logLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  foodName: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 4, textTransform: 'capitalize' },
  timeText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  logRight: { alignItems: 'flex-end' },
  impactText: { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 6 },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#38BDF8', marginTop: 12, fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyStateText: { color: 'rgba(255,255,255,0.4)', marginTop: 16, fontSize: 14, fontWeight: '600' },
});