import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../screens/auth/authTheme';

const OTP_LENGTH = 6;

/**
 * @typedef {Object} OtpModalProps
 * @property {boolean} visible
 * @property {(code: string, onComplete: () => void) => void} onVerify
 * @property {() => void} [onClose]
 * @property {string} [phoneNumber]
 * @property {boolean} [isVerifying]
 * @property {boolean} [dismissible]
 */

/**
 * OtpModal component
 * Presents an OTP input overlay modal (reuses OtpPage logic)
 * Calls onVerify(code) when user submits valid OTP
 * Calls onClose() when user closes the modal
 */
/**
 * @param {OtpModalProps} props
 */
const OtpModal = ({
  visible,
  onVerify,
  onClose,
  phoneNumber = 'your phone',
  isVerifying = false,
  dismissible = true,
}) => {
  const [code, setCode] = useState(Array(OTP_LENGTH).fill(''));
  const [isVerifyingLocal, setIsVerifyingLocal] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendIn, setResendIn] = useState(60);
  /** @type {React.MutableRefObject<Array<import('react-native').TextInput | null>>} */
  const inputs = useRef([]);

  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes
      setCode(Array(OTP_LENGTH).fill(''));
      setIsVerifyingLocal(false);
      setResendIn(60);
      return;
    }

    // Start resend countdown
    if (resendIn === 0) return;
    const timer = setInterval(() => {
      setResendIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, resendIn]);

  const codeValue = useMemo(() => code.join(''), [code]);

  /** @param {number} index */
  const focusInput = (index) => {
    inputs.current[index]?.focus();
  };

  /** @param {string} value @param {number} index */
  const handleChange = (value, index) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    if (sanitized.length === 0) {
      const next = [...code];
      next[index] = '';
      setCode(next);
      return;
    }

    if (sanitized.length === 1) {
      const next = [...code];
      next[index] = sanitized;
      setCode(next);
      if (index < OTP_LENGTH - 1) {
        focusInput(index + 1);
      }
      return;
    }

    const next = [...code];
    for (let i = 0; i < sanitized.length && index + i < OTP_LENGTH; i += 1) {
      next[index + i] = sanitized[i];
    }
    setCode(next);
    const nextIndex = Math.min(index + sanitized.length, OTP_LENGTH - 1);
    focusInput(nextIndex);
  };

  /** @param {{ nativeEvent: { key?: string } }} event @param {number} index */
  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key !== 'Backspace') return;
    if (code[index]) return;
    if (index === 0) return;
    const next = [...code];
    next[index - 1] = '';
    setCode(next);
    focusInput(index - 1);
  };

  const handleVerify = () => {
    if (isVerifyingLocal || codeValue.length !== OTP_LENGTH) return;
    setIsVerifyingLocal(true);
    
    // Call parent's onVerify callback
    if (onVerify) {
      onVerify(codeValue, () => {
        // onVerify callback completes, reset state
        setIsVerifyingLocal(false);
      });
    }
  };

  const handleResend = () => {
    if (isResending || resendIn > 0) return;
    setIsResending(true);
    setTimeout(() => {
      setIsResending(false);
      setResendIn(60);
      setCode(Array(OTP_LENGTH).fill(''));
      focusInput(0);
    }, 900);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={dismissible ? handleClose : () => {}}
    >
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalContent}>
            {dismissible ? (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={AUTH_COLORS.text} />
              </TouchableOpacity>
            ) : (
              <View style={styles.closeButtonPlaceholder} />
            )}

            {/* Title and subtitle */}
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              A 6-digit code was sent to {phoneNumber}
            </Text>

            {/* OTP Input Row */}
            <View style={styles.otpRow}>
              {code.map((digit, index) => (
                <TextInput
                  key={`otp-${index}`}
                  ref={(ref) => {
                    inputs.current[index] = ref;
                  }}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(value) => handleChange(value, index)}
                  onKeyPress={(event) => handleKeyPress(event, index)}
                  returnKeyType="done"
                />
              ))}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (isVerifyingLocal || codeValue.length !== OTP_LENGTH) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleVerify}
              activeOpacity={0.9}
            >
              {isVerifyingLocal ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            {/* Resend Row */}
            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't get the code?</Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={isResending || resendIn > 0}
                style={styles.resendButton}
              >
                {isResending ? (
                  <ActivityIndicator
                    color={AUTH_COLORS.primary}
                    size="small"
                  />
                ) : (
                  <Text
                    style={
                      resendIn > 0 ? styles.resendDisabled : styles.resendActive
                    }
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingTop: 28,
    paddingBottom: 32,
    minHeight: '50%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    padding: 8,
  },
  closeButtonPlaceholder: {
    height: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
    marginBottom: 24,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  otpInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    backgroundColor: '#fff',
  },
  verifyButton: {
    backgroundColor: AUTH_COLORS.primary,
    borderRadius: AUTH_RADII.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resendRow: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 4,
  },
  resendActive: {
    color: AUTH_COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  resendDisabled: {
    color: AUTH_COLORS.muted,
    fontWeight: '500',
    fontSize: 13,
  },
});

export default OtpModal;
