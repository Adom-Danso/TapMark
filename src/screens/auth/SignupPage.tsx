import React, { useEffect, useMemo, useRef, useState } from 'react';
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
	Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from './authTheme';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod/dist/zod.js';
import { SignupSchema, SignupSchemaInput, SignupSchemaType } from '@/schemas/auth';
import { Campus } from '@/schemas/campuses';
import { searchCampuses } from '@/functions/campuses/search-campuses';
import { showToast } from '@/utils/notifications';
import { useQuery } from '@tanstack/react-query';
import { signup } from '@/functions/auth/signup';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/schemas/shared';

type SignUpProps = NativeStackScreenProps<AppStackParamList, 'Signup'>;

const SignupPage = ({ navigation }: SignUpProps) => {
	const insets = useSafeAreaInsets();
	const firstNameRef = useRef<TextInput | null>(null);
	const lastNameRef = useRef<TextInput | null>(null);
	const emailRef = useRef<TextInput | null>(null);
	const phoneRef = useRef<TextInput | null>(null);
	const passwordRef = useRef<TextInput | null>(null);
	const confirmPasswordRef = useRef<TextInput | null>(null);
	const [campusOpen, setCampusOpen] = useState(false);
	const [campuses, setCampuses] = useState<Campus[]>([]);
	const [dobOpen, setDobOpen] = useState(false);
	const [tempDob, setTempDob] = useState<Date | null>(null);

	const form = useForm<SignupSchemaInput>({
		resolver: zodResolver(SignupSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			gender: 'male',
			campusId: '',
			email: '',
			phoneNumber: '',
			password: '',
			confirmPassword: '',
			dob: '',
		},
	});

	const campus = form.watch('campusId');
	const gender = form.watch('gender');
	const password = form.watch('password');
	const confirmPassword = form.watch('confirmPassword');
	const dob = form.watch('dob');
	const selectedCampus = useMemo(
		() => campuses.find((currentCampus: any) => currentCampus.id === campus),
		[campuses, campus],
	);

	const genderOptions = ['Male', 'Female'];
	const authHighlights = ['Quick setup', 'Campus verified', 'Secure OTP'];

	useEffect(() => {
		if (form.formState.errors.confirmPassword && password && confirmPassword && password === confirmPassword) {
			form.clearErrors('confirmPassword');
		}
	}, [confirmPassword, form, password]);

	const handleSignup = async (formData: SignupSchemaType) => {
		try {
			const response = await signup(formData);
			navigation.replace('Otp', { userId: response.data.id });
		} catch (error: any) {
			showToast('error', 'Signup failed.', error.message || 'An unexpected error occurred.');
		}
	};

	const submitSignup = form.handleSubmit(async (formData: any) => {
		if (formData.password !== formData.confirmPassword) {
			form.setError('confirmPassword', {
				type: 'validate',
				message: 'Passwords do not match.',
			});
			return;
		}

		await handleSignup(formData);
	});

	async function fetchCampuses() {
		try {
			const response = await searchCampuses(1000, 0);
			return response.data;
		} catch (error: any) {
			showToast('error', 'Failed to load campuses.', error.message || 'An unexpected error occurred.');
			return [];
		}
	}

	const fetchCampusesQuery = useQuery({
		queryKey: ['fetchCampuses'],
		queryFn: fetchCampuses,
	});

	useEffect(() => {
		if (fetchCampusesQuery.data && fetchCampusesQuery.status === 'success') {
			setCampuses(fetchCampusesQuery.data);
		}
	}, [fetchCampusesQuery.data, fetchCampusesQuery.status]);

	const renderMessage = (message?: string) => {
		if (!message) return null;
		return <Text style={styles.fieldError}>{message}</Text>;
	};

	const defaultDob = useMemo(() => {
		const date = new Date();
		date.setFullYear(date.getFullYear() - 18);
		return date;
	}, []);

	const parseIsoDate = (iso: string) => {
		const [year, month, day] = iso.split('-').map(Number);
		return new Date(year, month - 1, day);
	};

	const toIsoDate = (date: Date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const formatDob = (iso: string) => {
		if (!iso) return '';
		const date = parseIsoDate(iso);
		if (Number.isNaN(date.getTime())) return iso;
		return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	};

	const openDobPicker = () => {
		const initial = dob ? parseIsoDate(dob) : defaultDob;
		setTempDob(initial);

		if (Platform.OS === 'android') {
			DateTimePickerAndroid.open({
				value: initial,
				mode: 'date',
				maximumDate: new Date(),
				onChange: (event: any, selectedDate?: Date) => {
					if (event.type === 'set' && selectedDate) {
						form.setValue('dob', toIsoDate(selectedDate), { shouldValidate: true });
					}
				},
			},
			);
		} else {
			setDobOpen(true);
		}
	};

	const confirmDob = () => {
		if (tempDob) {
			form.setValue('dob', toIsoDate(tempDob), { shouldValidate: true });
		}
		setDobOpen(false);
	};

	return (
		<>
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
							<Text style={styles.kicker}>Campus access, made simpler</Text>
							<Text style={styles.title}>Create your account</Text>
							<Text style={styles.subtitle}>
								Join your campus storefront, check out faster, and keep every order in one place.
							</Text>

							<View style={styles.featureRow}>
								{authHighlights.map((highlight) => (
									<View key={highlight} style={styles.featureChip}>
										<Text style={styles.featureChipText}>{highlight}</Text>
									</View>
								))}
							</View>

							<View style={styles.toggle}>
								<TouchableOpacity style={styles.toggleButton} onPress={() => navigation.navigate('Login')}>
									<Text style={styles.toggleText}>Log In</Text>
								</TouchableOpacity>
								<TouchableOpacity style={[styles.toggleButton, styles.toggleActive]}>
									<Text style={[styles.toggleText, styles.toggleTextActive]}>Sign Up</Text>
								</TouchableOpacity>
							</View>

							<View style={styles.sectionHeader}>
								<Text style={styles.sectionIndex}>01</Text>
								<View style={styles.sectionCopy}>
									<Text style={styles.sectionTitle}>Personal details</Text>
									<Text style={styles.sectionDescription}>Start with your name and date of birth.</Text>
								</View>
							</View>

							<View style={styles.row}>
								<View style={styles.col}>
									<Text style={styles.label}>First Name</Text>
									<Controller
										control={form.control}
										name="firstName"
										render={(params: any) => {
											const { field } = params;
											return (
											<View>
												<TextInput
													ref={firstNameRef}
													style={[styles.input, form.formState.errors.firstName && styles.inputError]}
													placeholder="First"
													placeholderTextColor={AUTH_COLORS.muted}
													returnKeyType="next"
													onSubmitEditing={() => lastNameRef.current?.focus()}
													onBlur={field.onBlur}
													onChangeText={field.onChange}
													value={field.value}
												/>
												{renderMessage(form.formState.errors.firstName?.message)}
											</View>
										);
									}}
									/>
								</View>

								<View style={styles.col}>
									<Text style={styles.label}>Last Name</Text>
									<Controller
										control={form.control}
										name="lastName"
										render={(params: any) => {
											const { field } = params;
											return (
											<View>
												<TextInput
													ref={lastNameRef}
													style={[styles.input, form.formState.errors.lastName && styles.inputError]}
													placeholder="Last"
													placeholderTextColor={AUTH_COLORS.muted}
													returnKeyType="done"
													onSubmitEditing={() => setCampusOpen(true)}
													onBlur={field.onBlur}
													onChangeText={field.onChange}
													value={field.value}
												/>
												{renderMessage(form.formState.errors.lastName?.message)}
											</View>
										);
									}}
									/>
								</View>
							</View>

							<Text style={styles.label}>Date of Birth</Text>
							<TouchableOpacity
								style={[styles.selectInput, form.formState.errors.dob && styles.inputError]}
								onPress={openDobPicker}
								activeOpacity={0.8}
							>
								<Text style={dob ? styles.selectText : styles.selectPlaceholder}>
									{dob ? formatDob(dob) : 'Select your date of birth'}
								</Text>
							</TouchableOpacity>
							{renderMessage(form.formState.errors.dob?.message)}

							<View style={styles.sectionHeader}>
								<Text style={styles.sectionIndex}>02</Text>
								<View style={styles.sectionCopy}>
									<Text style={styles.sectionTitle}>Campus & contact</Text>
									<Text style={styles.sectionDescription}>Choose your campus and preferred contact info.</Text>
								</View>
							</View>

							<Text style={styles.label}>University Campus</Text>
							<TouchableOpacity
								style={[styles.selectInput, form.formState.errors.campusId && styles.inputError]}
								onPress={() => setCampusOpen(true)}
								activeOpacity={0.8}
							>
								<Text style={campus ? styles.selectText : styles.selectPlaceholder}>
									{selectedCampus?.name || (fetchCampusesQuery.isLoading ? 'Loading campuses...' : 'Select campus')}
								</Text>
							</TouchableOpacity>
							{renderMessage(form.formState.errors.campusId?.message)}

							<Text style={styles.label}>Email address</Text>
							<Controller
								control={form.control}
								name="email"
								render={(params: any) => {
									const { field } = params;
									return (
									<View>
										<TextInput
											ref={emailRef}
											style={[styles.input, form.formState.errors.email && styles.inputError]}
											placeholder="student@campus.edu"
											placeholderTextColor={AUTH_COLORS.muted}
											keyboardType="email-address"
											autoCapitalize="none"
											returnKeyType="next"
											onSubmitEditing={() => phoneRef.current?.focus()}
											onBlur={field.onBlur}
											onChangeText={field.onChange}
											value={field.value}
										/>
										{renderMessage(form.formState.errors.email?.message)}
									</View>
								)}}
							/>

							<Text style={styles.label}>Phone</Text>
							<Controller
								control={form.control}
								name="phoneNumber"
								render={({ field }: any) => (
									<View>
										<TextInput
											ref={phoneRef}
											style={[styles.input, form.formState.errors.phoneNumber && styles.inputError]}
											placeholder="+233 000 000 000"
											placeholderTextColor={AUTH_COLORS.muted}
											keyboardType="phone-pad"
											returnKeyType="next"
											onSubmitEditing={() => passwordRef.current?.focus()}
											onBlur={field.onBlur}
											onChangeText={field.onChange}
											value={field.value}
										/>
										{renderMessage(form.formState.errors.phoneNumber?.message)}
									</View>
								)}
							/>

							<View style={styles.sectionHeader}>
								<Text style={styles.sectionIndex}>03</Text>
								<View style={styles.sectionCopy}>
									<Text style={styles.sectionTitle}>Security</Text>
									<Text style={styles.sectionDescription}>Set your account sign-in details.</Text>
								</View>
							</View>

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

							<Text style={styles.label}>Password</Text>
							<Controller
								control={form.control}
								name="password"
								render={({ field }: any) => (
									<View>
										<TextInput
											ref={passwordRef}
											style={[styles.input, form.formState.errors.password && styles.inputError]}
											placeholder="Create password"
											placeholderTextColor={AUTH_COLORS.muted}
											secureTextEntry
											returnKeyType="next"
											onSubmitEditing={() => confirmPasswordRef.current?.focus()}
											onBlur={field.onBlur}
											onChangeText={field.onChange}
											value={field.value}
										/>
										{renderMessage(form.formState.errors.password?.message)}
									</View>
								)}
							/>

							<Text style={styles.label}>Confirm Password</Text>
							<Controller
								control={form.control}
								name="confirmPassword"
								render={({ field }: any) => (
									<View>
										<TextInput
											ref={confirmPasswordRef}
											style={[styles.input, form.formState.errors.confirmPassword && styles.inputError]}
											placeholder="Re-enter password"
											placeholderTextColor={AUTH_COLORS.muted}
											secureTextEntry
											returnKeyType="done"
											onSubmitEditing={submitSignup}
											onBlur={field.onBlur}
											onChangeText={field.onChange}
											value={field.value}
										/>
										{form.formState.errors.confirmPassword ? (
											<Text style={styles.fieldError}>{form.formState.errors.confirmPassword.message}</Text>
										) : (
											<Text style={styles.helperText}>Use a password you can type quickly on your phone.</Text>
										)}
									</View>
								)}
							/>

							<TouchableOpacity
								style={[styles.primaryButton, form.formState.isSubmitting && styles.buttonDisabled]}
								onPress={submitSignup}
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
			</SafeAreaView>

			<Modal visible={campusOpen} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Select Campus</Text>
						{fetchCampusesQuery.isLoading ? (
							<Text style={styles.modalEmpty}>Loading campuses...</Text>
						) : campuses.length === 0 ? (
							<Text style={styles.modalEmpty}>No campuses available right now.</Text>
						) : (
							campuses.map((currentCampus: any) => (
								<TouchableOpacity
									key={currentCampus.id}
									style={styles.modalOption}
									onPress={() => {
										form.setValue('campusId', currentCampus.id);
										setCampusOpen(false);
									}}
								>
									<Text style={styles.modalOptionText}>{currentCampus.name}</Text>
								</TouchableOpacity>
							))
						)}
						<TouchableOpacity style={styles.modalClose} onPress={() => setCampusOpen(false)}>
							<Text style={styles.modalCloseText}>Cancel</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			<Modal visible={dobOpen} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Select Date of Birth</Text>
						{tempDob && (
							<DateTimePicker
								value={tempDob}
								mode="date"
								display="spinner"
								maximumDate={new Date()}
								onChange={(_event: any, selectedDate?: Date) => {
									if (selectedDate) setTempDob(selectedDate);
								}}
							/>
						)}
						<View style={styles.dobActions}>
							<TouchableOpacity
								style={styles.dobCancelButton}
								onPress={() => setDobOpen(false)}
								activeOpacity={0.8}
							>
								<Text style={styles.dobCancelText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.dobConfirmButton}
								onPress={confirmDob}
								activeOpacity={0.9}
							>
								<Text style={styles.dobConfirmText}>Done</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</>
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
		height: 170,
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
	helperText: {
		fontSize: 11,
		color: AUTH_COLORS.muted,
		marginBottom: 10,
	},
	fieldError: {
		fontSize: 11,
		color: '#B45309',
		marginBottom: 10,
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
		marginBottom: 8,
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
		marginBottom: 10,
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
	modalEmpty: {
		fontSize: 13,
		color: AUTH_COLORS.muted,
		paddingVertical: 12,
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
	dobActions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 16,
	},
	dobCancelButton: {
		flex: 1,
		borderWidth: 1,
		borderColor: AUTH_COLORS.line,
		borderRadius: AUTH_RADII.pill,
		paddingVertical: 12,
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	dobCancelText: {
		color: AUTH_COLORS.muted,
		fontSize: 14,
		fontWeight: '600',
	},
	dobConfirmButton: {
		flex: 1,
		backgroundColor: AUTH_COLORS.primary,
		borderRadius: AUTH_RADII.pill,
		paddingVertical: 12,
		alignItems: 'center',
	},
	dobConfirmText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
	},
});

export default SignupPage;
