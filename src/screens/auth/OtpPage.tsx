import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	StatusBar,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
	const insets = useSafeAreaInsets();
	const [code, setCode] = useState(Array(OTP_LENGTH).fill(''));
	const [isVerifying, setIsVerifying] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [isResendingSms, setIsResendingSms] = useState(false);
	const [resendIn, setResendIn] = useState(60);
	const inputs = useRef<Array<TextInput | null>>([]);
	const { userId } = route.params;

	useEffect(() => {
		if (resendIn === 0) return;
		const timer = setInterval(() => {
			setResendIn((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);

		return () => clearInterval(timer);
	}, [resendIn]);

	const codeValue = useMemo(() => code.join(''), [code]);
	const codeComplete = codeValue.length === OTP_LENGTH;

	const focusInput = (index: number) => {
		inputs.current[index]?.focus();
	};

	const handleChange = (value: string, index: number) => {
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
		focusInput(Math.min(index + sanitized.length, OTP_LENGTH - 1));
	};

	const handleKeyPress = (event: any, index: number) => {
		if (event.nativeEvent.key !== 'Backspace') return;
		if (code[index]) return;
		if (index === 0) return;

		const next = [...code];
		next[index - 1] = '';
		setCode(next);
		focusInput(index - 1);
	};

	const handleVerify = async () => {
		if (isVerifying || !codeComplete) return;
		setIsVerifying(true);

		try {
			const response = await verifyOtp({ userId: userId, otpCode: codeValue });
			await saveTokens(response.authData?.accessToken as string, response.authData?.refreshToken as string);
			await saveProfileData({
				id: response.data.id,
				firstName: response.data.firstName,
				lastName: response.data.lastName,
				email: response.data.email,
				phone: response.data.phoneNumber,
				otherNames: response.data.otherNames,
			});
			navigation.replace('Main');
		} catch (error: any) {
			showToast('error', 'Verification Failed', error.message || 'An error occurred during verification. Please try again.');
		} finally {
			setIsVerifying(false);
		}
	};

	const handleResend = async () => {
		if (isResending || resendIn > 0) return;
		setIsResending(true);

		try {
			await resendOtp({ userId: userId, mode: 'email' });
		} catch (error: any) {
			showToast('error', 'Resend Failed', error.message || 'An error occurred while resending the code. Please try again.');
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
			await resendOtp({ userId: userId, mode: 'sms' });
		} catch (error: any) {
			showToast('error', 'Resend Failed', error.message || 'An error occurred while resending the code. Please try again.');
		} finally {
			setIsResendingSms(false);
			setResendIn(60);
			setCode(Array(OTP_LENGTH).fill(''));
			focusInput(0);
		}
	};

	const authHighlights = ['Step 2 of 2', 'Secure verification'];

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.select({ ios: 'padding', android: undefined })}
			>
				<ScrollView
					contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + AUTH_SPACING.screenY }]}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.heroWrap}>
						<Text style={styles.kicker}>Verification code</Text>
						<Text style={styles.heroTitle}>Confirm it’s you</Text>
						<Text style={styles.heroSubtitle}>Enter the 6-digit code we sent to your account to finish signing in.</Text>
						<View style={styles.featureRow}>
							{authHighlights.map((highlight) => (
								<View key={highlight} style={styles.featureChip}>
									<Text style={styles.featureChipText}>{highlight}</Text>
								</View>
							))}
						</View>
					</View>

					<View style={styles.card}>
						<View style={styles.codeRow}>
							{code.map((digit, index) => (
								<TextInput
									key={`otp-${index}`}
									ref={(ref) => {
										inputs.current[index] = ref;
									}}
									style={[styles.otpInput, digit && styles.otpInputFilled]}
									keyboardType="number-pad"
									textContentType={index === 0 ? 'oneTimeCode' : 'none'}
									autoComplete={index === 0 ? 'one-time-code' : 'off'}
									maxLength={1}
									value={digit}
									autoFocus={index === 0}
									onChangeText={(value) => handleChange(value, index)}
									onKeyPress={(event) => handleKeyPress(event, index)}
									returnKeyType={index === OTP_LENGTH - 1 ? 'done' : 'next'}
									onSubmitEditing={() => {
										if (index < OTP_LENGTH - 1) {
											focusInput(index + 1);
										} else {
											handleVerify();
										}
									}}
								/>
							))}
						</View>

						<TouchableOpacity
							style={[styles.verifyButton, (isVerifying || !codeComplete) && styles.buttonDisabled]}
							onPress={handleVerify}
							activeOpacity={0.9}
						>
							{isVerifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyText}>Verify code</Text>}
						</TouchableOpacity>

						<View style={styles.resendRow}>
							<Text style={styles.resendTitle}>Didn’t get the code?</Text>
							<Text style={styles.resendSubtitle}>Try email or SMS after the timer resets.</Text>

							<View style={styles.resendActions}>
								<TouchableOpacity
									onPress={handleResend}
									disabled={isResending || resendIn > 0}
									style={styles.resendButton}
								>
									{isResending ? (
										<ActivityIndicator color={AUTH_COLORS.primary} size="small" />
									) : (
										<Text style={resendIn > 0 ? styles.resendDisabled : styles.resendActive}>
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
										<Text style={resendIn > 0 ? styles.resendDisabled : styles.resendActive}>
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
	},
	scroll: {
		paddingHorizontal: AUTH_SPACING.screenX,
		paddingTop: AUTH_SPACING.screenY,
		flexGrow: 1,
	},
	heroWrap: {
		backgroundColor: AUTH_COLORS.card,
		borderRadius: AUTH_RADII.card,
		padding: AUTH_SPACING.block,
		marginBottom: 14,
		shadowColor: AUTH_COLORS.shadow,
		shadowOpacity: 1,
		shadowRadius: 14,
		shadowOffset: { width: 0, height: 8 },
		elevation: 3,
	},
	kicker: {
		fontSize: 11,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 1.1,
		color: AUTH_COLORS.primary,
		marginBottom: 6,
	},
	heroTitle: {
		fontSize: 22,
		fontWeight: '700',
		color: AUTH_COLORS.text,
	},
	heroSubtitle: {
		marginTop: 6,
		fontSize: 13,
		color: AUTH_COLORS.muted,
	},
	featureRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 12,
	},
	featureChip: {
		backgroundColor: AUTH_COLORS.primarySoft,
		borderRadius: AUTH_RADII.pill,
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	featureChipText: {
		fontSize: 11,
		fontWeight: '700',
		color: AUTH_COLORS.primary,
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
	codeRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 8,
		marginBottom: 22,
	},
	otpInput: {
		flex: 1,
		height: 54,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: AUTH_COLORS.line,
		textAlign: 'center',
		fontSize: 18,
		fontWeight: '700',
		color: AUTH_COLORS.text,
		backgroundColor: '#fff',
	},
	otpInputFilled: {
		borderColor: AUTH_COLORS.primary,
		backgroundColor: AUTH_COLORS.primarySoft,
	},
	verifyButton: {
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
	},
	resendTitle: {
		fontSize: 13,
		fontWeight: '700',
		color: AUTH_COLORS.text,
	},
	resendSubtitle: {
		marginTop: 2,
		fontSize: 12,
		color: AUTH_COLORS.muted,
	},
	resendActions: {
		marginTop: 10,
		flexDirection: 'row',
		gap: 10,
	},
	resendButton: {
		flex: 1,
		borderWidth: 1,
		borderColor: AUTH_COLORS.line,
		borderRadius: AUTH_RADII.pill,
		paddingVertical: 10,
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	resendActive: {
		color: AUTH_COLORS.primary,
		fontWeight: '700',
	},
	resendDisabled: {
		color: AUTH_COLORS.muted,
		fontWeight: '500',
	},
});

export default OtpPage;
