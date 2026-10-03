import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../screens/auth/authTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type OngoingOrderStatus = 'awaiting_payment' | 'preparing';

export type OngoingOrderCardData = {
  id: string;
  status: OngoingOrderStatus;
  total?: number;
  createdAt: string;
  cartId?: string;
  paymentMethod?: string;
  deliveryAddressGpsLocation?: { lat: number; lng: number };
};

const STATUS_META: Record<OngoingOrderStatus, { label: string; color: string; background: string; icon: any }> = {
  awaiting_payment: {
    label: 'Pending payment',
    color: '#D97706',
    background: '#FFF1D6',
    icon: 'time-outline',
  },
  preparing: {
    label: 'Preparing',
    color: AUTH_COLORS.primary,
    background: AUTH_COLORS.primarySoft,
    icon: 'time-outline',
  },
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
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[styles.card, { transform: [{ scale }] }]}
    >
      <View style={[styles.statusPill, { backgroundColor: meta.background }]}>
        <Ionicons name={meta.icon} size={11} color={meta.color} />
        <Text style={[styles.statusText, { color: meta.color }]} numberOfLines={1}>
          {meta.label}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        {isAwaitingPayment ? (
          <Text style={styles.heroPrompt} numberOfLines={1}>
            Complete payment
          </Text>
        ) : (
          <Text style={styles.heroAmount} numberOfLines={1}>
            GHS {(data.total ?? 0).toFixed(2)}
          </Text>
        )}
        {!isAwaitingPayment ? <Text style={styles.paidText}>Paid</Text> : null}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 147,
    height: 72,
    borderRadius: AUTH_RADII.card,
    backgroundColor: AUTH_COLORS.card,
    paddingHorizontal: AUTH_SPACING.tight,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    justifyContent: 'space-between',
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AUTH_RADII.pill,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    flexShrink: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  heroAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: AUTH_COLORS.text,
    letterSpacing: -0.3,
  },
  heroPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  paidText: {
    fontSize: 11,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
});

export default OngoingOrderCard;
