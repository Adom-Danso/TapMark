import React, { useEffect, useRef } from 'react';
import { Animated, FlatList, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AUTH_COLORS, AUTH_SPACING } from '../auth/authTheme';
import StoreCard from '../../components/StoreCard';
import { useFavorites } from '../../context/FavoritesContext';
import { searchStores } from '@/functions/stores/search-stores';
import { showToast } from '@/utils/notifications';
import { useQuery } from '@tanstack/react-query';
import { Store } from '@/schemas/stores';
import { set } from 'zod';
import { generateImageUrl, getGpsDistanceInMeters } from '@/utils/shared';
import { useLocation } from '@/context/LocationContext';

const FavoritesScreen = ({ navigation }: { navigation: any }) => {
  const { favoriteStores, toggleFavoriteStore, isFavoriteStore } = useFavorites();
  const { currentLocation } = useLocation();
  const favoritesCount = favoriteStores.length;
  const [favoritesData, setFavoritesData] = React.useState<Store[]>([]);
  const emptyFloat = useRef(new Animated.Value(0)).current;

  const fetchFavoriteStores = async () => {
    try {
      const response = await searchStores(
        10000,
        0,
        null,
        null,
        null,
        favoriteStores,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,

      )
      return response.data;
    } catch (error) {
      showToast("error", "Failed to load favorite stores. Please try again.");
      return []
    }
  }
  const fetchFavoritesStoresQuery = useQuery({
    queryKey: ['favoriteStores', favoriteStores],
    queryFn: fetchFavoriteStores,
    enabled: favoriteStores.length > 0,
  })
  React.useEffect(() => {
    if (fetchFavoritesStoresQuery.data && fetchFavoritesStoresQuery.status == "success") {
      setFavoritesData(fetchFavoritesStoresQuery.data as Store[]);
    }
  }, [fetchFavoritesStoresQuery.data, fetchFavoritesStoresQuery.status]);

  useEffect(() => {
    if (favoriteStores.length !== 0) {
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
  }, [emptyFloat, favoriteStores.length]);

  const handleCardPress = (item: Store) => {
    navigation.navigate('Home', {
      screen: 'StoreDetails',
      params: {
        id: item.id,
        name: item.name,
        imageUri: generateImageUrl((item as Store).coverPhoto.fileStoragePath),
        rating: item.averageRating,
        isOpen: (item as Store).isOpen,
        averageRating: (item as Store).averageRating,
        ratingCount: (item as Store).ratingCount,
        estimatedDeliveryFee: getGpsDistanceInMeters({ "lat": (item as Store).gpsLocation.lat, "lng": (item as Store).gpsLocation.lng }, { "lat": currentLocation.latitude, "lng": currentLocation.longitude }) * parseFloat(process.env.EXPO_PUBLIC_DELIVERY_FEE_PER_100_METER || '0.5'),
      },
    });
  };

  const renderItem = ({ item }: { item: Store }) => (
    <StoreCard
      data={item}
      onPress={() => handleCardPress(item)}
      onFavorite={() => toggleFavoriteStore(item.id)}
      isFavorite={isFavoriteStore(item.id)}
    />
  );

  if (favoriteStores.length === 0) {
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
        <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
        <View style={styles.emptyHeader}>
          <Text style={styles.headerTitle}>Favourites</Text>
          <Text style={styles.headerSubtitle}>Saved stores you can reopen anytime.</Text>
        </View>
        <View style={styles.emptyContent}>
          <View style={styles.emptyArtWrap}>
            <View style={styles.emptyGlowOne} />
            <View style={styles.emptyGlowTwo} />
            <Animated.View
              style={[
                styles.iconWrap,
                {
                  transform: [{ translateY: floatTranslateY }, { scale: floatScale }],
                },
              ]}
            >
              <Ionicons name="heart-outline" size={30} color={AUTH_COLORS.primary} />
            </Animated.View>
            <View style={styles.emptyDotOne} />
            <View style={styles.emptyDotTwo} />
            <View style={styles.emptyDotThree} />
          </View>
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart on a store card to save it here for quick access.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
      <View style={styles.headerWrap}>
        <View>
          <Text style={styles.headerTitle}>Favourites</Text>
          <Text style={styles.headerSubtitle}>Saved stores you can reopen anytime.</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{favoritesCount}</Text>
        </View>
      </View>
      <FlatList
        data={favoritesData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  headerWrap: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  emptyHeader: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: AUTH_COLORS.text,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: AUTH_COLORS.muted,
  },
  countPill: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCECEF',
    borderWidth: 1,
    borderColor: '#F2D6D6',
  },
  countText: {
    fontSize: 14,
    fontWeight: '800',
    color: AUTH_COLORS.primary,
  },
  content: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingTop: 4,
    paddingBottom: 120,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AUTH_SPACING.screenX,
    gap: 12,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCECEF',
  },
  emptyArtWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
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
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(128, 24, 24, 0.06)',
  },
  emptyDotOne: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F8B77C',
  },
  emptyDotTwo: {
    position: 'absolute',
    bottom: 24,
    left: 28,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E4A5A5',
  },
  emptyDotThree: {
    position: 'absolute',
    bottom: 18,
    right: 24,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5D36D',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: AUTH_COLORS.muted,
    textAlign: 'center',
  },
});

export default FavoritesScreen;
