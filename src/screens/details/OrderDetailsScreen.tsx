import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_SPACING } from '../auth/authTheme';
import { ORDER_TIMELINE_STEPS, getOrderById, getOrderStatusMeta, getTimelineStepIndex } from '../../functions/orderData';
import { useQuery } from '@tanstack/react-query';
import { getOneOrderById } from '@/functions/orders/get-one-order-by-id';
import { showToast } from '@/utils/notifications';
import { Order } from '@/schemas/orders';
import { useLocation } from '@/context/LocationContext';

const STEP_META = {
  placed: { label: 'Placed', icon: 'checkmark-circle-outline' },
  processing: { label: 'Preparing', icon: 'flame-outline' },
  assigned: {label: 'Assigned to courier', icon: 'bicycle'},
  pick_up_completed: { label: 'Picked up', icon: 'bicycle-outline' },
  completed: { label: 'Delivered', icon: 'flag-outline' },
  cancelled: {label: "Cancelled", icon: 'close'}
};


const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatMoney = (value) => `GHS ${Number(value || 0).toFixed(2)}`;

const TimelineStep = ({ stepKey, isActive, isComplete, isLast }: {stepKey: string, isActive: boolean, isComplete: boolean, isLast: boolean}) => {
  const meta = STEP_META[stepKey];

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View
          style={[
            styles.timelineDot,
            isComplete ? styles.timelineDotComplete : null,
            isActive ? styles.timelineDotActive : null,
          ]}
        >
          <Ionicons name={meta.icon} size={13} color={isActive || isComplete ? '#fff' : AUTH_COLORS.muted} />
        </View>
        {!isLast ? <View style={[styles.timelineLine, isComplete ? styles.timelineLineComplete : null]} /> : null}
      </View>
      <View style={styles.timelineBody}>
        <Text style={[styles.timelineLabel, isActive ? styles.timelineLabelActive : null]}>{meta.label}</Text>
        <Text style={styles.timelineHint}>
          {isComplete ? 'Completed' : isActive ? 'In progress' : 'Waiting'}
        </Text>
      </View>
    </View>
  );
};

const OrderDetailsScreen = () => {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const orderId = route.params?.orderId;
  const {getLocationName} = useLocation()

  // const order = useMemo(() => (orderId ? getOrderById(orderId) : null), [orderId]);
  const [order, setOrder] = useState<Order | null>(null)
  const statusMeta = getOrderStatusMeta(order?.status);
  const activeStepIndex = getTimelineStepIndex(order?.trackingStage);
  const isCompleted = order?.status === 'completed';
  const [showCourierModal, setShowCourierModal] = useState(false);

  const fetchOneOrderQuery = useQuery({
    queryKey: ["fetchOneOrder", orderId],
    queryFn: async () =>{
      try {
        const response = await getOneOrderById(orderId)
        return response.data
      } catch (error: any) {
        showToast("error", error.message || "Order not found")
        return null
      }
    }
  })
  React.useEffect(()=>{
    if (fetchOneOrderQuery.data && fetchOneOrderQuery.status == "success") {
      setOrder(fetchOneOrderQuery.data)
    }
  }, [fetchOneOrderQuery.data, fetchOneOrderQuery.status])

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + AUTH_SPACING.screenY }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Order details</Text>

        {!order ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={24} color={AUTH_COLORS.primary} />
            <Text style={styles.emptyTitle}>Order not found</Text>
            <Text style={styles.subtitle}>We could not resolve this order from the current data set.</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <View style={styles.summaryTextWrap}>
                  <Text style={styles.orderLabel}>Order #{order.orderNumber}</Text>
                  <Text style={styles.subtitle}>{formatDateTime(order.createdAt)}</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{statusMeta.label}</Text>
                </View>
              </View>

              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Total</Text>
                  <Text style={styles.metaValue}>{formatMoney(order.payment.amount)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>ETA</Text>
                  <Text style={styles.metaValue}>{order.eta || 'N/A'}</Text>
                </View>
                <TouchableOpacity style={[styles.metaItem, styles.metaItemTouchable]} activeOpacity={0.85} onPress={() => setShowCourierModal(true)}>
                  <View style={styles.riderTileRow}>
                    <View style={styles.riderTextWrap}>
                      <Text style={styles.metaLabel}>Rider</Text>
                      <Text style={styles.metaValue}>{order.courier?.firstName || 'Assigned soon'}</Text>
                      <Text style={styles.riderTapHint}>Tap to view courier details</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={AUTH_COLORS.muted} />
                  </View>
                </TouchableOpacity>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Payment</Text>
                  <Text style={styles.metaValue}>{order.payment.paymentMethod || 'Unknown'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Track order</Text>
              <Text style={styles.sectionSubtitle}>Follow the order journey from placement to delivery.</Text>
              <View style={styles.timelineWrap}>
                {ORDER_TIMELINE_STEPS.map((stepKey, index) => (
                  <TimelineStep
                    key={stepKey}
                    stepKey={stepKey}
                    isComplete={index < activeStepIndex || (isCompleted && stepKey === 'delivered')}
                    isActive={index === activeStepIndex}
                    isLast={index === ORDER_TIMELINE_STEPS.length - 1}
                  />
                ))}
              </View>
            </View>
            {order?.courier && (
              <Modal
                visible={showCourierModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCourierModal(false)}
              >
                <View style={styles.modalBackdrop}>
                  <View style={styles.modalCard}>
                    <Image source={{ uri: `${process.env.EXPO_PUBLIC_BACKEND_URL}${order.courier.photo?.fileStoragePath}` }} style={styles.modalAvatar} />
                    <Text style={styles.modalTitle}>Courier details</Text>
                    <Text style={styles.modalRow}>{`${order.courier.firstName} ${order.courier.lastName}`}</Text>
                    {/* <Text style={styles.modalRow}>{order.courier.vehicle} • {order.courier.plate}</Text> */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.modalPhone}
                      onPress={() => {
                        if (order.courier?.phoneNumber) {
                          Linking.openURL(`tel:${order.courier.phoneNumber}`);
                        }
                      }}
                    >
                      <Text style={styles.modalPhoneText}>{order.courier.phoneNumber}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowCourierModal(false)} style={styles.modalClose}>
                      <Text style={styles.modalCloseText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Delivery info</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{getLocationName(order.deliveryAddressGpsLocation.lat, order.deliveryAddressGpsLocation.lng).then(name=>name) || 'Not available'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Instructions</Text>
                <Text style={styles.infoValue}>{order.deliveryInstructions || 'None'}</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Items</Text>
              <View style={styles.itemsList}>
                {order.cart.cartItems.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.storeItem.name}</Text>
                    <Text style={styles.itemMeta}>
                      {item.qty} x {formatMoney(item.storeItem.price)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Subtotal</Text>
                <Text style={styles.breakdownValue}>{formatMoney(order.subtotal)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Delivery fee</Text>
                <Text style={styles.breakdownValue}>{formatMoney(order.deliveryFee)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Service fee</Text>
                <Text style={styles.breakdownValue}>{formatMoney(order.serviceFee)}</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTotal}>Total</Text>
                <Text style={styles.breakdownTotal}>{formatMoney(order.payment.amount)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  content: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingBottom: 80,
    gap: 14,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  summaryCard: {
    backgroundColor: AUTH_COLORS.card,
    borderRadius: 18,
    padding: AUTH_SPACING.block,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    gap: 14,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryTextWrap: {
    flex: 1,
    gap: 4,
  },
  orderLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
    textTransform: 'capitalize',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    width: '48%',
    backgroundColor: '#FBF8F6',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
  },
  metaLabel: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  sectionCard: {
    backgroundColor: AUTH_COLORS.card,
    borderRadius: 18,
    padding: AUTH_SPACING.block,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
  },
  timelineWrap: {
    gap: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineRail: {
    width: 22,
    alignItems: 'center',
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D9CEC6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotComplete: {
    backgroundColor: '#1B8A3F',
  },
  timelineDotActive: {
    backgroundColor: AUTH_COLORS.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E8DDD6',
    marginTop: 4,
  },
  timelineLineComplete: {
    backgroundColor: '#1B8A3F',
  },
  timelineBody: {
    flex: 1,
    paddingBottom: 6,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  timelineLabelActive: {
    color: AUTH_COLORS.primary,
  },
  timelineHint: {
    marginTop: 2,
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  itemsList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  itemMeta: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: AUTH_COLORS.line,
  },
  breakdownTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  emptyCard: {
    backgroundColor: AUTH_COLORS.card,
    borderRadius: 18,
    padding: AUTH_SPACING.block,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: AUTH_COLORS.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    gap: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  modalRow: {
    fontSize: 14,
    color: AUTH_COLORS.text,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 2,
  },
  riderTileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riderTextWrap: {
    flex: 1,
    gap: 2,
  },
  riderTapHint: {
    fontSize: 12,
    fontWeight: '600',
    color: AUTH_COLORS.primary,
  },
  metaItemTouchable: {
    borderColor: AUTH_COLORS.primary,
    borderWidth: 1,
    backgroundColor: '#FFFDF9',
    shadowColor: AUTH_COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  modalPhone: {
    marginTop: 8,
    backgroundColor: AUTH_COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalPhoneText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalClose: {
    marginTop: 10,
    paddingVertical: 8,
  },
  modalCloseText: {
    color: AUTH_COLORS.muted,
  },
});

export default OrderDetailsScreen;
