import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../auth/authTheme';
import StoreCard from '../../components/StoreCard';
import { useFavorites } from '../../context/FavoritesContext';
import { searchStores } from '../../functions/stores/search-stores';
import { Store } from '@/schemas/stores';
import { useLocation } from '@/context/LocationContext';
import { generateImageUrl, getGpsDistanceInMeters } from '@/utils/shared';
import { showToast } from '@/utils/notifications';
import { useQueries, useQuery } from '@tanstack/react-query';
import { searchStoreCategories } from '@/functions/store-categories/search-store-categories';
import { StoreCategories } from '@/schemas/store-categories';

const SORT_OPTIONS = [
  { id: 'top-rated', label: 'Top rated' },
  { id: 'most-ordered', label: 'Most ordered' },
  { id: 'save', label: 'Save on delivery' },
];

const RATING_OPTIONS = [
  { id: '3', label: '3.0+', value: 3 },
  { id: '4', label: '4.0+', value: 4 },
  { id: '4-7', label: '4.7+', value: 4.7 },
];

const DISTANCE_OPTIONS = [
  { id: '1', label: '1 km or less', value: 1000 },
  { id: '3', label: '3 km or less', value: 3000 },
  { id: '5', label: '5 km or less', value: 5000 },
];

const CATEGORY_OPTIONS = [
  { id: 'groceries', label: 'Groceries' },
  { id: 'pharmacy', label: 'Pharmacy' },
  { id: 'beauty', label: 'Health & Beauty' },
  { id: 'produce', label: 'Fresh Produce' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'household', label: 'Household' },
  { id: 'baby', label: 'Baby Care' },
];

const SectionListScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const routeParams = route?.params || {};
  const title = routeParams.title || 'Section';
  const { toggleFavoriteStore, isFavoriteStore } = useFavorites();
  const { currentLocation } = useLocation();
  const [storeCategories, setStoreCategories] = useState<StoreCategories[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const searchStoreCategoriesQuery = useQuery({
    queryKey: ['storeCategories', routeParams],
    queryFn: async () => {
      try {
        const response = await searchStoreCategories(
          10000000,
          0,
          null,
        );
        return response.data;
      } catch (error: any) {
        showToast("error", error.message || "Failed to load store categories. Please try again.");
        return [];
      }
    },
  })
  React.useEffect(() => {
    if (searchStoreCategoriesQuery.data && searchStoreCategoriesQuery.status === 'success') {
      setStoreCategories(searchStoreCategoriesQuery.data);
    }
  }, [searchStoreCategoriesQuery.data, searchStoreCategoriesQuery.status]);

  const baseParams = useMemo(
    () => ({
      limit: typeof routeParams.limit === 'number' ? routeParams.limit : 12,
      skip: typeof routeParams.skip === 'number' ? routeParams.skip : 0,
      name: routeParams.name ?? null,
      sortBy: routeParams.sortBy ?? null,
      sortOrder: routeParams.sortOrder ?? null,
      storeIds: routeParams.storeIds ?? null,
      shuffle: typeof routeParams.shuffle === 'boolean' ? routeParams.shuffle : false,
      centerLat: routeParams.centerLat ?? null,
      centerLng: routeParams.centerLng ?? null,
      maxDistance: routeParams.maxDistance ?? null,
      storeCategoryIds: routeParams.storeCategoryIds ?? null,
      minimumRating: routeParams.minimumRating ?? null,
    }),
    [routeParams]
  );

  const initialSort = useMemo(() => {
    if (baseParams.sortBy === 'rating') {
      return 'top-rated';
    }
    if (baseParams.sortBy === 'orders') {
      return 'most-ordered';
    }
    if (baseParams.centerLat && baseParams.centerLng && baseParams.maxDistance) {
      return 'save';
    }
    return null;
  }, [baseParams.centerLat, baseParams.centerLng, baseParams.maxDistance, baseParams.sortBy]);

  const [selectedSort, setSelectedSort] = useState<string | null>(initialSort);
  const [selectedRating, setSelectedRating] = useState<number | null>(baseParams.minimumRating ?? null);
  const [selectedDistance, setSelectedDistance] = useState<number | null>(baseParams.maxDistance ?? null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(baseParams.storeCategoryIds ?? []);

  const [draftSort, setDraftSort] = useState<string | null>(selectedSort);
  const [draftRating, setDraftRating] = useState<number | null>(selectedRating);
  const [draftDistance, setDraftDistance] = useState<number | null>(selectedDistance);
  const [draftCategories, setDraftCategories] = useState<string[]>(selectedCategories);

  const handleOpenFilters = useCallback(() => {
    setDraftSort(selectedSort);
    setDraftRating(selectedRating);
    setDraftDistance(selectedDistance);
    setDraftCategories(selectedCategories);
    setIsFilterOpen(true);
  }, [selectedSort, selectedRating, selectedDistance, selectedCategories]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () => (
        <Pressable onPress={handleOpenFilters} hitSlop={10} style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color={AUTH_COLORS.primary} />
        </Pressable>
      ),
    });
  }, [navigation, title, handleOpenFilters]);

  const buildSearchParams = () => {
    let sortBy = baseParams.sortBy;
    let sortOrder = baseParams.sortOrder;
    let shuffle = baseParams.shuffle;
    let centerLat = baseParams.centerLat;
    let centerLng = baseParams.centerLng;
    let maxDistance = baseParams.maxDistance;

    if (selectedSort === 'top-rated') {
      sortBy = 'rating';
      sortOrder = null;
    }

    if (selectedSort === 'most-ordered') {
      sortBy = 'orders';
      sortOrder = null;
    }

    if (selectedSort === 'save' && currentLocation) {
      centerLat = currentLocation.latitude;
      centerLng = currentLocation.longitude;
      maxDistance = selectedDistance ?? 1800;
      sortBy = null;
      sortOrder = null;
      shuffle = false;
    }

    if (selectedDistance && currentLocation) {
      centerLat = currentLocation.latitude;
      centerLng = currentLocation.longitude;
      maxDistance = selectedDistance;
    }

    return {
      limit: baseParams.limit,
      skip: baseParams.skip,
      name: baseParams.name,
      sortBy,
      sortOrder,
      storeIds: baseParams.storeIds,
      shuffle,
      centerLat,
      centerLng,
      maxDistance,
      storeCategoryIds: selectedCategories.length > 0 ? selectedCategories : baseParams.storeCategoryIds,
      minimumRating: selectedRating ?? baseParams.minimumRating,
    };
  };

  const fetchStores = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = buildSearchParams();
      const response = await searchStores(
        params.limit,
        params.skip,
        params.name,
        params.sortBy,
        params.sortOrder,
        params.storeIds,
        params.shuffle,
        params.centerLat,
        params.centerLng,
        params.maxDistance,
        params.storeCategoryIds,
        params.minimumRating,
      );
      setStores(response?.data || []);
    } catch (error: any) {
      setStores([]);
      showToast('error', error.message || 'Failed to load stores. Please try again.');
      setErrorMessage('Failed to load stores.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStores();
  }, [
    baseParams,
    selectedSort,
    selectedRating,
    selectedDistance,
    selectedCategories,
    currentLocation,
  ]);

  const handleCardPress = (item: Store) => {
    navigation.navigate('StoreDetails', {
      id: item.id,
      name: item.name,
      imageUri: generateImageUrl(item.coverPhoto.fileStoragePath),
      rating: item.averageRating,
      isOpen: item.isOpen,
      averageRating: item.averageRating,
      ratingCount: item.ratingCount,
      estimatedDeliveryFee: currentLocation
        ? getGpsDistanceInMeters(
            { lat: item.gpsLocation.lat, lng: item.gpsLocation.lng },
            { lat: currentLocation.latitude, lng: currentLocation.longitude },
          ) * parseFloat(process.env.EXPO_PUBLIC_DELIVERY_FEE_PER_100_METER || '0.5')
        : 0,
    });
  };

  const applyFilters = () => {
    const needsLocation = draftSort === 'save' || !!draftDistance;
    if (needsLocation && !currentLocation) {
      showToast('error', 'Enable location to use distance filters.');
      return;
    }

    setSelectedSort(draftSort);
    setSelectedRating(draftRating);
    setSelectedDistance(draftDistance);
    setSelectedCategories(draftCategories);
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    setDraftSort(null);
    setDraftRating(null);
    setDraftDistance(null);
    setDraftCategories([]);
  };

  const toggleCategory = (categoryId: string) => {
    setDraftCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const renderItem = ({ item }: { item: Store }) => (
    <StoreCard
      data={item}
      onPress={() => handleCardPress(item)}
      onFavorite={() => toggleFavoriteStore(item.id)}
      isFavorite={isFavoriteStore(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={AUTH_COLORS.primary} />
          <Text style={styles.loadingText}>Loading stores...</Text>
        </View>
      ) : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {!isLoading && stores.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No stores found</Text>
          <Text style={styles.emptyText}>Try adjusting your filters or search terms.</Text>
        </View>
      ) : (
        <FlatList
          data={stores}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={isFilterOpen}
        animationType="slide"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeaderRow}>
            <Pressable onPress={() => setIsFilterOpen(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={AUTH_COLORS.text} />
            </Pressable>
            <Text style={styles.modalTitle}>Filters</Text>
            <Pressable onPress={resetFilters} hitSlop={8}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Sort Card */}
            <View style={styles.sectionCardAlt}>
              <Text style={styles.filterLabel}>Sort</Text>
              <View style={styles.radioList}>
                {SORT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => setDraftSort(draftSort === option.id ? null : option.id)}
                    style={styles.radioRow}
                  >
                    <View style={[styles.radioOuter, draftSort === option.id ? styles.radioOuterActive : null]}>
                      {draftSort === option.id ? <View style={styles.radioInner} /> : null}
                    </View>
                    <Text style={styles.radioLabel}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Offers */}
            {/* <View style={styles.sectionCardAlt}>
              <Text style={styles.filterLabel}>Offers</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.infoText}>Only show places with discounts or other offers</Text>
                <Pressable onPress={() => setDraftOffers((s) => !s)} style={[styles.checkbox, draftOffers ? styles.checkboxActive : null]}>
                  {draftOffers ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                </Pressable>
              </View>
            </View> */}

            {/* Rating chips */}
            <View style={styles.sectionCardAlt}>
              <Text style={styles.filterLabel}>Rating</Text>
              <View style={styles.chipRowAlt}>
                {RATING_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => setDraftRating(draftRating === option.value ? null : option.value)}
                    style={[styles.chipAlt, draftRating === option.value ? styles.chipActiveAlt : null]}
                  >
                    <Text style={[styles.chipText, draftRating === option.value ? styles.chipTextActive : null]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Distance */}
            <View style={styles.sectionCardAlt}>
              <Text style={styles.filterLabel}>Distance</Text>
              <View style={styles.chipRowAlt}>
                {DISTANCE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => setDraftDistance(draftDistance === option.value ? null : option.value)}
                    style={[styles.chipAlt, draftDistance === option.value ? styles.chipActiveAlt : null]}
                  >
                    <Text style={[styles.chipText, draftDistance === option.value ? styles.chipTextActive : null]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Pickup & Schedule */}
            {/* <View style={styles.sectionCardAlt}>
              <Text style={styles.filterLabel}>Pickup</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.infoText}>Only show places with the option to collect orders yourself</Text>
                <Pressable onPress={() => setDraftPickup((s) => !s)} style={[styles.checkbox, draftPickup ? styles.checkboxActive : null]}>
                  {draftPickup ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                </Pressable>
              </View>
            </View> */}

            {/* <View style={styles.sectionCardAlt}>
              <Text style={styles.filterLabel}>Schedule</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.infoText}>Only show places with the option to schedule for later</Text>
                <Pressable onPress={() => setDraftSchedule((s) => !s)} style={[styles.checkbox, draftSchedule ? styles.checkboxActive : null]}>
                  {draftSchedule ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                </Pressable>
              </View>
            </View> */}

            {/* Categories list */}
            <View style={styles.sectionCardAltLast}>
              <Text style={styles.filterLabel}>Categories</Text>
              {storeCategories.length > 0 ? (
                storeCategories.map((option) => (
                  <Pressable key={option.id} onPress={() => toggleCategory(option.id)} style={styles.categoryLine}>
                    <Text style={styles.categoryLineText}>{option.name}</Text>
                    <Pressable onPress={() => toggleCategory(option.id)} style={[styles.checkbox, draftCategories.includes(option.id) ? styles.checkboxActive : null]}>
                      {draftCategories.includes(option.id) ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                    </Pressable>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptyText}>No categories available</Text>
              )}
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          <View style={styles.applyBar}>
            <Pressable style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </Pressable>
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
  content: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingBottom: 120,
    gap: 16,
  },
  filterButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  loadingWrap: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  errorText: {
    textAlign: 'center',
    color: AUTH_COLORS.primary,
    fontSize: 13,
    marginBottom: 8,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AUTH_SPACING.screenX,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  emptyText: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  modalHeader: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: AUTH_SPACING.screenX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderRow: {
    paddingTop: 18,
    paddingBottom: 12,
    paddingHorizontal: AUTH_SPACING.screenX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.muted,
  },
  applyText: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
  modalContent: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingBottom: 40,
    gap: 16,
  },
  sectionCardAlt: {
    backgroundColor: AUTH_COLORS.card,
    borderRadius: AUTH_RADII.card,
    padding: 14,
    gap: 10,
  },
  sectionCardAltLast: {
    backgroundColor: AUTH_COLORS.card,
    borderRadius: AUTH_RADII.card,
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  radioList: {
    marginTop: 6,
    gap: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: AUTH_COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AUTH_COLORS.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: AUTH_COLORS.text,
    fontWeight: '600',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  infoText: {
    color: AUTH_COLORS.muted,
    flex: 1,
    marginRight: 8,
    fontSize: 13,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.card,
  },
  checkboxActive: {
    backgroundColor: AUTH_COLORS.primary,
    borderColor: AUTH_COLORS.primary,
  },
  chipRowAlt: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  chipAlt: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: AUTH_RADII.pill,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    backgroundColor: AUTH_COLORS.background,
  },
  chipActiveAlt: {
    backgroundColor: AUTH_COLORS.primary,
    borderColor: AUTH_COLORS.primary,
  },
  categoryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  categoryLineText: {
    fontSize: 14,
    color: AUTH_COLORS.text,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: AUTH_RADII.pill,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    backgroundColor: AUTH_COLORS.card,
  },
  chipActive: {
    backgroundColor: AUTH_COLORS.primary,
    borderColor: AUTH_COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  chipTextActive: {
    color: '#fff',
  },
  modalFooter: {
    marginTop: 8,
    paddingBottom: 10,
  },
  resetButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: AUTH_RADII.pill,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    backgroundColor: '#fff',
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  applyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: AUTH_COLORS.background,
    borderTopWidth: 1,
    borderTopColor: AUTH_COLORS.line,
  },
  applyButton: {
    backgroundColor: AUTH_COLORS.primary,
    paddingVertical: 14,
    borderRadius: AUTH_RADII.pill,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default SectionListScreen;
