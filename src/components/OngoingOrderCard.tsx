import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../screens/auth/authTheme';

export type OngoingOrderStatus = 'awaiting_payment' | 'preparing';

export type OngoingOrderCardData = {
  id: string;
  status: OngoingOrderStatus;
  total?: number;
  createdAt: string;
};

const STATUS_META: Record<OngoingOrderStatus, { label: string; color: string; background: string; icon: any }> = {
  awaiting_payment: {
    label: 'Awaiting payment',
    color: '#1D4ED8',
    background: '#E8EFFD',
    icon: 'card-outline',
  },
  preparing: {
    label: 'Preparing',
    color: '#1D4ED8',
    background: '#E8EFFD',
    icon: 'time-outline',
  },
};

const formatRelativeTime = (iso: string) => {
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) {
    return '';
  }

  const diffMs = Date.now() - created;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const OngoingOrderCard = ({
  data,
  onPress,
}: {
  data: OngoingOrderCardData;
  onPress?: () => void;
}) => {
  const meta = STATUS_META[data.status];
  const isAwaitingPayment = data.status === 'awaiting_payment';
  const relativeTime = formatRelativeTime(data.createdAt);

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <View style={[styles.statusPill, { backgroundColor: meta.background }]}>
        <Ionicons name={meta.icon} size={12} color={meta.color} />
        <Text style={[styles.statusText, { color: meta.color }]} numberOfLines={1}>
          {meta.label}
        </Text>
      </View>

      <View style={styles.heroWrap}>
        {isAwaitingPayment ? (
          <>
            <Text style={styles.heroPrompt}>Complete payment</Text>
            <Text style={styles.heroHint}>Tap to view amount and pay</Text>
          </>
        ) : (
          <>
            <Text style={styles.heroLabel}>Total</Text>
            <Text style={styles.heroAmount}>GHS {(data.total ?? 0).toFixed(2)}</Text>
          </>
        )}
      </View>

      <View style={styles.footerWrap}>
        <Text style={styles.footerText}>
          {isAwaitingPayment ? 'Pay to confirm' : 'Paid'}
        </Text>
        {relativeTime ? <Text style={styles.footerTime}>{relativeTime}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 190,
    height: 230,
    borderRadius: AUTH_RADII.card,
    backgroundColor: AUTH_COLORS.card,
    padding: AUTH_SPACING.block,
    justifyContent: 'space-between',
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: AUTH_RADII.pill,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  heroLabel: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
    fontWeight: '600',
  },
  heroAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: AUTH_COLORS.text,
    letterSpacing: -0.4,
  },
  heroPrompt: {
    fontSize: 17,
    fontWeight: '800',
    color: AUTH_COLORS.text,
    letterSpacing: -0.3,
  },
  heroHint: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  footerWrap: {
    gap: 2,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
  footerTime: {
    fontSize: 11,
    color: AUTH_COLORS.muted,
  },
});

export default OngoingOrderCard;
