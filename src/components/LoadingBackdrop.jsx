import React, { useEffect, useRef } from 'react';
import { Animated, ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { AUTH_COLORS } from '../screens/auth/authTheme';

const LoadingBackdrop = ({ visible = false, message = 'Processing order...' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.backdrop,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color={AUTH_COLORS.primaryDark} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  message: {
    color: AUTH_COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoadingBackdrop;
