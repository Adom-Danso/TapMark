import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	StatusBar,
	TextInput,
	TouchableOpacity,
	Image,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	ScrollView,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
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
	const form = useForm<LoginSchemaType>({
		resolver: zodResolver(LoginSchema),
	});

	const handleLogin = async (credentials: LoginSchemaType) => {
		try {
			const response = await login(credentials)
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
		} catch (err: any) {
			if (err.statusCode === 403) {
				navigation.navigate("Otp", {
					userId: err.data.user_id,
				});
			} else {
				showToast("error", "Login Failed", err.message || "An error occurred during login. Please try again.")
			}
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
			<KeyboardAvoidingView
				style={styles.safeArea}
				behavior={Platform.select({ ios: 'padding', android: undefined })}
			>
				<ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
					<View style={styles.heroWrap}>
						<Image
							source={require('../../../assets/RestaurantCovers/sample.png')}
							resizeMode="cover"
							style={styles.heroImage}
						/>
					</View>

					<View style={styles.card}>
						<Text style={styles.title}>Welcome back</Text>
						<Text style={styles.subtitle}>Log in to continue your campus delivery.</Text>

						<View style={styles.toggle}>
							<TouchableOpacity style={[styles.toggleButton, styles.toggleActive]}>
								<Text style={[styles.toggleText, styles.toggleTextActive]}>Log In</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.toggleButton}
								onPress={() => navigation.navigate('Signup')}
							>
								<Text style={styles.toggleText}>Sign Up</Text>
							</TouchableOpacity>
						</View>

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

						<Text style={styles.label}>Password</Text>
						<Controller
							control={form.control}
							name="password"
							render={({ field: { onChange, onBlur, value } }) => (
								<TextInput
									style={styles.input}
									placeholder="Enter password"
									placeholderTextColor={AUTH_COLORS.muted}
									secureTextEntry
									onBlur={onBlur}
									onChangeText={onChange}
									value={value}
								/>
							)}
						/>

						<TouchableOpacity style={styles.forgotButton}>
							<Text style={styles.forgotText}>Forgot password?</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.primaryButton, form.formState.isSubmitting && styles.buttonDisabled]}
							onPress={form.handleSubmit(handleLogin, (errors) => {
								if (errors.email) {
									showToast("error", "Invalid Email", errors.email.message || "Please enter a valid email address.")
								} else if (errors.password) {
									showToast("error", "Invalid Password", errors.password.message || "Please enter a valid password.")
								}
							})}
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
	scroll: {
		paddingHorizontal: AUTH_SPACING.screenX,
		paddingTop: AUTH_SPACING.screenY,
		paddingBottom: 32,
	},
	heroWrap: {
		height: 160,
		borderRadius: 22,
		overflow: 'hidden',
		marginBottom: 18,
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

