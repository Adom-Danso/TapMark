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
	Modal,
} from 'react-native';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from './authTheme';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod/dist/zod.js';
import { SignupSchema, SignupSchemaType } from '@/schemas/auth';
import { Campus } from '@/schemas/campuses';
import { searchCampuses } from '@/functions/campuses/search-campuses';
import { showToast } from '@/utils/notifications';
import { useQuery } from '@tanstack/react-query';
import { signup } from '@/functions/auth/signup';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/schemas/shared';

type SignUpProps = NativeStackScreenProps<AppStackParamList, 'Signup'>;

const SignupPage = ({ navigation }: SignUpProps) => {
	const [campusOpen, setCampusOpen] = useState(false);
	const [campuses, setCampuses] = useState<Campus[]>([]);
	const form = useForm<SignupSchemaType>({
		resolver: zodResolver(SignupSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			dob: '',
			gender: 'male',
			campusId: '',
			email: '',
			phoneNumber: '',
			password: '',
			confirmPassword: '',
		},
	});
	const campus = form.watch('campusId');
	const gender = form.watch('gender');

	const genderOptions = ['Male', 'Female'];

	const handleSignup = async (formData: SignupSchemaType) => {
		try {
			const response = await signup(formData);
			navigation.replace("Otp", {userId: response.data.id});
		} catch (error: any) {
			showToast("error", "Signup failed.", error.message || "An unexpected error occurred.");
		}
	};

	async function fetchCampuses() {
		try {
			const response = await searchCampuses(1000, 0)
			return response.data;
		} catch (error: any) {
			showToast("error", "Failed to load campuses.", error.message || "An unexpected error occurred.");
			return []
		}
	}
	const fetchCampusesQuery = useQuery({
		queryKey: ['fetchCampuses'],
		queryFn: fetchCampuses,
	});
	React.useEffect(() => {
		if (fetchCampusesQuery.data && fetchCampusesQuery.status === 'success') {
			setCampuses(fetchCampusesQuery.data);
		}
	}, [fetchCampusesQuery.data]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
			<View style={styles.heroWrap}>
				<Image
					source={require('../../../assets/foodCovers/burger.jpg')}
					resizeMode="cover"
					style={styles.heroImage}
				/>
			</View>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.select({ ios: 'padding', android: undefined })}
			>
				<ScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.card}>
						<Text style={styles.title}>Create your account</Text>
						<Text style={styles.subtitle}>
							Sign up to access campus delivery and exclusive deals.
						</Text>

						<View style={styles.toggle}>
							<TouchableOpacity
								style={styles.toggleButton}
								onPress={() => navigation.navigate('Login')}
							>
								<Text style={styles.toggleText}>Log In</Text>
							</TouchableOpacity>
							<TouchableOpacity style={[styles.toggleButton, styles.toggleActive]}>
								<Text style={[styles.toggleText, styles.toggleTextActive]}>Sign Up</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.row}>
							<View style={styles.col}>
								<Text style={styles.label}>First Name</Text>
								<Controller
									control={form.control}
									name="firstName"
									render={({ field: { onChange, onBlur, value } }) => (
										<TextInput
											style={styles.input}
											placeholder="First"
											placeholderTextColor={AUTH_COLORS.muted}
											onBlur={onBlur}
											onChangeText={onChange}
											value={value}
										/>
									)}
								/>
							</View>
							<View style={styles.col}>
								<Text style={styles.label}>Last Name</Text>
								<Controller
									control={form.control}
									name="lastName"
									render={({ field: { onChange, onBlur, value } }) => (
										<TextInput
											style={styles.input}
											placeholder="Last"
											placeholderTextColor={AUTH_COLORS.muted}
											onBlur={onBlur}
											onChangeText={onChange}
											value={value}
										/>
									)}
								/>
							</View>
						</View>

						{/* <Text style={styles.label}>Other Names (Optional)</Text>
							<TextInput
								style={styles.input}
								placeholder="Other names"
								placeholderTextColor={AUTH_COLORS.muted}
								value={otherNames}
								onChangeText={setOtherNames}
							/> */}

						<View style={styles.row}>
							<View style={styles.col}>
								<Text style={styles.label}>Date of Birth</Text>
								<Controller
									control={form.control}
									name="dob"
									render={({ field: { onChange, onBlur, value } }) => (
										<TextInput
											style={styles.input}
											placeholder="YYYY-MM-DD"
											placeholderTextColor={AUTH_COLORS.muted}
											onBlur={onBlur}
											onChangeText={onChange}
											value={value}
										/>
									)}
								/>
							</View>
							<View style={styles.col}>
								<Text style={styles.label}>Gender</Text>
								<View style={styles.genderRow}>
									{genderOptions.map((option) => (
										<TouchableOpacity
											key={option}
											style={[
												styles.genderButton,
												gender === option.toLowerCase() && styles.genderButtonActive,
											]}
											onPress={() => form.setValue('gender', option.toLowerCase())}
										>
											<Text
												style={[
													styles.genderText,
													gender === option.toLowerCase() && styles.genderTextActive,
												]}
											>
												{option}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							</View>
						</View>

						<Text style={styles.label}>University Campus</Text>
						<TouchableOpacity
							style={styles.selectInput}
							onPress={() => setCampusOpen(true)}
							activeOpacity={0.8}
						>
							<Text style={campus ? styles.selectText : styles.selectPlaceholder}>
								{campuses.find((c) => c.id === campus)?.name || 'Select campus'}
							</Text>
						</TouchableOpacity>

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

						<Text style={styles.label}>Phone</Text>
						<Controller
							control={form.control}
							name="phoneNumber"
							render={({ field: { onChange, onBlur, value } }) => (
								<TextInput
									style={styles.input}
									placeholder="+233 000 000 000"
									placeholderTextColor={AUTH_COLORS.muted}
									keyboardType="phone-pad"
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
									placeholder="Create password"
									placeholderTextColor={AUTH_COLORS.muted}
									secureTextEntry
									onBlur={onBlur}
									onChangeText={onChange}
									value={value}
								/>
							)}
						/>

						<Text style={styles.label}>Confirm Password</Text>
						<Controller
							control={form.control}
							name="confirmPassword"
							render={({ field: { onChange, onBlur, value } }) => (
								<TextInput
									style={styles.input}
									placeholder="Re-enter password"
									placeholderTextColor={AUTH_COLORS.muted}
									secureTextEntry
									onBlur={onBlur}
									onChangeText={onChange}
									value={value}
								/>
							)}
						/>

						<TouchableOpacity
							style={[styles.primaryButton, form.formState.isSubmitting && styles.buttonDisabled]}
							onPress={form.handleSubmit(handleSignup)}
							activeOpacity={0.9}
						>
							{form.formState.isSubmitting ? (
								<ActivityIndicator color="#fff" />
							) : (
								<Text style={styles.primaryButtonText}>Sign Up</Text>
							)}
						</TouchableOpacity>

						<Text style={styles.terms}>
							By signing up, you agree to our Terms & Privacy Policy.
						</Text>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			<Modal visible={campusOpen} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Select Campus</Text>
						{campuses.map((campus) => (
							<TouchableOpacity
								key={campus.id}
								style={styles.modalOption}
								onPress={() => {
									form.setValue('campusId', campus.id);
									setCampusOpen(false);
								}}
							>
								<Text style={styles.modalOptionText}>{campus.name}</Text>
							</TouchableOpacity>
						))}
						<TouchableOpacity
							style={styles.modalClose}
							onPress={() => setCampusOpen(false)}
						>
							<Text style={styles.modalCloseText}>Cancel</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
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
		paddingTop: 12,
		paddingBottom: 40,
		flexGrow: 1,
	},
	heroWrap: {
		height: 190,
		borderRadius: 22,
		overflow: 'hidden',
		marginTop: AUTH_SPACING.screenY,
		marginHorizontal: AUTH_SPACING.screenX,
		marginBottom: 16,
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
	textArea: {
		height: 84,
		textAlignVertical: 'top',
	},
	row: {
		flexDirection: 'row',
		gap: 12,
	},
	col: {
		flex: 1,
	},
	selectInput: {
		borderWidth: 1,
		borderColor: AUTH_COLORS.line,
		borderRadius: AUTH_RADII.input,
		paddingHorizontal: 14,
		paddingVertical: 12,
		backgroundColor: '#fff',
		marginBottom: 14,
	},
	selectPlaceholder: {
		color: AUTH_COLORS.muted,
		fontSize: 14,
	},
	selectText: {
		color: AUTH_COLORS.text,
		fontSize: 14,
		fontWeight: '600',
	},
	genderRow: {
		flexDirection: 'row',
		gap: 6,
		marginBottom: 14,
	},
	genderButton: {
		flex: 1,
		borderWidth: 1,
		borderColor: AUTH_COLORS.line,
		borderRadius: 10,
		paddingVertical: 8,
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	genderButtonActive: {
		borderColor: AUTH_COLORS.primary,
		backgroundColor: AUTH_COLORS.primarySoft,
	},
	genderText: {
		fontSize: 12,
		color: AUTH_COLORS.muted,
		fontWeight: '600',
	},
	genderTextActive: {
		color: AUTH_COLORS.primary,
	},
	primaryButton: {
		backgroundColor: AUTH_COLORS.primary,
		borderRadius: AUTH_RADII.pill,
		paddingVertical: 14,
		alignItems: 'center',
		marginTop: 4,
	},
	primaryButtonText: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '600',
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	terms: {
		marginTop: 12,
		fontSize: 11,
		color: AUTH_COLORS.muted,
		textAlign: 'center',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
		justifyContent: 'center',
		padding: 22,
	},
	modalCard: {
		backgroundColor: AUTH_COLORS.card,
		borderRadius: AUTH_RADII.card,
		padding: 18,
		shadowColor: AUTH_COLORS.shadow,
		shadowOpacity: 1,
		shadowRadius: 14,
		shadowOffset: { width: 0, height: 8 },
		elevation: 3,
	},
	modalTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: AUTH_COLORS.text,
		marginBottom: 10,
	},
	modalOption: {
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: AUTH_COLORS.line,
	},
	modalOptionText: {
		color: AUTH_COLORS.text,
		fontSize: 14,
		fontWeight: '600',
	},
	modalClose: {
		marginTop: 12,
		alignItems: 'center',
	},
	modalCloseText: {
		color: AUTH_COLORS.primary,
		fontWeight: '600',
	},
});

export default SignupPage;

