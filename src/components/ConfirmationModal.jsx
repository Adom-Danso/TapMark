import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../screens/auth/authTheme';

/**
 * ConfirmationModal component supporting three states:
 * - 'success': progress/completion animation -> auto-close + onSuccess callback
 * - 'failure': error icon + retry button -> onRetry callback
 * - 'pending': loading spinner -> auto-dismiss after ~2-3s
 */
const ConfirmationModal = ({
  visible,
  type = 'success', // 'success' | 'failure' | 'pending'
  onSuccess,
  onRetry,
  successMessage = 'Payment confirmed!',
  failureMessage = 'Payment failed',
  pendingMessage = 'Processing...',
  dismissDelay = 2500, // ms for pending state auto-dismiss
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      iconScaleAnim.setValue(0);
      return;
    }

    // Entrance animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Success animation: scale in checkmark
    if (type === 'success') {
      const animSeq = Animated.sequence([
        Animated.timing(iconScaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ]);
      animSeq.start(() => {
        if (onSuccess) {
          onSuccess();
        }
      });
    }

    // Pending: auto-dismiss after delay
    if (type === 'pending') {
      const pendingTimer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }, dismissDelay);

      return () => clearTimeout(pendingTimer);
    }
  }, [visible, type, scaleAnim, opacityAnim, onSuccess, dismissDelay]);

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return (
          <Animated.View
            style={{
              transform: [
                {
                  scale: iconScaleAnim,
                },
              ],
            }}
          >
            <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
              <Ionicons name="checkmark" size={56} color="#fff" />
            </View>
          </Animated.View>
        );
      case 'failure':
        return (
          <View style={[styles.iconCircle, styles.iconCircleError]}>
            <Ionicons name="close" size={56} color="#fff" />
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.iconCircle, styles.iconCirclePending]}>
            <ActivityIndicator color="#fff" size={40} />
          </View>
        );
      default:
        return null;
    }
  };

  const renderMessage = () => {
    switch (type) {
      case 'success':
        return successMessage;
      case 'failure':
        return failureMessage;
      case 'pending':
        return pendingMessage;
      default:
        return '';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {renderIcon()}
          <Text style={styles.message}>{renderMessage()}</Text>

          {type === 'failure' && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
              activeOpacity={0.9}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: AUTH_RADII.card,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: AUTH_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircleSuccess: {
    backgroundColor: '#22C55E',
  },
  iconCircleError: {
    backgroundColor: '#E53E3E',
  },
  iconCirclePending: {
    backgroundColor: AUTH_COLORS.primary,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: AUTH_COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: AUTH_COLORS.primary,
    borderRadius: AUTH_RADII.pill,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ConfirmationModal;
