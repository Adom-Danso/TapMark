import React, { useMemo, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';

import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../screens/auth/authTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CardPressable = styled(AnimatedPressable)`
  background-color: ${AUTH_COLORS.card};
  border-radius: ${AUTH_RADII.card}px;
  overflow: hidden;
  shadow-color: ${AUTH_COLORS.shadow};
  shadow-opacity: 1;
  shadow-radius: 14px;
  shadow-offset: 0px 8px;
  elevation: 3;
`;

const ImageWrap = styled.View`
  position: relative;
  width: 100%;
  height: 170px;
  background-color: ${AUTH_COLORS.background};
`;

const CardImage = styled.Image`
  width: 100%;
  height: 100%;
`;

const FavoriteButton = styled(Pressable)`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 34px;
  height: 34px;
  border-radius: 17px;
  background-color: rgba(255, 255, 255, 0.9);
  align-items: center;
  justify-content: center;
`;

const PromoBadge = styled.View`
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background-color: ${AUTH_COLORS.primary};
`;

const PromoText = styled.Text`
  color: #fff;
  font-size: 12px;
  font-weight: 600;
`;

const StatusBadge = styled.View`
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background-color: #1b8a3f;
`;

const StatusText = styled.Text`
  color: #fff;
  font-size: 12px;
  font-weight: 600;
`;

const CardBody = styled.View`
  padding: ${AUTH_SPACING.block}px;
  gap: 8px;
`;

const TitleRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

const Title = styled.Text`
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: ${AUTH_COLORS.text};
`;

const Price = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: ${AUTH_COLORS.primary};
`;

const MetaRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const RatingRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const RatingText = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: ${AUTH_COLORS.text};
`;

const ReviewText = styled.Text`
  font-size: 12px;
  color: ${AUTH_COLORS.muted};
`;

const SupportText = styled.Text`
  font-size: 12px;
  color: ${AUTH_COLORS.muted};
`;

const SIZE_PRESETS = {
  default: { cardWidth: '100%', imageHeight: 170 },
  medium: { cardWidth: 260, imageHeight: 150 },
  compact: { cardWidth: 220, imageHeight: 140 },
};

const StoreCard = ({
  variant = 'store',
  size = 'default',
  imageUri,
  title,
  price,
  promo,
  isOpen = true,
  rating = 0,
  reviewCount,
  onPress,
  onFavorite,
  isFavorite = false,
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const isItem = variant === 'item';
  const sizePreset = SIZE_PRESETS[size] || SIZE_PRESETS.default;
  const ratingLabel = useMemo(() => {
    if (typeof rating === 'number') {
      return rating.toFixed(1);
    }
    return rating || '0.0';
  }, [rating]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.04,
        useNativeDriver: true,
        speed: 18,
        bounciness: 10,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 8,
      }),
    ]).start();
    if (onPress) {
      onPress();
    }
  };

  const handleFavoritePress = (event) => {
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    if (onFavorite) {
      onFavorite();
    }
  };

  return (
    <CardPressable
      style={[{ transform: [{ scale }], width: sizePreset.cardWidth }, style]}
      onPressIn={handlePressIn}
      onPress={handlePress}
    >
      <ImageWrap style={{ height: sizePreset.imageHeight }}>
        {imageUri ? (
          <CardImage source={{ uri: imageUri }} resizeMode="cover" />
        ) : (
          <View />
        )}
        {isItem ? (
          <FavoriteButton onPress={handleFavoritePress} hitSlop={8}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={AUTH_COLORS.primary}
            />
          </FavoriteButton>
        ) : null}
        {promo ? (
          <PromoBadge>
            <PromoText>{promo}</PromoText>
          </PromoBadge>
        ) : null}
        {!isItem ? (
          <StatusBadge style={{ backgroundColor: isOpen ? '#1b8a3f' : '#c62828' }}>
            <StatusText>{isOpen ? 'Open' : 'Closed'}</StatusText>
          </StatusBadge>
        ) : null}
      </ImageWrap>
      <CardBody>
        <TitleRow>
          <Title numberOfLines={1}>{title}</Title>
          {isItem && price ? <Price>{price}</Price> : null}
        </TitleRow>
        <MetaRow>
          <RatingRow>
            <Ionicons name="star" size={14} color={AUTH_COLORS.primary} />
            <RatingText>{ratingLabel}</RatingText>
            {reviewCount ? <ReviewText>({reviewCount})</ReviewText> : null}
          </RatingRow>
          {!isItem && price ? <Price>{price}</Price> : null}
        </MetaRow>
        {isItem && promo ? <SupportText>{promo}</SupportText> : null}
        {!isItem && promo ? <SupportText>{promo}</SupportText> : null}
      </CardBody>
    </CardPressable>
  );
};

export default StoreCard;
