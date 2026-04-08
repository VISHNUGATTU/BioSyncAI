import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, TextInput, ScrollView, ActivityIndicator, Alert, Platform, KeyboardAvoidingView
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function BookingScreen({ navigation }) {
  // --- Address State ---
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  const [phone, setPhone] = useState('');

  // --- Date/Time State ---
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);

  // Generate the next 4 days dynamically
  useEffect(() => {
    const dates = [];
    for (let i = 1; i <= 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        id: i,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }), 
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
        fullDate: d.toISOString()
      });
    }
    setAvailableDates(dates);
    setSelectedDate(dates[0].fullDate); 
  }, []);

  const timeSlots = ['07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM'];

  const handleBook = async () => {
    if (!houseNo || !street || !stateName || !pincode || !phone || !selectedDate || !selectedTime) {
      return Alert.alert("Missing Information", "Please fill out all dispatch details and select a time.");
    }
    
    setIsBooking(true);
    try {
      const appointmentStr = `${selectedDate.split('T')[0]} at ${selectedTime}`;
      
      // Package the address into the structured object the DB expects
      const addressPayload = { houseNo, street, state: stateName, pincode, country, phone };

      await api.post('/appointment/book', { 
        address: addressPayload, 
        scheduledDate: appointmentStr 
      });
      
      Alert.alert("Consultant Dispatched", "A medical assistant has been assigned. Please remember to fast!");
      navigation.navigate('DashboardScreen');
    } catch (error) {
      Alert.alert("Booking Failed", "Could not schedule the consultant.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.glowCircle1} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clinical Dispatch</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.iconContainer}>
            <Ionicons name="water-outline" size={50} color="#FBBF24" />
          </View>

          <Text style={styles.title}>Baseline Required</Text>
          <Text style={styles.subtitle}>
            Your Neural Engine is locked. We must establish your clinical baseline (HbA1c & Lipids) before predicting glucose responses.
          </Text>

          {/* --- FASTING WARNING --- */}
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={24} color="#FBBF24" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>10-HOUR FASTING REQUIRED</Text>
              <Text style={styles.warningText}>
                Do not consume food or beverages (except water) for 10 hours prior to your selected morning time slot.
              </Text>
            </View>
          </View>

          {/* --- DETAILED ADDRESS FORM --- */}
          <Text style={styles.sectionTitle}>DISPATCH LOCATION</Text>
          <BlurView intensity={40} tint="dark" style={styles.formCard}>
            
            <View style={styles.inputRow}>
              <View style={styles.halfInputContainer}>
                <Text style={styles.inputLabel}>H.NO / FLAT / BLDG</Text>
                <TextInput style={styles.input} value={houseNo} onChangeText={setHouseNo} placeholder="Apt 4B" placeholderTextColor="rgba(255,255,255,0.3)" />
              </View>
              <View style={styles.halfInputContainer}>
                <Text style={styles.inputLabel}>CONTACT NUMBER</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 999..." placeholderTextColor="rgba(255,255,255,0.3)" />
              </View>
            </View>

            <Text style={styles.inputLabel}>STREET / LOCALITY</Text>
            <TextInput style={styles.input} value={street} onChangeText={setStreet} placeholder="Jubilee Hills, Road No. 36" placeholderTextColor="rgba(255,255,255,0.3)" />

            <View style={styles.inputRow}>
              <View style={styles.halfInputContainer}>
                <Text style={styles.inputLabel}>STATE</Text>
                <TextInput style={styles.input} value={stateName} onChangeText={setStateName} placeholder="Telangana" placeholderTextColor="rgba(255,255,255,0.3)" />
              </View>
              <View style={styles.halfInputContainer}>
                <Text style={styles.inputLabel}>PINCODE</Text>
                <TextInput style={styles.input} value={pincode} onChangeText={setPincode} keyboardType="numeric" placeholder="500033" placeholderTextColor="rgba(255,255,255,0.3)" />
              </View>
            </View>

            <Text style={styles.inputLabel}>COUNTRY</Text>
            <TextInput style={[styles.input, { color: 'rgba(255,255,255,0.5)' }]} value={country} editable={false} />

          </BlurView>

          {/* --- DATE / TIME SELECTION --- */}
          <Text style={styles.sectionTitle}>SELECT DATE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {availableDates.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.dateCard, selectedDate === item.fullDate && styles.dateCardActive]}
                onPress={() => setSelectedDate(item.fullDate)}
              >
                <Text style={[styles.dayText, selectedDate === item.fullDate && styles.activeText]}>{item.dayName}</Text>
                <Text style={[styles.dateText, selectedDate === item.fullDate && styles.activeText]}>{item.dateStr}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>MORNING TIME SLOTS</Text>
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity 
                key={time} 
                style={[styles.timeSlot, selectedTime === time && styles.timeSlotActive]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[styles.timeText, selectedTime === time && styles.activeText]}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.bookButton} onPress={handleBook} disabled={isBooking}>
            {isBooking ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.bookButtonText}>SCHEDULE BLOOD DRAW</Text>}
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  glowCircle1: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(251, 191, 36, 0.08)', top: -100, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 10 },
  headerIcon: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  content: { paddingHorizontal: 24 },
  
  iconContainer: { alignItems: 'center', marginTop: 10, marginBottom: 10 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 10 },
  
  warningBox: { flexDirection: 'row', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)', padding: 16, borderRadius: 16, marginBottom: 24, alignItems: 'center' },
  warningTitle: { color: '#FBBF24', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  warningText: { color: 'rgba(251, 191, 36, 0.8)', fontSize: 12, lineHeight: 18 },

  sectionTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 12, marginLeft: 4 },
  
  formCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.85)', marginBottom: 24 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInputContainer: { width: '47%' },
  inputLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 6 },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16 },

  dateScroll: { marginBottom: 24 },
  dateCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, marginRight: 12, alignItems: 'center', width: 90 },
  dateCardActive: { backgroundColor: '#FBBF24', borderColor: '#FBBF24' },
  dayText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  dateText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  timeSlot: { width: '48%', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  timeSlotActive: { backgroundColor: '#FBBF24', borderColor: '#FBBF24' },
  timeText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 'bold' },
  
  activeText: { color: '#0F172A' },

  bookButton: { backgroundColor: '#FBBF24', width: '100%', paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#FBBF24', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  bookButtonText: { color: '#0F172A', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});