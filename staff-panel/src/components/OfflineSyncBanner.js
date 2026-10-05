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

export const OfflineSyncBanner = ({ style }) => {
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

  // If online and no items pending, render a subtle status or nothing
  if (syncState.isOnline && syncState.pendingCount === 0) {
    return null;
  }

  const isOffline = !syncState.isOnline;

  return (
    <View
      style={[
        styles.banner,
        isOffline ? styles.bannerOffline : styles.bannerPending,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconWrap}>
          {syncState.isSyncing ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : isOffline ? (
            <WifiOff size={16} color="#ef4444" />
          ) : (
            <Clock size={16} color="#0891b2" />
          )}
        </View>

        <View style={styles.textWrap}>
          <Text
            style={[
              styles.title,
              isOffline ? styles.titleOffline : styles.titlePending,
            ]}
          >
            {syncState.isSyncing
              ? 'Synchronizing with Central Laboratory...'
              : isOffline
              ? 'Offline Mode Active (Dead-Zone Protected)'
              : `${syncState.pendingCount} Queued Specimen(s) Pending Sync`}
          </Text>
          <Text style={styles.subtitle}>
            {isOffline
              ? 'Samples recorded locally in encrypted storage. Auto-syncs on reconnect.'
              : 'LTE/Wi-Fi connected. Tapping Sync Now will upload immediately.'}
          </Text>
        </View>

        {syncState.pendingCount > 0 && (
          <TouchableOpacity
            style={[styles.syncBtn, syncState.isSyncing && { opacity: 0.6 }]}
            onPress={handleSyncNow}
            disabled={syncState.isSyncing || isOffline}
            activeOpacity={0.8}
          >
            {syncState.isSyncing ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Zap size={13} color="#000000" />
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
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bannerOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  bannerPending: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.35)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
  titleOffline: {
    color: '#f87171',
  },
  titlePending: {
    color: '#22d3ee',
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 14,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#06b6d4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
});

export default OfflineSyncBanner;
