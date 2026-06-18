import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_SPACING } from '../auth/authTheme';
import { useFavorites } from '../../context/FavoritesContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList } from '@/schemas/shared';
import { showToast } from '@/utils/notifications';
import { searchStoreItems } from '@/functions/store-items/search-store-items';
import { StoreItem } from '@/schemas/store-items';
import { useQuery } from '@tanstack/react-query';
import { generateImageUrl } from '@/utils/shared';
import { getOneStoreById } from '@/functions/stores/get-one-store-by-id';
import { Store, WorkingHours } from '@/schemas/stores';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
type StoreDetailsScreenProps = NativeStackScreenProps<MainTabParamList, 'StoreDetails'>;


const StoreDetailsScreen = ({ route, navigation }: StoreDetailsScreenProps) => {
  const { id, name = 'Store Details', imageUri, rating = 0, isOpen = true, averageRating = 0, ratingCount = 0, estimatedDeliveryFee = 0 } = route.params || {};
  const [store, setStore] = useState<Store | null>(null);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [showAllHours, setShowAllHours] = useState(false);
  const { toggleFavoriteStore, isFavoriteStore } = useFavorites();
  const favoriteScale = useRef(new Animated.Value(1)).current;

  const dayOrder = useMemo(
    () => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    [],
  );

  const toTitleCase = (value: string) => {
    if (!value) {
      return value;
    }

    return value
      .split(' ')
      .filter(Boolean)
      .map((segment) => segment[0].toUpperCase() + segment.slice(1))
      .join(' ');
  };

  const normalizedHours = useMemo(() => {
    if (!store?.workingHours?.length) {
      return [] as WorkingHours[];
    }

    const hoursByDay = new Map(
      store.workingHours.map((entry) => [entry.day.toLowerCase(), entry]),
    );

    return dayOrder.map((day) =>
      hoursByDay.get(day) || { day, openTime: '', closeTime: '' },
    );
  }, [dayOrder, store?.workingHours]);

  const todayHours = useMemo(() => {
    if (!normalizedHours.length) {
      return null;
    }

    const todayIndex = (new Date().getDay() + 6) % 7;
    return normalizedHours[todayIndex];
  }, [normalizedHours]);

  const formatHours = (hours: WorkingHours | null) => {
    if (!hours || (!hours.openTime && !hours.closeTime)) {
      return 'Store is closed at the moment.';
    }

    if (!hours.openTime || !hours.closeTime) {
      return hours.openTime || hours.closeTime;
    }

    return `${hours.openTime} - ${hours.closeTime}`;
  };

  const hasWorkingHours = normalizedHours.length > 0;

  async function fetchStoreItems() {
    try {
      const response = await searchStoreItems(
        100000,
        0,
        null,
        null,
        null,
        id
      )
      return response.data;
    } catch (error: any) {
      showToast("error", "Error", error.message || "Failed to load store details. Please try again.")
      return []
    }
  }
  const fetchStoreItemsQuery = useQuery({
    queryKey: ["fetchStoreItems", id],
    queryFn: fetchStoreItems,
  });
  React.useEffect(() => {
    if (fetchStoreItemsQuery.data && fetchStoreItemsQuery.status === "success") {
      setStoreItems(fetchStoreItemsQuery.data);
    }
  }, [fetchStoreItemsQuery.data, fetchStoreItemsQuery.status])

  const fetchStoreDetailsQuery = useQuery({
    queryKey: ['fetchStoreDetails', id],
    queryFn: async () => {
      try {
        const response = await getOneStoreById(id);
        return response.data;
      } catch (error: any) {
        showToast('error', 'Error', error.message || 'Failed to load store details. Please try again.');
        return null;
      }
    },
  });

  React.useEffect(() => {
    if (fetchStoreDetailsQuery.data && fetchStoreDetailsQuery.status === 'success') {
      setStore(fetchStoreDetailsQuery.data);
    }
  }, [fetchStoreDetailsQuery.data, fetchStoreDetailsQuery.status]);

  const isFavorite = isFavoriteStore(id);

  const handleFavoritePress = () => {
    Animated.sequence([
      Animated.spring(favoriteScale, {
        toValue: 0.88,
        useNativeDriver: true,
        speed: 22,
        bounciness: 6,
      }),
      Animated.spring(favoriteScale, {
        toValue: 1.12,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }),
      Animated.spring(favoriteScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
    ]).start();

    toggleFavoriteStore(id);
  };

  const handleItemPress = (item: StoreItem) => {
    navigation.navigate('ItemDetails', {
      id: item.id,
      name: item.name,
      imageUri: generateImageUrl((item as StoreItem).photo.fileStoragePath),
      description: (item as StoreItem).description,
      price: (item as StoreItem).price,
    });
  };

  const renderItemCard = (item: StoreItem) => (
    <Pressable key={item.id} style={styles.itemCard} onPress={() => handleItemPress(item)}>
      <Image source={{ uri: generateImageUrl(item.photo.fileStoragePath) }} style={styles.itemImage} resizeMode="cover" />
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.itemMetaRow}>
          <Text style={styles.itemPrice}>GHS {item.price.toFixed(2)}</Text>
          {/* <View style={styles.itemRatingRow}>
            <Ionicons name="star" size={12} color="#F5A623" />
            <Text style={styles.itemRatingText}>{item.averageRating?.toFixed(1)}</Text>
          </View> */}
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.imageWrap}>
          <Image source={{ uri: generateImageUrl(imageUri || '') }} style={styles.image} resizeMode="cover" />
          <AnimatedPressable
            onPress={handleFavoritePress}
            hitSlop={8}
            style={[styles.favoriteButton, { transform: [{ scale: favoriteScale }] }]}
          >
            <Ionicons
              /// for marking as favorite, we can use the isFavorite variable to determine which icon to show
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={19}
              color={AUTH_COLORS.primary}
            />
          </AnimatedPressable>
        </View>


        <View style={styles.infoCard}>
          <Text style={styles.title}>{name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.statPill}>
              <Ionicons name="bicycle-outline" size={14} color={AUTH_COLORS.primaryDark} />
              <Text style={styles.statLabel}>GHS {estimatedDeliveryFee.toFixed(2)}</Text>
            </View>
            {/* <View style={styles.statPill}>
              <Ionicons name="star" size={14} color="#F5A623" />
              <Text style={styles.statLabel}>{averageRating?.toFixed(1)}</Text>
            </View> */}
            <View
              style={[
                styles.statPill,
                isOpen ? styles.openBadge : styles.closedBadge,
              ]}
            >
              <Ionicons
                name={isOpen ? 'time-outline' : 'close-circle-outline'}
                size={14}
                color={isOpen ? '#1B8A3F' : '#B42318'}
              />
              <Text
                style={[
                  styles.statLabel,
                  isOpen ? styles.openText : styles.closedText,
                ]}
              >
                {isOpen ? 'Open now' : 'Closed'}
              </Text>
            </View>
          </View>

          <Text style={styles.subMeta}>
            {ratingCount} reviews
          </Text>
        </View>

        <View style={styles.hoursCard}>
          <View style={styles.hoursHeader}>
            <Text style={styles.hoursTitle}>Working hours</Text>
            <Pressable style={styles.hoursToggle} onPress={() => setShowAllHours((prev) => !prev)}>
              <Text style={styles.hoursToggleText}>{showAllHours ? 'Hide' : 'View all'}</Text>
              <Ionicons name={showAllHours ? 'chevron-up' : 'chevron-down'} size={16} color={AUTH_COLORS.primaryDark} />
            </Pressable>
          </View>

          <View style={styles.hoursRow}>
            <Text style={styles.dayLabel}>Today</Text>
            <Text
              style={[
                styles.hoursValue,
                !hasWorkingHours || (!todayHours?.openTime && !todayHours?.closeTime)
                  ? styles.hoursClosed
                  : null,
              ]}
            >
              {hasWorkingHours ? formatHours(todayHours) : 'Hours unavailable'}
            </Text>
          </View>

          {showAllHours ? (
            normalizedHours.length ? (
              <View style={styles.weeklyList}>
                {normalizedHours.map((entry) => (
                  <View key={entry.day} style={styles.hoursRow}>
                    <Text style={styles.dayLabel}>{toTitleCase(entry.day)}</Text>
                    <Text
                      style={[
                        styles.hoursValue,
                        !entry.openTime && !entry.closeTime ? styles.hoursClosed : null,
                      ]}
                    >
                      {formatHours(entry)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.hoursEmpty}>Hours unavailable</Text>
            )
          ) : null}

          <View style={styles.holidayBadge}>
            <Ionicons
              name={store?.isAvailableOnHolidays ? 'sunny-outline' : 'moon-outline'}
              size={14}
              color={store?.isAvailableOnHolidays ? '#1B8A3F' : '#B42318'}
            />
            <Text
              style={[
                styles.holidayText,
                store?.isAvailableOnHolidays ? styles.holidayOpenText : styles.holidayClosedText,
              ]}
            >
              {store?.isAvailableOnHolidays ? 'Open on holidays' : 'Closed on holidays'}
            </Text>
          </View>
        </View>

        {fetchStoreItemsQuery.isPending ? (
          <View style={styles.feedbackState}>
            <ActivityIndicator size="small" color={AUTH_COLORS.primaryDark} />
            <Text style={styles.feedbackText}>Loading store items...</Text>
          </View>
        ) : null}

        {/* {errorMessage ? (
          <View style={styles.feedbackState}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null} */}

        {!fetchStoreItemsQuery.isPending ? (
          <View style={styles.itemsSection}>
            <Text style={styles.itemsTitle}>Store items</Text>
            <View style={styles.grid}>
              {storeItems.map((item) => renderItemCard(item))}
            </View>
          </View>
        ) : null}
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
    paddingBottom: 120,
    gap: 14,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 18,
    backgroundColor: AUTH_COLORS.card,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: AUTH_COLORS.card,
    borderRadius: 18,
    padding: AUTH_SPACING.block,
    gap: 12,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AUTH_COLORS.primarySoft,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AUTH_COLORS.primaryDark,
  },
  openBadge: {
    backgroundColor: '#EAF7EF',
  },
  closedBadge: {
    backgroundColor: '#FDECEC',
  },
  openText: {
    color: '#1B8A3F',
  },
  closedText: {
    color: '#B42318',
  },
  subMeta: {
    fontSize: 14,
    color: AUTH_COLORS.muted,
  },
  hoursCard: {
    backgroundColor: AUTH_COLORS.card,
    borderRadius: 18,
    padding: AUTH_SPACING.block,
    gap: 10,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hoursTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  hoursToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hoursToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: AUTH_COLORS.primaryDark,
  },
  weeklyList: {
    gap: 6,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  hoursValue: {
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  hoursClosed: {
    color: AUTH_COLORS.muted,
  },
  hoursEmpty: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  holidayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AUTH_COLORS.primarySoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  holidayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  holidayOpenText: {
    color: '#1B8A3F',
  },
  holidayClosedText: {
    color: '#B42318',
  },
  feedbackState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  feedbackText: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
  },
  errorText: {
    fontSize: 13,
    color: '#B42318',
    textAlign: 'center',
  },
  itemsSection: {
    gap: 12,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  itemCard: {
    width: '48%',
    backgroundColor: AUTH_COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  itemImage: {
    width: '100%',
    height: 108,
    backgroundColor: AUTH_COLORS.background,
  },
  itemBody: {
    padding: 10,
    gap: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    minHeight: 34,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
  itemRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: AUTH_COLORS.muted,
  },
});

export default StoreDetailsScreen;
