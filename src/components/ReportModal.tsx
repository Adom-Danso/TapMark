import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../screens/auth/authTheme';
import { useMutation } from '@tanstack/react-query';
import { addOneReport } from '@/functions/reports/add-one-report';
import { showToast } from '@/utils/notifications';

type ReportModalProps = {
  visible: boolean;
  title: string;
  subtitle: string;
  targetId: string;
  complaints: Record<string, string>;
  onClose: () => void;
};


type EvidenceAsset = {
  uri: string,
  name: string,
  type: string,
}

const ReportModal = ({ visible, title, subtitle, targetId, complaints, onClose }: ReportModalProps) => {
  const [selectedComplaint, setSelectedComplaint] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<EvidenceAsset | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const formData = useRef<FormData>(new FormData())
  const canSubmit = useMemo(
    () => selectedComplaint.trim().length > 0 && description.trim().length > 0,
    [description, selectedComplaint],
  );
  
  const addOneReportMutation = useMutation({
    mutationKey: ["addOneReport"],
    mutationFn: async () => {
      if (!canSubmit) {
        throw Error("Please complete the form");
      }

      const response = await addOneReport(formData.current)
      return response.data
    },
    onSuccess: (data)=> {
      showToast("info", "Your complaint was submitted"),
      onClose();
    },
    onError: (error) => {
      showToast("error", error.message || "Error submitting complaint")
    }
  })


  useEffect(() => {
    if (!visible) {
      setSelectedComplaint('');
      setDescription('');
      setEvidence(null);
      setIsPickingImage(false);
      setPermissionDenied(false);
    }
  }, [visible]);


  const handleClose = () => {
    if (addOneReportMutation.isPending) {
      return;
    }
    onClose();
  };

  const handlePickEvidence = async () => {
    if (isPickingImage || addOneReportMutation.isPending) {
      return;
    }

    setIsPickingImage(true);
    setPermissionDenied(false);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setPermissionDenied(true);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setEvidence({
          name: asset.fileName || "report_evidence",
          type: asset.type || "image",
          uri: asset.uri,
        });
      }
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSubmit = () => {
    formData.current.append("evidence_photo", evidence as any)
    formData.current.append("report_type", selectedComplaint)
    formData.current.append("reported_party_id", targetId)
    formData.current.append("report_description", description.trim())

    addOneReportMutation.mutate()
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

            <View style={styles.sectionBlock}>
              <Text style={styles.fieldLabel}>What happened?</Text>
              <View style={styles.chipGrid}>
                {Object.keys(complaints).map((complaint) => {
                  const active = selectedComplaint === complaint;

                  return (
                    <Pressable
                      key={complaint}
                      onPress={() => setSelectedComplaint(complaint)}
                      style={({ pressed }) => [styles.chip, active ? styles.chipActive : null, pressed ? styles.chipPressed : null]}
                    >
                      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{complaints[complaint]}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.fieldLabel}>Describe the issue</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add the details that help us understand what happened"
                placeholderTextColor={AUTH_COLORS.muted}
                style={styles.textArea}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.sectionBlock}>
              <View style={styles.evidenceHeader}>
                <Text style={styles.fieldLabel}>Evidence</Text>
                <Text style={styles.evidenceHint}>One photo helps keep the report focused.</Text>
              </View>

              {evidence ? (
                <View style={styles.previewCard}>
                  <Image source={{ uri: evidence.uri }} style={styles.previewImage} />
                  <View style={styles.previewCopy}>
                    <Text style={styles.previewTitle}>Photo attached</Text>
                    <Text style={styles.previewMeta}>{evidence.name || 'Captured from camera'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setEvidence(null)}
                    activeOpacity={0.8}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={18} color="#B42318" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.evidenceButton} onPress={handlePickEvidence} activeOpacity={0.9}>
                  {isPickingImage ? (
                    <ActivityIndicator color={AUTH_COLORS.primary} />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={18} color={AUTH_COLORS.primary} />
                      <Text style={styles.evidenceButtonText}>Take photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {permissionDenied ? <Text style={styles.permissionText}>Camera permission is required to attach evidence.</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit ? styles.submitButtonDisabled : null]}
              activeOpacity={0.9}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              {addOneReportMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit report</Text>}
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
    gap: 16,
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
  sectionBlock: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: AUTH_RADII.pill,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    backgroundColor: AUTH_COLORS.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipActive: {
    backgroundColor: AUTH_COLORS.primarySoft,
    borderColor: AUTH_COLORS.primary,
  },
  chipPressed: {
    transform: [{ scale: 0.98 }],
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  chipTextActive: {
    color: AUTH_COLORS.primary,
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
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  evidenceHint: {
    fontSize: 11,
    color: AUTH_COLORS.muted,
    flex: 1,
    textAlign: 'right',
  },
  evidenceButton: {
    minHeight: 52,
    borderRadius: AUTH_RADII.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: AUTH_COLORS.primary,
    backgroundColor: AUTH_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  evidenceButtonText: {
    color: AUTH_COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: AUTH_RADII.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    backgroundColor: AUTH_COLORS.background,
    padding: 10,
  },
  previewImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E7DFD8',
  },
  previewCopy: {
    flex: 1,
    gap: 2,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  previewMeta: {
    fontSize: 11,
    color: AUTH_COLORS.muted,
  },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F0',
  },
  permissionText: {
    fontSize: 11,
    color: '#B42318',
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

export default ReportModal;