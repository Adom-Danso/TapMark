import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, Linking, Image, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../auth/authTheme';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getOneOrderById } from '@/functions/orders/get-one-order-by-id';
import { showToast } from '@/utils/notifications';
import { Order } from '@/schemas/orders';
import { useLocation } from '@/context/LocationContext';
import { generateImageUrl } from '@/utils/shared';
import { updateOneOrder } from '@/functions/orders/update-one-order-by-id';
import { OTPCode } from '@/schemas/otp-codes';
import { addOneOTPCode, RequestBody } from '@/functions/verifications/add-one-otp-code';
import MapView, { Marker, Polyline } from 'react-native-maps';
import RatingModal from '@/components/RatingModal';
import ReportModal from '@/components/ReportModal';

const ORDER_TIMELINE_STEPS = ['placed', 'processing', 'assigned', 'pick_up_completed', 'completed'] as const;

type OrderStage = (typeof ORDER_TIMELINE_STEPS)[number] | 'cancelled';

type CourierLocation = {
  latitude: number;
  longitude: number;
};

type FeedbackTarget = {
  targetType: string;
  targetId: string;
  title: string;
  subtitle: string;
};

const STEP_META = {
  placed: { label: 'Placed', icon: 'checkmark-circle-outline' },
  assigned: { label: 'Assigned to courier', icon: 'bicycle' },
  processing: { label: 'Preparing', icon: 'flame-outline' },
  pick_up_completed: { label: 'Picked up', icon: 'bicycle-outline' },
  completed: { label: 'Delivered', icon: 'flag-outline' },
  cancelled: { label: "Cancelled", icon: 'close' }
} as const;

const normaliseOrderStage = (order?: Order): OrderStage => {
  if (!order) return 'placed';

  if (order.orderStatus === 'cancelled') return 'cancelled';

  if (order.isOrderCompleted || order.orderStatus === 'delivered') {
    return 'completed';
  }

  if (order.isPickedUp) {
    return 'pick_up_completed';
  }

  if (order.orderStatus === "processing" && !order.assignedCourierId) {
    return 'processing';
  }

  if (order.assignedCourierId || order.orderStatus === 'accepted') {
    return 'assigned';
  }

  return 'placed';
};

const getTimelineStepIndex = (normalizedStage?: OrderStage | null) => {
  switch (normalizedStage) {
    case 'placed':
      return 0;
    case 'processing':
      return 1;
    case 'assigned':
      return 2;
    case 'pick_up_completed':
      return 3;
    case 'completed':
      return 4;
    default:
      return 0;
  }
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

const formatMoney = (value: unknown) => `GHS ${Number(value || 0).toFixed(2)}`;

type TimelineStepKey = keyof typeof STEP_META;

const TimelineStep = ({ stepKey, isActive, isComplete, isLast }: { stepKey: TimelineStepKey; isActive: boolean; isComplete: boolean; isLast: boolean }) => {
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

const ANIMATION_DURATION = 220;


const OrderDetailsScreen = ({ navigation }: { navigation: any }) => {
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const orderId = route.params?.orderId;
  const { getLocationName } = useLocation()

  const [order, setOrder] = useState<Order | null>(null)
  const scale = useState(new Animated.Value(0.9))[0];
  const fade = useState(new Animated.Value(0))[0];
  const [deliveryAddressName, setDeliveryAddressName] = useState<string>('Loading address...');
  const [courierLocation, setCourierLocation] = useState<CourierLocation | null>(null);
  const normalizedStage = normaliseOrderStage(order as Order | undefined);
  const activeStepIndex = getTimelineStepIndex(normalizedStage);
  const isCompleted = normalizedStage === 'completed';
  const isProcessingStage = normalizedStage === 'processing';
  const showTrackingMap = ['assigned', 'pick_up_completed', 'completed'].includes(normalizedStage);
  const destinationLocation = order?.deliveryAddressGpsLocation;
  const mapRegion = useMemo(() => {
    if (!courierLocation || !destinationLocation) {
      return null;
    }

    const centerLatitude = (courierLocation.latitude + destinationLocation.lat) / 2;
    const centerLongitude = (courierLocation.longitude + destinationLocation.lng) / 2;

    return {
      latitude: centerLatitude,
      longitude: centerLongitude,
      latitudeDelta: Math.max(Math.abs(courierLocation.latitude - destinationLocation.lat) * 2.2, 0.02),
      longitudeDelta: Math.max(Math.abs(courierLocation.longitude - destinationLocation.lng) * 2.2, 0.02),
    };
  }, [courierLocation, destinationLocation]);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState<OTPCode | null>(null);
  const [ratingTarget, setRatingTarget] = useState<FeedbackTarget | null>(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportComplaints] = useState([
    'Package damaged',
    'Courier was late',
    'Wrong item delivered',
    'Missing items',
    'Delivery issue',
  ]);

  const fetchOneOrderQuery = useQuery({
    queryKey: ["fetchOneOrder", orderId],
    queryFn: async () => {
      try {
        const response = await getOneOrderById(orderId)
        return response.data
      } catch (error: any) {
        showToast("error", error.message || "Order not found")
        return null
      }
    }
  })
  React.useEffect(() => {
    if (fetchOneOrderQuery.data && fetchOneOrderQuery.status == "success") {
      setOrder(fetchOneOrderQuery.data)
    }
  }, [fetchOneOrderQuery.data, fetchOneOrderQuery.status])

  useEffect(() => {
    if (!order) {
      setDeliveryAddressName('Loading address...');
      setCourierLocation(null);
      return;
    }

    let cancelled = false;

    getLocationName(order.deliveryAddressGpsLocation.lat, order.deliveryAddressGpsLocation.lng)
      .then((name) => {
        if (!cancelled) {
          setDeliveryAddressName(name || 'Not available');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDeliveryAddressName('Not available');
        }
      });

    setCourierLocation({
      latitude: order.deliveryAddressGpsLocation.lat + 0.0045,
      longitude: order.deliveryAddressGpsLocation.lng - 0.004,
    });

    return () => {
      cancelled = true;
    };
  }, [getLocationName, order]);

  const updateOneOrderMutation = useMutation({
    mutationKey: ["updateOneOrder", orderId],
    mutationFn: async (updates: Partial<Order>) => {
      const response = updateOneOrder(orderId, updates)
      return response
    },
    onSuccess: (data) => {
      showToast("success", "Order updated successfully")
      fetchOneOrderQuery.refetch()
      navigation.goBack()
    },
    onError: (error: any) => {
      showToast("error", error.message || "Failed to update order")
    }
  })
  const closeModal = () => {
    Animated.timing(fade, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start(() => {
      scale.setValue(0.9);
      setIsModalVisible(false);
    });
  };
  const addOneOtpCodeMutation = useMutation({
    mutationKey: ["addOneOtpCode"],
    mutationFn: async (payload: RequestBody) => {
      if (otpCode) return otpCode
      const response = await addOneOTPCode(payload)
      setOtpCode(response.data)
      return response.data;
    },
    onSuccess: (data) => {
      setIsModalVisible(true)
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }),
      ]).start();
    },
    onError: (error) => {
      showToast("error", error.message || "Failed to initiate verification")
    }
  })

  const isOrderLoading = fetchOneOrderQuery.isPending && !order;
  const openOrderRating = () => {
    if (!order?.id) {
      return;
    }

    setRatingTarget({
      targetType: 'order',
      targetId: order.id,
      title: 'Rate your delivery',
      subtitle: 'Tell us how the package, timing, and overall experience went.',
    });
  };

  const openCourierRating = () => {
    const courierId = order?.courier?.id || order?.assignedCourierId;

    if (!courierId) {
      return;
    }

    setShowCourierModal(false);
    setRatingTarget({
      targetType: 'courier',
      targetId: courierId,
      title: 'Rate the courier',
      subtitle: 'Tell us how the courier handled the delivery.',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + AUTH_SPACING.screenY }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Order details</Text>

        {isOrderLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={AUTH_COLORS.primary} />
            <Text style={styles.loadingTitle}>Loading order details</Text>
            <Text style={styles.subtitle}>Please wait while we fetch the latest order information.</Text>
          </View>
        ) : !order ? (
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
                  <Text style={styles.orderLabel}>{order.orderNumber}</Text>
                  <Text style={styles.subtitle}>{formatDateTime(order.createdAt)}</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{STEP_META[normalizedStage as keyof typeof STEP_META]?.label || 'Unknown'}</Text>
                </View>
              </View>

              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Total</Text>
                  <Text style={styles.metaValue}>{formatMoney(order.payment.amount)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>ETA</Text>
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

            {isCompleted ? (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Share feedback</Text>
                    <Text style={styles.sectionSubtitle}>Leave a delivery review and rate the courier from courier details.</Text>
                  </View>
                  <View style={styles.feedbackBadge}>
                    <Text style={styles.feedbackBadgeText}>Post-delivery</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryReviewButton} activeOpacity={0.9} onPress={openOrderRating}>
                  <Ionicons name="star" size={18} color="#fff" />
                  <View style={styles.primaryReviewCopy}>
                    <Text style={styles.primaryReviewTitle}>Rate order</Text>
                    <Text style={styles.primaryReviewSubtitle}>Review the package, timing, and overall experience.</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : null}

            {isProcessingStage ? (
              <View style={styles.sectionCard}>
                <View style={styles.searchHeader}>
                  <View style={styles.searchIconWrap}>
                    <ActivityIndicator color={AUTH_COLORS.primary} />
                  </View>
                  <View style={styles.searchTextWrap}>
                    <Text style={styles.sectionTitle}>Searching for courier</Text>
                    <Text style={styles.sectionSubtitle}>We are matching a rider to your order. You can keep following the summary below.</Text>
                  </View>
                </View>
                <View style={styles.searchPillsRow}>
                  <View style={styles.searchPill}>
                    <Ionicons name="time-outline" size={14} color={AUTH_COLORS.primary} />
                    <Text style={styles.searchPillText}>Preparing pickup</Text>
                  </View>
                  <View style={styles.searchPill}>
                    <Ionicons name="bicycle-outline" size={14} color={AUTH_COLORS.primary} />
                    <Text style={styles.searchPillText}>Courier not assigned yet</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {showTrackingMap && courierLocation && destinationLocation ? (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Courier tracking</Text>
                    <Text style={styles.sectionSubtitle}>Live tracking will attach here once the courier is on the move.</Text>
                  </View>
                  <View style={styles.mapStatusPill}>
                    <Text style={styles.mapStatusText}>{normalizedStage === 'pick_up_completed' ? 'On the way' : 'Assigned'}</Text>
                  </View>
                </View>
                <View style={styles.mapWrap}>
                  <MapView
                    style={styles.map}
                    initialRegion={mapRegion || undefined}
                    region={mapRegion || undefined}
                  >
                    <Marker coordinate={courierLocation} pinColor={AUTH_COLORS.primary} />
                    <Marker coordinate={{ latitude: destinationLocation.lat, longitude: destinationLocation.lng }} pinColor="#1B8A3F" />
                    <Polyline
                      coordinates={[
                        courierLocation,
                        { latitude: destinationLocation.lat, longitude: destinationLocation.lng },
                      ]}
                      strokeColor={AUTH_COLORS.primary}
                      strokeWidth={4}
                    />
                  </MapView>
                </View>
              </View>
            ) : null}

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Track order</Text>
              <Text style={styles.sectionSubtitle}>Follow the order journey from placement to delivery.</Text>
              {!isProcessingStage ? (
                <View style={styles.timelineWrap}>
                  {ORDER_TIMELINE_STEPS.map((stepKey, index) => (
                    <TimelineStep
                      key={stepKey}
                      stepKey={stepKey}
                      isComplete={index < activeStepIndex || (isCompleted && stepKey === 'completed')}
                      isActive={index === activeStepIndex}
                      isLast={index === ORDER_TIMELINE_STEPS.length - 1}
                    />
                  ))}
                </View>
              ) : null}
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
                    <Image source={{ uri: generateImageUrl(order.courier.photo?.fileStoragePath || '') }} style={styles.modalAvatar} />
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
                    {isCompleted ? (
                      <TouchableOpacity onPress={openCourierRating} style={styles.courierReviewButton} activeOpacity={0.9}>
                        <Ionicons name="star-outline" size={16} color={AUTH_COLORS.primary} />
                        <Text style={styles.courierReviewText}>Rate courier</Text>
                      </TouchableOpacity>
                    ) : null}
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
                <Text style={styles.infoValue}>{deliveryAddressName}</Text>
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
                      {item.quantity} x {formatMoney(item.storeItem.price)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Subtotal</Text>
                <Text style={styles.breakdownValue}>{formatMoney(order.payment.amount - order.deliveryFee - order.serviceFee)}</Text>
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

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Need help?</Text>
                  <Text style={styles.sectionSubtitle}>If something went wrong, you can report it from here without leaving the page.</Text>
                </View>
                <View style={styles.helpBadge}>
                  <Text style={styles.helpBadgeText}>Optional</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.reportButton} activeOpacity={0.9} onPress={() => setIsReportModalVisible(true)}>
                <Ionicons name="chatbox-ellipses-outline" size={18} color={AUTH_COLORS.text} />
                <View style={styles.reportCopy}>
                  <Text style={styles.reportTitle}>Report an issue</Text>
                  <Text style={styles.reportSubtitle}>Use this for delays, damage, wrong items, or other delivery problems.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={AUTH_COLORS.muted} />
              </TouchableOpacity>
            </View>

            {order.isPickedUp && !order.isOrderCompleted && (
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton, addOneOtpCodeMutation.isPending && styles.actionButtonDisabled]}
                onPress={() => addOneOtpCodeMutation.mutate({
                  userId: order?.assignedCourierId as string,
                  orderId: order?.id,
                  otpType: "pickup_verification",
                  cartItemIds: order?.cart.cartItems.map((value) => value.id)
                })}
                activeOpacity={0.85}
                disabled={addOneOtpCodeMutation.isPending}
              >
                {addOneOtpCodeMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.actionButtonText}>Confirm Order Completion</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {!order.isPickedUp && order.orderStatus !== 'cancelled' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton, updateOneOrderMutation.isPending && styles.actionButtonDisabled]}
                onPress={() => updateOneOrderMutation.mutate({ orderStatus: 'cancelled' })}
                activeOpacity={0.85}
                disabled={updateOneOrderMutation.isPending}
              >
                {updateOneOrderMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.actionButtonText}>Cancel Order</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
      {ratingTarget ? (
        <RatingModal
          visible={!!ratingTarget}
          title={ratingTarget.title}
          subtitle={ratingTarget.subtitle}
          targetType={ratingTarget.targetType}
          targetId={ratingTarget.targetId}
          onClose={() => setRatingTarget(null)}
        />
      ) : null}
      {order ? (
        <ReportModal
          visible={isReportModalVisible}
          title="Report an issue"
          subtitle="Choose the complaint that fits best, add a short explanation, and include a photo if needed."
          targetType="order"
          targetId={order.id}
          complaints={reportComplaints}
          onClose={() => setIsReportModalVisible(false)}
        />
      ) : null}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.modalCard,
              { opacity: fade, transform: [{ scale }] },
            ]}
          >
            <Text style={styles.modalTitle}>Pickup confirmation</Text>
            <Text style={styles.modalSubtitle}>
              Let the courier scan the QR or call out this OTP.
            </Text>
            <View style={styles.qrWrap}>
              <QRCode value={otpCode ? otpCode.code : ""} size={180} color={AUTH_COLORS.text} />
            </View>
            <View style={styles.otpWrap}>
              <Text style={styles.otpLabel}>One-time code</Text>
              <Text style={styles.otpValue}>{otpCode ? otpCode.code : ""}</Text>
            </View>
            <Pressable style={styles.modalClose} onPress={closeModal}>
              <Text style={styles.modalCloseText}>Done</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
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
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 220,
    backgroundColor: AUTH_COLORS.card,
    borderRadius: 18,
    padding: AUTH_SPACING.block,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
    textAlign: 'center',
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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  searchIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  searchTextWrap: {
    flex: 1,
    gap: 4,
  },
  searchPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#FFF8F6',
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
  },
  searchPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  mapStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  mapStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
  mapWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    height: 220,
    backgroundColor: '#F6F1ED',
  },
  map: {
    flex: 1,
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
  feedbackBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  feedbackBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
  primaryReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 74,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: AUTH_COLORS.primary,
    shadowColor: AUTH_COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  primaryReviewCopy: {
    flex: 1,
    gap: 2,
  },
  primaryReviewTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  primaryReviewSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  helpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3EEE9',
  },
  helpBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: AUTH_COLORS.muted,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FBF8F6',
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
  },
  reportCopy: {
    flex: 1,
    gap: 2,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  reportSubtitle: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  courierReviewButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: AUTH_COLORS.primarySoft,
    borderWidth: 1,
    borderColor: AUTH_COLORS.primary,
    alignSelf: 'stretch',
  },
  courierReviewText: {
    color: AUTH_COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 4,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  confirmButton: {
    backgroundColor: AUTH_COLORS.primary,
  },
  cancelButton: {
    backgroundColor: '#DC3545',
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: AUTH_COLORS.muted,
    marginTop: 8,
    marginBottom: AUTH_SPACING.block,
  },
  qrWrap: {
    padding: AUTH_SPACING.block,
    borderRadius: AUTH_RADII.card,
    backgroundColor: AUTH_COLORS.background,
  },
  otpWrap: {
    alignItems: 'center',
    marginTop: AUTH_SPACING.block,
  },
  otpLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: AUTH_COLORS.muted,
    textTransform: 'uppercase',
  },
  otpValue: {
    fontSize: 28,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
    letterSpacing: 6,
    marginTop: 6,
  },
  emptyBody: {
    fontSize: 14,
    color: AUTH_COLORS.muted,
    marginTop: 8,
  },
});

export default OrderDetailsScreen;
