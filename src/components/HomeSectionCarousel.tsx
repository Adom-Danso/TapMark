import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AUTH_COLORS, AUTH_SPACING } from '../screens/auth/authTheme';
import SectionCarouselSkeleton from './SectionCarouselSkeleton';

const HomeSectionCarousel = ({
  title,
  actionLabel = 'See more',
  onActionPress,
  data,
  renderItem,
  keyExtractor,
  itemSeparatorWidth = 14,
  contentPaddingRight = AUTH_SPACING.screenX,
  loading = false,
  loadingHeight = 210,
}:
{
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  data: any[];
  renderItem: ({ item }: { item: any }) => React.ReactElement;
  keyExtractor?: (item: any, index: number) => string;
  itemSeparatorWidth?: number;
  contentPaddingRight?: number;
  loading?: boolean;
  loadingHeight?: number;
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          {onActionPress ? (
            <Pressable onPress={onActionPress} hitSlop={8}>
              <Text style={styles.actionText}>{actionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={[styles.loadingRow, { minHeight: loadingHeight }]}>
          <SectionCarouselSkeleton
            itemCount={2}
            itemWidth={160}
            itemHeight={loadingHeight - 20}
            itemSeparatorWidth={itemSeparatorWidth}
            contentPaddingRight={contentPaddingRight}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {onActionPress ? (
          <Pressable onPress={onActionPress} hitSlop={8}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={
          keyExtractor || ((item, index) => item.id || `${title}-${index}`)
        }
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingRight: contentPaddingRight }]}
        ItemSeparatorComponent={() => <View style={{ width: itemSeparatorWidth }} />}
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
    paddingBottom: 2,
  },
  loadingRow: {
    justifyContent: 'center',
    paddingLeft: 2,
  },
});

export default HomeSectionCarousel;
