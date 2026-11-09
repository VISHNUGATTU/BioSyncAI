import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet
} from 'react-native';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  TrendingUp,
  Footprints,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Utensils,
  Globe
} from 'lucide-react-native';
import { voiceApi } from '../api/voiceApi';

export default function VernacularVoiceScreen({ navigation }) {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [transcript, setTranscript] = useState('Maine abhi do methi parathe aur ek katori dahi khayi');
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [activeTab, setActiveTab] = useState('FOOD_LOG'); // 'FOOD_LOG' or 'KITCHEN_COACH'

  // Kitchen Coach state
  const [potSize, setPotSize] = useState(1000);
  const [kitchenResult, setKitchenResult] = useState(null);

  const samplePrompts = {
    hi: 'Maine abhi do methi parathe aur ek katori dahi khayi',
    te: 'Nenu rendu ragi sankati mariyu chepala pulusu tinnanu',
    ta: 'Rendu idli oru cup sambar saptom',
    mr: 'Me don jowar bhakri aani pithla khalla',
    en: 'I just had two whole wheat rotis and one bowl of dal tadka'
  };

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setTranscript(samplePrompts[lang] || samplePrompts.hi);
    setSimulationResult(null);
  };

  const handleSimulateVoice = async () => {
    if (!transcript) {
      Alert.alert('Empty Speech', 'Please speak or enter a vernacular meal description.');
      return;
    }

    try {
      setLoading(true);
      const res = await voiceApi.parseVoiceTranscript(transcript, selectedLanguage);
      if (res.success) {
        setSimulationResult(res);
      }
    } catch (err) {
      Alert.alert('Voice Error', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunKitchenCoach = async () => {
    try {
      setLoading(true);
      const members = [
        { memberId: 'dadaji', name: 'Dadaji', clinicalProfile: { condition: 'Type_2_Diabetes', requiresPotassiumRestriction: true } },
        { memberId: 'papaji', name: 'Papaji', clinicalProfile: { condition: 'Hypertension' } },
        { memberId: 'aman', name: 'Aman', clinicalProfile: { condition: 'Athlete_Resistance' } }
      ];

      const res = await voiceApi.getKitchenAudioCoach(potSize, 'Hyderabadi Dum Biryani', members, selectedLanguage);
      if (res.success) {
        setKitchenResult(res);
      }
    } catch (err) {
      Alert.alert('Coach Error', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Globe size={14} color="#0D9488" />
          <Text style={styles.headerBadgeText}>Multilingual Indic Voice AI</Text>
        </View>
        <Text style={styles.title}>Vernacular Voice Assistant</Text>
        <Text style={styles.subtitle}>
          Speak naturally in your mother tongue for ambient food tracking and hands-free kitchen plating guidance.
        </Text>
      </View>

      {/* Mode Switcher Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'FOOD_LOG' && styles.tabButtonActive]}
          onPress={() => setActiveTab('FOOD_LOG')}
        >
          <Mic size={16} color={activeTab === 'FOOD_LOG' ? '#0D9488' : '#64748B'} />
          <Text style={[styles.tabButtonText, activeTab === 'FOOD_LOG' && styles.tabButtonTextActive]}>
            Voice Meal Logging
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'KITCHEN_COACH' && styles.tabButtonActive]}
          onPress={() => setActiveTab('KITCHEN_COACH')}
        >
          <Utensils size={16} color={activeTab === 'KITCHEN_COACH' ? '#0D9488' : '#64748B'} />
          <Text style={[styles.tabButtonText, activeTab === 'KITCHEN_COACH' && styles.tabButtonTextActive]}>
            Kitchen Audio Coach
          </Text>
        </TouchableOpacity>
      </View>

      {/* Language Selector Pills */}
      <View style={styles.langRow}>
        {[
          { code: 'hi', label: 'हिंदी (Hindi)' },
          { code: 'te', label: 'తెలుగు (Telugu)' },
          { code: 'ta', label: 'தமிழ் (Tamil)' },
          { code: 'mr', label: 'मराठी (Marathi)' },
          { code: 'en', label: 'English' }
        ].map((item) => (
          <TouchableOpacity
            key={item.code}
            style={[styles.langChip, selectedLanguage === item.code && styles.langChipActive]}
            onPress={() => handleLanguageChange(item.code)}
          >
            <Text style={[styles.langChipText, selectedLanguage === item.code && styles.langChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'FOOD_LOG' ? (
        <View>
          {/* Main Voice Recording Center */}
          <View style={styles.micCard}>
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonRecording]}
              onPress={() => setIsRecording(!isRecording)}
            >
              {isRecording ? <MicOff size={36} color="#FFFFFF" /> : <Mic size={36} color="#FFFFFF" />}
            </TouchableOpacity>

            <Text style={styles.micStatusText}>
              {isRecording ? 'Listening in your mother tongue...' : 'Tap microphone to speak'}
            </Text>
            <Text style={styles.micSubText}>
              Supports regional food names (Karela, Ragi Sankati, Sambar, Dahi) & volumetric units (Katori, Chammach)
            </Text>

            {/* Transcript Preview Box */}
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptLabel}>SPOKEN TRANSCRIPT:</Text>
              <Text style={styles.transcriptText}>"{transcript}"</Text>
            </View>

            {/* Process Button */}
            <TouchableOpacity
              style={styles.processButton}
              onPress={handleSimulateVoice}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Sparkles size={18} color="#FFFFFF" />
                  <Text style={styles.processButtonText}>Process In-Silico Forecast</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* In-Silico Biophysical Simulation Results */}
          {simulationResult && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle}>Biophysical Impact Analysis</Text>
                  <Text style={styles.resultSubtitle}>
                    {simulationResult.parsedItems?.map((p) => `${p.quantity} ${p.unit} ${p.spokenPhrase}`).join(', ')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.riskBadge,
                    simulationResult.glycemicForecast?.isSpikeHazard ? styles.riskBadgeAlert : styles.riskBadgeSafe
                  ]}
                >
                  <Text
                    style={[
                      styles.riskBadgeText,
                      simulationResult.glycemicForecast?.isSpikeHazard ? styles.riskBadgeTextAlert : styles.riskBadgeTextSafe
                    ]}
                  >
                    {simulationResult.glycemicForecast?.glycemicRiskCategory?.replace('_', ' ') || 'SAFE'}
                  </Text>
                </View>
              </View>

              {/* Peak & Ambulation Grid */}
              <View style={styles.metricGrid}>
                <View style={styles.metricBox}>
                  <TrendingUp size={20} color="#0D9488" />
                  <Text style={styles.metricVal}>
                    {Math.round(simulationResult.glycemicForecast?.predictedPeakGlucose || 150)} mg/dL
                  </Text>
                  <Text style={styles.metricLabel}>Predicted Peak</Text>
                </View>

                <View style={styles.metricBox}>
                  <Footprints size={20} color="#2563EB" />
                  <Text style={styles.metricVal}>
                    {simulationResult.ambulationPrescription?.targetStepCount || 1980}
                  </Text>
                  <Text style={styles.metricLabel}>Target GLUT-4 Steps</Text>
                </View>

                <View style={styles.metricBox}>
                  <Clock size={20} color="#D97706" />
                  <Text style={styles.metricVal}>
                    {simulationResult.ambulationPrescription?.recommendedWalkMinutes || 18} min
                  </Text>
                  <Text style={styles.metricLabel}>Walk Duration</Text>
                </View>
              </View>

              {/* Spoken Vernacular Audio Feedback Display */}
              <View style={styles.audioFeedbackCard}>
                <View style={styles.audioFeedbackHeader}>
                  <Volume2 size={18} color="#0F766E" />
                  <Text style={styles.audioFeedbackTitle}>Synthesized Vernacular Voice Directive</Text>
                </View>
                <Text style={styles.audioScriptText}>
                  "{simulationResult.spokenAudioScript}"
                </Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        /* Kitchen Audio Coach View */
        <View style={styles.kitchenCard}>
          <Text style={styles.kitchenTitle}>Hands-Free Joint Family Kitchen Plating Coach</Text>
          <Text style={styles.kitchenSub}>
            Directs Mummyji or the home cook step-by-step through voice chimes to safely plate single-pot meals.
          </Text>

          <View style={styles.potRow}>
            <Text style={styles.potLabel}>Pot Weight: 1000g Hyderabadi Dum Biryani</Text>
            <TouchableOpacity style={styles.coachButton} onPress={handleRunKitchenCoach} disabled={loading}>
              <Volume2 size={16} color="#FFFFFF" />
              <Text style={styles.coachButtonText}>Start Voice Coaching</Text>
            </TouchableOpacity>
          </View>

          {kitchenResult && (
            <View style={styles.directivesList}>
              <Text style={styles.directivesHeading}>Spoken Step-by-Step Instructions:</Text>
              {kitchenResult.spokenStepByStepDirectives?.map((dir, idx) => (
                <View key={idx} style={styles.directiveItem}>
                  <View style={styles.stepNumBadge}>
                    <Text style={styles.stepNumText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.directiveText}>{dir}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contentContainer: { padding: 16 },
  header: { marginBottom: 16 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: '#0F766E', marginLeft: 6 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10
  },
  tabButtonActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  tabButtonText: { fontSize: 13, fontWeight: '600', color: '#64748B', marginLeft: 6 },
  tabButtonTextActive: { color: '#0D9488', fontWeight: '700' },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    marginBottom: 6
  },
  langChipActive: { backgroundColor: '#0D9488' },
  langChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  langChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  micCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 14
  },
  micButtonRecording: { backgroundColor: '#E11D48', shadowColor: '#E11D48' },
  micStatusText: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  micSubText: { fontSize: 12, color: '#64748B', textAlign: 'center', paddingHorizontal: 20, marginBottom: 14 },
  transcriptBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 14
  },
  transcriptLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 0.5, marginBottom: 4 },
  transcriptText: { fontSize: 14, fontWeight: '600', color: '#1E293B', fontStyle: 'italic' },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24
  },
  processButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginLeft: 8 },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  resultTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  resultSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  riskBadgeAlert: { backgroundColor: '#FEE2E2' },
  riskBadgeSafe: { backgroundColor: '#DCFCE7' },
  riskBadgeText: { fontSize: 10, fontWeight: '800' },
  riskBadgeTextAlert: { color: '#B91C1C' },
  riskBadgeTextSafe: { color: '#15803D' },
  metricGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  metricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4
  },
  metricVal: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 6 },
  metricLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },
  audioFeedbackCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1'
  },
  audioFeedbackHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  audioFeedbackTitle: { fontSize: 12, fontWeight: '700', color: '#0F766E', marginLeft: 6 },
  audioScriptText: { fontSize: 13, color: '#134E4A', lineHeight: 18, fontStyle: 'italic' },
  kitchenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  kitchenTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  kitchenSub: { fontSize: 12, color: '#64748B', marginBottom: 14 },
  potRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16
  },
  potLabel: { fontSize: 12, fontWeight: '700', color: '#334155', flex: 1 },
  coachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  coachButtonText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginLeft: 6 },
  directivesList: { marginTop: 10 },
  directivesHeading: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  directiveItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  stepNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2
  },
  stepNumText: { fontSize: 11, fontWeight: '800', color: '#0F766E' },
  directiveText: { fontSize: 13, color: '#334155', flex: 1, lineHeight: 18 }
});

