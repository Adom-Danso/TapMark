import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AUTH_COLORS, AUTH_SPACING } from '../screens/auth/authTheme';
import CategoryTile from './CategoryTile';
import SectionCarouselSkeleton from './SectionCarouselSkeleton';
import CarouselEmptyState from './CarouselEmptyState';
import { StoreCategories } from '@/schemas/store-categories';
import { generateImageUrl } from '@/utils/shared';

const CategoryStrip = ({
  title = 'Top rated categories',
  actionLabel,
  onActionPress,
  categories,
  tileSize = 64,
  onCategoryPress,
  loading = false,
  loadingHeight = 130,
  emptyIcon = 'grid-outline',
  emptyTitle = 'No categories yet',
  emptySubtitle = 'Browse everything on TapMark while we line these up.',
  error = false,
  onRetry,
}:
{
  title?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  categories: StoreCategories[];
  tileSize?: number;
  onCategoryPress: (category: StoreCategories, index: number) => void;
  loading?: boolean;
  loadingHeight?: number;
  emptyIcon?: any;
  emptyTitle?: string;
  emptySubtitle?: string;
  error?: boolean;
  onRetry?: () => void;
}) => {
  const renderItem = ({ item, index }: { item: StoreCategories, index: number }) => (
    <CategoryTile
      label={item.name}
      imageUri={generateImageUrl(item.photo.fileStoragePath)}
      imageSize={tileSize}
      onPress={
        () => {
          onCategoryPress(item, index);
        }
      }
    />
  );

  const header = (
    <View style={styles.headerRow}>
      {actionLabel ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {header}
        <View style={[styles.loadingRow, { minHeight: loadingHeight }]}>
          <SectionCarouselSkeleton
            itemCount={3}
            itemWidth={90}
            itemHeight={loadingHeight - 20}
            itemSeparatorWidth={14}
            contentPaddingRight={AUTH_SPACING.screenX}
          />
        </View>
      </View>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <View style={styles.container}>
        {header}
        <CarouselEmptyState
          icon={emptyIcon}
          title={emptyTitle}
          subtitle={emptySubtitle}
          variant={error ? 'error' : 'empty'}
          onRetry={onRetry}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header}
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || `${item.name}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.primary,
  },
  listContent: {
    paddingRight: AUTH_SPACING.screenX,
    paddingTop: 7,
  },
  loadingRow: {
    justifyContent: 'center',
    paddingLeft: 2,
  },
  separator: {
    width: 14,
  },
});

export default CategoryStrip;
