import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	StatusBar,
	TextInput,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	ScrollView,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from './authTheme';
import { ForgotPasswordSchema, ForgotPasswordSchemaType } from '@/schemas/auth';
import { initiatePasswordReset } from '@/functions/auth/initiate-password-reset';
import { showToast } from '@/utils/notifications';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/schemas/shared';

type ForgotPasswordProps = NativeStackScreenProps<AppStackParamList, 'ForgotPassword'>;

const ForgotPasswordPage = ({ navigation }: ForgotPasswordProps) => {
	const [emailSent, setEmailSent] = useState<string | null>(null);
	const form = useForm<ForgotPasswordSchemaType>({
		resolver: zodResolver(ForgotPasswordSchema),
	});

	const handleSubmitEmail = async (data: ForgotPasswordSchemaType) => {
		try {
			await initiatePasswordReset(data.email);
			setEmailSent(data.email);
		} catch (err: any) {
			showToast("error", "Reset Failed", err.message || "An error occurred while sending the reset instructions. Please try again.")
		}
	};

	if (emailSent) {
		return (
			<SafeAreaView style={styles.safeArea}>
				<StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
				<View style={styles.confirmWrap}>
					<View style={styles.card}>
						<View style={styles.checkCircle}>
							<Text style={styles.checkMark}>✓</Text>
						</View>
						<Text style={styles.title}>Check your email</Text>
						<Text style={styles.subtitle}>
							We've sent instructions to reset your password to
						</Text>
						<Text style={styles.email}>{emailSent}</Text>
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={() => navigation.navigate('Login')}
							activeOpacity={0.9}
						>
							<Text style={styles.primaryButtonText}>Back to Login</Text>
						</TouchableOpacity>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
			<KeyboardAvoidingView
				style={styles.safeArea}
				behavior={Platform.select({ ios: 'padding', android: undefined })}
			>
				<ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
					<View style={styles.card}>
						<Text style={styles.title}>Forgot Password</Text>
						<Text style={styles.subtitle}>
							Enter your email address and we'll send you instructions to reset your password.
						</Text>

						<Text style={styles.label}>Email address</Text>
						<Controller
							control={form.control}
							name="email"
							render={({ field: { onChange, onBlur, value } }) => (
								<TextInput
									style={styles.input}
									placeholder="student@campus.edu"
									placeholderTextColor={AUTH_COLORS.muted}
									keyboardType="email-address"
									autoCapitalize="none"
									onBlur={onBlur}
									onChangeText={onChange}
									value={value}
								/>
							)}
						/>

						<TouchableOpacity
							style={[styles.primaryButton, form.formState.isSubmitting && styles.buttonDisabled]}
							onPress={form.handleSubmit(handleSubmitEmail, (errors) => {
								if (errors.email) {
									showToast("error", "Invalid Email", errors.email.message || "Please enter a valid email address.")
								}
							})}
							activeOpacity={0.9}
						>
							{form.formState.isSubmitting ? (
								<ActivityIndicator color="#fff" />
							) : (
								<Text style={styles.primaryButtonText}>Send Instructions</Text>
							)}
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.backButton}
							onPress={() => navigation.goBack()}
							activeOpacity={0.8}
						>
							<Text style={styles.backText}>Back to Login</Text>
						</TouchableOpacity>
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
	scroll: {
		paddingHorizontal: AUTH_SPACING.screenX,
		paddingTop: AUTH_SPACING.screenY,
		paddingBottom: 32,
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
		fontSize: 22,
		fontWeight: '700',
		color: AUTH_COLORS.text,
	},
	subtitle: {
		marginTop: 6,
		marginBottom: 14,
		fontSize: 13,
		color: AUTH_COLORS.muted,
	},
	label: {
		fontSize: 12,
		color: AUTH_COLORS.muted,
		marginBottom: 6,
	},
	input: {
		borderWidth: 1,
		borderColor: AUTH_COLORS.line,
		borderRadius: AUTH_RADII.input,
		paddingHorizontal: 14,
		paddingVertical: 12,
		fontSize: 14,
		color: AUTH_COLORS.text,
		backgroundColor: '#fff',
		marginBottom: 14,
	},
	primaryButton: {
		backgroundColor: AUTH_COLORS.primary,
		borderRadius: AUTH_RADII.pill,
		paddingVertical: 14,
		alignItems: 'center',
	},
	primaryButtonText: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '600',
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	backButton: {
		marginTop: 14,
		alignItems: 'center',
	},
	backText: {
		fontSize: 13,
		color: AUTH_COLORS.primary,
		fontWeight: '600',
	},
	confirmWrap: {
		flex: 1,
		paddingHorizontal: AUTH_SPACING.screenX,
		paddingTop: AUTH_SPACING.screenY,
		paddingBottom: 32,
		justifyContent: 'center',
	},
	checkCircle: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: AUTH_COLORS.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 14,
	},
	checkMark: {
		fontSize: 26,
		fontWeight: '700',
		color: AUTH_COLORS.primary,
	},
	email: {
		marginTop: 4,
		marginBottom: 18,
		fontSize: 14,
		fontWeight: '600',
		color: AUTH_COLORS.text,
	},
});

export default ForgotPasswordPage;
