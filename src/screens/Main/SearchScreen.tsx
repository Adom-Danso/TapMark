import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_SPACING } from '../auth/authTheme';
import { useSearch } from '@/context/SearchContext';
import { searchStoreCategories } from '@/functions/store-categories/search-store-categories';
import { useQuery } from '@tanstack/react-query';
import { showToast } from '@/utils/notifications';
import { StoreCategories } from '@/schemas/store-categories';
import { generateImageUrl } from '@/utils/shared';
const CATEGORY_SWATCHES = ['#FFF1E6', '#EEF8F0', '#F2F0FF', '#FFF7DD', '#EAF5FF', '#FDEEF2'];

const getCategorySwatch = (index: number) => CATEGORY_SWATCHES[index % CATEGORY_SWATCHES.length];

const SearchScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const { getSearchData, addSearchData } = useSearch();
  const { isSearchFocused } = route.params || {};
  const searchInputRef = useRef<TextInput>(null);
  const [searchValue, setSearchValue] = useState('');

  const searchStoreCategoriesQuery = useQuery({
    queryKey: ['storeCategories'],
    queryFn: async () => {
      try {
        const response = await searchStoreCategories(10000000, 0, null);
        return response.data;
      } catch (error: any) {
        showToast('error', error.message || 'Failed to load store categories. Please try again.');
        return [];
      }
    },
  });

  const recentSearches = getSearchData() ?? [];
  const storeCategories = (searchStoreCategoriesQuery.data ?? []) as StoreCategories[];

  if (isSearchFocused) {
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }

  const runSearch = (term: string | null, label: string | null) => {
    const nextTerm = term?.trim() || searchValue.trim();
    if (nextTerm) {
      addSearchData({ query: nextTerm });
    }
    navigation.navigate('Home', {
      screen: 'SectionList',
      params: {
        title: label || nextTerm || 'Section',
        name: nextTerm || null,
        shuffle: false,
      }
    });
  };

  const handleSubmitSearch = () => {
    const nextTerm = searchValue.trim();
    if (!nextTerm) {
      searchInputRef.current?.focus();
      return;
    }

    runSearch(nextTerm, nextTerm);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="search" size={18} color={AUTH_COLORS.primary} />
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Find fast</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Search food, stores, and cravings.</Text>
          <Text style={styles.heroSubtitle}>
            Jump back into recent searches or browse popular categories.
          </Text>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={AUTH_COLORS.muted} />
            <TextInput
              ref={searchInputRef}
              value={searchValue}
              onChangeText={setSearchValue}
              onSubmitEditing={handleSubmitSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              autoFocus={Boolean(isSearchFocused)}
              placeholder="Search stores and items"
              placeholderTextColor={AUTH_COLORS.muted}
              style={styles.searchInput}
            />
            <Pressable onPress={handleSubmitSearch} hitSlop={10} style={styles.searchActionButton}>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent searches</Text>
            <Text style={styles.sectionHint}>Tap any term to search again</Text>
          </View>
          {recentSearches.length > 0 ? (
            <View style={styles.recentList}>
              {recentSearches.map((term, index) => (
                <Pressable
                  key={`${term.query}-${index}`}
                  onPress={() => runSearch(term.query, term.query)}
                  style={styles.recentChip}
                >
                  <View style={styles.recentIconWrap}>
                    <Ionicons name="time-outline" size={16} color={AUTH_COLORS.muted} />
                  </View>
                  <Text style={styles.recentText}>{term.query}</Text>
                  <Ionicons name="chevron-forward" size={16} color={AUTH_COLORS.muted} />
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="time-outline" size={18} color={AUTH_COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No recent searches yet</Text>
              <Text style={styles.emptySubtitle}>
                Your past searches will appear here so you can jump back in quickly.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular categories</Text>
            <Text style={styles.sectionHint}>Most browsed right now</Text>
          </View>

          {storeCategories.length > 0 ? (
            <View style={styles.categoryList}>
              {storeCategories.map((category, index) => {
                const imageUri = category.photo?.fileStoragePath ? generateImageUrl(category.photo.fileStoragePath) : null;

                return (
                  <Pressable
                    key={category.id}
                    onPress={() =>
                      navigation.navigate('Home', {
                        screen: 'SectionList',
                        params: {
                          title: category.name,
                          name: null,
                          storeCategoryIds: [category.id],
                        }
                      })
                    }
                    style={styles.categoryRow}
                  >
                    <View style={[styles.categoryIconWrap, { backgroundColor: getCategorySwatch(index) }]}>
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.categoryImage} resizeMode="cover" />
                      ) : (
                        <Text style={styles.categoryFallbackText}>{category.name.slice(0, 1).toUpperCase()}</Text>
                      )}
                    </View>
                    <View style={styles.categoryTextWrap}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryDescription}>{category.description}</Text>
                    </View>
                    <View style={styles.categoryArrowWrap}>
                      <Ionicons name="arrow-forward" size={16} color={AUTH_COLORS.primary} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="grid-outline" size={18} color={AUTH_COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No categories available</Text>
              <Text style={styles.emptySubtitle}>
                Categories will show up here once they are loaded from the server.
              </Text>
            </View>
          )}
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
    gap: 18,
  },
  heroCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: '#FFF8F2',
    borderWidth: 1,
    borderColor: '#F0E3D8',
    shadowColor: '#D9B79E',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.card,
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: AUTH_COLORS.text,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: AUTH_COLORS.muted,
  },
  section: {
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: AUTH_COLORS.card,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: AUTH_COLORS.text,
    paddingVertical: 0,
  },
  searchActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primary,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    gap: 8,
  },
  emptyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  emptySubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: AUTH_COLORS.muted,
  },
  sectionHeader: {
    gap: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  sectionHint: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  recentList: {
    gap: 10,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE5DD',
  },
  recentIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F4F0',
  },
  recentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  categoryList: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryFallbackText: {
    fontSize: 18,
    fontWeight: '800',
    color: AUTH_COLORS.text,
  },
  categoryTextWrap: {
    flex: 1,
    gap: 3,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  categoryDescription: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  categoryArrowWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primarySoft,
  },
});

export default SearchScreen;
