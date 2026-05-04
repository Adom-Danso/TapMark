import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AUTH_COLORS, AUTH_SPACING } from '../screens/auth/authTheme';
import CategoryTile from './CategoryTile';

const CategoryStrip = ({
  title = 'Top rated categories',
  actionLabel,
  onActionPress,
  categories = [],
  tileSize = 64,
  onCategoryPress,
}) => {
  const renderItem = ({ item, index }) => (
    <CategoryTile
      label={item.label}
      imageUri={item.imageUri}
      imageSize={tileSize}
      onPress={
        onCategoryPress
          ? () => {
              onCategoryPress(item, index);
            }
          : undefined
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
        keyExtractor={(item, index) => item.id || `${item.label}-${index}`}
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
