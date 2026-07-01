import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../screens/auth/authTheme';

type RatingModalProps = {
  visible: boolean;
  title: string;
  subtitle: string;
  targetType: string;
  targetId: string;
  onClose: () => void;
};

const STAR_VALUES = [1, 2, 3, 4, 5];

const helperLabelByScore: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

const RatingModal = ({ visible, title, subtitle, targetType, targetId, onClose }: RatingModalProps) => {
  const [score, setScore] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setScore(0);
      setReview('');
      setIsSubmitting(false);
    }
  }, [visible]);

  const canSubmit = useMemo(() => score > 0 && review.trim().length > 0 && !isSubmitting, [isSubmitting, review, score]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    const payload = {
      target_type: targetType,
      target_id: targetId,
      score,
      review: review.trim(),
    };

    void payload;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setScore(0);
      setReview('');
      onClose();
    }, 900);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.8}>
                <Ionicons name="close" size={20} color={AUTH_COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingCard}>
              <View style={styles.ratingTopRow}>
                <Text style={styles.ratingLabel}>Your score</Text>
                <Text style={styles.ratingValue}>{score > 0 ? `${score}/5` : 'Select a rating'}</Text>
              </View>

              <View style={styles.starRow}>
                {STAR_VALUES.map((value) => {
                  const isActive = value <= score;

                  return (
                    <Pressable
                      key={value}
                      onPress={() => setScore(value)}
                      style={({ pressed }) => [styles.starButton, pressed ? styles.starButtonPressed : null]}
                      accessibilityRole="button"
                      accessibilityLabel={`Rate ${value} star${value > 1 ? 's' : ''}`}
                    >
                      <Ionicons
                        name={isActive ? 'star' : 'star-outline'}
                        size={34}
                        color={isActive ? '#F59E0B' : '#D6C9BF'}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.helperRow}>
                <Text style={styles.helperText}>{score > 0 ? helperLabelByScore[score] : 'Tap a star to rate your experience'}</Text>
                <Text style={styles.helperText}>Rating uses integer values from 1 to 5.</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Write a review</Text>
              <TextInput
                value={review}
                onChangeText={setReview}
                placeholder="Tell us what stood out"
                placeholderTextColor={AUTH_COLORS.muted}
                style={styles.textArea}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit ? styles.submitButtonDisabled : null]}
              activeOpacity={0.9}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit review</Text>
              )}
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AUTH_COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingTop: 20,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: AUTH_COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
    lineHeight: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.background,
  },
  ratingCard: {
    borderRadius: AUTH_RADII.card,
    backgroundColor: '#FBF8F6',
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    padding: 14,
    gap: 12,
  },
  ratingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: AUTH_COLORS.primary,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  starButton: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
  },
  starButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  helperRow: {
    gap: 2,
  },
  helperText: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  formGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  textArea: {
    minHeight: 110,
    borderRadius: AUTH_RADII.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    backgroundColor: AUTH_COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: AUTH_COLORS.text,
  },
  submitButton: {
    minHeight: 52,
    borderRadius: AUTH_RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primary,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default RatingModal;