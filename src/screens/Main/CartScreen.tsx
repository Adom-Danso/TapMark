import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../auth/authTheme';
import { useLocation } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import LoadingBackdrop from '../../components/LoadingBackdrop';
import { showToast } from '@/utils/notifications';
import { getOneCartById } from '@/functions/cart/get-one-cart-by-id';
import { getActiveCartId, saveActiveCartId } from '@/utils/cart';
import { addOneCart } from '@/functions/cart/add-one-cart';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CartItem, CartItemAddition } from '@/schemas/cart-items';
import { addOneTempOrder, RequestBody } from '@/functions/orders/add-one-temp-order';
import { useProfile } from '@/context/ProfileContext';
import { getCartInvoice } from '@/functions/cart/get-cart-invoice';
import { CartInvoice } from '@/schemas/cart';
import { updateOneCartItem } from '@/functions/cart-items/update-cart-item-by-id';

const PAYMENT_METHODS = [
  { id: 'mobile-money', label: 'Mobile Money', icon: 'phone-portrait-outline' },
  { id: 'bank', label: 'Bank', icon: 'card-outline' },
];

const CartScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { currentLocation } = useLocation();
  const { cartLines, updateCartLineQty, removeCartLine, updateCartLine, isRemoving, activeCartId } = useCart();
  const {profileData} = useProfile();

  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mobile-money');
  const [cartInvoice, setCartInvoice] = useState<CartInvoice | null>(null)
  const [expandedId, setExpandedId] = useState(null);
  const [edits, setEdits] = useState({});
  const emptyFloat = useRef(new Animated.Value(0)).current;

  // Track loading state for cart operations (invoice, item updates, removals)
  const [isCartOperationLoading, setIsCartOperationLoading] = useState(false);

  const addOneTempOrderMutation = useMutation({
    mutationKey: ['addOneTempOrder'],
    mutationFn: async (payload: RequestBody) => {
      if (!cartInvoice) {
        throw Error("Invoice not available. please select delivery location.")
      }

      const response = await addOneTempOrder(payload);
      return response;
    },
    onError: (error) => {
      showToast("error", "Order Failed", error.message || "An error occurred while initiating your order. Please try again.");
    },
    onSuccess: (data) => {
      setTimeout(() => {
        navigation.navigate('Payment', { paymentType: paymentMethod, tempOrderId: data.data.id, amountToPay: cartInvoice?.totalAmount });
      }, 1200);
    }
  });

  async function fetchCartInvoice() {
    try {
      const response = await getCartInvoice(activeCartId as string, currentLocation?.longitude!, currentLocation?.latitude!)
      return response.data
    } catch (err) {
      showToast("error", "Cart Error", "An error occurred while fetching your cart. Please try again.")
      return null
    }
  }
  const fetchCartInvoiceQuery = useQuery({
    queryKey: ['fetchCartInvoice', activeCartId, currentLocation, cartLines],
    queryFn: fetchCartInvoice,
    enabled: !!activeCartId && !!currentLocation
  });
  React.useEffect(()=>{
    if (fetchCartInvoiceQuery.data && fetchCartInvoiceQuery.status=="success") {
      setCartInvoice(fetchCartInvoiceQuery.data)
    }
  }, [fetchCartInvoiceQuery.data, fetchCartInvoiceQuery.status])

  // Aggregate all cart operation loading states
  const updateCartItemMutation = useMutation({
    mutationKey: ['updateCartItem'],
    mutationFn: async (payload: Partial<CartItem>) => {
      const response = await updateOneCartItem(payload.id, payload);
      return response.data;
    },
    onSuccess: (data) => {
      try {
        // server returned updated CartItem
        const updated: any = data;
        updateCartLine(updated.id || updated.cartItemId || updated.itemId, {
          selectedExtras: updated.additions || updated.additions || [],
          note: updated.note || ''
        });
      } catch (err) {
        // fallback: show success toast anyway
      }
      showToast('success', 'Item updated', 'Your cart item has been updated successfully.');
    },
    onError: (error) => {
      showToast("error", "Update Failed", error.message || "An error occurred while updating your cart item. Please try again.");
    }
  })

  React.useEffect(() => {
    const isLoading = 
      fetchCartInvoiceQuery.isPending || 
      isRemoving ||
      updateCartItemMutation.isPending;
    setIsCartOperationLoading(isLoading);
  }, [fetchCartInvoiceQuery.isPending, isRemoving, updateCartItemMutation.isPending]);

  useEffect(() => {
    if (cartLines.length !== 0) {
      emptyFloat.stopAnimation();
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(emptyFloat, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(emptyFloat, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [cartLines.length, emptyFloat]);


  const handleIncrease = (cartLineId: string) => updateCartLineQty(cartLineId, 1);

  const handleDecrease = (cartLineId: string) => updateCartLineQty(cartLineId, -1);

  const handleRemove = (cartLineId: string) => {
    removeCartLine(cartLineId)
  };

  const handleContinueSearching = () => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Home');
      return;
    }

    navigation.navigate('Main', { screen: 'Home' });
  };

  const handleOpenMap = () => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      // navigate to the Home tab's MapPicker screen
      navigation.navigate('Home', { screen: 'MapPicker' });
      return;
    }
    navigation.navigate('MapPicker');
  };

  const region = {
    latitude: currentLocation?.latitude,
    longitude: currentLocation?.longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };
  const markerCoord = {
    latitude: currentLocation?.latitude,
    longitude: currentLocation?.longitude,
  };

  const toggleEdit = (item) => {
    if (expandedId === item.cartLineId) {
      setExpandedId(null);
      return;
    }

    // initialize edit state from existing selectedExtras
    const selectedMap = {};
    (item.selectedExtras || []).forEach((extra: CartItemAddition) => {
      const key = extra.extraId;
      if (extra.pricingMode === 'open_amount') {
        selectedMap[key] = { amount: String(extra.amount || '') };
      } else {
        selectedMap[key] = { quantity: extra.quantity || 1 };
      }
    });
    setEdits((prev) => ({ ...prev, [item.cartLineId]: { selectedMap, note: item.note || '' } }));
    setExpandedId(item.cartLineId);
  };

  const renderEditPanel = (item) => {
    const state = edits[item.cartLineId] || { selectedMap: {}, note: item.note || '' };

    // toggling extras selection is disabled here; users can only edit quantities/amounts and notes

    const updatePerUnitQtyEdit = (extra: CartItemAddition, delta: number) => {
      const key = extra.extraId;
      setEdits((prev) => {
        const next = { ...(prev[item.cartLineId] || { selectedMap: {}, note: '' }) };
        const sm = { ...(next.selectedMap || {}) };
        if (!sm[key]) return prev;
        const currentQty = Number.parseInt(String(sm[key].quantity || 1), 10) || 1;
        sm[key] = { ...sm[key], quantity: Math.max(1, currentQty + delta) };
        next.selectedMap = sm;
        return { ...prev, [item.cartLineId]: next };
      });
    };

    const updateOpenAmountEdit = (extra: CartItemAddition, text: string) => {
      const key = extra.extraId;
      const sanitized = text.replace(/[^\d.]/g, '');
      setEdits((prev) => {
        const next = { ...(prev[item.cartLineId] || { selectedMap: {}, note: '' }) };
        const sm = { ...(next.selectedMap || {}) };
        sm[key] = { ...sm[key], amount: sanitized };
        next.selectedMap = sm;
        return { ...prev, [item.cartLineId]: next };
      });
    };

    const onSave = () => {
      const st = edits[item.cartLineId] || { selectedMap: {}, note: '' };
      const selectedExtras = (item.selectedExtras || [])
        .filter((extra: CartItemAddition) => Boolean(st.selectedMap[extra.extraId]))
        .map((extra: CartItemAddition) => {

          const state = st.selectedMap[extra.extraId];
          if (extra.pricingMode === 'open_amount') {
            return {
              extraId: extra.extraId,
              extraName: extra.extraName,
              pricingMode: 'open_amount',
              amount: Number.parseFloat(state.amount) || 0,
            };
          }
          return {
            extraId: extra.extraId,
            extraName: extra.extraName,
            pricingMode: 'per_unit',
            unitPrice: extra.unitPrice || 0,
            quantity: Number.parseInt(String(state.quantity || 1), 10) || 1,
          };
        })

      // send full additions list to server via mutation
      updateCartItemMutation.mutate({ id: item.cartLineId, additions: selectedExtras, note: st.note || '' });
      // clear local edit state for this item and close panel
      setEdits((prev) => {
        const next = { ...prev };
        delete next[item.cartLineId];
        return next;
      });
      setExpandedId(null);
    };

    const onCancel = () => {
      setExpandedId(null);
    };

    return (
      <View>
        {(item.selectedExtras || []).map((extra: CartItemAddition) => {
          const key = extra.extraId;
          const selectedState = state.selectedMap[key];
          const isSelected = Boolean(selectedState);
          return (
            <View key={extra.extraId} style={styles.groupBlockSimple}>
              <Text style={styles.groupTitleSimple}>{extra.extraName}</Text>
              <View key={extra.extraId} style={styles.optionRowSimple}>
                <View>
                  <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={isSelected ? AUTH_COLORS.primary : AUTH_COLORS.muted} />
                </View>
                <Text style={styles.optionLabelSimple}>{extra.extraName}</Text>
                {isSelected && extra.pricingMode === 'per_unit' ? (
                  <View style={styles.inlineControlRow}>
                    <TouchableOpacity style={styles.controlButton} onPress={() => updatePerUnitQtyEdit(extra, -1)}>
                      <Ionicons name="remove" size={15} color={AUTH_COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.controlValue}>{(state && state.selectedMap && state.selectedMap[key] && state.selectedMap[key].quantity) || (selectedState && selectedState.quantity) || 1}</Text>
                    <TouchableOpacity style={styles.controlButton} onPress={() => updatePerUnitQtyEdit(extra, 1)}>
                      <Ionicons name="add" size={15} color={AUTH_COLORS.text} />
                    </TouchableOpacity>
                  </View>
                ) : null}
                {isSelected && extra.pricingMode === 'open_amount' ? (
                  <TextInput
                    value={state.selectedMap ? state.selectedMap[key]?.amount : String(selectedState.amount || '')}
                    onChangeText={(t) => updateOpenAmountEdit(extra, t)}
                    keyboardType="decimal-pad"
                    style={styles.amountInputSimple}
                  />
                ) : null}
              </View>
            </View>
          )
        })}

        <TextInput
          value={state.note}
          onChangeText={(t) => setEdits((prev) => ({ ...prev, [item.cartLineId]: { ...(prev[item.cartLineId] || {}), note: t } }))}
          placeholder="Note (optional)"
          placeholderTextColor={AUTH_COLORS.muted}
          style={styles.noteInputSimple}
        />

        <View style={styles.editActionsRow}>
          <TouchableOpacity style={[styles.saveButton]} onPress={onSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cancelButton]} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (cartLines.length === 0) {
    const floatTranslateY = emptyFloat.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -10],
    });
    const floatScale = emptyFloat.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.04],
    });

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyContentHeader, { paddingTop: insets.top + 16, paddingHorizontal: AUTH_SPACING.screenX }]}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Your cart</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Orders')}
              style={styles.ordersButton}
            >
              <View style={styles.ordersIconWrap}>
                <Ionicons name="receipt" size={16} color={AUTH_COLORS.text} />
              </View>
              <Text style={styles.ordersButtonText}>Orders</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.emptyContent]}>
          <View style={styles.emptyArtWrap}>
            <View style={styles.emptyGlowOne} />
            <View style={styles.emptyGlowTwo} />
            <Animated.View
              style={[
                styles.emptyIconWrap,
                {
                  transform: [{ translateY: floatTranslateY }, { scale: floatScale }],
                },
              ]}
            >
              <Ionicons name="cart-outline" size={34} color={AUTH_COLORS.primary} />
            </Animated.View>
            <View style={styles.emptyFoodDotOne} />
            <View style={styles.emptyFoodDotTwo} />
            <View style={styles.emptyFoodDotThree} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Add a few favorites and come back when you’re ready to place your order.
          </Text>
          <TouchableOpacity activeOpacity={0.9} style={styles.emptyButton} onPress={handleContinueSearching}>
            <Ionicons name="search-outline" size={18} color="#fff" />
            <Text style={styles.emptyButtonText}>Continue searching</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Your cart</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Orders')}
            style={styles.ordersButton}
          >
            <View style={styles.ordersIconWrap}>
              <Ionicons name="receipt" size={16} color={AUTH_COLORS.text} />
            </View>
            <Text style={styles.ordersButtonText}>Orders</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.itemList}>
            {cartLines.map((item) => (
              <View key={item.cartLineId} style={styles.itemWrap}>
                <View style={styles.itemRow}>
                  <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.title}</Text>
                    {item.selectedExtras?.length ? (
                      <Text style={styles.itemMeta}>
                        {item.selectedExtras
                          .map((extra: CartItemAddition) => {
                            if (extra.pricingMode === 'open_amount') {
                              return `${extra.extraName} (GHS ${(extra.amount || 0).toFixed(2)})`;
                            }
                            return `${extra.extraName} x${extra.quantity}`;
                          })
                          .join(', ')}
                      </Text>
                    ) : null}
                    {item.note ? <Text style={styles.itemNote}>Note: {item.note}</Text> : null}
                    <View style={styles.itemMetaRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleDecrease(item.cartLineId)}
                        style={styles.qtyButton}
                      >
                        <Ionicons name="remove" size={16} color={AUTH_COLORS.text} />
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{item.qty}</Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleIncrease(item.cartLineId)}
                        style={styles.qtyButton}
                      >
                        <Ionicons name="add" size={16} color={AUTH_COLORS.text} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => toggleEdit(item)}
                        style={[styles.editPill, expandedId === item.cartLineId ? styles.editPillActive : null]}
                      >
                        <Ionicons
                          name={expandedId === item.cartLineId ? 'chevron-up-outline' : 'chevron-down-outline'}
                          size={16}
                          color={expandedId === item.cartLineId ? '#fff' : AUTH_COLORS.primary}
                        />
                        <Text style={[styles.editPillText, expandedId === item.cartLineId ? styles.editPillTextActive : null]}>{expandedId === item.cartLineId ? 'Close' : 'Edit'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <Text style={styles.itemPrice}>GHS {item.lineTotal.toFixed(2)}</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleRemove(item.cartLineId)}
                      style={styles.removeButton}
                      disabled={isRemoving}
                    >
                      {isRemoving ? (
                        <ActivityIndicator size="small" color={AUTH_COLORS.primary} />
                      ) : (
                        <Ionicons name="trash-outline" size={16} color={AUTH_COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Expanded editor (rendered below the row) */}
                {expandedId === item.cartLineId ? (
                  <View style={styles.editPanel}>{renderEditPanel(item)}</View>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownValue}>GHS {cartInvoice ? cartInvoice.subtotal.toFixed(2) : "N/A"}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Delivery fee</Text>
            <Text style={styles.breakdownValue}>GHS {cartInvoice ? cartInvoice.deliveryFee.toFixed(2) : "N/A"}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Service fee</Text>
            <Text style={styles.breakdownValue}>GHS {cartInvoice ? cartInvoice.serviceFee.toFixed(2) : "N/A"}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownTotal}>Total</Text>
            <Text style={styles.breakdownTotal}>GHS {cartInvoice ? cartInvoice.totalAmount.toFixed(2) : "N/A"}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Delivery location</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={handleOpenMap}>
              <Text style={styles.linkText}>Change</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.locationName}>{currentLocation?.name || "Current Location"}</Text>
          <Text style={styles.locationCoords}>
            {currentLocation?.latitude.toFixed(5)}, {currentLocation?.longitude.toFixed(5)}
          </Text>
          <TouchableOpacity activeOpacity={0.9} onPress={handleOpenMap} style={styles.mapPreview}>
            <MapView style={styles.map} region={region} pointerEvents="none">
              <Marker coordinate={markerCoord} pinColor={AUTH_COLORS.primary} />
            </MapView>
            <View style={styles.mapOverlay}>
              <Ionicons name="navigate" size={16} color={AUTH_COLORS.primary} />
              <Text style={styles.mapOverlayText}>Tap to choose location</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery instructions</Text>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Room number, gate code, building info"
            placeholderTextColor={AUTH_COLORS.muted}
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment method</Text>
          <View style={styles.paymentList}>
            {PAYMENT_METHODS.map((method) => {
              const isActive = method.id === paymentMethod;
              return (
                <TouchableOpacity
                  key={method.id}
                  activeOpacity={0.85}
                  style={[styles.paymentItem, isActive ? styles.paymentItemActive : null]}
                  onPress={() => setPaymentMethod(method.id)}
                >
                  <Ionicons
                    name={method.icon}
                    size={18}
                    color={isActive ? AUTH_COLORS.primary : AUTH_COLORS.muted}
                  />
                  <Text style={styles.paymentText}>{method.label}</Text>
                  <View style={[styles.radio, isActive ? styles.radioActive : null]}>
                    {isActive ? <View style={styles.radioDot} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <SwipeToConfirm
          label="Slide to place order"
          onComplete={() => addOneTempOrderMutation.mutate({
            cartId: activeCartId,
            userId: profileData.id,
            deliveryAddressGpsLocation: {lat: currentLocation?.latitude, lng: currentLocation?.longitude},
            deliveryFee: cartInvoice?.deliveryFee,
            serviceFee: cartInvoice?.serviceFee,
            deliveryInstructions: instructions,
          } as RequestBody)}
        />
      </ScrollView>
      <LoadingBackdrop 
        visible={addOneTempOrderMutation.isPending || isCartOperationLoading} 
        message={addOneTempOrderMutation.isPending ? "Processing order..." : "Updating cart..."} 
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
    paddingBottom: 80,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: AUTH_COLORS.card,
    borderRadius: AUTH_RADII.card,
    padding: AUTH_SPACING.block,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    marginBottom: 12,
  },
  itemList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemWrap: {
    width: '100%',
    flexDirection: 'column',
    gap: 8,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  itemNote: {
    marginTop: 3,
    fontSize: 12,
    color: AUTH_COLORS.muted,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    marginVertical: 8,
  },
  breakdownTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    fontSize: 13,
    color: AUTH_COLORS.primary,
    fontWeight: '600',
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  locationCoords: {
    marginTop: 2,
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  mapPreview: {
    marginTop: 12,
    borderRadius: AUTH_RADII.card,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: 160,
  },
  mapOverlay: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  mapOverlayText: {
    fontSize: 12,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    borderRadius: AUTH_RADII.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: AUTH_COLORS.text,
    backgroundColor: '#fff',
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#F3F3F3',
    borderRadius: 8,
  },
  editText: {
    fontSize: 12,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  editPanel: {
    marginTop: 8,
    padding: 12,
    backgroundColor: AUTH_COLORS.card,
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
  },
  groupBlockSimple: {
    marginBottom: 8,
  },
  groupTitleSimple: {
    fontSize: 13,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    marginBottom: 6,
  },
  optionRowSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  optionLabelSimple: {
    flex: 1,
    fontSize: 13,
    color: AUTH_COLORS.text,
    marginLeft: 8,
  },
  inlineControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F1EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlValue: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  amountInputSimple: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    borderRadius: AUTH_RADII.input,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 96,
    textAlign: 'right',
    color: AUTH_COLORS.text,
  },
  noteInputSimple: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    borderRadius: AUTH_RADII.input,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
    color: AUTH_COLORS.text,
  },
  editActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: AUTH_COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: AUTH_RADII.pill,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#F3F3F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: AUTH_RADII.pill,
  },
  cancelText: {
    color: AUTH_COLORS.text,
    fontWeight: '700',
  },
  paymentList: {
    gap: 12,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: AUTH_RADII.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    backgroundColor: '#fff',
  },
  paymentItemActive: {
    borderColor: AUTH_COLORS.primary,
    backgroundColor: '#FFF1F1',
  },
  paymentText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  ordersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F1EF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E7E1DD',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 8,
  },
  ordersIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ordersButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  itemMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F1EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 10,
    marginLeft: 8,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F3F3',
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
  },
  editPillActive: {
    backgroundColor: AUTH_COLORS.primary,
    borderColor: AUTH_COLORS.primary,
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
  editPillTextActive: {
    color: '#fff',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: AUTH_COLORS.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AUTH_COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  emptyContentHeader: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingBottom: 16,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AUTH_SPACING.screenX,
    gap: 14,
  },
  emptyArtWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGlowOne: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(128, 24, 24, 0.08)',
  },
  emptyGlowTwo: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: 'rgba(128, 24, 24, 0.06)',
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F1',
    borderWidth: 1,
    borderColor: '#F2D6D6',
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  emptyFoodDotOne: {
    position: 'absolute',
    top: 18,
    right: 28,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F8B77C',
  },
  emptyFoodDotTwo: {
    position: 'absolute',
    bottom: 26,
    left: 28,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E4A5A5',
  },
  emptyFoodDotThree: {
    position: 'absolute',
    bottom: 18,
    right: 24,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5D36D',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: AUTH_COLORS.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: AUTH_COLORS.muted,
    textAlign: 'center',
    maxWidth: 300,
  },
  emptyButton: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: AUTH_RADII.pill,
    backgroundColor: AUTH_COLORS.primary,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CartScreen;
