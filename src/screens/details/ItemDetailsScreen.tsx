import React, { useMemo, useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../auth/authTheme';
import { useCart } from '../../context/CartContext';
import { showToast } from '@/utils/notifications';
import { getOneStoreItemById } from '@/functions/store-items/get-one-store-item-by-id';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList } from '@/schemas/shared';
import { useQuery } from '@tanstack/react-query';
import { StoreItem } from '@/schemas/store-items';
import { StoreItemExtra } from '@/schemas/store-item-extras';
import { generateImageUrl } from '@/utils/shared';

const NOTE_MAX_LENGTH = 160;
const parseMoney = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

type StoreItemDetailScreenProps = NativeStackScreenProps<MainTabParamList, 'ItemDetails'>;


const ItemDetailsScreen = ({ route, navigation }: StoreItemDetailScreenProps) => {
  const insets = useSafeAreaInsets();
  const { addCartLine, isAdding } = useCart() as any;
  const [storeItem, setStoreItem] = useState<StoreItem | null>(null);
  const { id, imageUri, price, description, name } = route.params || {};

  async function fetchItemDetails() {
    try {
      const response = await getOneStoreItemById(id);
      return response.data;
    } catch (error: any) {
      showToast("error", "Failed.", error.message || "Unable to fetch item details.");
      return null
    }
  }
  const fetchItemDetailsQuery = useQuery({
    queryKey: ['storeItemDetails', id],
    queryFn: fetchItemDetails,
  })
  React.useEffect(() => {
    if (fetchItemDetailsQuery.data && fetchItemDetailsQuery.status === 'success') {
      setStoreItem(fetchItemDetailsQuery.data);
    }
  }, [fetchItemDetailsQuery.data, fetchItemDetailsQuery.status])


  const [selectedMap, setSelectedMap] = useState<Record<string, { amount?: number; quantity?: number }>>({});
  const [itemQty, setItemQty] = useState(1);
  const [itemAmount, setItemAmount] = useState(String(price || 0));
  const [packageQty, setPackageQty] = useState(1);
  const [note, setNote] = useState('');

  const itemExtras = Array.isArray(storeItem?.extras) ? storeItem.extras.filter((extra) => !extra.isPackaging) : [];
  const itemPackaging = Array.isArray(storeItem?.extras) ? storeItem.extras.filter((extra) => extra.isPackaging) : [];

  const toggleOption = (extra: StoreItemExtra) => {
    const key = extra.id;
    setSelectedMap((prev) => {
      // If already selected, deselect it
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }

      // When group allows only one selection, clear other selections in the same group
      const next = { ...prev };
      if (extra.isPackaging) {
        (storeItem?.extras || []).forEach((extra) => {
          if (extra.isPackaging && extra.id !== key) {
            delete next[extra.id];
          }
        });
      }

      next[key] =
        !extra.isSoldPerUnit
          ? { amount: extra.unitPrice || 0 }
          : { quantity: 1 };

      return next;
    });
  };

  const updatePerUnitQty = (extra: StoreItemExtra, delta: number) => {
    const key = extra.id;
    setSelectedMap((prev) => {
      if (!prev[key]) {
        return prev;
      }
      const currentQty = Number.parseInt(String(prev[key].quantity || 1), 10);
      const nextQty = Math.max(1, (Number.isNaN(currentQty) ? 1 : currentQty) + delta);
      return {
        ...prev,
        [key]: { ...prev[key], quantity: nextQty },
      };
    });
  };

  const updateOpenAmount = (extra: StoreItemExtra, text: string) => {
    const key = extra.id;
    const sanitized = text.replace(/[^\d.]/g, '');
    setSelectedMap((prev) => ({
      ...prev,
      [key]: { ...prev[key], amount: Number(sanitized) },
    }));
  };

  const updateItemAmount = (text: string) => {
    const sanitized = text.replace(/[^\d.]/g, '');

    setItemAmount((sanitized === '' ? '' : sanitized));
  };

  const selectedExtras = useMemo(() => {
    const options = [...itemExtras, ...itemPackaging]
      .filter((extra) => Boolean(selectedMap[extra.id]))
      .map((extra) => {
        const state = selectedMap[extra.id] || {};

        if (!extra.isSoldPerUnit) {
          return {
            extraId: extra.id,
            extraName: extra.name,
            pricingMode: 'open_amount',
            amount: parseMoney(state.amount ?? extra.unitPrice),
          };
        }

        const quantity = Math.max(1, Number.parseInt(String(state.quantity ?? 1), 10) || 1);
        return {
          extraId: extra.id,
          extraName: extra.name,
          pricingMode: 'per_unit',
          unitPrice: parseMoney(extra.unitPrice),
          quantity,
        };
      });

    return options.length > 0
      ?
      options
      : [];
  }, [itemExtras, itemPackaging, parseMoney, selectedMap]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    [...itemExtras, ...itemPackaging].forEach((extra) => {
      const state = selectedMap[extra.id];
      if (!state) {
        return;
      }

      if (extra.isSoldPerUnit) {
        const quantity = Number.parseInt(String(state.quantity ?? 1), 10);
        if (!Number.isInteger(quantity) || quantity < 1) {
          errors.push(`${extra.name}: quantity must be at least 1.`);
        }
        return;
      }

      const amount = parseMoney(state.amount ?? extra.unitPrice);
      if (!Number.isFinite(amount) || amount < 0) {
        errors.push(`${extra.name}: enter a valid amount.`);
      }
    });

    return errors;
  }, [itemExtras, itemPackaging, parseMoney, selectedMap]);

  const extrasTotal = useMemo(
    () =>
      selectedExtras.reduce(
        (sum, extra) =>
          sum + (extra.pricingMode === 'open_amount' ? parseMoney(extra.amount) : parseMoney(extra.unitPrice) * extra.quantity!),
        0
      ),
    [parseMoney, selectedExtras]
  );

  const basePrice = parseMoney(storeItem?.price);
  const itemAmountNumber = parseMoney(itemAmount);
  const lineUnitPrice = storeItem?.isSoldPerUnit ? basePrice * itemQty : itemAmountNumber + extrasTotal;
  const grandTotal = lineUnitPrice * packageQty;
  const noteValue = note.trim().slice(0, NOTE_MAX_LENGTH);
  const canAdd = validationErrors.length === 0;
  const resolvedImageUri = generateImageUrl(imageUri || storeItem?.photo?.fileStoragePath || '');

  // Ensure packaging has a default selected option when available.
  React.useEffect(() => {
    if (itemPackaging.length === 0) {
      return;
    }

    const hasSelectedPackaging = itemPackaging.some((extra) => Boolean(selectedMap[extra.id]));
    if (hasSelectedPackaging) {
      return;
    }

    const defaultPackaging = itemPackaging[0];
    setSelectedMap((prev) => ({
      ...prev,
      [defaultPackaging.id]: defaultPackaging.isSoldPerUnit
        ? { quantity: 1 }
        : { amount: defaultPackaging.unitPrice || 0 },
    }));
  }, [id]);

  const displayTotal = Number.isFinite(grandTotal) ? grandTotal.toFixed(2) : '0.00';

  const handleAddToCart = () => {
    if (!canAdd) {
      return;
    }

    const itemAmountNum = parseMoney(itemAmount);
    const minPrice = parseMoney(price || 0);

    if (!storeItem?.isSoldPerUnit && itemAmountNum < minPrice) {
      showToast('error', 'Invalid amount', `Amount must be at least GHS ${minPrice.toFixed(2)}`);
      return;
    }

    addCartLine({
      storeItemId: id,
      storeId: storeItem?.storeId || '',
      title: name || storeItem?.name || 'Item',
      imageUri: resolvedImageUri,
      basePrice,
      selectedExtras,
      note: noteValue,
      qty: itemQty,
      itemAmount: itemAmountNum,
      packageQty,
    });

    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Cart', { screen: 'CartIndex' });
      return;
    }
  };


  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        {resolvedImageUri ? (
          <Image source={{ uri: resolvedImageUri }} style={styles.image} resizeMode="cover" />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.title}>{name || 'Item'}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>GHS {basePrice.toFixed(2)}</Text>
            {typeof storeItem?.averageRating === 'number' ? (
              <Text style={styles.metaText}>Rating {storeItem?.averageRating.toFixed(1)}</Text>
            ) : null}
          </View>
          <Text style={styles.helperText}>Customize this item with extras before adding to cart.</Text>
        </View>

        <View style={styles.card}>
          {
            storeItem?.isSoldPerUnit ? (
              <>
                <Text style={styles.sectionTitle}>Item quantity</Text>
                <View style={styles.inlineControlRow}>
                  <TouchableOpacity style={styles.controlButton} onPress={() => setItemQty((prev) => Math.max(1, prev - 1))}>
                    <Ionicons name="remove" size={15} color={AUTH_COLORS.text} />
                  </TouchableOpacity>
                  <Text style={styles.controlValue}>{itemQty}</Text>
                  <TouchableOpacity style={styles.controlButton} onPress={() => setItemQty((prev) => prev + 1)}>
                    <Ionicons name="add" size={15} color={AUTH_COLORS.text} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Item amount</Text>
                <TextInput
                  value={itemAmount}
                  onChangeText={(text) => updateItemAmount(text)}
                  keyboardType="numeric"
                  // placeholder={`Enter amount >= ${parseMoney(extra.unitPrice).toFixed(2)}`}
                  placeholderTextColor={AUTH_COLORS.muted}
                  style={styles.amountInput}
                />
              </>
            )
          }
        </View>

        <View style={styles.card}>
          {/* <Text style={styles.sectionTitle}>Extras</Text> */}
          {itemExtras.length > 0 && (<View style={styles.groupBlock}>
            <Text style={styles.groupTitle}>Add-ons</Text>
            {/* <Text style={styles.groupHint}>
                  {extra.required ? 'Required' : 'Optional'}
                  {typeof extra.maxSelect === 'number' ? ` • Max ${extra.maxSelect}` : ''}
                  {extra.minSelect > 0 ? ` • Min ${extra.minSelect}` : ''}
                </Text> */}
            {/* {typeof extra.maxSelect === 'number' && extra.maxSelect === 1 ? (
                  <Text style={styles.packageHint}>Packaging — choose one (one selected by default)</Text>
                ) : null} */}

            {itemExtras.map((extra) => {
              const key = extra.id;
              const selectedState = selectedMap[key];
              const isSelected = Boolean(selectedState);

              return (
                <View key={extra.id} style={styles.optionCard}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => toggleOption(extra)}
                    style={styles.optionRow}
                  >
                    <View>
                      <Text style={styles.optionLabel}>{extra.name}</Text>
                      {!extra.isSoldPerUnit ? (
                        <Text style={styles.optionPrice}>
                          Min amount GHS {parseMoney(extra.unitPrice).toFixed(2)}
                        </Text>
                      ) : (
                        <Text style={styles.optionPrice}>
                          GHS {parseMoney(extra.unitPrice).toFixed(2)} per unit
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isSelected ? AUTH_COLORS.primary : AUTH_COLORS.muted}
                    />
                  </TouchableOpacity>

                  {isSelected && extra.isSoldPerUnit ? (
                    <View style={styles.inlineControlRow}>
                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => updatePerUnitQty(extra, -1)}
                      >
                        <Ionicons name="remove" size={15} color={AUTH_COLORS.text} />
                      </TouchableOpacity>
                      <Text style={styles.controlValue}>{selectedState.quantity ?? 1}</Text>
                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => updatePerUnitQty(extra, 1)}
                      >
                        <Ionicons name="add" size={15} color={AUTH_COLORS.text} />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {isSelected && !extra.isSoldPerUnit ? (
                    <TextInput
                      value={selectedState.amount !== undefined ? String(selectedState.amount) : ''}
                      onChangeText={(text) => updateOpenAmount(extra, text)}
                      keyboardType="decimal-pad"
                      placeholder={`Enter amount >= ${parseMoney(extra.unitPrice).toFixed(2)}`}
                      placeholderTextColor={AUTH_COLORS.muted}
                      style={styles.amountInput}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>)}
          {itemPackaging.length > 0 && (<View style={styles.groupBlock}>
            <Text style={styles.groupTitle}>Packaging</Text>
            {/* <Text style={styles.groupHint}>
                  {extra.required ? 'Required' : 'Optional'}
                  {typeof extra.maxSelect === 'number' ? ` • Max ${extra.maxSelect}` : ''}
                  {extra.minSelect > 0 ? ` • Min ${extra.minSelect}` : ''}
                </Text> */}
            {/* {typeof extra.maxSelect === 'number' && extra.maxSelect === 1 ? (
                  <Text style={styles.packageHint}>Packaging — choose one (one selected by default)</Text>
                ) : null} */}

            {itemPackaging.map((extra) => {
              const key = extra.id;
              const selectedState = selectedMap[key];
              const isSelected = Boolean(selectedState);


              return (
                <View key={extra.id} style={styles.optionCard}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => toggleOption(extra)}
                    style={styles.optionRow}
                  >
                    <View>
                      <Text style={styles.optionLabel}>{extra.name}</Text>
                      {!extra.isSoldPerUnit ? (
                        <Text style={styles.optionPrice}>
                          Min amount GHS {parseMoney(extra.unitPrice).toFixed(2)}
                        </Text>
                      ) : (
                        <Text style={styles.optionPrice}>
                          GHS {parseMoney(extra.unitPrice).toFixed(2)} per unit
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isSelected ? AUTH_COLORS.primary : AUTH_COLORS.muted}
                    />
                  </TouchableOpacity>

                  {isSelected && extra.isSoldPerUnit ? (
                    <View style={styles.inlineControlRow}>
                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => updatePerUnitQty(extra, -1)}
                      >
                        <Ionicons name="remove" size={15} color={AUTH_COLORS.text} />
                      </TouchableOpacity>
                      <Text style={styles.controlValue}>{selectedState.quantity ?? 1}</Text>
                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => updatePerUnitQty(extra, 1)}
                      >
                        <Ionicons name="add" size={15} color={AUTH_COLORS.text} />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {isSelected && !extra.isSoldPerUnit ? (
                    <TextInput
                      value={selectedState.amount !== undefined ? String(selectedState.amount) : ''}
                      onChangeText={(text) => updateOpenAmount(extra, text)}
                      keyboardType="decimal-pad"
                      placeholder={`Enter amount >= ${parseMoney(extra.unitPrice).toFixed(2)}`}
                      placeholderTextColor={AUTH_COLORS.muted}
                      style={styles.amountInput}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>)}
        </View>

        <View style={styles.card}>
          <>
            <Text style={styles.sectionTitle}>How many of this package?</Text>
            <View style={styles.inlineControlRow}>
              <TouchableOpacity style={styles.controlButton} onPress={() => setPackageQty((prev) => Math.max(1, prev - 1))}>
                <Ionicons name="remove" size={15} color={AUTH_COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.controlValue}>{packageQty}</Text>
              <TouchableOpacity style={styles.controlButton} onPress={() => setPackageQty((prev) => prev + 1)}>
                <Ionicons name="add" size={15} color={AUTH_COLORS.text} />
              </TouchableOpacity>
            </View>
          </>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={NOTE_MAX_LENGTH}
            placeholder="Add special instructions"
            placeholderTextColor={AUTH_COLORS.muted}
            style={styles.noteInput}
          />
          <Text style={styles.noteCount}>{NOTE_MAX_LENGTH - note.length} characters left</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base item</Text>
            <Text style={styles.summaryValue}>GHS {storeItem?.isSoldPerUnit ? (basePrice * itemQty).toFixed(2) : itemAmountNumber.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Extras</Text>
            <Text style={styles.summaryValue}>GHS {extrasTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Qty</Text>
            <Text style={styles.summaryValue}>{packageQty}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotal}>GHS {grandTotal.toFixed(2)}</Text>
          </View>

          {validationErrors.length > 0 ? (
            <View style={styles.errorWrap}>
              {validationErrors.map((error) => (
                <Text key={error} style={styles.errorText}>
                  • {error}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
        <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 14 }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.addButton, (!canAdd || isAdding) ? styles.addButtonDisabled : null]}
            disabled={!canAdd || isAdding}
            onPress={handleAddToCart}
          >
            {isAdding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add to cart • GHS {displayTotal}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingTop: 16,
    gap: 14,
  },
  image: {
    width: '100%',
    height: 230,
    borderRadius: 18,
    backgroundColor: AUTH_COLORS.card,
  },
  card: {
    backgroundColor: AUTH_COLORS.card,
    borderRadius: AUTH_RADII.card,
    padding: AUTH_SPACING.block,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
  metaText: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
    fontWeight: '600',
  },
  helperText: {
    color: AUTH_COLORS.muted,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  groupBlock: {
    gap: 8,
    marginTop: 4,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  groupHint: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    borderRadius: AUTH_RADII.input,
    padding: 10,
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  optionPrice: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
    marginTop: 2,
  },
  inlineControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F1EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlValue: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    borderRadius: AUTH_RADII.input,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: AUTH_COLORS.text,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    borderRadius: AUTH_RADII.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 84,
    textAlignVertical: 'top',
    color: AUTH_COLORS.text,
    fontSize: 13,
  },
  noteCount: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: AUTH_COLORS.line,
    marginVertical: 2,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  errorWrap: {
    marginTop: 6,
    gap: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#B42318',
  },
  ctaWrap: {
    width: '100%',
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingTop: 8,
    backgroundColor: 'rgba(255, 247, 243, 0.96)',
    borderTopWidth: 1,
    borderTopColor: AUTH_COLORS.line,
  },
  packageHint: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: AUTH_COLORS.primary,
    borderRadius: AUTH_RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default ItemDetailsScreen;
