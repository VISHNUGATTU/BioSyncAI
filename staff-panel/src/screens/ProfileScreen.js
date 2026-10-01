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
  Award,
  Wifi,
  Settings2,
  Sun,
  Moon,
  Smartphone,
  Check,
} from 'lucide-react-native';

import { colors, gradients, alpha, useTheme } from '../theme/colors';
import GlassCard from '../components/GlassCard';
import DutyStatusSwitch from '../components/DutyStatusSwitch';
import { useAuthStore } from '../store/authStore';
import { staffApi } from '../api/staffApi';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  DEFAULT_BASE_URL,
} from '../api/axios';
import locationService from '../services/locationService';

export default function ProfileScreen({ navigation }) {
  const { themePreference, mode, isDark, setTheme, colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const staff = useAuthStore((state) => state.staff);

  const role = useAuthStore(
    (state) =>
      state.role ||
      state.user?.role ||
      state.staff?.role ||
      'lab_assistant'
  );

  const logout = useAuthStore((state) => state.logout);
  const dutyStatus = useAuthStore((state) => state.dutyStatus);
  const setDutyStatus = useAuthStore(
    (state) => state.setDutyStatus
  );

  const isLocationTracking = useAuthStore(
    (state) => state.isLocationTracking
  );

  const setLocationTracking = useAuthStore(
    (state) => state.setLocationTracking
  );

  const activeStaff = staff || user || {};

  const [profile, setProfile] = useState(activeStaff);

  const normalizedRole = String(role).toLowerCase();

  const isDoctor =
    normalizedRole === 'doctor' ||
    String(profile?.role || '').toLowerCase() === 'doctor';

  const [loading, setLoading] = useState(false);
  const [statusModalVisible, setStatusModalVisible] =
    useState(false);

  // Edit Profile
  const [editModalVisible, setEditModalVisible] =
    useState(false);

  const [editPhone, setEditPhone] = useState(
    activeStaff?.phone || ''
  );

  const [editVehicle, setEditVehicle] = useState(
    activeStaff?.vehicleNumber || ''
  );

  const [editSaving, setEditSaving] = useState(false);

  // Server Host
  const [serverModalVisible, setServerModalVisible] =
    useState(false);

  const [currentBaseUrl, setCurrentBaseUrl] = useState(
    getApiBaseUrl()
  );

  const [serverInput, setServerInput] = useState(
    getApiBaseUrl()
  );

  const [testingConnection, setTestingConnection] =
    useState(false);

  useEffect(() => {
    fetchProfile();
    loadServerHost();
  }, []);

  const loadServerHost = async () => {
    try {
      const url = getApiBaseUrl() || DEFAULT_BASE_URL;

      setCurrentBaseUrl(url);
      setServerInput(url);
    } catch (error) {
      console.warn(
        '[Profile] Failed to load API host:',
        error?.message
      );

      setCurrentBaseUrl(DEFAULT_BASE_URL);
      setServerInput(DEFAULT_BASE_URL);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);

    try {
      const res = await staffApi.getProfile();

      if (res?.success && res?.data) {
        setProfile(res.data);

        if (res.data.status) {
          useAuthStore.setState({
            dutyStatus: res.data.status,
          });
        }
      }
    } catch (err) {
      console.warn(
        'Failed to load profile:',
        err?.response?.data?.message ||
          err?.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTracking = async (value) => {
    if (value) {
      try {
        const res = await locationService.startTracking();

        if (res.success) {
          setLocationTracking(true);

          Alert.alert(
            'GPS Broadcaster Active',
            'Your real-time coordinates are now streaming to Central Dispatch.'
          );
        } else {
          setLocationTracking(false);

          Alert.alert(
            'GPS Broadcaster Warning',
            res.message ||
              'Failed to start GPS broadcast.'
          );
        }
      } catch (err) {
        setLocationTracking(false);

        Alert.alert(
          'Location Error',
          err?.response?.data?.message ||
            err?.message ||
            'Unable to start location tracking.'
        );
      }
    } else {
      locationService.stopTracking();

      setLocationTracking(false);

      Alert.alert(
        'GPS Offline',
        'Live location broadcasting has been paused.'
      );
    }
  };

  const handleSaveProfile = async () => {
    const cleanPhone = editPhone
      .trim()
      .replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      Alert.alert(
        'Invalid Phone',
        'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    setEditSaving(true);

    try {
      const res = await staffApi.updateProfile({
        phone: cleanPhone,
        vehicleNumber: editVehicle.trim(),
      });

      if (res?.success) {
        const updatedProfile = {
          ...profile,
          ...(res.data || {}),
          phone: cleanPhone,
          vehicleNumber: editVehicle.trim(),
        };

        setProfile(updatedProfile);

        useAuthStore.setState({
          staff: updatedProfile,
          user: updatedProfile,
        });

        setEditModalVisible(false);

        Alert.alert(
          'Profile Updated',
          'Your profile information was updated successfully.'
        );
      } else {
        Alert.alert(
          'Update Failed',
          res?.message ||
            'Unable to update profile.'
        );
      }
    } catch (err) {
      Alert.alert(
        'Update Failed',
        err?.response?.data?.message ||
          err?.message ||
          'Unable to update profile.'
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleSaveServerHost = async () => {
    const host = serverInput.trim();

    if (!host) {
      Alert.alert(
        'Validation Error',
        'API server host cannot be empty.'
      );
      return;
    }

    try {
      await setApiBaseUrl(host);

      const updatedUrl = getApiBaseUrl();

      setCurrentBaseUrl(updatedUrl);
      setServerInput(updatedUrl);
      setServerModalVisible(false);

      Alert.alert(
        'Host Updated',
        `API endpoint set to:\n${updatedUrl}\n\nReload the profile to verify the connection.`,
        [
          {
            text: 'Reload',
            onPress: fetchProfile,
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Invalid Host',
        'Please enter a valid API server address.'
      );
    }
  };

  const handleResetServerHost = async () => {
    try {
      await setApiBaseUrl(DEFAULT_BASE_URL);

      setCurrentBaseUrl(DEFAULT_BASE_URL);
      setServerInput(DEFAULT_BASE_URL);

      Alert.alert(
        'Default Restored',
        `The default API endpoint is now:\n${DEFAULT_BASE_URL}`,
        [
          {
            text: 'Reload',
            onPress: fetchProfile,
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Reset Failed',
        'Unable to restore the default API endpoint.'
      );
    }
  };

  const handleTestConnection = async () => {
    const host = serverInput.trim();

    if (!host) {
      Alert.alert(
        'Invalid Host',
        'Enter an API endpoint before testing the connection.'
      );
      return;
    }

    setTestingConnection(true);

    try {
      await setApiBaseUrl(host);

      const activeUrl = getApiBaseUrl();

      setCurrentBaseUrl(activeUrl);

      const res = await staffApi.getProfile();

      if (res?.success) {
        Alert.alert(
          'Connection Successful',
          'The mobile app successfully connected to the BioSyncAI backend.'
        );
      } else {
        Alert.alert(
          'Response Received',
          'The server was reachable, but returned an unexpected response.'
        );
      }
    } catch (err) {
      Alert.alert(
        'Connection Failed',
        `Could not reach:\n${getApiBaseUrl()}\n\n${
          err?.response?.data?.message ||
          err?.message ||
          'Unknown network error'
        }`
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Sign Out',
      'Are you sure you want to end your active BioSyncAI session?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            if (isLocationTracking) {
              locationService.stopTracking();
            }

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
      case 'On_The_Way':
        return colors.cyan;

      case 'Collecting':
        return colors.amber;

      case 'Off_Duty':
        return colors.rose;

      default:
        return colors.textMuted;
    }
  };

  const getInitials = () => {
    if (!profile?.name) {
      return isDoctor ? 'DR' : 'LA';
    }

    return profile.name
      .split(' ')
      .filter(Boolean)
      .map((name) => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getShiftText = () => {
    if (
      typeof profile?.shiftTiming === 'object' &&
      profile.shiftTiming !== null
    ) {
      return `${profile.shiftTiming.start || '08:00 AM'} – ${
        profile.shiftTiming.end || '05:00 PM'
      }`;
    }

    return (
      profile?.shiftTiming ||
      '08:00 AM – 05:00 PM'
    );
  };

  const getZoneText = () => {
    if (
      Array.isArray(profile?.assignedZones) &&
      profile.assignedZones.length > 0
    ) {
      return profile.assignedZones.join(', ');
    }

    return (
      profile?.assignedArea ||
      'Madhapur, Hitec City'
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgDark }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <User
                size={17}
                color={colors.primaryLight}
              />
            </View>

            <View>
              <Text style={styles.headerSubtitle}>
                {isDoctor ? 'DOCTOR PORTAL' : 'FIELD STAFF'}
              </Text>

              <Text style={styles.headerTitle}>
                Profile
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={fetchProfile}
            disabled={loading}
            activeOpacity={0.75}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={colors.primaryLight}
              />
            ) : (
              <RefreshCw
                size={18}
                color={colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* PROFILE HERO */}
        <GlassCard style={styles.profileCard}>
          <LinearGradient
            colors={[
              'rgba(6, 182, 212, 0.12)',
              'rgba(10, 10, 10, 0.98)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCardGradient}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrap}>
                <LinearGradient
                  colors={gradients.cyanBlue}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>
                    {getInitials()}
                  </Text>
                </LinearGradient>

                <View
                  style={[
                    styles.avatarStatusBadge,
                    {
                      backgroundColor:
                        getDutyColor(),
                    },
                  ]}
                />
              </View>

              <View style={styles.profileInfo}>
                <Text
                  style={styles.profileName}
                  numberOfLines={1}
                >
                  {profile.name ||
                    (isDoctor
                      ? 'Doctor'
                      : 'Field Assistant')}
                </Text>

                <Text style={styles.profileRole}>
                  {isDoctor
                    ? profile.specialty ||
                      'Pathologist'
                    : 'Phlebotomist'}
                </Text>

                <View style={styles.badgeRow}>
                  <View style={styles.empBadge}>
                    <ShieldCheck
                      size={11}
                      color={colors.primaryLight}
                    />

                    <Text
                      style={styles.empBadgeText}
                      numberOfLines={1}
                    >
                      {isDoctor
                        ? profile.licenseNumber ||
                          'MCI-PATH-88219'
                        : profile.employeeId ||
                          'EMP001'}
                    </Text>
                  </View>

                  <View style={styles.ratingBadge}>
                    <Star
                      size={11}
                      color={colors.amber}
                      fill={colors.amber}
                    />

                    <Text style={styles.ratingText}>
                      {isDoctor
                        ? 'Certified'
                        : '4.9/5.0'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* DUTY STATUS */}
            {!isDoctor && (
              <TouchableOpacity
                style={styles.dutyStatusBar}
                onPress={() =>
                  setStatusModalVisible(true)
                }
                activeOpacity={0.8}
              >
                <View style={styles.dutyStatusLeft}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          getDutyColor(),
                      },
                    ]}
                  />

                  <View>
                    <Text
                      style={styles.dutyStatusLabel}
                    >
                      CURRENT DUTY STATUS
                    </Text>

                    <Text
                      style={[
                        styles.dutyStatusValue,
                        {
                          color: getDutyColor(),
                        },
                      ]}
                    >
                      {(dutyStatus || 'Available')
                        .replace(/_/g, ' ')
                        .toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View
                  style={styles.changeStatusBtn}
                >
                  <Text
                    style={styles.changeStatusText}
                  >
                    Change
                  </Text>

                  <ChevronRight
                    size={14}
                    color={colors.primaryLight}
                  />
                </View>
              </TouchableOpacity>
            )}

            {isDoctor && (
              <View style={styles.doctorVerifiedBar}>
                <ShieldCheck
                  size={17}
                  color={colors.emeraldLight}
                />

                <View style={styles.doctorVerifiedText}>
                  <Text
                    style={styles.doctorVerifiedTitle}
                  >
                    Clinical credentials verified
                  </Text>

                  <Text
                    style={styles.doctorVerifiedSubtitle}
                  >
                    Authorized BioSyncAI clinical reviewer
                  </Text>
                </View>

                <View
                  style={styles.verifiedDot}
                />
              </View>
            )}
          </LinearGradient>
        </GlassCard>

        {/* DETAILS */}
        <Text style={styles.sectionHeader}>
          {isDoctor ? 'CREDENTIALS' : 'STAFF DETAILS'}
        </Text>

        <GlassCard style={styles.detailsCard}>
          {/* PHONE */}
          <View style={styles.detailRow}>
            <View
              style={[
                styles.detailIconWrap,
                {
                  backgroundColor:
                    alpha.cyan10,
                },
              ]}
            >
              <Phone
                size={17}
                color={colors.primaryLight}
              />
            </View>

            <View style={styles.detailMeta}>
              <Text style={styles.detailLabel}>
                Mobile Phone
              </Text>

              <Text style={styles.detailValue}>
                {profile.phone ||
                  '+91 98765 43210'}
              </Text>
            </View>

            {!isDoctor && (
              <TouchableOpacity
                style={styles.detailEditBtn}
                onPress={() => {
                  setEditPhone(
                    profile.phone || ''
                  );

                  setEditVehicle(
                    profile.vehicleNumber || ''
                  );

                  setEditModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <SquarePen
                  size={15}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.detailDivider} />

          {/* EMAIL */}
          <View style={styles.detailRow}>
            <View
              style={[
                styles.detailIconWrap,
                {
                  backgroundColor:
                    alpha.cyan10,
                },
              ]}
            >
              <Mail
                size={17}
                color={colors.primaryLight}
              />
            </View>

            <View style={styles.detailMeta}>
              <Text style={styles.detailLabel}>
                Email ID
              </Text>

              <Text style={styles.detailValue}>
                {profile.email ||
                  (isDoctor
                    ? 'doctor@biosync.ai'
                    : 'staff@biosync.ai')}
              </Text>
            </View>
          </View>

          {isDoctor ? (
            <>
              <View style={styles.detailDivider} />

              {/* HOSPITAL */}
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.detailIconWrap,
                    {
                      backgroundColor:
                        alpha.emerald10,
                    },
                  ]}
                >
                  <MapPin
                    size={17}
                    color={colors.emerald}
                  />
                </View>

                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>
                    Hospital
                  </Text>

                  <Text style={styles.detailValue}>
                    {profile.hospitalAffiliation ||
                      'BioSync Central Lab, Hyderabad'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              {/* LICENSE */}
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.detailIconWrap,
                    {
                      backgroundColor:
                        alpha.cyan10,
                    },
                  ]}
                >
                  <ShieldCheck
                    size={17}
                    color={colors.primaryLight}
                  />
                </View>

                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>
                    Medical Registration
                  </Text>

                  <Text style={styles.detailValue}>
                    {profile.licenseNumber ||
                      'MCI-PATH-88219'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              {/* SPECIALTY */}
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.detailIconWrap,
                    {
                      backgroundColor:
                        alpha.cyan10,
                    },
                  ]}
                >
                  <Award
                    size={17}
                    color={colors.primaryLight}
                  />
                </View>

                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>
                    Specialty
                  </Text>

                  <Text style={styles.detailValue}>
                    {profile.specialty ||
                      'Pathology'}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailDivider} />

              {/* ZONE */}
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.detailIconWrap,
                    {
                      backgroundColor:
                        alpha.emerald10,
                    },
                  ]}
                >
                  <MapPin
                    size={17}
                    color={colors.emerald}
                  />
                </View>

                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>
                    Assigned Zone
                  </Text>

                  <Text style={styles.detailValue}>
                    {getZoneText()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              {/* VEHICLE */}
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.detailIconWrap,
                    {
                      backgroundColor:
                        alpha.amber10,
                    },
                  ]}
                >
                  <Truck
                    size={17}
                    color={colors.amber}
                  />
                </View>

                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>
                    Assigned Vehicle
                  </Text>

                  <Text style={styles.detailValue}>
                    {profile.vehicleNumber ||
                      'TS 09 EA 4482 (Hero Splendor)'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              {/* SHIFT */}
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.detailIconWrap,
                    {
                      backgroundColor:
                        alpha.white06,
                    },
                  ]}
                >
                  <Clock
                    size={17}
                    color={colors.textSecondary}
                  />
                </View>

                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>
                    Shift
                  </Text>

                  <Text style={styles.detailValue}>
                    {getShiftText()}
                  </Text>
                </View>
              </View>
            </>
          )}
        </GlassCard>

        {/* GPS */}
        {!isDoctor && (
          <>
            <Text style={styles.sectionHeader}>
              FIELD OPERATIONS
            </Text>

            <GlassCard style={styles.settingsCard}>
              <View style={styles.gpsHeader}>
                <View
                  style={[
                    styles.gpsIconWrap,
                    {
                      backgroundColor:
                        isLocationTracking
                          ? alpha.emerald10
                          : alpha.white06,
                    },
                  ]}
                >
                  <Radio
                    size={19}
                    color={
                      isLocationTracking
                        ? colors.emerald
                        : colors.textMuted
                    }
                  />
                </View>

                <View style={styles.switchMeta}>
                  <View
                    style={styles.gpsTitleRow}
                  >
                    <Text
                      style={styles.switchTitle}
                    >
                      Live GPS Tracking
                    </Text>

                    {isLocationTracking && (
                      <View
                        style={
                          styles.livePill
                        }
                      >
                        <View
                          style={
                            styles.liveDot
                          }
                        />
                        <Text
                          style={
                            styles.livePillText
                          }
                        >
                          LIVE
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={styles.switchSubtitle}
                  >
                    {isLocationTracking
                      ? 'Location is being shared with Central Dispatch'
                      : 'Location broadcasting is currently paused'}
                  </Text>
                </View>

                <Switch
                  value={!!isLocationTracking}
                  onValueChange={
                    handleToggleTracking
                  }
                  trackColor={{
                    false: colors.borderSubtle,
                    true: alpha.emerald30,
                  }}
                  thumbColor={
                    isLocationTracking
                      ? colors.emeraldLight
                      : colors.textMuted
                  }
                />
              </View>

              <View
                style={styles.gpsInfoBar}
              >
                <Wifi
                  size={13}
                  color={
                    isLocationTracking
                      ? colors.emerald
                      : colors.textMuted
                  }
                />

                <Text
                  style={styles.gpsInfoText}
                >
                  {isLocationTracking
                    ? 'Foreground location updates are active'
                    : 'Enable this when you are on field duty'}
                </Text>
              </View>
            </GlassCard>
          </>
        )}

        {/* APPEARANCE & DISPLAY (TRI-THEME SYSTEM) */}
        <Text style={styles.sectionHeader}>
          APPEARANCE & DISPLAY
        </Text>

        <GlassCard style={styles.settingsCard}>
          <View style={styles.themeHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.themeCardTitle}>
                Interface Appearance
              </Text>
              <Text style={styles.themeCardSubtitle}>
                Select theme mode for staff portal
              </Text>
            </View>
            <View style={styles.currentThemePill}>
              <Text style={styles.currentThemePillText}>
                {themePreference === 'system'
                  ? 'System (Default)'
                  : themePreference === 'dark'
                  ? 'Dark'
                  : 'Light'}
              </Text>
            </View>
          </View>

          {/* 3 Pills: Light, Dark, System */}
          <View style={styles.themeOptionsGrid}>
            {/* Light */}
            <TouchableOpacity
              style={[
                styles.themeOptionCard,
                themePreference === 'light' && styles.themeOptionCardActive,
              ]}
              onPress={() => setTheme('light')}
              activeOpacity={0.8}
            >
              <View style={styles.themeIconCircle}>
                <Sun
                  size={18}
                  color={
                    themePreference === 'light'
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
              </View>
              <Text
                style={[
                  styles.themeOptionTitle,
                  themePreference === 'light' && { color: colors.primary },
                ]}
              >
                Light
              </Text>
              <Text style={styles.themeOptionSubtitle}>White Clean</Text>
              {themePreference === 'light' && (
                <View style={styles.themeCheckBadge}>
                  <Check size={10} color="#ffffff" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>

            {/* Dark */}
            <TouchableOpacity
              style={[
                styles.themeOptionCard,
                themePreference === 'dark' && styles.themeOptionCardActive,
              ]}
              onPress={() => setTheme('dark')}
              activeOpacity={0.8}
            >
              <View style={styles.themeIconCircle}>
                <Moon
                  size={18}
                  color={
                    themePreference === 'dark'
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
              </View>
              <Text
                style={[
                  styles.themeOptionTitle,
                  themePreference === 'dark' && { color: colors.primary },
                ]}
              >
                Dark
              </Text>
              <Text style={styles.themeOptionSubtitle}>Black Slate</Text>
              {themePreference === 'dark' && (
                <View style={styles.themeCheckBadge}>
                  <Check size={10} color="#ffffff" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>

            {/* System */}
            <TouchableOpacity
              style={[
                styles.themeOptionCard,
                themePreference === 'system' && styles.themeOptionCardActive,
              ]}
              onPress={() => setTheme('system')}
              activeOpacity={0.8}
            >
              <View style={styles.themeIconCircle}>
                <Smartphone
                  size={18}
                  color={
                    themePreference === 'system'
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
              </View>
              <Text
                style={[
                  styles.themeOptionTitle,
                  themePreference === 'system' && { color: colors.primary },
                ]}
              >
                System
              </Text>
              <Text style={styles.themeOptionSubtitle}>Auto-Follow</Text>
              {themePreference === 'system' && (
                <View style={styles.themeCheckBadge}>
                  <Check size={10} color="#ffffff" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.themeExplanationText}>
            {themePreference === 'system'
              ? `System mode is active. The portal automatically synchronizes with your device's light and dark schedule (Currently: ${
                  mode === 'dark' ? 'Dark Mode' : 'Light Mode'
                }).`
              : `Manually set to ${
                  themePreference === 'dark' ? 'Dark Mode' : 'Light Mode'
                }. Tap 'System' to follow your phone's appearance settings automatically.`}
          </Text>
        </GlassCard>

        {/* SYSTEM */}
        <Text style={styles.sectionHeader}>
          SYSTEM
        </Text>

        <GlassCard style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => {
              setServerInput(
                currentBaseUrl ||
                  getApiBaseUrl()
              );

              setServerModalVisible(true);
            }}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.switchIconWrap,
                {
                  backgroundColor:
                    alpha.cyan10,
                },
              ]}
            >
              <Server
                size={19}
                color={colors.primaryLight}
              />
            </View>

            <View style={styles.switchMeta}>
              <Text style={styles.switchTitle}>
                API Gateway
              </Text>

              <Text
                style={styles.switchSubtitle}
                numberOfLines={1}
              >
                {currentBaseUrl ||
                  DEFAULT_BASE_URL}
              </Text>
            </View>

            <ChevronRight
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <View style={styles.detailDivider} />

          <View style={styles.complianceRow}>
            <View
              style={styles.versionIcon}
            >
              <Award
                size={15}
                color={colors.primaryLight}
              />
            </View>

            <View style={styles.versionMeta}>
              <Text
                style={styles.versionTitle}
              >
                BioSyncAI Mobile
              </Text>

              <Text
                style={styles.versionSubtitle}
              >
                Clinical Staff Platform • v1.0
              </Text>
            </View>

            <View
              style={styles.statusPill}
            >
              <View
                style={styles.statusPillDot}
              />

              <Text
                style={styles.statusPillText}
              >
                SECURE
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutIcon}>
            <LogOut
              size={17}
              color={colors.roseLight}
            />
          </View>

          <View style={styles.logoutMeta}>
            <Text style={styles.logoutText}>
              Sign Out
            </Text>

            <Text
              style={styles.logoutSubtitle}
            >
              End this active staff session
            </Text>
          </View>

          <ChevronRight
            size={17}
            color={colors.rose}
          />
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Authorized Personnel Only
          {'  •  '}
          BioSyncAI Clinical Network
        </Text>
      </ScrollView>

      {/* DUTY STATUS MODAL */}
      <DutyStatusSwitch
        visible={statusModalVisible}
        onClose={() =>
          setStatusModalVisible(false)
        }
        currentStatus={dutyStatus}
        onStatusChange={(newStatus) => {
          setDutyStatus(newStatus);
          fetchProfile();
        }}
      />

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setEditModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>
                  ACCOUNT
                </Text>

                <Text style={styles.modalTitle}>
                  Edit Profile
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() =>
                  setEditModalVisible(false)
                }
              >
                <X
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>
                MOBILE PHONE
              </Text>

              <TextInput
                style={styles.modalInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="10-digit phone number"
                placeholderTextColor={
                  colors.textMuted
                }
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text
                style={[
                  styles.inputLabel,
                  { marginTop: 16 },
                ]}
              >
                VEHICLE REGISTRATION
              </Text>

              <TextInput
                style={styles.modalInput}
                value={editVehicle}
                onChangeText={setEditVehicle}
                placeholder="e.g. TS 09 EA 4482"
                placeholderTextColor={
                  colors.textMuted
                }
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={[
                  styles.modalPrimaryBtn,
                  editSaving && {
                    opacity: 0.7,
                  },
                ]}
                onPress={handleSaveProfile}
                disabled={editSaving}
              >
                {editSaving ? (
                  <ActivityIndicator
                    size="small"
                    color="#000"
                  />
                ) : (
                  <Text
                    style={
                      styles.modalPrimaryText
                    }
                  >
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SERVER ENDPOINT MODAL */}
      <Modal
        visible={serverModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setServerModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>
                  NETWORK
                </Text>

                <Text style={styles.modalTitle}>
                  API Gateway
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() =>
                  setServerModalVisible(false)
                }
              >
                <X
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.endpointInfo}>
              <Settings2
                size={16}
                color={colors.primaryLight}
              />

              <Text
                style={styles.endpointInfoText}
              >
                Configure the backend endpoint used by
                this mobile application.
              </Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>
                API BASE URL
              </Text>

              <TextInput
                style={styles.modalInput}
                value={serverInput}
                onChangeText={setServerInput}
                placeholder="http://192.168.x.x:6446/api"
                placeholderTextColor={
                  colors.textMuted
                }
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.inputHint}>
                Physical devices must use the computer's
                LAN IP address instead of localhost.
              </Text>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.testBtn}
                  onPress={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.primaryLight}
                    />
                  ) : (
                    <>
                      <Wifi
                        size={15}
                        color={colors.primaryLight}
                      />

                      <Text
                        style={styles.testBtnText}
                      >
                        Test
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveHostBtn}
                  onPress={handleSaveServerHost}
                >
                  <Text
                    style={styles.saveHostBtnText}
                  >
                    Save & Apply
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.resetHostBtn}
                onPress={handleResetServerHost}
              >
                <RefreshCw
                  size={14}
                  color={colors.textMuted}
                />

                <Text
                  style={styles.resetHostText}
                >
                  Restore Default Endpoint
                </Text>
              </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },

  /* HEADER */

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: alpha.cyan10,
    borderWidth: 1,
    borderColor: alpha.cyan20,
  },

  headerSubtitle: {
    fontSize: 9,
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: '800',
    marginBottom: 2,
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* PROFILE */

  profileCard: {
    marginBottom: 22,
    overflow: 'hidden',
  },

  profileCardGradient: {
    padding: 17,
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
    width: 68,
    height: 68,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 21,
    fontWeight: '900',
    color: '#ffffff',
  },

  avatarStatusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: colors.bgCard,
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  profileRole: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
    marginBottom: 7,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  empBadge: {
    maxWidth: 135,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: alpha.cyan10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: alpha.cyan20,
  },

  empBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryLight,
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: alpha.amber10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },

  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.amber,
  },

  dutyStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
    borderRadius: 13,
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
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  dutyStatusLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  dutyStatusValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },

  changeStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: alpha.cyan10,
  },

  changeStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryLight,
  },

  doctorVerifiedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: alpha.emerald10,
    borderWidth: 1,
    borderColor: alpha.emerald20,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  doctorVerifiedText: {
    flex: 1,
    marginLeft: 10,
  },

  doctorVerifiedTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.emeraldLight,
  },

  doctorVerifiedSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },

  verifiedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.emerald,
  },

  /* SECTIONS */

  sectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },

  /* DETAILS */

  detailsCard: {
    padding: 14,
    marginBottom: 21,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
  },

  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  detailMeta: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },

  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 3,
  },

  detailEditBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.bgCardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 10,
  },

  /* GPS / SYSTEM */

  settingsCard: {
    padding: 14,
    marginBottom: 21,
  },

  gpsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  gpsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  switchMeta: {
    flex: 1,
    marginRight: 8,
  },

  gpsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  switchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  switchSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 15,
  },

  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: alpha.emerald10,
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.emerald,
  },

  livePillText: {
    fontSize: 7,
    fontWeight: '900',
    color: colors.emeraldLight,
    letterSpacing: 0.6,
  },

  gpsInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 7,
  },

  gpsInfoText: {
    flex: 1,
    fontSize: 9,
    color: colors.textMuted,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  switchIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },

  versionIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: alpha.cyan10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  versionMeta: {
    flex: 1,
  },

  versionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  versionSubtitle: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: alpha.emerald10,
    borderWidth: 1,
    borderColor: alpha.emerald20,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  statusPillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.emerald,
  },

  statusPillText: {
    fontSize: 7,
    fontWeight: '900',
    color: colors.emeraldLight,
    letterSpacing: 0.6,
  },

  /* LOGOUT */

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: alpha.rose10,
    borderWidth: 1,
    borderColor: alpha.rose20,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginTop: 1,
    marginBottom: 17,
  },

  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: alpha.rose10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  logoutMeta: {
    flex: 1,
  },

  logoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.roseLight,
  },

  logoutSubtitle: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },

  footerNote: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 20,
  },

  /* MODALS */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: 19,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  modalEyebrow: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
    color: colors.primaryLight,
    marginBottom: 3,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },

  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.bgCardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBody: {},

  inputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 7,
  },

  modalInput: {
    backgroundColor: colors.bgDark,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 13,
  },

  inputHint: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 7,
    marginBottom: 16,
    lineHeight: 15,
  },

  endpointInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: alpha.cyan05,
    borderWidth: 1,
    borderColor: alpha.cyan10,
    borderRadius: 11,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },

  endpointInfoText: {
    flex: 1,
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 15,
  },

  modalPrimaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  modalPrimaryText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13,
  },

  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },

  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bgCardElevated,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 12,
    paddingVertical: 13,
  },

  testBtnText: {
    color: colors.primaryLight,
    fontWeight: '800',
    fontSize: 12,
  },

  saveHostBtn: {
    flex: 1.7,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveHostBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12,
  },

  resetHostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    marginTop: 5,
  },

  resetHostText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },

  /* APPEARANCE STYLES */
  themeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  themeCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  themeCardSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  currentThemePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.borderCyan,
    borderWidth: 1,
    borderColor: colors.borderCyanStrong,
  },
  currentThemePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  themeOptionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  themeOptionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgCardSoft,
    position: 'relative',
  },
  themeOptionCardActive: {
    borderColor: colors.primary,
    backgroundColor: alpha.cyan10,
  },
  themeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCardElevated,
    marginBottom: 8,
  },
  themeOptionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  themeOptionSubtitle: {
    fontSize: 9.5,
    color: colors.textMuted,
  },
  themeCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeExplanationText: {
    fontSize: 10.5,
    color: colors.textMuted,
    lineHeight: 15,
  },
});