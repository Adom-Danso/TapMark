import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../auth/authTheme';
import { usePaymentMethods } from '@/context/PaymentMethodsContext';
import { Bank, PaymentMethodType } from '@/schemas/payments';
import { getPaystackBanks } from '@/functions/payments/get-banks-list';
import { showToast } from '@/utils/notifications';
import { useQuery } from '@tanstack/react-query';

type PaymentMethodsOrigin = 'profile' | 'payment';

type PaymentMethodsRouteParams = {
  origin?: PaymentMethodsOrigin;
};

const METHOD_TYPES = [
  { key: 'mobile-money', label: 'Mobile Money', icon: 'phone-portrait-outline' },
  // { key: 'bank', label: 'Bank', icon: 'business-outline' },
];

const MethodCard = ({ method, onSetDefault, onRemove }: { method: PaymentMethodType; onSetDefault: (methodId: string) => void; onRemove: (methodId: string) => void }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const icon = METHOD_TYPES.find((type) => type.key === method.type)?.icon || 'wallet-outline';

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

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.methodCard, method.isDefault ? styles.methodCardDefault : null]}
        onPress={() => onSetDefault(method.id)}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <View style={styles.methodIconWrap}>
          <Ionicons name={icon} size={18} color={AUTH_COLORS.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>{method.displayLabel || method.accountName || ''}</Text>
          <Text style={styles.methodSubtitle}>
            {method.isDefault ? 'Default payment method' : 'Tap to set as default'}
          </Text>
        </View>

        <View style={styles.methodRight}>
          {method.isDefault ? (
            <View style={styles.defaultPill}>
              <Text style={styles.defaultPillText}>Default</Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.removeButton}
            onPress={() => onRemove(method.id)}
          >
            <Ionicons name="trash-outline" size={16} color={AUTH_COLORS.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const PaymentMethodsScreen = (
  { navigation, route, onSetDefault, onAddMethod, onRemoveMethod }: 
  { navigation: any; route: { params?: PaymentMethodsRouteParams }; onSetDefault: (methodId: string) => void; onAddMethod: (method: PaymentMethodType) => void; onRemoveMethod: (methodId: string) => void }) => {
  const insets = useSafeAreaInsets();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addStep, setAddStep] = useState('choose'); // 'choose' | 'form'
  const [newMethodType, setNewMethodType] = useState('mobile-money');
  const [mAccountName, setMAccountName] = useState('');
  const [mMobileNumber, setMMobileNumber] = useState('');
  const [mProvider, setMProvider] = useState('mtn');
  const [bAccountName, setBAccountName] = useState('');
  const [bAccountNumber, setBAccountNumber] = useState('');
  const [bBankName, setBBankName] = useState('GCB Bank');
  const [bBankCode, setBBankCode] = useState('');
  const [bBranchCode, setBBranchCode] = useState('');
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [undoItem, setUndoItem] = useState<PaymentMethodType | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);

  const undoTranslate = useRef(new Animated.Value(80)).current;
  const undoOpacity = useRef(new Animated.Value(0)).current;
  const undoTimeout = useRef(null);
  const origin = route?.params?.origin ?? 'profile';
  const isExitingRef = useRef(false);

  const {paymentMethods} = usePaymentMethods();
  const [bankList, setBankList] = useState<Bank[]>([]);

  async function fetchPaystackBanks() {
    try {
      const response = await getPaystackBanks();
      return response.data;
    } catch (error) {
      showToast("error", "Failed to load banks list");
      return [];
    }
  }
  const fetchPaystackBanksQuery = useQuery({
    queryKey: ['fetchPaystackBanks'],
    queryFn: fetchPaystackBanks,
  })
  React.useEffect(() => {
    if (fetchPaystackBanksQuery.data && fetchPaystackBanksQuery.status === "success") {
      setBankList(fetchPaystackBanksQuery.data as Bank[]);
    }
  }, [fetchPaystackBanksQuery.data, fetchPaystackBanksQuery.status]);


  useEffect(() => {
    if (!undoVisible) {
      return;
    }

    Animated.parallel([
      Animated.timing(undoTranslate, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(undoOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [undoOpacity, undoTranslate, undoVisible]);

  useEffect(
    () => () => {
      if (undoTimeout.current) {
        clearTimeout(undoTimeout.current);
      }
    },
    []
  );

  const handleExit = useCallback(() => {
    if (isExitingRef.current) {
      return;
    }

    isExitingRef.current = true;

    if (origin === 'payment') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'ProfileHome' }],
      });
      navigation.getParent()?.navigate('Cart');
      return;
    }

    navigation.goBack();
  }, [navigation, origin]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (isExitingRef.current) {
        return;
      }

      event.preventDefault();
      handleExit();
    });

    return unsubscribe;
  }, [handleExit, navigation]);

  const openAddModal = () => {
    setAddStep('choose');
    setNewMethodType('mobile-money');
    setMAccountName('');
    setMMobileNumber('');
    setMProvider('mtn');
    setBAccountName('');
    setBAccountNumber('');
    setBBankName('GCB Bank');
    setBBankCode('');
    setBBranchCode('');
    setAddModalOpen(true);
  };

  const submitAddMethod = () => {
    if (newMethodType === 'mobile-money') {
      if (!mAccountName.trim() || !mMobileNumber.trim() || !mProvider.trim()) {
        Alert.alert('Missing details', 'Please complete all Mobile Money fields.');
        return;
      }

      const method = {
        type: 'mobile-money',
        accountName: mAccountName.trim(),
        mobileNumber: mMobileNumber.trim(),
        provider: mProvider,
      };

      onAddMethod(method);
      setAddModalOpen(false);
      if (origin === 'profile') {
        navigation.navigate('ProfileHome', { notice: 'Mobile Money added' });
      }
      return;
    }

    if (newMethodType === 'bank') {
      if (!bAccountName.trim() || !bAccountNumber.trim() || !bBankName.trim()) {
        Alert.alert('Missing details', 'Please complete all Bank fields.');
        return;
      }

      const method = {
        type: 'bank',
        accountName: bAccountName.trim(),
        accountNumber: bAccountNumber.replace(/[^0-9]/g, ''),
        bankName: bBankName,
        bankCode: bBankCode,
        branchCode: bBranchCode.trim() || undefined,
      };

      onAddMethod(method);
      setAddModalOpen(false);
      if (origin === 'profile') {
        navigation.navigate('ProfileHome', { notice: 'Bank added' });
      }
      return;
    }
  };

  const hideUndo = () => {
    Animated.parallel([
      Animated.timing(undoTranslate, {
        toValue: 80,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(undoOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setUndoVisible(false);
      setUndoItem(null);
    });
  };

  const handleRemoveMethod = (method: PaymentMethodType) => {
    Alert.alert('Remove payment method', `Remove ${method.displayLabel}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          onRemoveMethod(method.id);
          setUndoItem(method);
          setUndoVisible(true);

          if (undoTimeout.current) {
            clearTimeout(undoTimeout.current);
          }
          undoTimeout.current = setTimeout(() => {
            hideUndo();
          }, 3800);
        },
      },
    ]);
  };

  const handleUndo = () => {
    if (!undoItem) {
      return;
    }

    onAddMethod(undoItem);
    hideUndo();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Payment methods</Text>
        <Text style={styles.subtitle}>Tap a method to make it default.</Text>

        <TouchableOpacity activeOpacity={0.9} style={styles.addCard} onPress={openAddModal}>
          <View style={styles.addIconWrap}>
            <Ionicons name="add" size={18} color={AUTH_COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addTitle}>Add payment method</Text>
            <Text style={styles.addSubtitle}>Mobile Money, Card, or Bank</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={AUTH_COLORS.muted} />
        </TouchableOpacity>

        <View style={styles.listWrap}>
          {paymentMethods.map((method) => (
            <MethodCard
              key={method.id}
              method={method}
              onSetDefault={() => onSetDefault(method.id)}
              onRemove={() => handleRemoveMethod(method)}
            />
          ))}

          {paymentMethods.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={26} color={AUTH_COLORS.primary} />
              <Text style={styles.emptyTitle}>No payment methods yet</Text>
              <Text style={styles.emptyText}>Add one to speed up checkout.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {undoVisible ? (
        <Animated.View
          style={[
            styles.undoBar,
            {
              opacity: undoOpacity,
              transform: [{ translateY: undoTranslate }],
            },
          ]}
        >
          <Text style={styles.undoText}>Method removed</Text>
          <TouchableOpacity onPress={handleUndo} activeOpacity={0.9}>
            <Text style={styles.undoAction}>Undo</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      <Modal visible={addModalOpen} transparent animationType="fade" onRequestClose={() => setAddModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add method</Text>
            <Text style={styles.modalSubtitle}>Choose type and enter details.</Text>

            {addStep === 'choose' ? (
              <View style={{ gap: 10 }}>
                {METHOD_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={styles.typeSelect}
                    activeOpacity={0.9}
                    onPress={() => {
                      setNewMethodType(type.key);
                      setAddStep('form');
                    }}
                  >
                    <View style={styles.addIconWrapSmall}>
                      <Ionicons name={type.icon} size={18} color={AUTH_COLORS.primary} />
                    </View>
                    <Text style={styles.typeSelectText}>{type.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color={AUTH_COLORS.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {addStep === 'form' && newMethodType === 'mobile-money' ? (
              <View style={{ gap: 10 }}>
                <TextInput
                  value={mAccountName}
                  onChangeText={setMAccountName}
                  placeholder="Account name"
                  placeholderTextColor={AUTH_COLORS.muted}
                  style={styles.input}
                />
                <TextInput
                  value={mMobileNumber}
                  onChangeText={setMMobileNumber}
                  placeholder="Mobile number (e.g. 055 123 4567)"
                  placeholderTextColor={AUTH_COLORS.muted}
                  style={styles.input}
                />
                <View style={styles.typeRow}>
                  {['mtn', 'atl', 'vod'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      activeOpacity={0.9}
                      style={[styles.typePill, mProvider === p ? styles.typePillActive : null]}
                      onPress={() => setMProvider(p)}
                    >
                      <Text style={[styles.typePillText, mProvider === p ? styles.typePillTextActive : null]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {addStep === 'form' && newMethodType === 'bank' ? (
              <View style={{ gap: 10 }}>
                <TextInput
                  value={bAccountName}
                  onChangeText={setBAccountName}
                  placeholder="Account name"
                  placeholderTextColor={AUTH_COLORS.muted}
                  style={styles.input}
                />
                <TextInput
                  value={bAccountNumber}
                  onChangeText={setBAccountNumber}
                  placeholder="Account number"
                  placeholderTextColor={AUTH_COLORS.muted}
                  style={styles.input}
                  keyboardType="number-pad"
                />
                <Text style={{ fontSize: 12, color: AUTH_COLORS.muted }}>Bank</Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.bankSelect}
                  onPress={() => setBankPickerOpen(true)}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: AUTH_COLORS.text }}>{bBankName}</Text>
                  <Ionicons name="chevron-down" size={18} color={AUTH_COLORS.muted} />
                </TouchableOpacity>
                <TextInput
                  value={bBranchCode}
                  onChangeText={setBBranchCode}
                  placeholder="Branch/Sort code (optional)"
                  placeholderTextColor={AUTH_COLORS.muted}
                  style={styles.input}
                />
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondary}
                activeOpacity={0.85}
                onPress={() => {
                  if (addStep === 'form') {
                    setAddStep('choose');
                  } else {
                    setAddModalOpen(false);
                  }
                }}
              >
                <Text style={styles.modalSecondaryText}>{addStep === 'form' ? 'Back' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimary]}
                activeOpacity={0.9}
                onPress={submitAddMethod}
              >
                <Text style={styles.modalPrimaryText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={bankPickerOpen} transparent animationType="fade" onRequestClose={() => setBankPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '70%' }]}>
            <Text style={styles.modalTitle}>Select Bank</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {bankList.map((bank) => (
                <TouchableOpacity
                  key={bank.code}
                  activeOpacity={0.7}
                  style={[styles.bankItem, bBankCode === bank.code && styles.bankItemActive]}
                  onPress={() => {
                    setBBankName(bank.name);
                    setBBankCode(bank.code);
                    setBankPickerOpen(false);
                  }}
                >
                  <Text style={[styles.bankItemText, bBankCode === bank.code && styles.bankItemTextActive]}>
                    {bank.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalSecondary}
              activeOpacity={0.85}
              onPress={() => setBankPickerOpen(false)}
            >
              <Text style={styles.modalSecondaryText}>Close</Text>
            </TouchableOpacity>
          </View>
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
  scroll: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingBottom: 120,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: AUTH_COLORS.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 2,
    marginBottom: 4,
    fontSize: 13,
    color: AUTH_COLORS.muted,
  },
  addCard: {
    borderRadius: AUTH_RADII.card,
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  addTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  addSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  addIconWrapSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primarySoft,
    marginRight: 12,
  },
  typeSelect: {
    borderRadius: AUTH_RADII.card,
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeSelectText: {
    fontSize: 15,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    flex: 1,
  },
  listWrap: {
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
  methodCardDefault: {
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
  methodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
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
  defaultPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F7E1DC',
    marginRight: 4,
  },
  defaultPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCEEEE',
  },
  emptyCard: {
    borderRadius: AUTH_RADII.card,
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E6D9D5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  emptyText: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  undoBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: AUTH_RADII.pill,
    backgroundColor: '#2C2323',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  undoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  undoAction: {
    color: '#F6D7D7',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: AUTH_RADII.card,
    backgroundColor: AUTH_COLORS.card,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  modalSubtitle: {
    marginTop: -6,
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    borderRadius: AUTH_RADII.input,
    backgroundColor: '#fff',
    color: AUTH_COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EDE2DD',
    backgroundColor: '#FBF6F3',
  },
  typePillActive: {
    borderColor: '#E6C3BD',
    backgroundColor: '#F9E9E6',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: AUTH_COLORS.muted,
  },
  typePillTextActive: {
    color: AUTH_COLORS.primary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalSecondary: {
    borderRadius: AUTH_RADII.pill,
    backgroundColor: '#F3ECE8',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  modalPrimary: {
    borderRadius: AUTH_RADII.pill,
    backgroundColor: AUTH_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalPrimaryDisabled: {
    opacity: 0.5,
  },
  modalPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  bankSelect: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    borderRadius: AUTH_RADII.input,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AUTH_COLORS.line,
  },
  bankItemActive: {
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  bankItemText: {
    fontSize: 14,
    color: AUTH_COLORS.text,
    fontWeight: '500',
  },
  bankItemTextActive: {
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
});

export default PaymentMethodsScreen;
