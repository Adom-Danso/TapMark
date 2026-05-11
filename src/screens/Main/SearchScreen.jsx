import React, { useMemo } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { AUTH_COLORS, AUTH_SPACING } from '../auth/authTheme';
import SearchBar from '../../components/SearchBar';
import CategoryStrip from '../../components/CategoryStrip';

const RECENT_SEARCHES = [
  'Jollof rice',
  'Pharmacy',
  'Fresh juice',
  'Snacks',
  'Grocery mart',
];

const STORE_CATEGORIES = [
  {
    id: 'groceries',
    name: 'Groceries',
    description: 'Daily essentials and staples',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    isDeleted: 'false',
    photo: {
      id: 'cat-groceries',
      entityType: 'store-category',
      entityId: 'groceries',
      fileThumbnailStoragePath: '',
      fileStoragePath:
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
      createdAt: '2026-01-01',
      isDeleted: 'false',
      filename: 'groceries.jpg',
    },
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    description: 'Health and wellness',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    isDeleted: 'false',
    photo: {
      id: 'cat-pharmacy',
      entityType: 'store-category',
      entityId: 'pharmacy',
      fileThumbnailStoragePath: '',
      fileStoragePath:
        'https://images.unsplash.com/photo-1580281658629-7680f3b7d99b?auto=format&fit=crop&w=300&q=80',
      createdAt: '2026-01-01',
      isDeleted: 'false',
      filename: 'pharmacy.jpg',
    },
  },
  {
    id: 'beauty',
    name: 'Health & Beauty',
    description: 'Self-care favorites',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    isDeleted: 'false',
    photo: {
      id: 'cat-beauty',
      entityType: 'store-category',
      entityId: 'beauty',
      fileThumbnailStoragePath: '',
      fileStoragePath:
        'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=300&q=80',
      createdAt: '2026-01-01',
      isDeleted: 'false',
      filename: 'beauty.jpg',
    },
  },
  {
    id: 'produce',
    name: 'Fresh Produce',
    description: 'Fruit and vegetables',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    isDeleted: 'false',
    photo: {
      id: 'cat-produce',
      entityType: 'store-category',
      entityId: 'produce',
      fileThumbnailStoragePath: '',
      fileStoragePath:
        'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=300&q=80',
      createdAt: '2026-01-01',
      isDeleted: 'false',
      filename: 'produce.jpg',
    },
  },
  {
    id: 'drinks',
    name: 'Drinks',
    description: 'Juice, soda, and more',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    isDeleted: 'false',
    photo: {
      id: 'cat-drinks',
      entityType: 'store-category',
      entityId: 'drinks',
      fileThumbnailStoragePath: '',
      fileStoragePath:
        'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?auto=format&fit=crop&w=300&q=80',
      createdAt: '2026-01-01',
      isDeleted: 'false',
      filename: 'drinks.jpg',
    },
  },
];

/**
 * @param {{ navigation: any }} props
 */
const SearchScreen = ({ navigation }) => {
  const recentSearches = useMemo(() => RECENT_SEARCHES.slice(0, 5), []);

  /**
   * @param {string | null} term
   * @param {string | null} label
   */
  const runSearch = (term, label) => {
    navigation.navigate('SectionList', {
      title: label || term || 'Section',
      name: term || null,
      shuffle: false,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SearchBar
          placeholder="Search stores and items"
          onPress={() =>
            navigation.navigate('SectionList', {
              title: 'Trending stores',
              name: null,
              shuffle: true,
            })
          }
          style={styles.searchBar}
          showFilter={false}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent searches</Text>
          </View>
          <View style={styles.recentList}>
            {recentSearches.map((term, index) => (
              <Pressable
                key={`${term}-${index}`}
                onPress={() => runSearch(term, term)}
                style={styles.recentChip}
              >
                <Text style={styles.recentText}>{term}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store categories</Text>
          <CategoryStrip
            categories={STORE_CATEGORIES}
            tileSize={58}
            onCategoryPress={(category) =>
              navigation.navigate('SectionList', {
                title: category.name,
                name: null,
                storeCategoryIds: [category.id],
              })
            }
          />
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
  scroll: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingTop: AUTH_SPACING.screenY,
    paddingBottom: 120,
    gap: 22,
  },
  section: {
    gap: 12,
  },
  searchBar: {
    marginBottom: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  recentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recentChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
  },
  recentText: {
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
});

export default SearchScreen;
