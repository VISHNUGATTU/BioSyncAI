import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  ShieldAlert,
  LogOut,
  AlertCircle,
  FileCheck2,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import GlassCard from '../components/GlassCard';

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of BioSync AI?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const isSuspended = user?.accountStatus === 'Suspended';
  const strikes = user?.strikeCount || 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient Profile</Text>
        <Text style={styles.headerSubtitle}>
          Verified biometric & diagnostic record identity
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <GlassCard style={styles.userCard}>
          <View style={styles.userAvatarCircle}>
            <User size={28} color={colors.cyan} />
          </View>
          <Text style={styles.userName}>{user?.name || 'BioSync Patient'}</Text>
          <Text style={styles.userPhone}>+91 {user?.phone || '9876543210'}</Text>
          {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
        </GlassCard>

        {/* NABL Account Standing & Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT COMPLIANCE</Text>
          <GlassCard
            style={[
              styles.complianceCard,
              isSuspended && styles.complianceCardSuspended,
            ]}
          >
            <View style={styles.complianceRow}>
              {isSuspended ? (
                <ShieldAlert size={20} color={colors.roseLight} />
              ) : (
                <Shield size={20} color={colors.emeraldLight} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.complianceTitle}>
                  Status: {user?.accountStatus || 'Active'}
                </Text>
                <Text style={styles.complianceSubtitle}>
                  {isSuspended
                    ? 'Account suspended due to repeated cancellation breaches.'
                    : 'NABL & ISO-15189 Verified Patient Identity'}
                </Text>
              </View>
            </View>

            <View style={styles.strikeRow}>
              <Text style={styles.strikeLabel}>Cancellation Strikes:</Text>
              <View style={styles.strikeDots}>
                <View
                  style={[
                    styles.strikeDot,
                    strikes >= 1 && styles.strikeDotActive,
                  ]}
                />
                <View
                  style={[
                    styles.strikeDot,
                    strikes >= 2 && styles.strikeDotActive,
                  ]}
                />
              </View>
              <Text style={styles.strikeLimitText}>({strikes}/2 Maximum)</Text>
            </View>
          </GlassCard>
        </View>

        {/* Verified Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REGISTERED HOME COLLECTION ADDRESS</Text>
          <GlassCard style={styles.addressCard}>
            <View style={styles.addressRow}>
              <MapPin size={20} color={colors.cyan} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressMain}>
                  {user?.address?.street || 'Flat 402, Highline Residency'}
                </Text>
                <Text style={styles.addressSub}>
                  {user?.address?.city || 'Hyderabad'}, {user?.address?.pincode || '500081'}
                </Text>
                <Text style={styles.coordsText}>
                  GPS: {user?.address?.coordinates?.lat || '17.4435'}° N,{' '}
                  {user?.address?.coordinates?.lng || '78.3842'}° E
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Clinical Disclaimer */}
        <View style={styles.disclaimerBox}>
          <FileCheck2 size={16} color={colors.textMuted} />
          <Text style={styles.disclaimerText}>
            All specimens are handled in strict adherence to CLSI H3-A6 standards with full cold chain audit logs.
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={16} color={colors.roseLight} />
          <Text style={styles.logoutBtnText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  userAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  userPhone: {
    fontSize: 12,
    color: colors.cyanLight,
    fontWeight: '700',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  complianceCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  complianceCardSuspended: {
    borderColor: colors.rose,
    backgroundColor: '#160808',
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  complianceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  complianceSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  strikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  strikeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  strikeDots: {
    flexDirection: 'row',
    gap: 6,
  },
  strikeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  strikeDotActive: {
    backgroundColor: colors.rose,
    borderColor: colors.roseLight,
  },
  strikeLimitText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  addressCard: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressMain: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  addressSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  coordsText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#080808',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#18080a',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingVertical: 14,
    borderRadius: 14,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.roseLight,
    letterSpacing: 1,
  },
});

export default ProfileScreen;
