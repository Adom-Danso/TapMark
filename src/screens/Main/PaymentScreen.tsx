import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Animated,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../auth/authTheme';
import { usePaymentMethods } from '../../context/PaymentMethodsContext';
import OtpModal from '../../components/OtpModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useMutation } from '@tanstack/react-query';
import { addOnePayment, RequestBody } from '@/functions/payments/add-one-payment';
import { toPaystackBankFragment, toPaystackMobileMoneyFragment } from '@/utils/payment-methods';
import { PaymentMethodType } from '@/schemas/payments';
import { useProfile } from '@/context/ProfileContext';
import { useCart } from '@/context/CartContext';
import { submitPaystackOtp } from '@/functions/payments/submit-otp';
import { showToast } from '@/utils/notifications';
import { checkPaymentStatus } from '@/functions/payments/check-payment-status';
import { deleteOneTempOrder } from '@/functions/orders/delete-one-temp-order';
import { updateOneCart } from '@/functions/cart/update-one-cart';
import { clearActiveCartId } from '@/utils/cart';
import { useLocation } from '@/context/LocationContext';

const METHOD_TYPE_LABELS = {
  'mobile-money': 'Mobile Money',
  bank: 'Bank',
  'tapmark-wallet': 'Tapmark Wallet',
};

const METHOD_ICONS = {
  'mobile-money': 'phone-portrait-outline',
  bank: 'business-outline',
  'tapmark-wallet': 'wallet-outline',
};

const TAPMARK_WALLET_METHOD: any = {
  id: 'tapmark-wallet',
  type: 'tapmark-wallet',
  label: 'Tapmark Wallet',
  displayLabel: 'Tapmark Wallet',
  accountName: 'Tapmark Wallet',
  isDefault: true,
};

/**
 * SelectableMethodCard
 * Reusable card for selecting a payment method
 */
const SelectableMethodCard = ({ method, isSelected, onSelect }: { method: any; isSelected: any; onSelect: any }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.985,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  };

  const icon: any = METHOD_ICONS[method.type as keyof typeof METHOD_ICONS] || 'wallet-outline';
  const displayLabel = method.displayLabel || method.label || method.accountName || 'Unknown';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.methodCard, isSelected && styles.methodCardSelected]}
        onPress={onSelect}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <View style={styles.methodIconWrap}>
          <Ionicons
            name={icon as any}
            size={18}
            color={isSelected ? AUTH_COLORS.primary : AUTH_COLORS.muted}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>{displayLabel}</Text>
          <Text style={styles.methodSubtitle}>
            {method.isDefault ? 'Your default method' : 'Tap to select'}
          </Text>
        </View>

        <View style={[styles.radio, isSelected && styles.radioActive]}>
          {isSelected && <View style={styles.radioDot} />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

type PaymentScreenParams = {
  paymentType: string;
  tempOrderId: string;
}

/**
 * PaymentScreen
 * Allows users to select an existing payment method (filtered by type from cart)
 * Then verify with OTP and confirm payment
 *
 * Route Params:
 *  - paymentType: 'mobile-money' or 'bank' (from CartScreen)
 */
const PaymentScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { paymentMethods } = usePaymentMethods();
  const { addLocation, currentLocation } = useLocation()
  const { profileData } = useProfile()
  const { activeCartId, refreshCart } = useCart()

  // Get payment type from route params (passed from CartScreen)
  const { paymentType, tempOrderId, amountToPay } = route.params || {};
  const paymentTypeLabel = METHOD_TYPE_LABELS[paymentType as keyof typeof METHOD_TYPE_LABELS] || 'payment';

  // State management
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationType, setConfirmationType] = useState('success'); // 'success', 'failure', 'pending'
  const [phoneNumber, setPhoneNumber] = useState('your phone');
  const [paymentReference, setPaymentReference] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [hasTappedPay, setHasTappedPay] = useState(false)
  const isExitingRef = useRef(false)
  const isResettingRef = useRef(false)

  const resetToCartIndex = () => {
    isResettingRef.current = true;
    navigation.reset({
      index: 0,
      routes: [{ name: 'CartIndex' }],
    });
  };

  const handleClosePress = () => {
    if (!tempOrderId || deleteOneTempOrderMutation.isPending || isExitingRef.current) {
      return;
    }

    isExitingRef.current = true;
    deleteOneTempOrderMutation.mutate(tempOrderId);
  };


  const updateCartMutation = useMutation({
    mutationKey: ["updateCart"],
    mutationFn: async (payload: any) => {
      setConfirmationModalVisible(true);
      const response = await updateOneCart(payload, activeCartId as string)
      return response
    },
    onSuccess: (data) => {
      clearActiveCartId();
      addLocation(currentLocation!);
      refreshCart()
      setTimeout(() => {
        setConfirmationModalVisible(false);
        if (otpVerified) {
          setOtpVerified(false);
        }
        resetToCartIndex();
      }, 500);
    },
    onError: (error) => {

    },
  })

  const deleteOneTempOrderMutation = useMutation({
    mutationKey: ["deleteOneTempOrder"],
    mutationFn: async (tempOrderId: string) => {
      const response = await deleteOneTempOrder(tempOrderId)
      return response
    },
    onSuccess: (data) => {
      console.log("Temp order deleted successfully", data);
      resetToCartIndex();
    },
    onError: (error) => {
      isExitingRef.current = false;
      console.log(error)
      showToast("error", error.message || "Failed to delete temp order")
    }
  })

  const addOnePaymentMutation = useMutation({
    mutationKey: ["addOnePaymentMutation"],
    mutationFn: async (payload: RequestBody) => {
      if (!selectedMethod) throw Error("Payment Method not selected");

      // Extract phone number from method for OTP display
      if (selectedMethod.type === 'mobile-money' && selectedMethod.mobileNumber) {
        setPhoneNumber(selectedMethod.mobileNumber);
      }

      const requestPayload = { ...payload }
      if (selectedMethod.type == 'mobile-money') {
        requestPayload.mobileMoney = toPaystackMobileMoneyFragment(selectedMethod)
      } else if (selectedMethod.type == 'bank') {
        requestPayload.bank = toPaystackBankFragment(selectedMethod as PaymentMethodType)
      } else if (selectedMethod.type === 'tapmark-wallet') {
        // No additional data needed for tapmark wallet
        requestPayload.mobileMoney = undefined;
        requestPayload.bank = undefined;
      }

      const response = await addOnePayment(requestPayload)
      setPaymentReference(response.data.reference)
      setPaymentId(response.data.id)
      return response
    },
    onSuccess: (data) => {
      if (data.nextStep == "send_otp") {
        setOtpModalVisible(true);
      } else {
        setOtpVerified(true);
      }

      if (paymentType === 'tapmark-wallet') {
        setConfirmationType('pending');
        updateCartMutation.mutate({ isOrderCompleted: true })
      }
    },
    onError: (error) => {
      console.log(error)
      setHasTappedPay(false);
      showToast("error", error.message || "Failed to initiate Payment")
    }
  })

  const submitPaystackOtpMutation = useMutation({
    mutationKey: ["submitPaystackOtpMutation"],
    mutationFn: async (payload: { otp: string, onComplete: () => void }) => {
      try {
        const response = await submitPaystackOtp({ ...payload, reference: paymentReference as string })
        return { data: response.data, onComplete: payload.onComplete }
      } catch (error) {
        payload.onComplete()
        throw error
      }
    },
    onSuccess: (data) => {
      setOtpVerified(true);
      setOtpModalVisible(false);
      data.onComplete()
    },
    onError: (error) => {
      showToast("error", error.message || "Failed to submit otp")
    }
  })


  const iHavePaidMutation = useMutation({
    mutationKey: ["iHavePaidMutation"],
    mutationFn: async () => {
      if (!paymentReference || !paymentId) throw Error("Payment reference or ID not set");
      setConfirmationType("pending");
      setConfirmationModalVisible(true);
      const response = await checkPaymentStatus({ reference: paymentReference, paymentId: paymentId })
      return response.data
    },
    onSuccess: (data) => {
      if (data.paymentStatus === "completed") {
        setConfirmationType("success");
        updateCartMutation.mutate({ isOrderCompleted: data.paymentStatus === "completed" })
      } else if (data.paymentStatus === "pending") {
        setTimeout(() => {
          setConfirmationModalVisible(false);
        }, 1000);
      } else {
        setConfirmationType("failure");
        setTimeout(() => {
          setConfirmationModalVisible(false);
          if (otpVerified) {
            setOtpVerified(false);
          }
          resetToCartIndex();
        }, 2000);

      }

    },
    onError: (error) => {
      showToast("error", error.message || "Failed to check payment status")
    }
  })

  const showCloseButton = !hasTappedPay;

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (isResettingRef.current) {
        return;
      }

      if (!tempOrderId) {
        return;
      }

      event.preventDefault();

      if (!isExitingRef.current && !deleteOneTempOrderMutation.isPending) {
        handleClosePress();
      }
    });

    return unsubscribe;
  }, [deleteOneTempOrderMutation.isPending, navigation, tempOrderId]);

  // Filter methods by payment type
  const filteredMethods = useMemo(
    () => paymentMethods.filter((m) => m.type === paymentType),
    [paymentMethods, paymentType]
  );
  const visibleMethods = useMemo<any[]>(
    () => (paymentType === 'tapmark-wallet' ? [TAPMARK_WALLET_METHOD] : filteredMethods),
    [filteredMethods, paymentType]
  );

  // Auto-select first method if available
  useEffect(() => {
    if (visibleMethods.length > 0 && !selectedMethod) {
      const defaultMethod = visibleMethods.find((m) => m.isDefault);
      setSelectedMethod(defaultMethod || visibleMethods[0]);
    }
  }, [selectedMethod, visibleMethods]);

  // Handle OTP verification
  // const handleOtpVerify = (code, onComplete) => {
  //   // Stub: simulate OTP verification (replace with real API call)
  //   setTimeout(() => {
  //     // Simulated success (95% pass, 5% fail for testing)
  //     const isSuccess = Math.random() > 0.05;

  //     if (isSuccess) {
  //       setOtpVerified(true);
  //       setOtpModalVisible(false);
  //       onComplete();
  //     } else {
  //       // Show failure modal
  //       setConfirmationType('failure');
  //       setConfirmationModalVisible(true);
  //       onComplete();
  //     }
  //   }, 1200);
  // };

  // Handle "I have paid" button tap
  // const handleIHavePaidTap = () => {
  //   // Show pending modal briefly, then auto-dismiss
  //   setConfirmationType('pending');
  //   setConfirmationModalVisible(true);

  //   // After pending modal auto-dismisses (2.5s), show success
  //   setTimeout(() => {
  //     setConfirmationType('success');
  //     setConfirmationModalVisible(true);
  //   }, 2500);
  // };



  // Handle confirmation modal retry (failure)
  const handleConfirmationRetry = () => {
    setConfirmationModalVisible(false);
    setOtpVerified(false);
    // Reset to show "Pay" button again
  };

  // Handle OTP modal close
  const handleOtpModalClose = () => {
    setOtpModalVisible(false);
  };

  const showPaidLoading = confirmationModalVisible && confirmationType === 'pending';

  const handleOpenPaymentMethods = () => {
    const parentNav = navigation.getParent();

    if (parentNav) {
      parentNav.navigate('Profile', {
        screen: 'PaymentMethods',
        params: { origin: 'payment' },
      });
      return;
    }

    navigation.navigate('Profile', {
      screen: 'PaymentMethods',
      params: { origin: 'payment' },
    });
  };

  // If no methods available, show empty state
  if (visibleMethods.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Select Payment Method</Text>

          <View style={styles.emptyCard}>
            <Ionicons name="wallet-outline" size={32} color={AUTH_COLORS.primary} />
            <Text style={styles.emptyTitle}>No payment methods</Text>
            <Text style={styles.emptyText}>
              Add a {paymentTypeLabel} method to continue your payment.
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleOpenPaymentMethods}
              activeOpacity={0.9}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addButtonText}>Add {paymentTypeLabel}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerWrap}>
          <Text style={styles.title}>Select Payment Method</Text>
          <Text style={styles.subtitle}>
            Choose your {paymentTypeLabel} method
          </Text>
        </View>

        <View style={styles.methodsWrap}>
          {visibleMethods.map((method) => (
            <SelectableMethodCard
              key={method.id}
              method={method}
              isSelected={selectedMethod?.id === method.id}
              onSelect={() => setSelectedMethod(method)}
            />
          ))}
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={AUTH_COLORS.primary} />
          <Text style={styles.infoText}>
            You will receive an OTP to verify this transaction.
          </Text>
        </View>
      </ScrollView>

      {/* Action buttons (fixed at bottom) */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClosePress}
            activeOpacity={0.9}
            disabled={deleteOneTempOrderMutation.isPending}
          >
            {deleteOneTempOrderMutation.isPending ? (
              <ActivityIndicator size="small" color={AUTH_COLORS.primary} />
            ) : (
              <Ionicons name="close" size={16} color={AUTH_COLORS.primary} />
            )}
            <Text style={styles.closeButtonText}>
              {deleteOneTempOrderMutation.isPending ? 'Closing...' : 'Close'}
            </Text>
          </TouchableOpacity>
        )}

        {!otpVerified ? (
          <TouchableOpacity
            style={[
              styles.payButton,
              !selectedMethod && styles.payButtonDisabled,
            ]}
            onPress={() => {
              setHasTappedPay(true);
              addOnePaymentMutation.mutate({
                userId: profileData.id,
                paymentMethod: paymentType,
                amount: amountToPay,
                tempOrderId: tempOrderId,
                cartId: activeCartId as string,
              });
            }}
            activeOpacity={0.9}
            disabled={!selectedMethod}
          >
            {addOnePaymentMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            )}
            <Text style={styles.payButtonText}>
              {addOnePaymentMutation.isPending ? 'Processing...' : 'Pay'}
            </Text>
          </TouchableOpacity>
        ) : (
          (paymentType !== 'tapmark-wallet' && <TouchableOpacity
            style={styles.payButton}
            onPress={() => iHavePaidMutation.mutate()}
            activeOpacity={0.9}
            disabled={iHavePaidMutation.isPending || showPaidLoading || otpModalVisible}
          >
            {showPaidLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            )}
            <Text style={styles.payButtonText}>
              {showPaidLoading ? 'Checking...' : 'I have paid'}
            </Text>
          </TouchableOpacity>)
        )}
      </View>

      {/* OTP Modal */}
      <OtpModal
        visible={otpModalVisible}
        onVerify={(code: string, onComplete: () => void) => submitPaystackOtpMutation.mutate({ otp: code, onComplete: onComplete })}
        onClose={handleOtpModalClose}
        phoneNumber={phoneNumber}
        dismissible={false}
      />

      {/* Confirmation Modal (success / failure / pending) */}
      <ConfirmationModal
        visible={confirmationModalVisible}
        type={confirmationType}
        onSuccess={() => 1}
        onRetry={handleConfirmationRetry}
        successMessage="Payment confirmed!"
        failureMessage="Payment verification failed"
        pendingMessage="Checking payment status..."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  scroll: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingBottom: 200,
    gap: 16,
  },
  headerWrap: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: AUTH_COLORS.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: AUTH_COLORS.muted,
  },
  methodsWrap: {
    gap: 10,
  },
  methodCard: {
    borderRadius: AUTH_RADII.card,
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  methodCardSelected: {
    borderColor: '#EACCC8',
    backgroundColor: '#FFF8F6',
  },
  methodIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  methodSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: AUTH_COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: AUTH_COLORS.primary,
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AUTH_COLORS.primary,
  },
  infoCard: {
    borderRadius: AUTH_RADII.card,
    backgroundColor: '#FFF8F6',
    borderWidth: 1,
    borderColor: '#EACCC8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: AUTH_COLORS.text,
    fontWeight: '500',
  },
  emptyCard: {
    borderRadius: AUTH_RADII.card,
    backgroundColor: AUTH_COLORS.card,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  emptyText: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 12,
    backgroundColor: AUTH_COLORS.primary,
    borderRadius: AUTH_RADII.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: AUTH_COLORS.background,
    borderTopWidth: 1,
    borderTopColor: AUTH_COLORS.line,
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingTop: 12,
  },
  closeButton: {
    marginBottom: 10,
    borderRadius: AUTH_RADII.pill,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF8F6',
    borderWidth: 1,
    borderColor: '#EACCC8',
  },
  closeButtonText: {
    color: AUTH_COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: AUTH_COLORS.primary,
    borderRadius: AUTH_RADII.pill,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PaymentScreen;
