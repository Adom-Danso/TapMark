import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS } from '../screens/auth/authTheme';
import SwipeButton from '../../node_modules/rn-swipe-button/src/components/SwipeButton/index.tsx';


const SLIDER_HEIGHT = 56;
const SLIDER_RADIUS = SLIDER_HEIGHT / 2;


const SwipeToConfirm = ({ label = 'Slide to confirm', onComplete, resetDelay = 1200 }) => {
  const [showSuccessTick, setShowSuccessTick] = useState(false);
  const successTickScale = useRef(new Animated.Value(0.65)).current;
  const successTickOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showSuccessTick) {
      return undefined;
    }

    Animated.parallel([
      Animated.spring(successTickScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 8,
      }),
      Animated.timing(successTickOpacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      setShowSuccessTick(false);
      successTickScale.setValue(0.65);
      successTickOpacity.setValue(0);
    }, resetDelay);

    return () => clearTimeout(timer);
  }, [resetDelay, showSuccessTick, successTickOpacity, successTickScale]);

  const handleSwipeSuccess = () => {
    setShowSuccessTick(true);
    if (typeof onComplete === 'function') {
      onComplete();
    }
  };

  return (
    <View style={styles.sliderWrap}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.successTickWrap,
          {
            opacity: successTickOpacity,
            transform: [{ scale: successTickScale }],
          },
        ]}
      >
        <View style={styles.successTickBubble}>
          <Ionicons name="checkmark" size={22} color="#15803D" />
        </View>
      </Animated.View>
      <SwipeButton
        title={label}
        swipeSuccessThreshold={60}
        onSwipeSuccess={handleSwipeSuccess}
        shouldResetAfterSuccess
        resetAfterSuccessAnimDelay={resetDelay}
        disableResetOnTap
        height={SLIDER_HEIGHT}
        width={undefined}
        containerStyles={styles.container}
        railBackgroundColor="#F6E1E1"
        railBorderColor="#F6E1E1"
        railFillBackgroundColor="#CFF2DA"
        railFillBorderColor="#CFF2DA"
        thumbIconBackgroundColor="#FFFFFF"
        thumbIconBorderColor="#FFFFFF"
        titleColor={AUTH_COLORS.primaryDark}
        titleFontSize={14}
        titleStyles={styles.sliderLabel}
        thumbIconComponent={() => (
          <View style={styles.thumbWrap}>
            <Ionicons name="chevron-forward" size={22} color="#16A34A" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sliderWrap: {
    paddingBottom: 8,
  },
  container: {
    width: '100%',
    borderRadius: SLIDER_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F6E1E1',
  },
  sliderLabel: {
    fontWeight: '700',
  },
  successTickWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  successTickBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9F7E5',
    borderWidth: 1,
    borderColor: '#A7E4BB',
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  thumbWrap: {
    width: SLIDER_HEIGHT - 8,
    height: SLIDER_HEIGHT - 8,
    borderRadius: (SLIDER_HEIGHT - 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SwipeToConfirm;
