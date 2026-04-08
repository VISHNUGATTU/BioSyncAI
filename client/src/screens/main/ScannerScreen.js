import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert, Platform
} from 'react-native';
// ✅ FIXED: Imported useMicrophonePermissions
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import api from '../../services/api';
import BookingScreen from './BookingScreen';

export default function ScannerScreen({ navigation }) {
  // ✅ FIXED: Added microphone state
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const cameraRef = useRef(null);

  // 1. Wait for both permissions to load
  if (!cameraPermission || !micPermission) return <View style={styles.container} />;
  
  // 2. If either permission is denied, ask for them
  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Optical & Audio Sensors Required</Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 }}>
          BioSync AI requires both Camera and Microphone access to process live video streams.
        </Text>
        <TouchableOpacity 
          style={styles.permissionBtn} 
          onPress={() => {
            requestCameraPermission();
            requestMicPermission();
          }}
        >
          <Text style={styles.permissionBtnText}>GRANT SENSOR ACCESS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const startRecording = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({ maxDuration: 4 });
        setIsRecording(false);
        processVideo(video.uri);
      } catch (error) {
        setIsRecording(false);
        console.log("Record Error:", error);
        Alert.alert("Error", "Recording failed. Please try again.");
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const processVideo = async (videoUri) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri: videoUri, name: 'scan.mp4', type: 'video/mp4' });

      const response = await api.post('/tracker/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const aiData = response.data.aiData; 
      setAnalysisResult(aiData);
      
      Speech.speak(aiData.dictationScript, { language: 'en', pitch: 0.9, rate: 1.1 });

    } catch (error) {
      console.log("Upload Error", error.response?.data || error.message);
      
      // ✅ NEW: The Interceptor!
      if (error.response?.data?.actionRequired === 'BOOK_CONSULTANT') {
        // Stop analyzing and immediately push them to the Booking Screen
        setIsAnalyzing(false);
        navigation.navigate('BookingScreen');
      } else {
        Alert.alert("Neural Link Failed", "Could not process video stream.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />

      {analysisResult ? (
        <View style={styles.resultsContainer}>
          <BlurView intensity={80} tint="dark" style={styles.resultsCard}>
            <Text style={styles.verdictTitle}>{analysisResult.verdict}</Text>
            <Text style={styles.quantityText}>Approved: {analysisResult.recommendedQuantity}</Text>
            
            <View style={styles.divider} />
            <Text style={styles.dataLabel}>IDENTIFIED:</Text>
            <Text style={styles.dataValue}>{analysisResult.itemsFound.join(', ')}</Text>
            
            <Text style={styles.dataLabel}>IMPACT IF EATEN:</Text>
            <Text style={styles.dataValue}>{analysisResult.eatImpact}</Text>
            
            <Text style={styles.dataLabel}>IMPACT IF SKIPPED:</Text>
            <Text style={styles.dataValue}>{analysisResult.skipImpact}</Text>

            <TouchableOpacity 
              style={styles.resetBtn} 
              onPress={() => { Speech.stop(); setAnalysisResult(null); navigation.navigate('DashboardScreen'); }}
            >
              <Text style={styles.resetBtnText}>ACKNOWLEDGE</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      ) : (
        <View style={StyleSheet.absoluteFillObject}>
          <CameraView style={StyleSheet.absoluteFillObject} facing="back" mode="video" ref={cameraRef} />

          <View style={styles.overlayContainer}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
              {isRecording ? <Text style={styles.recordingText}>REC •</Text> : null}
            </View>

            {isAnalyzing ? (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="large" color="#38BDF8" />
                <Text style={styles.analyzingText}>PROCESSING VIDEO STREAM...</Text>
              </View>
            ) : (
              <View style={styles.bottomBarCamera}>
                <Text style={styles.instructionText}>HOLD TO RECORD BIO-MATTER</Text>
                <TouchableOpacity 
                  style={[styles.shutterRing, isRecording && styles.shutterRingActive]}
                  onPressIn={startRecording}
                  onPressOut={stopRecording}
                >
                  <View style={[styles.shutterButton, isRecording && styles.shutterButtonActive]} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  permissionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  permissionBtn: { backgroundColor: '#38BDF8', padding: 16, borderRadius: 12 },
  permissionBtnText: { color: '#0F172A', fontWeight: '900' },

  overlayContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, paddingTop: 40 },
  recordingText: { color: '#EF4444', fontWeight: '900', fontSize: 18, letterSpacing: 2 },
  
  bottomBarCamera: { width: '100%', alignItems: 'center', paddingBottom: 40 },
  instructionText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginBottom: 20 },
  shutterRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center' },
  shutterRingActive: { borderColor: '#EF4444' },
  shutterButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  shutterButtonActive: { backgroundColor: '#EF4444', width: 40, height: 40, borderRadius: 10 },

  analyzingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  analyzingText: { color: '#38BDF8', fontWeight: 'bold', marginTop: 16, letterSpacing: 1.5 },

  resultsContainer: { flex: 1, justifyContent: 'flex-end', padding: 24, paddingBottom: 40, backgroundColor: '#020617' },
  resultsCard: { padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#38BDF8' },
  verdictTitle: { color: '#fff', fontSize: 32, fontWeight: '900' },
  quantityText: { color: '#4ADE80', fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 16 },
  dataLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 4 },
  dataValue: { color: '#fff', fontSize: 14, marginBottom: 16, lineHeight: 20 },
  resetBtn: { backgroundColor: '#38BDF8', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  resetBtnText: { color: '#0F172A', fontWeight: '900', letterSpacing: 1 }
});