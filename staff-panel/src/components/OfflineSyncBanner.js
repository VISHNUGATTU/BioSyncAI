import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  WifiOff,
  Clock,
  Zap,
} from 'lucide-react-native';
import offlineSyncQueueService from '../services/offlineSyncQueueService';
import { useTheme } from '../theme/ThemeContext';

export const OfflineSyncBanner = ({ style }) => {
  const { colors, isDark } = useTheme();
  const [syncState, setSyncState] = useState({
    isConnected: true,
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
  });

  useEffect(() => {
    offlineSyncQueueService.init();
    const unsubscribe = offlineSyncQueueService.subscribe((state) => {
      setSyncState({
        isConnected: state.isConnected,
        isOnline: state.isOnline,
        pendingCount: state.pendingCount,
        isSyncing: state.isSyncing,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSyncNow = () => {
    offlineSyncQueueService.syncNow();
  };

  if (syncState.isOnline && syncState.pendingCount === 0) {
    return null;
  }

  const isOffline = !syncState.isOnline;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isOffline ? colors.alphaRose10 : colors.alphaCyan10,
          borderColor: isOffline ? colors.alphaRose20 : colors.borderCyan,
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(15, 23, 42, 0.06)',
            },
          ]}
        >
          {syncState.isSyncing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : isOffline ? (
            <WifiOff size={16} color={colors.roseLight} />
          ) : (
            <Clock size={16} color={colors.primaryLight} />
          )}
        </View>

        <View style={styles.textWrap}>
          <Text
            style={[
              styles.title,
              {
                color: isOffline ? colors.roseLight : colors.primaryLight,
              },
            ]}
          >
            {syncState.isSyncing
              ? 'Synchronizing with Central Laboratory...'
              : isOffline
              ? 'Offline Mode Active (Dead-Zone Protected)'
              : `${syncState.pendingCount} Queued Specimen(s) Pending Sync`}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isOffline
              ? 'Samples recorded locally in encrypted storage. Auto-syncs on reconnect.'
              : 'LTE/Wi-Fi connected. Tapping Sync Now will upload immediately.'}
          </Text>
        </View>

        {syncState.pendingCount > 0 && (
          <TouchableOpacity
            style={[
              styles.syncBtn,
              { backgroundColor: colors.primary },
              syncState.isSyncing && { opacity: 0.6 },
            ]}
            onPress={handleSyncNow}
            disabled={syncState.isSyncing || isOffline}
            activeOpacity={0.8}
          >
            {syncState.isSyncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Zap size={13} color="#FFFFFF" />
                <Text style={styles.syncBtnText}>Sync Now</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default OfflineSyncBanner;
