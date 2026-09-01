import React, { useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	StatusBar,
	TextInput,
	TouchableOpacity,
	Image,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller, FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from './authTheme';
import { LoginSchema, LoginSchemaType } from '@/schemas/auth';
import { login } from '@/functions/auth/login';
import { saveTokens } from '@/utils/tokens';
import { showToast } from '@/utils/notifications';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/schemas/shared';
import { saveProfileData } from '@/utils/profile';

type LoginProps = NativeStackScreenProps<AppStackParamList, 'Login'>;

const LoginPage = ({ navigation }: LoginProps) => {
	const insets = useSafeAreaInsets();
	const passwordRef = useRef<TextInput | null>(null);
	const form = useForm<LoginSchemaType>({
		resolver: zodResolver(LoginSchema),
	});

	const handleLogin = async (credentials: LoginSchemaType) => {
		try {
			const response = await login(credentials);
			await saveTokens(response.authData?.accessToken as string, response.authData?.refreshToken as string);
			await saveProfileData({
				id: response.data.id,
				firstName: response.data.firstName,
				lastName: response.data.lastName,
				email: response.data.email,
				phone: response.data.phoneNumber,
				otherNames: response.data.otherNames,
			});

			if (response.data.userType === 'regular') {
				navigation.replace('Main');
			} else {
				showToast('error', 'Invalid Account');
			}
		} catch (err: any) {
			if (err.statusCode === 403) {
				navigation.navigate('Otp', {
					userId: err.data.user_id,
				});
			} else {
				showToast('error', 'Login Failed', err.message || 'An error occurred during login. Please try again.');
			}
		}
	};

	const submitLogin = form.handleSubmit(handleLogin, (errors: FieldErrors<LoginSchemaType>) => {
		if (errors.email) {
			showToast('error', 'Invalid Email', errors.email.message || 'Please enter a valid email address.');
		} else if (errors.password) {
			showToast('error', 'Invalid Password', errors.password.message || 'Please enter a valid password.');
		}
	});

	const authHighlights = ['Fast sign in', 'Secure sessions', 'Campus delivery'];

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
						<Image
							source={require('../../../assets/auth-logo.png')}
							resizeMode="cover"
							style={styles.heroImage}
						/>
					</View>

					<View style={styles.card}>
						<Text style={styles.kicker}>Welcome back</Text>
						<Text style={styles.title}>Log in to continue</Text>
						<Text style={styles.subtitle}>Pick up where you left off and get back to campus orders in seconds.</Text>

						<View style={styles.featureRow}>
							{authHighlights.map((highlight) => (
								<View key={highlight} style={styles.featureChip}>
									<Text style={styles.featureChipText}>{highlight}</Text>
								</View>
							))}
						</View>

						<View style={styles.toggle}>
							<TouchableOpacity style={[styles.toggleButton, styles.toggleActive]}>
								<Text style={[styles.toggleText, styles.toggleTextActive]}>Log In</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.toggleButton} onPress={() => navigation.navigate('Signup')}>
								<Text style={styles.toggleText}>Sign Up</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.sectionHeader}>
							<Text style={styles.sectionIndex}>01</Text>
							<View style={styles.sectionCopy}>
								<Text style={styles.sectionTitle}>Account access</Text>
								<Text style={styles.sectionDescription}>Use your campus email and password.</Text>
							</View>
						</View>

						<Text style={styles.label}>Email address</Text>
						<Controller
							control={form.control}
							name="email"
							render={({ field }) => (
								<View>
									<TextInput
										style={[styles.input, form.formState.errors.email && styles.inputError]}
										placeholder="student@campus.edu"
										placeholderTextColor={AUTH_COLORS.muted}
										keyboardType="email-address"
										autoCapitalize="none"
										returnKeyType="next"
										onSubmitEditing={() => passwordRef.current?.focus()}
										onBlur={field.onBlur}
										onChangeText={field.onChange}
										value={field.value}
									/>
									{form.formState.errors.email && (
										<Text style={styles.fieldError}>{form.formState.errors.email.message}</Text>
									)}
								</View>
							)}
						/>

						<Text style={styles.label}>Password</Text>
						<Controller
							control={form.control}
							name="password"
							render={({ field }) => (
								<View>
									<TextInput
										ref={passwordRef}
										style={[styles.input, form.formState.errors.password && styles.inputError]}
										placeholder="Enter password"
										placeholderTextColor={AUTH_COLORS.muted}
										secureTextEntry
										returnKeyType="done"
										onSubmitEditing={submitLogin}
										onBlur={field.onBlur}
										onChangeText={field.onChange}
										value={field.value}
									/>
									{form.formState.errors.password && (
										<Text style={styles.fieldError}>{form.formState.errors.password.message}</Text>
									)}
								</View>
							)}
						/>

						<TouchableOpacity style={styles.forgotButton} onPress={() => navigation.navigate('ForgotPassword')}>
							<Text style={styles.forgotText}>Forgot password?</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.primaryButton, form.formState.isSubmitting && styles.buttonDisabled]}
							onPress={submitLogin}
							activeOpacity={0.9}
						>
							{form.formState.isSubmitting ? (
								<ActivityIndicator color="#fff" />
							) : (
								<Text style={styles.primaryButtonText}>Log In</Text>
							)}
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
	container: {
		flex: 1,
	},
	scroll: {
		paddingHorizontal: AUTH_SPACING.screenX,
		paddingTop: AUTH_SPACING.screenY,
		paddingBottom: 0,
		flexGrow: 1,
	},
	heroWrap: {
		height: 150,
		borderRadius: 22,
		overflow: 'hidden',
		marginBottom: 14,
		backgroundColor: AUTH_COLORS.card,
		shadowColor: AUTH_COLORS.shadow,
		shadowOpacity: 1,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 6 },
		elevation: 3,
	},
	heroImage: {
		width: '100%',
		height: '100%',
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
	kicker: {
		fontSize: 11,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 1.1,
		color: AUTH_COLORS.primary,
		marginBottom: 6,
	},
	title: {
		fontSize: 22,
		fontWeight: '700',
		color: AUTH_COLORS.text,
	},
	subtitle: {
		marginTop: 6,
		marginBottom: 12,
		fontSize: 13,
		color: AUTH_COLORS.muted,
	},
	featureRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 14,
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
	toggle: {
		flexDirection: 'row',
		backgroundColor: AUTH_COLORS.background,
		borderRadius: AUTH_RADII.pill,
		padding: 4,
		marginBottom: 16,
	},
	toggleButton: {
		flex: 1,
		paddingVertical: 8,
		borderRadius: AUTH_RADII.pill,
		alignItems: 'center',
	},
	toggleActive: {
		backgroundColor: AUTH_COLORS.card,
		shadowColor: AUTH_COLORS.shadow,
		shadowOpacity: 1,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 2,
	},
	toggleText: {
		fontSize: 13,
		color: AUTH_COLORS.muted,
		fontWeight: '600',
	},
	toggleTextActive: {
		color: AUTH_COLORS.primary,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 10,
		marginBottom: 10,
	},
	sectionIndex: {
		width: 26,
		height: 26,
		borderRadius: 13,
		backgroundColor: AUTH_COLORS.primarySoft,
		color: AUTH_COLORS.primary,
		textAlign: 'center',
		textAlignVertical: 'center',
		fontSize: 11,
		fontWeight: '800',
		paddingTop: Platform.OS === 'android' ? 2 : 0,
	},
	sectionCopy: {
		flex: 1,
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: '700',
		color: AUTH_COLORS.text,
	},
	sectionDescription: {
		marginTop: 2,
		fontSize: 12,
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
		marginBottom: 8,
	},
	inputError: {
		borderColor: '#D97706',
		backgroundColor: '#FFFDF7',
	},
	fieldError: {
		fontSize: 11,
		color: '#B45309',
		marginBottom: 10,
	},
	forgotButton: {
		alignSelf: 'flex-end',
		marginBottom: 16,
	},
	forgotText: {
		fontSize: 12,
		color: AUTH_COLORS.primary,
		fontWeight: '600',
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
});

export default LoginPage;
