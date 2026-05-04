import React, { useLayoutEffect } from 'react';
import { FlatList, StatusBar, StyleSheet, View } from 'react-native';
import { AUTH_COLORS, AUTH_SPACING } from '../auth/authTheme';
import StoreCard from '../../components/StoreCard';

const SectionListScreen = ({ navigation, route }) => {
  const title = route?.params?.title || 'Section';
  const items = route?.params?.items || [];

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

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

  const renderItem = ({ item }) => (
    <StoreCard
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
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || `${title}-${index}`}
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
  content: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingBottom: 120,
    gap: 16,
  },
});

export default SectionListScreen;
