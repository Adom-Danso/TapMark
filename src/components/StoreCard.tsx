import React, { useMemo, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';

import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../screens/auth/authTheme';
import { Store } from '@/schemas/stores';
import { StoreItem } from '@/schemas/store-items';
import { generateImageUrl } from '@/utils/shared';

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

const AnimatedFavoriteButton = Animated.createAnimatedComponent(FavoriteButton);

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
  data,
  promo,
  onPress,
  onFavorite,
  isFavorite = false,
  style,
} : {
  variant?: 'store' | 'item';
  size?: 'default' | 'medium' | 'compact';
  promo?: string;
  onPress?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  style?: any;
  data: Store | StoreItem;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const favoriteScale = useRef(new Animated.Value(1)).current;
  const isItem = variant === 'item';
  const showFavoriteButton = typeof onFavorite === 'function';
  const sizePreset = SIZE_PRESETS[size] || SIZE_PRESETS.default;
  const ratingLabel = useMemo(() => {
    if (typeof data.averageRating === 'number') {
      return data.averageRating.toFixed(1);
    }
    return data.averageRating || '0.0';
  }, [data.averageRating]);

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

  const handleFavoritePress = (event: any) => {
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    Animated.sequence([
      Animated.spring(favoriteScale, {
        toValue: 0.88,
        useNativeDriver: true,
        speed: 22,
        bounciness: 6,
      }),
      Animated.spring(favoriteScale, {
        toValue: 1.12,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }),
      Animated.spring(favoriteScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
    ]).start();
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
        {(data as Store).coverPhoto.fileStoragePath ? (
          <CardImage source={{ uri: generateImageUrl((data as Store).coverPhoto.fileStoragePath) }} resizeMode="cover" />
        ) : (
          <View />
        )}
        {showFavoriteButton ? (
          <AnimatedFavoriteButton
            onPress={handleFavoritePress}
            hitSlop={8}
            style={{ transform: [{ scale: favoriteScale }] }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={AUTH_COLORS.primary}
            />
          </AnimatedFavoriteButton>
        ) : null}
        {promo ? (
          <PromoBadge>
            <PromoText>{promo}</PromoText>
          </PromoBadge>
        ) : null}
        {!isItem ? (
          <StatusBadge style={{ backgroundColor: (data as Store).isOpen ? '#1b8a3f' : '#c62828' }}>
            <StatusText>{(data as Store).isOpen ? 'Open' : 'Closed'}</StatusText>
          </StatusBadge>
        ) : null}
      </ImageWrap>
      <CardBody>
        <TitleRow>
          <Title numberOfLines={1}>{data.name}</Title>
          {isItem && (data as StoreItem).price ? <Price>{(data as StoreItem).price}</Price> : null}
        </TitleRow>
        <MetaRow>
          <RatingRow>
            <Ionicons name="star" size={14} color={AUTH_COLORS.primary} />
            <RatingText>{ratingLabel}</RatingText>
            {data.ratingCount ? <ReviewText>({data.ratingCount})</ReviewText> : null}
          </RatingRow>
          {/* {!isItem && data.price ? <Price>{data.price}</Price> : null} */}
        </MetaRow>
        {/* {isItem && promo ? <SupportText>{promo}</SupportText> : null}
        {!isItem && promo ? <SupportText>{promo}</SupportText> : null} */}
      </CardBody>
    </CardPressable>
  );
};

export default StoreCard;
