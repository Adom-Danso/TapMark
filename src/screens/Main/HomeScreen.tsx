import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { AUTH_COLORS, AUTH_SPACING } from '../auth/authTheme';
import HomeHeader from '../../components/HomeHeader';
import CategoryStrip from '../../components/CategoryStrip';
import HomeSectionCarousel from '../../components/HomeSectionCarousel';
import StoreCard from '../../components/StoreCard';
import { useLocation } from '../../context/LocationContext';
import { useFavorites } from '../../context/FavoritesContext';
import { searchStores } from '@/functions/stores/search-stores';
import { useQuery } from '@tanstack/react-query';
import { StoreItem } from '@/schemas/store-items';
import { Store } from '@/schemas/stores';
import { StoreCategories } from '@/schemas/store-categories';
import { generateImageUrl, getGpsDistanceInMeters } from '@/utils/shared';
import { searchStoreCategories } from '@/functions/store-categories/search-store-categories';
import { showToast } from '@/utils/notifications';
import { searchOrders } from '@/functions/orders/search-orders';
import { searchTempOrders } from '@/functions/orders/search_temp_orders';
import { useProfile } from '@/context/ProfileContext';
import OngoingOrderCard, { OngoingOrderCardData } from '@/components/OngoingOrderCard';

type Sections = "save" | "explore" | "top-rated" | "recommended";

const HOME_SECTIONS = [
  {
    id: 'explore',
    title: 'Explore',
    cardSize: 'medium',
  },
  {
    id: 'top-rated',
    title: 'Top rated',
    cardSize: 'medium',
  },
  {
    id: 'recommended',
    title: 'Recommended for you',
    cardSize: 'medium',
  },
];

const ONGOING_ORDERS_LIMIT = 5;

const HOME_SECTION_EMPTY: Record<string, { icon: any; title: string; subtitle: string }> = {
  save: {
    icon: 'location-outline',
    title: 'Nothing nearby yet',
    subtitle: 'Stores around you will show up here once they are available.',
  },
  explore: {
    icon: 'storefront-outline',
    title: 'No stores to explore yet',
    subtitle: 'New stores will show up here as they join TapMark.',
  },
  'top-rated': {
    icon: 'star-outline',
    title: 'No top rated stores yet',
    subtitle: 'Stores with the best ratings will appear here first.',
  },
  recommended: {
    icon: 'sparkles-outline',
    title: 'Nothing recommended yet',
    subtitle: 'Order a few times and we will tailor picks just for you.',
  },
};

const HomeScreen = ({ navigation }: { navigation: any }) => {
  const { currentLocation, isLoading } = useLocation();
  const { toggleFavoriteStore, isFavoriteStore } = useFavorites();
  const { profileData } = useProfile();
  const [categories, setCategories] = useState<StoreCategories[]>([]);
  const [homeSections, setHomeSections] = useState<any[]>(HOME_SECTIONS);


  const searchStoreCategoriesQuery = useQuery({
    queryKey: ['storeCategories'],
    queryFn: async () => {
      try {
        const response = await searchStoreCategories(
          5,
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
      setCategories(searchStoreCategoriesQuery.data);
    }
  }, [searchStoreCategoriesQuery.data, searchStoreCategoriesQuery.status]);


  const handleCardPress = (item: Store | StoreItem) => {

    navigation.navigate('StoreDetails', {
      id: item.id,
      name: item.name,
      imageUri: generateImageUrl((item as Store).coverPhoto.fileStoragePath),
      rating: item.averageRating,
      isOpen: (item as Store).isOpen,
      averageRating: (item as Store).averageRating,
      ratingCount: (item as Store).ratingCount,
      estimatedDeliveryFee: currentLocation ? getGpsDistanceInMeters({ lat: (item as Store).gpsLocation.lat, lng: (item as Store).gpsLocation.lng }, { lat: currentLocation.latitude, lng: currentLocation.longitude }) * parseFloat(process.env.EXPO_PUBLIC_DELIVERY_FEE_PER_100_METER || '0.5') : 0,
    });
  };

  const handleSeeMorePress = (section: any) => {
    const params: any = {
      title: section.title,
      limit: 12,
      skip: 0,
    };

    if (section.id === 'top-rated') {
      params.sortBy = 'rating';
    } else if (section.id === 'recommended') {
      params.sortBy = 'orders';
    } else if (section.id === 'explore') {
      params.shuffle = true;
    } else if (section.id === 'save' && currentLocation) {
      params.centerLat = currentLocation.latitude;
      params.centerLng = currentLocation.longitude;
      params.maxDistance = 1800;
    }

    navigation.navigate('SectionList', params);
  };

  async function fetchStores(section: Sections) {
    try {
      const response = await searchStores(
        5,
        0,
        null,
        section === "top-rated" ? "rating" : section === "recommended" ? "orders" : null,
        null,
        null,
        section === "explore" ? true : false,
        section === "save" && currentLocation ? currentLocation.latitude : null,
        section === "save" && currentLocation ? currentLocation.longitude : null,
        section === "save" && currentLocation ? 1800 : null,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching stores:', error);
      throw error;
    }
  }
  function useHomeSection(section: Sections) {
    return useQuery({
      queryKey: ["fetchStores", section],
      queryFn: () => fetchStores(section),
      enabled: section !== 'save' ? true : !!currentLocation,
    })
  }
  const exploreSectionQuery = useHomeSection("explore");
  const saveSectionQuery = useHomeSection("save");
  const topRatedSectionQuery = useHomeSection("top-rated");
  const recommendedSectionQuery = useHomeSection("recommended");

  React.useEffect(
    () => {
      if (saveSectionQuery.data && saveSectionQuery.status === "success" && saveSectionQuery.data.length > 0) {
        setHomeSections((prev) => prev.map(section => section.id === "save" ? { ...section, data: saveSectionQuery.data } : section));
      }
    }, [saveSectionQuery.data, saveSectionQuery.status]
  )

  function getSectionQuery(section: Sections) {
    switch (section) {
      case "explore":
        return exploreSectionQuery;
      case "save":
        return saveSectionQuery;
      case "top-rated":
        return topRatedSectionQuery;
      case "recommended":
        return recommendedSectionQuery;
    }
  }

  function getSectionData(section: Sections) {
    const query = getSectionQuery(section);
    return query?.data && query.status === "success" ? query.data || [] : [];
  }

  const ongoingTempOrdersQuery = useQuery({
    queryKey: ['pendingRequests', 'ongoing', profileData?.id],
    queryFn: async () => {
      const response = await searchTempOrders(profileData?.id || null, null, true);
      return response.data;
    },
    retry: 2,
    enabled: Boolean(profileData?.id),
  });

  const ongoingOrdersQuery = useQuery({
    queryKey: ['searchOrders', 'ongoing', profileData?.id],
    queryFn: async () => {
      const response = await searchOrders(10, 0, profileData?.id || null, false, null, null, null, null, null, null, null, null, null, null);
      return response.data;
    },
    enabled: Boolean(profileData?.id),
  });

  const ongoingOrders = React.useMemo<OngoingOrderCardData[]>(() => {
    const tempOrders: OngoingOrderCardData[] = (ongoingTempOrdersQuery.data || []).map((order) => ({
      id: order.id,
      status: 'awaiting_payment',
      createdAt: order.createdAt,
    }));

    const paidOrders: OngoingOrderCardData[] = (ongoingOrdersQuery.data || [])
      .filter((order) => order.orderStatus === 'processing' || order.orderStatus === 'accepted')
      .map((order) => ({
        id: order.id,
        status: 'preparing',
        total: (order.deliveryFee || 0) + (order.serviceFee || 0) + (order.payment?.amount || 0),
        createdAt: order.createdAt,
      }));

    const sortByCreatedAtDesc = (a: OngoingOrderCardData, b: OngoingOrderCardData) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

    return [...tempOrders.sort(sortByCreatedAtDesc), ...paidOrders.sort(sortByCreatedAtDesc)];
  }, [ongoingTempOrdersQuery.data, ongoingOrdersQuery.data]);

  const handleOngoingOrderPress = (order: OngoingOrderCardData) => {
    if (order.status === 'awaiting_payment') {
      navigation.navigate('Orders', { activeTabId: 'pending' });
      return;
    }

    navigation.navigate('Orders', { activeTabId: 'current' });
  };

  const handleSeeAllOngoingOrders = () => {
    navigation.navigate('Orders', { activeTabId: 'current' });
  };

  const handleSearchPress = () => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Search', { isSearchFocused: true });
      return;
    }
    navigation.navigate('Search', { isSearchFocused: true });
  };

  const handleLocationPress = () => {
    navigation.navigate('MapPicker', { origin: 'home' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <HomeHeader
          onSearchPress={handleSearchPress}
          onLocationPress={handleLocationPress}
          loading={isLoading}
          location={isLoading ? 'Locating…' : (currentLocation?.name || 'Unknown location')}
        />
        {ongoingOrders.length > 0 && (
          <View style={styles.ongoingSection}>
            <View style={styles.ongoingHeaderRow}>
              <Text style={styles.ongoingTitle}>Ongoing orders</Text>
              <TouchableOpacity onPress={handleSeeAllOngoingOrders} hitSlop={8}>
                <Text style={styles.ongoingActionText}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ongoingList}
            >
              {ongoingOrders.slice(0, ONGOING_ORDERS_LIMIT).map((order) => (
                <OngoingOrderCard
                  key={order.id}
                  data={order}
                  onPress={() => handleOngoingOrderPress(order)}
                />
              ))}
            </ScrollView>
          </View>
        )}
        <View style={styles.categorySection}>
          <CategoryStrip
            title="Top rated categories"
            categories={categories}
            tileSize={50}
            loading={searchStoreCategoriesQuery.isPending}
            loadingHeight={130}
            error={searchStoreCategoriesQuery.isError}
            onRetry={() => searchStoreCategoriesQuery.refetch()}
            onCategoryPress={(category) => {
              const params: any = {
                title: category.name,
                limit: 12,
                skip: 0,
                storeCategoryIds: [category.id]
              }
              navigation.navigate('SectionList', params);

            }}
          />
        </View>
        {HOME_SECTIONS.map((section) => {
          const sectionQuery = getSectionQuery(section.id as Sections);
          const emptyCopy = HOME_SECTION_EMPTY[section.id];
          return (
            <HomeSectionCarousel
              key={section.id}
              title={section.title}
              data={getSectionData(section.id as Sections)}
              loading={sectionQuery?.isPending}
              loadingHeight={210}
              onActionPress={() => handleSeeMorePress(section)}
              emptyIcon={emptyCopy?.icon}
              emptyTitle={emptyCopy?.title}
              emptySubtitle={emptyCopy?.subtitle}
              error={Boolean(sectionQuery?.isError)}
              onRetry={() => sectionQuery?.refetch()}
              renderItem={({ item }: { item: Store | StoreItem }) => (
                <StoreCard
                  size={"medium"}
                  variant={'store'}
                  data={item}
                  onPress={() => handleCardPress(item)}
                  onFavorite={
                    () => toggleFavoriteStore(item.id)
                  }
                  isFavorite={isFavoriteStore(item.id)}
                />
              )}
            />
          );
        })}
      </ScrollView>
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
    gap: 16,
  },
  categorySection: {
    marginBottom: 8,
  },
  ongoingSection: {
    gap: 12,
  },
  ongoingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ongoingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  ongoingActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.primary,
  },
  ongoingList: {
    gap: 12,
    paddingRight: AUTH_SPACING.screenX,
  },
});

export default HomeScreen;
