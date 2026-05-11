import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from './authTheme';
import { verifyOtp } from '@/functions/auth/verify-otp';
import { saveTokens } from '@/utils/tokens';
import { resendOtp } from '@/functions/auth/resend-otp';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/schemas/shared';
import { showToast } from '@/utils/notifications';
import { saveProfileData } from '@/utils/profile';

const OTP_LENGTH = 6;
type OtpProps = NativeStackScreenProps<AppStackParamList, 'Otp'>;

const OtpPage = ({ route, navigation }: OtpProps) => {
  const [code, setCode] = useState(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isResendingSms, setIsResendingSms] = useState(false);
  const [resendIn, setResendIn] = useState(60);
  const inputs = useRef([]);
  const { userId } = route.params;

  useEffect(() => {
    if (resendIn === 0) return;
    const timer = setInterval(() => {
      setResendIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const codeValue = useMemo(() => code.join(''), [code]);

  const focusInput = (index) => {
    inputs.current[index]?.focus();
  };

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

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key !== 'Backspace') return;
    if (code[index]) return;
    if (index === 0) return;
    const next = [...code];
    next[index - 1] = '';
    setCode(next);
    focusInput(index - 1);
  };

  const handleVerify = async () => {
    if (isVerifying || codeValue.length !== OTP_LENGTH) return;
    setIsVerifying(true);

    try {
      const response = await verifyOtp({ userId: userId, otpCode: codeValue });
      await saveTokens(response.authData?.accessToken as string, response.authData?.refreshToken as string)
      await saveProfileData({
        id: response.data.id,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        phone: response.data.phoneNumber,
        otherNames: response.data.otherNames,
      })
      navigation.replace("Main");
    } catch (error: any) {
      showToast("error", "Verification Failed", error.message || "An error occurred during verification. Please try again.")
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending || resendIn > 0) return;
    setIsResending(true);

    try {
      const response = await resendOtp({ userId: userId, mode: 'email' });
    } catch (error: any) {
      showToast("error", "Resend Failed", error.message || "An error occurred while resending the code. Please try again.");
    } finally {
      setIsResending(false);
      setResendIn(60);
      setCode(Array(OTP_LENGTH).fill(''));
      focusInput(0);
    }
  };

  const handleResendSms = async () => {
    if (isResendingSms || resendIn > 0) return;
    setIsResendingSms(true);
    try {
      const response = await resendOtp({ userId: userId, mode: 'sms' });
    } catch (error: any) {
      showToast("error", "Resend Failed", error.message || "An error occurred while resending the code. Please try again.");
    } finally {
      setIsResendingSms(false);
      setResendIn(60);
      setCode(Array(OTP_LENGTH).fill(''));
      focusInput(0);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to your email
            </Text>
            <Text style={styles.email}>student@campus.edu</Text>

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

            <TouchableOpacity
              style={[
                styles.verifyButton,
                (isVerifying || codeValue.length !== OTP_LENGTH) && styles.buttonDisabled,
              ]}
              onPress={handleVerify}
              activeOpacity={0.9}
            >
              {isVerifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyText}>Verify</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn’t get the code?</Text>
              <View style={styles.resendActions}>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={isResending || resendIn > 0}
                  style={styles.resendButton}
                >
                  {isResending ? (
                    <ActivityIndicator color={AUTH_COLORS.primary} size="small" />
                  ) : (
                    <Text
                      style={
                        resendIn > 0 ? styles.resendDisabled : styles.resendActive
                      }
                    >
                      {resendIn > 0 ? `Email in ${resendIn}s` : 'Resend Email'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleResendSms}
                  disabled={isResendingSms || resendIn > 0}
                  style={styles.resendButton}
                >
                  {isResendingSms ? (
                    <ActivityIndicator color={AUTH_COLORS.primary} size="small" />
                  ) : (
                    <Text
                      style={
                        resendIn > 0 ? styles.resendDisabled : styles.resendActive
                      }
                    >
                      {resendIn > 0 ? `SMS in ${resendIn}s` : 'Resend SMS'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingTop: AUTH_SPACING.screenY,
  },
  scroll: {
    paddingBottom: 28,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: AUTH_COLORS.card,
    borderRadius: AUTH_RADII.card,
    padding: AUTH_SPACING.block,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: AUTH_COLORS.muted,
  },
  email: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  otpRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpInput: {
    width: 44,
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
    marginTop: 24,
    backgroundColor: AUTH_COLORS.primary,
    borderRadius: AUTH_RADII.pill,
    paddingVertical: 14,
    alignItems: 'center',
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
    marginTop: 16,
    alignItems: 'center',
  },
  resendActions: {
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  resendButton: {
    paddingVertical: 4,
  },
  resendText: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
    marginBottom: 6,
  },
  resendActive: {
    color: AUTH_COLORS.primary,
    fontWeight: '600',
  },
  resendDisabled: {
    color: AUTH_COLORS.muted,
    fontWeight: '500',
  },
});

export default OtpPage;
