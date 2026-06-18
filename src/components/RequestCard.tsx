import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '@/screens/auth/authTheme';
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
          <Text style={styles.statusText}>
            Pending Payment
          </Text>
        </View>
      </View>

      <Text style={styles.title}>
        Complete your payment
      </Text>

      <Text style={styles.subtitle}>
        Your order is waiting for payment confirmation.
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
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  orderBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },

  statusBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
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