import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Truck,
  ShieldCheck,
  Radio,
  Server,
  LogOut,
  RefreshCw,
  SquarePen,
  X,
  Star,
  Clock,
  ChevronRight,
  Info,
  Award,
} from 'lucide-react-native';
import { colors, gradients } from '../theme/colors';
import GlassCard from '../components/GlassCard';
import DutyStatusSwitch from '../components/DutyStatusSwitch';
import { useAuthStore } from '../store/authStore';
import { staffApi } from '../api/staffApi';
import { getStoredBaseUrl, saveStoredBaseUrl } from '../api/axios';
import locationService from '../services/locationService';

export default function ProfileScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const staff = useAuthStore((state) => state.staff);
  const role = useAuthStore((state) => state.role || state.user?.role || 'lab_assistant');
  const logout = useAuthStore((state) => state.logout);
  const dutyStatus = useAuthStore((state) => state.dutyStatus);
  const setDutyStatus = useAuthStore((state) => state.setDutyStatus);
  const isLocationTracking = useAuthStore((state) => state.isLocationTracking);
  const setLocationTracking = useAuthStore((state) => state.setLocationTracking);
  
  const activeStaff = staff || user || {};
  const [profile, setProfile] = useState(activeStaff);
  const isDoctor = role === 'doctor' || profile?.role === 'doctor';
  const [loading, setLoading] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  
  // Edit Profile modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editPhone, setEditPhone] = useState(activeStaff?.phone || '');
  const [editVehicle, setEditVehicle] = useState(activeStaff?.vehicleNumber || '');
  const [editSaving, setEditSaving] = useState(false);

  // Server Host Config modal
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [currentBaseUrl, setCurrentBaseUrl] = useState('');
  const [serverInput, setServerInput] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    fetchProfile();
    loadServerHost();
  }, []);

  const loadServerHost = async () => {
    const url = await getStoredBaseUrl();
    setCurrentBaseUrl(url);
    setServerInput(url);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getProfile();
      if (res?.success && res?.data) {
        setProfile(res.data);
        if (res.data.status) {
          useAuthStore.setState({ dutyStatus: res.data.status });
        }
      }
    } catch (err) {
      console.warn('Failed to load profile:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTracking = async (value) => {
    if (value) {
      try {
        const res = await locationService.startTracking();
        if (res.success) {
          Alert.alert('GPS Broadcaster Active', 'Your real-time coordinates are streaming to Central Dispatch.');
        } else {
          Alert.alert('GPS Broadcaster Warning', res.message || 'Failed to start GPS broadcast.');
        }
      } catch (err) {
        Alert.alert('Location Error', err.response?.data?.message || err.message);
      }
    } else {
      locationService.stopTracking();
      Alert.alert('GPS Offline', 'Live location broadcasting paused.');
    }
  };

  const handleSaveProfile = async () => {
    setEditSaving(true);
    try {
      const res = await staffApi.updateProfile({
        phone: editPhone,
        vehicleNumber: editVehicle,
      });
      if (res?.success) {
        setProfile((prev) => ({ ...prev, phone: editPhone, vehicleNumber: editVehicle }));
        setEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully.');
      }
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.message || err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleSaveServerHost = async () => {
    if (!serverInput.trim()) {
      Alert.alert('Validation Error', 'API server host cannot be empty.');
      return;
    }
    await saveStoredBaseUrl(serverInput.trim());
    setCurrentBaseUrl(serverInput.trim());
    setServerModalVisible(false);
    Alert.alert('Host Updated', `API endpoint set to:\n${serverInput.trim()}\n\nReloading profile...`, [
      { text: 'OK', onPress: fetchProfile }
    ]);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      await saveStoredBaseUrl(serverInput.trim());
      const res = await staffApi.getProfile();
      if (res?.success) {
        Alert.alert('Success', 'Connected to backend server successfully!');
      } else {
        Alert.alert('Response Received', 'Connected but unexpected response payload.');
      }
    } catch (err) {
      Alert.alert('Connection Failed', `Could not reach ${serverInput.trim()}:\n${err.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Sign Out',
      'Are you sure you want to end your active session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const getDutyColor = () => {
    switch (dutyStatus) {
      case 'Available':
        return colors.emerald;
      case 'On_Route':
        return colors.cyan;
      default:
        return colors.rose;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSubtitle}>
              {isDoctor ? 'Doctor' : 'Staff'}
            </Text>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={fetchProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.cyan} />
            ) : (
              <RefreshCw size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <GlassCard style={styles.profileCard}>
          <LinearGradient
            colors={[colors.bgCardElevated, colors.bgCard]}
            style={styles.profileCardGradient}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrap}>
                <LinearGradient colors={gradients.cyanBlue} style={styles.avatarGradient}>
                  <Text style={styles.avatarText}>
                    {profile.name
                      ? profile.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : (isDoctor ? 'DR' : 'LA')}
                  </Text>
                </LinearGradient>
                <View style={[styles.avatarStatusBadge, { backgroundColor: getDutyColor() }]} />
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile.name || (isDoctor ? 'Dr. Rajesh Sharma, MD' : 'Field Assistant')}</Text>
                <Text style={styles.profileRole}>
                  {isDoctor
                    ? (profile.specialty || 'Pathologist')
                    : 'Phlebotomist'}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={styles.empBadge}>
                    <ShieldCheck size={12} color={colors.cyan} />
                    <Text style={styles.empBadgeText}>
                      {isDoctor ? (profile.licenseNumber || 'MCI-PATH-88219') : (profile.employeeId || 'EMP001')}
                    </Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Star size={12} color={colors.amber} fill={colors.amber} />
                    <Text style={styles.ratingText}>
                      {isDoctor ? 'Certified' : '4.9/5.0'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Duty Status Bar */}
            <TouchableOpacity
              style={styles.dutyStatusBar}
              onPress={() => setStatusModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.dutyStatusLeft}>
                <View style={[styles.statusDot, { backgroundColor: getDutyColor() }]} />
                <View>
                  <Text style={styles.dutyStatusLabel}>CURRENT DUTY STATUS</Text>
                  <Text style={[styles.dutyStatusValue, { color: getDutyColor() }]}>
                    {(dutyStatus || 'Available').replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.changeStatusBtn}>
                <Text style={styles.changeStatusText}>Change</Text>
                <ChevronRight size={14} color={colors.cyan} />
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </GlassCard>

        {/* Contact & Assignment Details */}
        <Text style={styles.sectionHeader}>{isDoctor ? 'CREDENTIALS' : 'DETAILS'}</Text>
        <GlassCard style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <Phone size={18} color={colors.cyan} />
            </View>
            <View style={styles.detailMeta}>
              <Text style={styles.detailLabel}>Mobile Phone</Text>
              <Text style={styles.detailValue}>{profile.phone || '+91 98765 43210'}</Text>
            </View>
            {!isDoctor && (
              <TouchableOpacity
                style={styles.detailEditBtn}
                onPress={() => {
                  setEditPhone(profile.phone || '');
                  setEditVehicle(profile.vehicleNumber || '');
                  setEditModalVisible(true);
                }}
              >
                <SquarePen size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <Mail size={18} color={colors.cyan} />
            </View>
            <View style={styles.detailMeta}>
              <Text style={styles.detailLabel}>Email ID</Text>
              <Text style={styles.detailValue}>{profile.email || (isDoctor ? 'doctor@biosync.ai' : 'staff@biosync.ai')}</Text>
            </View>
          </View>

          {isDoctor ? (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <MapPin size={18} color={colors.emerald} />
                </View>
                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>Hospital</Text>
                  <Text style={styles.detailValue}>
                    {profile.hospitalAffiliation || 'BioSync Central Lab, Hyderabad'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <ShieldCheck size={18} color={colors.cyan} />
                </View>
                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>MCI Registration</Text>
                  <Text style={styles.detailValue}>{profile.licenseNumber || 'MCI-PATH-88219'}</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <MapPin size={18} color={colors.emerald} />
                </View>
                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>Zone</Text>
                  <Text style={styles.detailValue}>
                    {Array.isArray(profile.assignedZones) && profile.assignedZones.length > 0
                      ? profile.assignedZones.join(', ')
                      : (profile.assignedArea || 'Madhapur, Hitec City')}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Truck size={18} color={colors.amber} />
                </View>
                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>Vehicle</Text>
                  <Text style={styles.detailValue}>{profile.vehicleNumber || 'TS 09 EA 4482 (Hero Splendor)'}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Clock size={18} color={colors.textSecondary} />
                </View>
                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>Shift</Text>
                  <Text style={styles.detailValue}>
                    {typeof profile.shiftTiming === 'object' && profile.shiftTiming !== null
                      ? `${profile.shiftTiming.start || '08:00 AM'} – ${profile.shiftTiming.end || '05:00 PM'}`
                      : (profile.shiftTiming || '08:00 AM – 05:00 PM (Regular Shift)')}
                  </Text>
                </View>
              </View>
            </>
          )}
        </GlassCard>

        {/* Live GPS Broadcast Switch (Field Lab Assistants only) */}
        {!isDoctor && (
          <>
            <Text style={styles.sectionHeader}>GPS TRACKING</Text>
            <GlassCard style={styles.settingsCard}>
              <View style={styles.switchRow}>
                <View style={styles.switchIconWrap}>
                  <Radio size={20} color={isLocationTracking ? colors.emerald : colors.textMuted} />
                </View>
                <View style={styles.switchMeta}>
                  <Text style={styles.switchTitle}>Live GPS</Text>
                  <Text style={styles.switchSubtitle}>
                    {isLocationTracking ? 'Active' : 'Paused'}
                  </Text>
                </View>
                <Switch
                  value={!!isLocationTracking}
                  onValueChange={handleToggleTracking}
                  trackColor={{ false: colors.borderSubtle, true: colors.emerald + '80' }}
                  thumbColor={isLocationTracking ? colors.emerald : colors.textMuted}
                />
              </View>
            </GlassCard>
          </>
        )}

        {/* Backend Endpoint Config */}
        <Text style={styles.sectionHeader}>SYSTEM</Text>
        <GlassCard style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => {
              setServerInput(currentBaseUrl);
              setServerModalVisible(true);
            }}
          >
            <View style={styles.switchIconWrap}>
              <Server size={20} color={colors.cyan} />
            </View>
            <View style={styles.switchMeta}>
              <Text style={styles.switchTitle}>API Host</Text>
              <Text style={styles.switchSubtitle} numberOfLines={1}>
                {currentBaseUrl || 'Default (Auto-detected)'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.detailDivider} />

          <View style={styles.complianceRow}>
            <Award size={16} color={colors.cyan} />
            <Text style={styles.complianceText}>BioSyncAI v1.0</Text>
          </View>
        </GlassCard>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color={colors.rose} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>Authorized Personnel Only</Text>
      </ScrollView>

      {/* Duty Status Modal */}
      <DutyStatusSwitch
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        currentStatus={dutyStatus}
        onStatusChange={(newStatus) => {
          setDutyStatus(newStatus);
          fetchProfile();
        }}
      />

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Mobile Phone</Text>
              <TextInput
                style={styles.modalInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="10-digit phone number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Vehicle Registration</Text>
              <TextInput
                style={styles.modalInput}
                value={editVehicle}
                onChangeText={setEditVehicle}
                placeholder="e.g. TS 09 EA 4482"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
                disabled={editSaving}
              >
                {editSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Server Endpoint Config Modal */}
      <Modal visible={serverModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>API Endpoint</Text>
              <TouchableOpacity onPress={() => setServerModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>API Base URL</Text>
              <TextInput
                style={styles.modalInput}
                value={serverInput}
                onChangeText={setServerInput}
                placeholder="http://192.168.x.x:6446/api"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>
                Note: In Expo Go on physical device, use your local Wi-Fi IP address instead of localhost.
              </Text>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.testBtn}
                  onPress={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <ActivityIndicator size="small" color={colors.cyan} />
                  ) : (
                    <Text style={styles.testBtnText}>Test Ping</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveHostBtn} onPress={handleSaveServerHost}>
                  <Text style={styles.saveHostBtnText}>Save & Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    marginBottom: 20,
    overflow: 'hidden',
  },
  profileCardGradient: {
    padding: 16,
    borderRadius: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.bgCardElevated,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  profileRole: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  empBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  empBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.cyan,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.amber,
  },
  dutyStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dutyStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dutyStatusLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dutyStatusValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  changeStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  changeStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.cyan,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  detailsCard: {
    padding: 14,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailMeta: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  detailEditBtn: {
    padding: 8,
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 10,
  },
  settingsCard: {
    padding: 14,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  switchMeta: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  complianceText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.rose,
  },
  footerNote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalBody: {},
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.bgDark,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
  },
  inputHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 16,
  },
  modalSaveBtn: {
    backgroundColor: colors.cyan,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  modalSaveText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  testBtn: {
    flex: 1,
    backgroundColor: colors.bgCardElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  testBtnText: {
    color: colors.cyan,
    fontWeight: '700',
    fontSize: 13,
  },
  saveHostBtn: {
    flex: 2,
    backgroundColor: colors.cyan,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveHostBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
});
