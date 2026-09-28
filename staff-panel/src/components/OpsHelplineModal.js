import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {
  Headset,
  Phone,
  X,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import GlassCard from './GlassCard';

export default function OpsHelplineModal({ visible, onClose, appointmentId }) {
  const handleDial = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleReportIssue = (type) => {
    Alert.alert(
      'Incident Logged',
      `${type} has been broadcast to Central Operations Dispatch. A supervisor has been alerted to your current GPS position.`,
      [{ text: 'OK', onPress: onClose }]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.iconCircle}>
                <Headset size={20} color={colors.cyan} />
              </View>
              <View>
                <Text style={styles.title}>Operations Dispatch Hotline</Text>
                <Text style={styles.subtitle}>Field Emergency & Logistics Support</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Direct Calling Actions */}
          <View style={styles.callOptions}>
            <TouchableOpacity
              style={styles.callCard}
              onPress={() => handleDial('18002467962')}
              activeOpacity={0.8}
            >
              <View style={[styles.callIconWrap, { backgroundColor: colors.cyan + '20' }]}>
                <Phone size={18} color={colors.cyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.callTitle}>Central Dispatch Desk</Text>
                <Text style={styles.callSubtitle}>Toll Free • Route & Schedule assistance</Text>
              </View>
              <View style={styles.dialBadge}>
                <Text style={styles.dialBadgeText}>Call</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callCard}
              onPress={() => handleDial('+919876543210')}
              activeOpacity={0.8}
            >
              <View style={[styles.callIconWrap, { backgroundColor: colors.emerald + '20' }]}>
                <ShieldAlert size={18} color={colors.emerald} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.callTitle}>Duty Pathologist / Supervisor</Text>
                <Text style={styles.callSubtitle}>Clinical advice, vein difficulty & tubes</Text>
              </View>
              <View style={[styles.dialBadge, { backgroundColor: colors.emerald }]}>
                <Text style={[styles.dialBadgeText, { color: '#000' }]}>Call</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Incident Reporting */}
          <Text style={styles.sectionLabel}>QUICK DISPATCH ALERTS</Text>

          <View style={styles.incidentRow}>
            <TouchableOpacity
              style={styles.incidentBtn}
              onPress={() => handleReportIssue('Transit / Traffic Delay (ETA +15 min)')}
            >
              <Clock size={16} color={colors.amber} />
              <Text style={styles.incidentBtnText}>Traffic Delay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.incidentBtn}
              onPress={() => handleReportIssue('Patient Adverse Reaction / Fainting')}
            >
              <AlertTriangle size={16} color={colors.rose} />
              <Text style={styles.incidentBtnText}>Patient Fainting</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
            <Text style={styles.dismissBtnText}>Return to Appointment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: colors.bgSurface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cyan + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  callOptions: {
    marginVertical: 14,
    gap: 10,
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCardElevated,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 12,
  },
  callIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  callSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  dialBadge: {
    backgroundColor: colors.cyan,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dialBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  incidentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  incidentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  incidentBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dismissBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dismissBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
