import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
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

const HomeScreen = ({ navigation }: { navigation: any }) => {
  const { currentLocation, isLoading } = useLocation();
  const { toggleFavoriteStore, isFavoriteStore } = useFavorites();
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

  function getSectionData(section: Sections) {
    switch (section) {
      case "explore":
        return exploreSectionQuery.data && exploreSectionQuery.status === "success" ? exploreSectionQuery.data || [] : [];
      case "save":
        return saveSectionQuery.data && saveSectionQuery.status === "success" ? saveSectionQuery.data || [] : [];
      case "top-rated":
        return topRatedSectionQuery.data && topRatedSectionQuery.status === "success" ? topRatedSectionQuery.data || [] : [];
      case "recommended":
        return recommendedSectionQuery.data && recommendedSectionQuery.status === "success" ? recommendedSectionQuery.data || [] : [];
    }
  }

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
          location={isLoading ? 'Locating...' : (currentLocation?.name || 'Unknown location')}
        />
        {isLoading ? (
          <View style={{ paddingVertical: 12, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={AUTH_COLORS.primary} />
            <Text style={{ marginTop: 8, color: AUTH_COLORS.muted, fontSize: 12 }}>Acquiring current location…</Text>
          </View>
        ) : null}
        {categories.length > 0 && (
          <View style={styles.categorySection}>
            <CategoryStrip title="Top rated categories" categories={categories} tileSize={50} onCategoryPress={(category) => {
              const params: any = {
                title: category.name,
                limit: 12,
                skip: 0,
                storeCategoryIds: [category.id]
              }
              navigation.navigate('SectionList', params);

            }} />
          </View>
        )}
        {HOME_SECTIONS.map((section) => (
          <HomeSectionCarousel
            key={section.id}
            title={section.title}
            data={getSectionData(section.id as Sections)}
            loading={section.id == "save" ? isLoading && saveSectionQuery.isPending : section.id == "explore" ? exploreSectionQuery.isPending : section.id == "top-rated" ? topRatedSectionQuery.isPending : recommendedSectionQuery.isPending}
            loadingHeight={210}
            onActionPress={() => handleSeeMorePress(section)}
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
        ))}
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
});

export default HomeScreen;
