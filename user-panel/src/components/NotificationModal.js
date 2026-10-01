import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Truck,
  FileText,
  Activity,
  AlertTriangle,
  LifeBuoy,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import GlassCard from './GlassCard';
import userApi from '../api/userApi';

export default function NotificationModal({ visible, onClose, onNotificationCountChange, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await userApi.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        const unreadCount = res.data.filter((n) => !n.isRead).length;
        if (onNotificationCountChange) {
          onNotificationCountChange(unreadCount);
        }
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible]);

  const handleMarkAsRead = async (id) => {
    try {
      await userApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
      const remainingUnread = notifications.filter((n) => n._id !== id && !n.isRead).length;
      if (onNotificationCountChange) {
        onNotificationCountChange(remainingUnread);
      }
    } catch (e) {
      console.warn('Mark read error:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await userApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      if (onNotificationCountChange) {
        onNotificationCountChange(0);
      }
    } catch (e) {
      console.warn('Mark all read error:', e);
    }
  };

  const getNotificationIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('dispatch') || t.includes('assistant') || t.includes('route') || t.includes('arrived')) {
      return <Truck size={18} color={colors.cyan} />;
    }
    if (t.includes('report') || t.includes('lab') || t.includes('result') || t.includes('sample')) {
      return <FileText size={18} color={colors.emeraldLight} />;
    }
    if (t.includes('ticket') || t.includes('support')) {
      return <LifeBuoy size={18} color={colors.purpleLight} />;
    }
    if (t.includes('alert') || t.includes('critical')) {
      return <AlertTriangle size={18} color={colors.roseLight} />;
    }
    return <Bell size={18} color={colors.primary} />;
  };

  const handleItemPress = (item) => {
    if (!item.isRead) {
      handleMarkAsRead(item._id);
    }
    if (navigation && item.metadata?.screen) {
      if (onClose) onClose();
      if (item.metadata.screen === 'AppointmentsList') {
        navigation.navigate('AppointmentsList');
      } else if (item.metadata.screen === 'Home') {
        navigation.navigate('MainTabs', { screen: 'Home' });
      }
    }
  };

  const renderItem = ({ item }) => {
    const timeFormatted = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          {
            backgroundColor: item.isRead
              ? isDark
                ? 'rgba(255,255,255,0.02)'
                : '#ffffff'
              : isDark
              ? 'rgba(6, 182, 212, 0.08)'
              : 'rgba(8, 145, 178, 0.06)',
            borderColor: item.isRead ? colors.borderSubtle : colors.borderCyan,
          },
        ]}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.itemHeader}>
          <View style={[styles.itemIconWrap, { backgroundColor: colors.cyanGlow }]}>
            {getNotificationIcon(item.type || item.title)}
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: colors.textPrimary, fontWeight: item.isRead ? '700' : '900' },
                ]}
              >
                {item.title}
              </Text>
              {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </View>
            <View style={styles.timeRow}>
              <Clock size={10} color={colors.textMuted} />
              <Text style={[styles.timeText, { color: colors.textMuted }]}>{timeFormatted}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.itemMessage, { color: colors.textSecondary }]}>
          {item.message}
        </Text>
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bgDark,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Notification Center
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {unreadCount > 0 ? `${unreadCount} unread operational alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
            </Text>
          </View>

          {unreadCount > 0 ? (
            <TouchableOpacity
              style={[styles.markAllBtn, { backgroundColor: isDark ? 'rgba(6,182,212,0.15)' : 'rgba(8,145,178,0.1)' }]}
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
            >
              <CheckCheck size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {/* Content */}
        {loading && notifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Syncing notifications...
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchNotifications();
                }}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <GlassCard style={styles.emptyCard}>
                <View style={[styles.emptyIconWrap, { backgroundColor: colors.cyanGlow }]}>
                  <Bell size={28} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  No Notifications
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  You do not have any new clinical dispatch, specimen, or ticket alerts right now.
                </Text>
              </GlassCard>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  itemCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 13.5,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemMessage: {
    fontSize: 12,
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    marginTop: 12,
  },
  emptyCard: {
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
