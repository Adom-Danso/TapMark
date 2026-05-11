import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../auth/authTheme';
import { useProfile } from '@/context/ProfileContext';
import { User } from '@/schemas/user';
import { updateOneUser } from '@/functions/users/update-one-user';
import { useMutation } from '@tanstack/react-query';
import { showToast } from '@/utils/notifications';
import { saveProfileData } from '@/utils/profile';
import { ProfileData } from '@/schemas/profile';

const FIELD_META = [
  { key: 'firstName', label: 'First name', keyboardType: 'default', icon: 'person-outline' },
  { key: 'lastName', label: 'Last name', keyboardType: 'default', icon: 'person-outline' },
  { key: 'email', label: 'Email address', keyboardType: 'email-address', icon: 'mail-outline' },
  { key: 'phone', label: 'Phone number', keyboardType: 'phone-pad', icon: 'call-outline' },
];

const validateField = (field, value) => {
  const text = value.trim();

  if (field === 'firstName' || field === 'lastName') {
    if (text.length < 1) {
      return `Enter your ${field === 'firstName' ? 'first name' : 'last name'}.`;
    }
  }

  if (field === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      return 'Enter a valid email address.';
    }
  }

  if (field === 'phone') {
    if (!/^\+?[0-9\s-]{7,}$/.test(text)) {
      return 'Enter a valid phone number.';
    }
  }

  return '';
};

const EditPersonalInfoScreen = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();
  const { profileData, refreshProfile } = useProfile();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<ProfileData>(profileData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  async function updateUser(userUpdates: Partial<User>) {
    try {
      const response = await updateOneUser(profileData.id, userUpdates)
      saveProfileData({
        id: profileData.id,
        email: response.data.email,
        phone: response.data.phoneNumber,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        otherNames: response.data.otherNames,
      });
      return response.data
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  const updateUserMutation = useMutation({
    mutationKey: ["updateUser"],
    mutationFn: async (userUpdates: Partial<User>) => await updateUser(userUpdates),
    onSuccess: (updatedUser) => {
      refreshProfile();
      navigation.navigate('ProfileHome', { notice: `Profile updated` });
    },
    onError: (error) => {
      showToast("error", error.message || "Failed to update profile");
    }
  })

  const animations = useRef(
    FIELD_META.reduce((acc, item) => {
      acc[item.key] = new Animated.Value(0);
      return acc;
    }, {})
  ).current;

  useEffect(() => {
    setDraftValues(profileData);
  }, [profileData]);

  useEffect(() => {
    FIELD_META.forEach((field) => {
      Animated.timing(animations[field.key], {
        toValue: activeField === field.key ? 1 : 0,
        duration: 220,
        useNativeDriver: false,
      }).start();
    });
  }, [activeField, animations]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!activeField) {
        return;
      }

      event.preventDefault();
      Alert.alert('Discard changes?', 'You have an active edit. Save or cancel before leaving.', [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setActiveField(null);
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });

    return unsubscribe;
  }, [activeField, navigation]);

  const saveCurrentField = () => {
    if (!activeField) {
      return;
    }

    const candidate = draftValues[activeField] ?? '';
    const error = validateField(activeField, candidate);

    if (error) {
      setErrors((prev) => ({ ...prev, [activeField]: error }));
      setTouched((prev) => ({ ...prev, [activeField]: true }));
      return;
    }

    updateUserMutation.mutate({ [activeField]: candidate.trim() });
    setActiveField(null);
    setErrors((prev) => ({ ...prev, [activeField]: '' }));

    const savedLabel = FIELD_META.find((item) => item.key === activeField)?.label ?? 'Profile';
    navigation.navigate('ProfileHome', { notice: `${savedLabel} updated` });
  };

  const startEdit = (fieldKey: string) => {
    if (activeField && activeField !== fieldKey) {
      return;
    }
    setActiveField(fieldKey);
  };

  const cancelEdit = () => {
    if (!activeField) {
      return;
    }

    setDraftValues((prev) => ({ ...prev, [activeField]: profileData[activeField] }));
    setErrors((prev) => ({ ...prev, [activeField]: '' }));
    setTouched((prev) => ({ ...prev, [activeField]: false }));
    setActiveField(null);
  };

  const headerSubtitle = useMemo(() => {
    if (!activeField) {
      return 'Only one field can be edited at a time.';
    }

    const label = FIELD_META.find((item) => item.key === activeField)?.label;
    return `Editing ${label}. Save or cancel to continue.`;
  }, [activeField]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Edit personal info</Text>
          <Text style={styles.subtitle}>{headerSubtitle}</Text>

          {FIELD_META.map((field) => {
            const isActive = activeField === field.key;
            const isLocked = !!activeField && !isActive;
            const anim = animations[field.key];
            const fieldError = touched[field.key] ? errors[field.key] : '';

            return (
              <View key={field.key} style={styles.fieldCard}>
                <View style={styles.fieldHeader}>
                  <View style={styles.fieldIdentity}>
                    <View style={styles.iconBubble}>
                      <Ionicons name={field.icon} size={16} color={AUTH_COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      <Text style={styles.fieldValue}>{(profileData as any)[field.key] || 'Not set'}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.editPill, isLocked ? styles.editPillDisabled : null]}
                    onPress={() => startEdit(field.key)}
                    disabled={isLocked}
                  >
                    <Text style={[styles.editPillText, isLocked ? styles.editPillTextDisabled : null]}>
                      {isActive ? 'Editing...' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Animated.View
                  style={[
                    styles.editorWrap,
                    {
                      maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 170] }),
                      opacity: anim,
                    },
                  ]}
                >
                  <TextInput
                    value={draftValues[field.key]}
                    onChangeText={(text) => {
                      setDraftValues((prev) => ({ ...prev, [field.key]: text }));
                      if (touched[field.key]) {
                        setErrors((prev) => ({ ...prev, [field.key]: validateField(field.key, text) }));
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, [field.key]: true }));
                      setErrors((prev) => ({
                        ...prev,
                        [field.key]: validateField(field.key, draftValues[field.key]),
                      }));
                    }}
                    keyboardType={field.keyboardType}
                    autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    placeholderTextColor={AUTH_COLORS.muted}
                    style={styles.input}
                  />

                  {fieldError ? <Text style={styles.errorText}>{fieldError}</Text> : null}

                  <View style={styles.editorActions}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.cancelButton}
                      onPress={cancelEdit}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={styles.saveButton}
                      onPress={saveCurrentField}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  scroll: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingBottom: 90,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: AUTH_COLORS.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
    marginTop: 2,
    marginBottom: 4,
  },
  fieldCard: {
    borderRadius: AUTH_RADII.card,
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    padding: 14,
    gap: 10,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  fieldLabel: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
    fontWeight: '600',
  },
  fieldValue: {
    marginTop: 2,
    fontSize: 14,
    color: AUTH_COLORS.text,
    fontWeight: '700',
  },
  editPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EDDEDB',
    backgroundColor: '#FDF7F5',
  },
  editPillDisabled: {
    backgroundColor: '#F1ECEA',
    borderColor: '#E6DBD8',
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
  editPillTextDisabled: {
    color: AUTH_COLORS.muted,
  },
  editorWrap: {
    overflow: 'hidden',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    borderRadius: AUTH_RADII.input,
    backgroundColor: '#fff',
    color: AUTH_COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#B42318',
    fontWeight: '600',
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: AUTH_RADII.pill,
    backgroundColor: '#F4ECE9',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: AUTH_RADII.pill,
    backgroundColor: AUTH_COLORS.primary,
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});

export default EditPersonalInfoScreen;
