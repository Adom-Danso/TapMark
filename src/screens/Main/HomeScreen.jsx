import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { AUTH_COLORS, AUTH_SPACING } from '../auth/authTheme';
import HomeHeader from '../../components/HomeHeader';
import CategoryStrip from '../../components/CategoryStrip';
import HomeSectionCarousel from '../../components/HomeSectionCarousel';
import StoreCard from '../../components/StoreCard';

const TOP_CATEGORIES = [
  {
    id: 'all',
    label: 'All stores',
    imageUri:
      'https://images.unsplash.com/photo-1515168833906-d2a3b82b3021?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'groceries',
    label: 'Groceries',
    imageUri:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    imageUri:
      'https://images.unsplash.com/photo-1580281658629-7680f3b7d99b?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'beauty',
    label: 'Health & Beauty',
    imageUri:
      'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'produce',
    label: 'Fresh Produce',
    imageUri:
      'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'snacks',
    label: 'Snacks',
    imageUri:
      'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'drinks',
    label: 'Drinks',
    imageUri:
      'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'household',
    label: 'Household',
    imageUri:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'baby',
    label: 'Baby Care',
    imageUri:
      'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=300&q=80',
  },
];

const SAVE_ON_DELIVERY = [
  {
    id: 'save-1',
    title: 'Green Market',
    imageUri:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    rating: 4.6,
    reviewCount: 220,
    promo: 'Free delivery',
    price: 'GHS 20 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'save-2',
    title: 'Fresh Basket',
    imageUri:
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80',
    rating: 4.5,
    reviewCount: 180,
    promo: 'Save GHS 5',
    price: 'GHS 18 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'save-3',
    title: 'Quick Pantry',
    imageUri:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    rating: 4.4,
    reviewCount: 140,
    promo: 'Delivery deal',
    price: 'GHS 22 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'save-4',
    title: 'City Mart',
    imageUri:
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
    rating: 4.3,
    reviewCount: 96,
    promo: 'Free delivery',
    price: 'GHS 16 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'save-5',
    title: 'Harbor Foods',
    imageUri:
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80',
    rating: 4.2,
    reviewCount: 90,
    promo: 'Save GHS 3',
    price: 'GHS 19 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'save-6',
    title: 'Coastal Pantry',
    imageUri:
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80',
    rating: 4.4,
    reviewCount: 112,
    promo: 'Free delivery',
    price: 'GHS 21 min',
    isOpen: true,
    variant: 'store',
  },
];

const EXPLORE_SECTION = [
  {
    id: 'exp-1',
    title: 'Kiki Kitchen',
    imageUri:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    rating: 4.6,
    reviewCount: 128,
    promo: 'Free delivery',
    price: 'GHS 15 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'exp-2',
    title: 'Bloom Pharmacy',
    imageUri:
      'https://images.unsplash.com/photo-1580281658629-7680f3b7d99b?auto=format&fit=crop&w=1200&q=80',
    rating: 4.7,
    reviewCount: 310,
    promo: 'Open late',
    price: 'GHS 12 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'exp-3',
    title: 'Glow & Go',
    imageUri:
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80',
    rating: 4.5,
    reviewCount: 152,
    promo: 'Beauty picks',
    price: 'GHS 20 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'exp-4',
    title: 'Corner Deli',
    imageUri:
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
    rating: 4.3,
    reviewCount: 98,
    promo: 'Quick bites',
    price: 'GHS 18 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'exp-5',
    title: 'Lavender Pharmacy',
    imageUri:
      'https://images.unsplash.com/photo-1576765607924-3f7b86b7a897?auto=format&fit=crop&w=1200&q=80',
    rating: 4.6,
    reviewCount: 204,
    promo: '24/7 care',
    price: 'GHS 14 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'exp-6',
    title: 'Urban Market',
    imageUri:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    rating: 4.4,
    reviewCount: 156,
    promo: 'Quick picks',
    price: 'GHS 19 min',
    isOpen: true,
    variant: 'store',
  },
];

const TOP_RATED_SECTION = [
  {
    id: 'top-1',
    title: 'Prime Grocer',
    imageUri:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    reviewCount: 410,
    promo: 'Best in town',
    price: 'GHS 14 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'top-2',
    title: 'Fresh Bloom',
    imageUri:
      'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=1200&q=80',
    rating: 4.8,
    reviewCount: 360,
    promo: 'Top rated',
    price: 'GHS 20 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'top-3',
    title: 'Snacks & Co',
    imageUri:
      'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1200&q=80',
    rating: 4.7,
    reviewCount: 280,
    promo: 'Fan favorite',
    price: 'GHS 16 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'top-4',
    title: 'Daily Essentials',
    imageUri:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
    rating: 4.7,
    reviewCount: 260,
    promo: 'Trusted picks',
    price: 'GHS 17 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'top-5',
    title: 'Golden Pantry',
    imageUri:
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80',
    rating: 4.8,
    reviewCount: 330,
    promo: 'Top rated',
    price: 'GHS 15 min',
    isOpen: true,
    variant: 'store',
  },
  {
    id: 'top-6',
    title: 'Harvest Lane',
    imageUri:
      'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=1200&q=80',
    rating: 4.7,
    reviewCount: 298,
    promo: 'Staff pick',
    price: 'GHS 18 min',
    isOpen: true,
    variant: 'store',
  },
];

const RECOMMENDED_SECTION = [
  {
    id: 'rec-1',
    title: 'Crispy Chicken Bowl',
    imageUri:
      'https://images.unsplash.com/photo-1516685018646-549d91a68356?auto=format&fit=crop&w=1200&q=80',
    rating: 4.8,
    reviewCount: 210,
    promo: 'Buy 1 Get 1',
    price: 'GHS 24',
    variant: 'item',
  },
  {
    id: 'rec-2',
    title: 'Salmon Bento',
    imageUri:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
    rating: 4.7,
    reviewCount: 180,
    promo: 'Chef pick',
    price: 'GHS 28',
    variant: 'item',
  },
  {
    id: 'rec-3',
    title: 'Fresh Avocado Toast',
    imageUri:
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80',
    rating: 4.6,
    reviewCount: 150,
    promo: 'Morning fave',
    price: 'GHS 18',
    variant: 'item',
  },
  {
    id: 'rec-4',
    title: 'Choco Snack Box',
    imageUri:
      'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1200&q=80',
    rating: 4.5,
    reviewCount: 120,
    promo: 'Sweet treat',
    price: 'GHS 14',
    variant: 'item',
  },
  {
    id: 'rec-5',
    title: 'Spicy Noodle Cup',
    imageUri:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
    rating: 4.5,
    reviewCount: 96,
    promo: 'Hot pick',
    price: 'GHS 16',
    variant: 'item',
  },
  {
    id: 'rec-6',
    title: 'Berry Yogurt Bowl',
    imageUri:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
    rating: 4.6,
    reviewCount: 132,
    promo: 'Light bite',
    price: 'GHS 20',
    variant: 'item',
  },
];

const HOME_SECTIONS = [
  {
    id: 'save',
    title: 'Save on delivery',
    data: SAVE_ON_DELIVERY,
    cardSize: 'explore',
  },
  {
    id: 'explore',
    title: 'Explore',
    data: EXPLORE_SECTION,
    cardSize: 'explore',
  },
  {
    id: 'top-rated',
    title: 'Top rated',
    data: TOP_RATED_SECTION,
    cardSize: 'topRated',
  },
  {
    id: 'recommended',
    title: 'Recommended for you',
    data: RECOMMENDED_SECTION,
    cardSize: 'topRated',
  },
];

const HomeScreen = ({ navigation }) => {
  const handleCardPress = (item) => {
    if (item?.variant === 'item') {
      navigation.navigate('ItemDetails', {
        title: item.title,
        imageUri: item.imageUri,
      });
      return;
    }

    navigation.navigate('StoreDetails', {
      title: item.title,
      imageUri: item.imageUri,
    });
  };

  const handleSeeMorePress = (section) => {
    navigation.navigate('SectionList', {
      title: section.title,
      items: section.data,
    });
  };

  const handleSearchPress = () => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Search');
      return;
    }
    navigation.navigate('Search');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <HomeHeader onSearchPress={handleSearchPress} />
        <View style={styles.categorySection}>
          <CategoryStrip title="Top rated categories" categories={TOP_CATEGORIES} tileSize={50} />
        </View>
        {HOME_SECTIONS.map((section) => (
          <HomeSectionCarousel
            key={section.id}
            title={section.title}
            data={section.data}
            onActionPress={() => handleSeeMorePress(section)}
            renderItem={({ item }) => (
              <StoreCard
                size={section.cardSize}
                variant={item.variant || 'store'}
                title={item.title}
                imageUri={item.imageUri}
                rating={item.rating}
                reviewCount={item.reviewCount}
                promo={item.promo}
                price={item.price}
                isOpen={item.isOpen}
                onPress={() => handleCardPress(item)}
                onFavorite={() => {}}
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
