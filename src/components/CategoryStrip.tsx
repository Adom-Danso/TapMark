import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AUTH_COLORS, AUTH_SPACING } from '../screens/auth/authTheme';
import CategoryTile from './CategoryTile';
import { StoreCategories } from '@/schemas/store-categories';

const CategoryStrip = ({
  title = 'Top rated categories',
  actionLabel,
  onActionPress,
  categories,
  tileSize = 64,
  onCategoryPress,
}:
{
  title?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  categories: StoreCategories[];
  tileSize?: number;
  onCategoryPress: (category: StoreCategories, index: number) => void;
}) => {
  const resolveImageUri = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${process.env.EXPO_PUBLIC_BACKEND_URL}${path}`;
  };

  const renderItem = ({ item, index }: { item: StoreCategories, index: number }) => (
    <CategoryTile
      label={item.name}
      imageUri={resolveImageUri(item.photo.fileStoragePath)}
      imageSize={tileSize}
      onPress={
        () => {
          onCategoryPress(item, index);
        }
      }
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {actionLabel ? (
          <Pressable onPress={onActionPress} hitSlop={8}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
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
  separator: {
    width: 14,
  },
});

export default CategoryStrip;
