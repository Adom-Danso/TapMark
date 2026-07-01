import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '@/screens/auth/authTheme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function RequestCard({
  index,
  onClick,
}: {
  index: number;
  onClick: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onClick}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.orderBadge}>
          <Text style={styles.orderBadgeText}>
            Order #{index + 1}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <Ionicons name="time-outline" size={12} color="#B45309" />
          <Text style={styles.statusText}>
            Pending Payment
          </Text>
        </View>
      </View>

      <Text style={styles.title}>
        Complete your payment
      </Text>

      <Text style={styles.subtitle}>
        Your order is waiting for payment confirmation. Tap to continue to checkout.
      </Text>

      <View style={styles.bottomRow}>
        <Text style={styles.actionText}>
          Continue →
        </Text>
      </View>
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: AUTH_COLORS.card,
    borderRadius: AUTH_RADII.card,
    padding: AUTH_SPACING.block,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 3,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  orderBadge: {
    backgroundColor: AUTH_COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  orderBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: AUTH_COLORS.primary,
  },

  statusBadge: {
    backgroundColor: "#FFF1D6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: AUTH_COLORS.text,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: AUTH_COLORS.muted,
  },

  bottomRow: {
    marginTop: 16,
    alignItems: "flex-end",
  },

  actionText: {
    fontSize: 14,
    fontWeight: "700",
    color: AUTH_COLORS.primary,
  },
});