import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Trash2,
  Activity,
  Heart,
  Wind,
  Gauge,
  Utensils,
  Bluetooth,
  Calendar,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react-native';

import { colors, gradients } from '../theme/colors';
import GlassCard from '../components/GlassCard';
import userApi from '../api/userApi';

export default function ChatbotScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [biomarkerSnapshot, setBiomarkerSnapshot] = useState(null);

  const flatListRef = useRef(null);

  // Twin pulse orb animation
  const orbScale = useRef(new Animated.Value(1)).current;
  const orbOpacity = useRef(new Animated.Value(0.3)).current;

  // Typing dots animation
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for AI twin orb
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orbScale, {
            toValue: 1.45,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(orbOpacity, {
            toValue: 0.1,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orbScale, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(orbOpacity, {
            toValue: 0.35,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Typing dots loop
    const animateDots = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1, { toValue: -6, duration: 250, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: -6, duration: 250, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: -6, duration: 250, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0, duration: 250, useNativeDriver: true }),
        ])
      ).start();
    };
    animateDots();
  }, [orbScale, orbOpacity, dot1, dot2, dot3]);

  // Load chat history & dynamic suggestions on mount
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const [histRes, suggRes] = await Promise.allSettled([
          userApi.getChatHistory({ limit: 50 }),
          userApi.getChatSuggestions(),
        ]);

        if (isMounted) {
          if (histRes.status === 'fulfilled' && histRes.value?.success) {
            setMessages(histRes.value.messages || []);
          }

          if (suggRes.status === 'fulfilled' && suggRes.value?.success) {
            setSuggestions(suggRes.value.suggestions || []);
            setBiomarkerSnapshot(suggRes.value.biomarkerSnapshot || null);
          }
        }
      } catch (err) {
        console.warn('[ChatbotScreen] Load initial data notice:', err?.message || err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSendMessage = useCallback(async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setInputText('');

    // Optimistically add user message to thread
    const optimisticUserMsg = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setLoading(true);

    try {
      const res = await userApi.sendChatMessage(text);
      if (res?.success && res.message) {
        setMessages((prev) => {
          // Replace temp or append verified response
          const filtered = prev.filter((m) => m._id !== optimisticUserMsg._id);
          return [
            ...filtered,
            { ...optimisticUserMsg, _id: `user-${Date.now()}` },
            {
              ...res.message,
              suggestedActions: res.suggestedActions || res.message.suggestedActions || [],
              followUpQuestions: res.followUpQuestions || [],
            },
          ];
        });

        if (res.biomarkerContext) {
          setBiomarkerSnapshot(res.biomarkerContext);
        }
      }
    } catch (err) {
      console.warn('[ChatbotScreen] Send error:', err);
      // Append localized assistant error recovery
      setMessages((prev) => [
        ...prev,
        {
          _id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'I apologize, but I encountered a momentary connection interruption while synthesizing your biomarkers. Please try asking again.',
          modelUsed: 'BioSync Offline Fallback',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [inputText, loading]);

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Conversation Thread',
      'Are you sure you want to delete all previous conversation messages? Your biomarker health logs will remain intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await userApi.clearChatHistory();
              setMessages([]);
            } catch (e) {
              Alert.alert('Notice', 'Could not clear chat history at this time.');
            }
          },
        },
      ]
    );
  };

  const handleActionPress = (action) => {
    if (!action) return;
    switch (action.actionType) {
      case 'NAVIGATE_SCAN':
        navigation.navigate('Scan');
        break;
      case 'NAVIGATE_WEARABLE':
        navigation.navigate('WearableSync');
        break;
      case 'NAVIGATE_BOOKING':
        navigation.navigate('BookAppointment');
        break;
      case 'NAVIGATE_VITALS':
        navigation.navigate('Analysis');
        break;
      default:
        break;
    }
  };

  // Render markdown-like text with bold highlighting and clean line breaks
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');

    return lines.map((line, lineIdx) => {
      // Split on bold markdown **words**
      const parts = line.split(/(\*\*.*?\*\*)/g);

      return (
        <Text key={`line-${lineIdx}`} style={styles.assistantTextLine}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <Text key={`b-${partIdx}`} style={styles.boldText}>
                  {part.slice(2, -2)}
                </Text>
              );
            }
            return (
              <Text key={`p-${partIdx}`} style={styles.regularText}>
                {part}
              </Text>
            );
          })}
        </Text>
      );
    });
  };

  const renderMessageItem = ({ item }) => {
    const isUser = item.role === 'user';

    if (isUser) {
      return (
        <View style={styles.userMessageRow}>
          <LinearGradient
            colors={['#0891b2', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userBubble}
          >
            <Text style={styles.userText}>{item.content}</Text>
          </LinearGradient>
        </View>
      );
    }

    return (
      <View style={styles.assistantMessageRow}>
        <View style={styles.assistantAvatar}>
          <LinearGradient colors={gradients.cyanBlue} style={styles.avatarGradient}>
            <Sparkles size={13} color="#ffffff" />
          </LinearGradient>
        </View>

        <View style={styles.assistantContentWrap}>
          <GlassCard style={styles.assistantBubble}>
            {/* Header info */}
            <View style={styles.assistantHeader}>
              <Text style={styles.assistantName}>BioSync Clinical Twin</Text>
              <Text style={styles.modelTag}>
                {item.modelUsed?.includes('gemini') ? 'Gemini 2.5 Flash' : 'Clinical RAG'}
              </Text>
            </View>

            {/* Content text */}
            <View style={styles.bodyWrap}>{renderFormattedText(item.content)}</View>

            {/* Referenced Biomarkers Pill Row if present */}
            {item.biomarkerContext && (
              <View style={styles.biomarkerPillsRow}>
                {item.biomarkerContext.glucoseFasting != null && (
                  <View style={styles.biomarkerPill}>
                    <Activity size={10} color="#f59e0b" />
                    <Text style={styles.biomarkerPillText}>
                      Glucose: {item.biomarkerContext.glucoseFasting} mg/dL
                    </Text>
                  </View>
                )}
                {item.biomarkerContext.hba1c != null && (
                  <View style={styles.biomarkerPill}>
                    <Text style={[styles.biomarkerPillText, { color: '#ef4444' }]}>
                      HbA1c: {item.biomarkerContext.hba1c}%
                    </Text>
                  </View>
                )}
                {item.biomarkerContext.systolic != null && (
                  <View style={styles.biomarkerPill}>
                    <Gauge size={10} color="#3b82f6" />
                    <Text style={styles.biomarkerPillText}>
                      BP: {item.biomarkerContext.systolic}/{item.biomarkerContext.diastolic}
                    </Text>
                  </View>
                )}
                {item.biomarkerContext.restingHeartRate != null && (
                  <View style={styles.biomarkerPill}>
                    <Heart size={10} color="#ec4899" />
                    <Text style={styles.biomarkerPillText}>
                      HR: {item.biomarkerContext.restingHeartRate} BPM
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons if provided */}
            {item.suggestedActions && item.suggestedActions.length > 0 && (
              <View style={styles.actionButtonsWrap}>
                {item.suggestedActions.map((action, aIdx) => (
                  <TouchableOpacity
                    key={`act-${aIdx}`}
                    style={styles.actionPillBtn}
                    onPress={() => handleActionPress(action)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionBtnLeft}>
                      {action.actionType === 'NAVIGATE_SCAN' && <Utensils size={12} color="#06b6d4" />}
                      {action.actionType === 'NAVIGATE_WEARABLE' && <Bluetooth size={12} color="#06b6d4" />}
                      {action.actionType === 'NAVIGATE_BOOKING' && <Calendar size={12} color="#06b6d4" />}
                      {action.actionType === 'NAVIGATE_VITALS' && <Activity size={12} color="#06b6d4" />}
                      <Text style={styles.actionBtnText}>{action.title}</Text>
                    </View>
                    <ChevronRight size={13} color="#06b6d4" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </GlassCard>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <LinearGradient colors={[colors.bgDark, colors.bgSurface]} style={styles.background}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <View style={styles.avatarPulsingWrap}>
              <Animated.View
                style={[
                  styles.pulsingRing,
                  {
                    transform: [{ scale: orbScale }],
                    opacity: orbOpacity,
                  },
                ]}
              />
              <LinearGradient colors={gradients.cyanBlue} style={styles.headerAvatar}>
                <Bot size={15} color="#ffffff" />
              </LinearGradient>
            </View>
            <View>
              <Text style={styles.headerTitle}>BioSync Health Companion</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.statusText}>Grounded Clinical Twin • Gemini 2.5</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClearHistory}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Live Biomarkers Snapshot Strip */}
        {biomarkerSnapshot && (
          <View style={styles.biomarkerStrip}>
            <View style={styles.stripMetric}>
              <Text style={styles.stripLabel}>GLUCOSE</Text>
              <Text style={[styles.stripVal, { color: '#f59e0b' }]}>
                {biomarkerSnapshot.glucoseFasting || '--'} <Text style={styles.stripUnit}>mg/dL</Text>
              </Text>
            </View>
            <View style={styles.stripDivider} />
            <View style={styles.stripMetric}>
              <Text style={styles.stripLabel}>HBA1C</Text>
              <Text style={[styles.stripVal, { color: '#ef4444' }]}>
                {biomarkerSnapshot.hba1c || '--'} <Text style={styles.stripUnit}>%</Text>
              </Text>
            </View>
            <View style={styles.stripDivider} />
            <View style={styles.stripMetric}>
              <Text style={styles.stripLabel}>PRESSURE</Text>
              <Text style={[styles.stripVal, { color: '#3b82f6' }]}>
                {biomarkerSnapshot.systolic || '--'}/{biomarkerSnapshot.diastolic || '--'}
              </Text>
            </View>
            <View style={styles.stripDivider} />
            <View style={styles.stripMetric}>
              <Text style={styles.stripLabel}>PULSE</Text>
              <Text style={[styles.stripVal, { color: '#ec4899' }]}>
                {biomarkerSnapshot.restingHeartRate || '--'} <Text style={styles.stripUnit}>BPM</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Messages List */}
        {initialLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#06b6d4" />
            <Text style={styles.loadingText}>Synchronizing clinical biomarkers...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item, index) => item._id || `msg-${index}`}
            contentContainerStyle={styles.messagesListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <LinearGradient colors={gradients.cyanBlue} style={styles.emptyIconCircle}>
                  <Bot size={28} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.emptyTitle}>Personalized AI Health Companion</Text>
                <Text style={styles.emptySubtitle}>
                  Trained on your real-time continuous vitals, NABL lab assays, and dietary logs. Ask
                  questions regarding your blood sugar, cardiovascular health, or meal impacts.
                </Text>
              </View>
            }
          />
        )}

        {/* Typing indicator */}
        {loading && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
              <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
              <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
            </View>
            <Text style={styles.typingText}>Reasoning over your clinical biomarkers...</Text>
          </View>
        )}

        {/* Suggestion Prompt Chips */}
        {suggestions.length > 0 && !loading && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={suggestions}
              keyExtractor={(item, idx) => `sugg-${idx}`}
              contentContainerStyle={styles.suggestionsContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => handleSendMessage(item)}
                  activeOpacity={0.7}
                >
                  <Sparkles size={11} color="#06b6d4" />
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about diet, glucose, BP, lab reports..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={600}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !inputText.trim() || loading
                  ? ['#1e293b', '#1e293b']
                  : ['#0891b2', '#06b6d4']
              }
              style={styles.sendGradient}
            >
              <Send size={15} color={!inputText.trim() || loading ? '#475569' : '#ffffff'} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarPulsingWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsingRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#06b6d4',
  },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biomarkerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 182, 212, 0.2)',
  },
  stripMetric: {
    alignItems: 'center',
  },
  stripLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  stripVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  stripUnit: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '600',
  },
  stripDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  messagesListContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 28,
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: '#94a3b8',
    textAlign: 'center',
  },
  userMessageRow: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    marginBottom: 12,
  },
  userBubble: {
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: {
    fontSize: 13.5,
    color: '#ffffff',
    lineHeight: 19,
    fontWeight: '500',
  },
  assistantMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '92%',
    marginBottom: 14,
    gap: 8,
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    marginTop: 2,
  },
  avatarGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantContentWrap: {
    flex: 1,
  },
  assistantBubble: {
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  assistantName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#22d3ee',
  },
  modelTag: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bodyWrap: {
    gap: 4,
  },
  assistantTextLine: {
    fontSize: 13,
    lineHeight: 19,
    color: '#e2e8f0',
  },
  regularText: {
    color: '#e2e8f0',
  },
  boldText: {
    fontWeight: '800',
    color: '#ffffff',
  },
  biomarkerPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  biomarkerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  biomarkerPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },
  actionButtonsWrap: {
    marginTop: 10,
    gap: 6,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#22d3ee',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  typingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#06b6d4',
  },
  typingText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  suggestionsContainer: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionsContent: {
    paddingHorizontal: 14,
    gap: 6,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  suggestionText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 13,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
