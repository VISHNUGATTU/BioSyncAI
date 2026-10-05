import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Headset,
  Plus,
  Send,
  X,
  ChevronRight,
  Clock,
  MessageSquare,
  ArrowLeft,
  LifeBuoy,
  FileQuestion,
  Receipt,
  UserX,
  Cpu,
} from 'lucide-react-native';

import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import GlassCard from '../components/GlassCard';
import userApi from '../api/userApi';

const CATEGORIES = [
  { id: 'Appointment', label: 'Appointment Delay', icon: Clock },
  { id: 'Lab_Assistant', label: 'Phlebotomist Conduct', icon: UserX },
  { id: 'Payment', label: 'Billing / Payment', icon: Receipt },
  { id: 'Complaint', label: 'Report Discrepancy', icon: FileQuestion },
  { id: 'Technical_Issue', label: 'App / AI Tech Issue', icon: Cpu },
  { id: 'Other', label: 'General Inquiries', icon: LifeBuoy },
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const SupportScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Ticket Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Appointment');
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Thread Modal State
  const [activeTicket, setActiveTicket] = useState(null);
  const [threadModalVisible, setThreadModalVisible] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await userApi.getTickets();
      if (res?.success) {
        setTickets(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.warn('[SupportScreen] Fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async () => {
    if (!subject.trim()) {
      Alert.alert('Subject Required', 'Please enter a brief summary of the issue.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please provide details so our clinical support team can resolve it.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await userApi.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        ticketType: selectedCategory,
        priority: selectedPriority,
      });

      if (res?.success) {
        Alert.alert('Ticket Submitted', 'Your ticket has been logged. A support specialist will respond shortly.');
        setSubject('');
        setDescription('');
        setSelectedCategory('Appointment');
        setSelectedPriority('Medium');
        setCreateModalVisible(false);
        fetchTickets();
      } else {
        Alert.alert('Submission Error', res?.message || 'Failed to submit support ticket.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Error creating ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !activeTicket) return;

    setSendingReply(true);
    try {
      const res = await userApi.replyTicket(activeTicket._id, replyMessage.trim());
      if (res?.success) {
        setActiveTicket(res.data);
        setReplyMessage('');
        // Update local ticket list
        setTickets((prev) =>
          prev.map((t) => (t._id === res.data._id ? res.data : t))
        );
      } else {
        Alert.alert('Notice', res?.message || 'Could not send reply.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadgeConfig = (status) => {
    switch (status) {
      case 'Open':
        return { label: 'Open', color: colors.cyanLight, bg: 'rgba(6, 182, 212, 0.12)' };
      case 'In_Progress':
        return { label: 'In Progress', color: colors.amberLight, bg: 'rgba(245, 158, 11, 0.12)' };
      case 'Resolved':
        return { label: 'Resolved', color: colors.emeraldLight, bg: 'rgba(16, 185, 129, 0.12)' };
      case 'Closed':
        return { label: 'Closed', color: colors.textMuted, bg: 'rgba(255, 255, 255, 0.05)' };
      case 'Escalated':
        return { label: 'Escalated', color: colors.roseLight, bg: 'rgba(244, 63, 94, 0.15)' };
      default:
        return { label: status, color: colors.cyanLight, bg: 'rgba(6, 182, 212, 0.12)' };
    }
  };

  const openTicketThread = (ticket) => {
    setActiveTicket(ticket);
    setThreadModalVisible(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#ffffff" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Help & Support Desk</Text>
          <Text style={styles.headerSubtitle}>Direct communication with BioSync clinical ops</Text>
        </View>

        <TouchableOpacity
          style={styles.newTicketHeaderBtn}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#000000" strokeWidth={2.5} />
          <Text style={styles.newTicketHeaderBtnText}>New Ticket</Text>
        </TouchableOpacity>
      </View>

      {/* Main Ticket List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cyan} />
          <Text style={styles.loadingText}>Loading support tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchTickets(true)}
              tintColor={colors.cyan}
            />
          }
          renderItem={({ item }) => {
            const badge = getStatusBadgeConfig(item.status);
            const msgCount = (item.messages || []).length;
            const lastMsg = msgCount > 0 ? item.messages[msgCount - 1] : null;

            return (
              <TouchableOpacity
                onPress={() => openTicketThread(item)}
                activeOpacity={0.8}
              >
                <GlassCard style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.ticketSubject} numberOfLines={1}>
                        {item.subject}
                      </Text>
                      <Text style={styles.ticketCategory}>
                        {item.ticketType || 'Support'} • #{item._id.slice(-6).toUpperCase()}
                      </Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.ticketSnippet} numberOfLines={2}>
                    {lastMsg ? lastMsg.message : item.description}
                  </Text>

                  <View style={styles.ticketFooter}>
                    <View style={styles.ticketFooterLeft}>
                      <Clock size={11} color={colors.textMuted} />
                      <Text style={styles.ticketDate}>
                        {new Date(item.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>

                    <View style={styles.ticketFooterRight}>
                      <MessageSquare size={13} color={colors.cyan} />
                      <Text style={styles.ticketRepliesCount}>
                        {msgCount} {msgCount === 1 ? 'message' : 'messages'}
                      </Text>
                      <ChevronRight size={14} color={colors.textMuted} />
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Headset size={36} color={colors.cyan} />
              </View>
              <Text style={styles.emptyTitle}>No Support Tickets</Text>
              <Text style={styles.emptySubtitle}>
                Have questions about your sample pickup, phlebotomist arrival, or test results? Raise a ticket and our 24/7 clinical operations team will assist you.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setCreateModalVisible(true)}
                activeOpacity={0.85}
              >
                <Plus size={15} color="#000000" strokeWidth={2.5} />
                <Text style={styles.emptyActionBtnText}>CREATE YOUR FIRST TICKET</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 1: CREATE NEW TICKET                               */}
      {/* ======================================================== */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>New Support Request</Text>
                <Text style={styles.modalSubtitle}>Select issue type and provide clinical context</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setCreateModalVisible(false)}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Category Selector */}
              <Text style={styles.inputLabel}>CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const Icon = cat.icon;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catOption,
                        isSelected && styles.catOptionActive,
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                      activeOpacity={0.8}
                    >
                      <Icon
                        size={14}
                        color={isSelected ? '#000000' : colors.cyanLight}
                      />
                      <Text
                        style={[
                          styles.catOptionText,
                          isSelected && styles.catOptionTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Priority Selector */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>URGENCY / PRIORITY</Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => {
                  const isSelected = selectedPriority === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityPill,
                        isSelected && styles.priorityPillActive,
                      ]}
                      onPress={() => setSelectedPriority(p)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.priorityPillText,
                          isSelected && styles.priorityPillTextActive,
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Subject Input */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>SUBJECT</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Phlebotomist delayed by 30 mins"
                placeholderTextColor={colors.textMuted}
                value={subject}
                onChangeText={setSubject}
              />

              {/* Description Input */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>DETAILS & CONTEXT</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your issue in detail. Include appointment ID or phlebotomist details if applicable..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitTicketBtn, submitting && { opacity: 0.6 }]}
              onPress={handleCreateTicket}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <LifeBuoy size={16} color="#000000" strokeWidth={2.5} />
                  <Text style={styles.submitTicketBtnText}>SUBMIT TO OPERATIONS</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: TICKET THREAD & CONVERSATION                   */}
      {/* ======================================================== */}
      <Modal
        visible={threadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setThreadModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            {activeTicket && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {activeTicket.subject}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      Ticket #{activeTicket._id.slice(-6).toUpperCase()} • Status: {activeTicket.status}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setThreadModalVisible(false)}
                  >
                    <X size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Conversation List */}
                <ScrollView
                  style={styles.threadScroll}
                  contentContainerStyle={{ paddingVertical: 10 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Original Description Card */}
                  <View style={styles.originalIssueBox}>
                    <Text style={styles.originalIssueLabel}>Original Issue Report:</Text>
                    <Text style={styles.originalIssueBody}>{activeTicket.description}</Text>
                    <Text style={styles.originalIssueDate}>
                      {new Date(activeTicket.createdAt).toLocaleString()}
                    </Text>
                  </View>

                  {/* Message Thread */}
                  {(activeTicket.messages || []).map((msg, index) => {
                    const isUser = msg.senderRole === 'User';
                    return (
                      <View
                        key={msg._id || index}
                        style={[
                          styles.chatBubble,
                          isUser ? styles.chatBubbleUser : styles.chatBubbleStaff,
                        ]}
                      >
                        <Text style={styles.chatSender}>
                          {isUser ? 'You' : msg.senderName || 'Clinical Support'}
                        </Text>
                        <Text style={styles.chatText}>{msg.message}</Text>
                        <Text style={styles.chatTime}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Reply Bar */}
                {activeTicket.status !== 'Closed' ? (
                  <View style={styles.replyBar}>
                    <TextInput
                      style={styles.replyInput}
                      placeholder="Type your response..."
                      placeholderTextColor={colors.textMuted}
                      value={replyMessage}
                      onChangeText={setReplyMessage}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendReplyBtn,
                        (!replyMessage.trim() || sendingReply) && { opacity: 0.5 },
                      ]}
                      onPress={handleSendReply}
                      disabled={!replyMessage.trim() || sendingReply}
                      activeOpacity={0.8}
                    >
                      {sendingReply ? (
                        <ActivityIndicator size="small" color="#000000" />
                      ) : (
                        <Send size={15} color="#000000" />
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.ticketClosedBanner}>
                    <Text style={styles.ticketClosedText}>
                      This ticket is closed. Submit a new ticket if you need further help.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  newTicketHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cyan,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  newTicketHeaderBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 10,
  },
  ticketCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
    padding: 14,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  ticketCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  ticketSnippet: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  ticketFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  ticketFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketRepliesCount: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.cyanLight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cyan,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121214',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.cyanLight,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catOptionActive: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyanLight,
  },
  catOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  catOptionTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  priorityPillActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: colors.cyan,
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  priorityPillTextActive: {
    color: colors.cyanLight,
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#ffffff',
  },
  textArea: {
    minHeight: 85,
    textAlignVertical: 'top',
  },
  submitTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.cyan,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  submitTicketBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  threadScroll: {
    maxHeight: 340,
  },
  originalIssueBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  originalIssueLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  originalIssueBody: {
    fontSize: 12,
    color: '#ffffff',
    lineHeight: 17,
  },
  originalIssueDate: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 6,
  },
  chatBubble: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    maxWidth: '85%',
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  chatBubbleStaff: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  chatSender: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.cyanLight,
    marginBottom: 3,
  },
  chatText: {
    fontSize: 12,
    color: '#ffffff',
    lineHeight: 16,
  },
  chatTime: {
    fontSize: 9,
    color: colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: '#ffffff',
  },
  sendReplyBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketClosedBanner: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  ticketClosedText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});

export default SupportScreen;
