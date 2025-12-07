import { Card } from '@/components/common/Card';
import { theme } from '@/constants/Theme';
import { api } from '@/convex/_generated/api';
import { useConvexAuth } from '@/hooks/useConvexAuth';
import { useAuthenticatedMutation } from '@/services/customAuth';
import { profileRepository, type UpdateProfileInput } from '@/services/repositories/profileRepository.native';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (profile: any) => void;
}

export function EditProfileModal({ visible, onClose, onSave }: EditProfileModalProps) {
  const { isAuthenticated } = useConvexAuth();
  const updateProfileMutation = useAuthenticatedMutation(api.profiles.update);

  const [formData, setFormData] = useState({
    fullName: '',
    title: '',
    church: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadProfile();
    }
  }, [visible]);

  const loadProfile = async () => {
    try {
      const profile = await profileRepository.getCurrent();
      if (profile) {
        setFormData({
          fullName: profile.fullName || '',
          title: profile.title || '',
          church: profile.church || '',
          bio: profile.bio || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      // Save to local SQLite first
      const updatedProfile = await profileRepository.update(formData as UpdateProfileInput);

      // If authenticated, sync to Convex
      if (isAuthenticated) {
        try {
          await updateProfileMutation({
            fullName: formData.fullName || undefined,
            title: formData.title || undefined,
            church: formData.church || undefined,
          });
          console.log('Profile synced to Convex');
        } catch (error) {
          console.warn('Failed to sync profile to Convex:', error);
          // Don't fail the save if sync fails - local save succeeded
        }
      }

      onSave(updatedProfile);
      onClose();

      if (Platform.OS === 'web') {
        alert('Profile saved successfully!');
      } else {
        Alert.alert('Success', 'Profile saved successfully', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      if (Platform.OS === 'web') {
        alert('Failed to save profile. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to save profile. Please try again.', [{ text: 'OK' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Ionicons name="chevron-down" size={28} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Pressable onPress={handleSave} disabled={loading} style={styles.headerButton}>
            <Text style={[styles.saveButtonText, loading && styles.saveButtonDisabled]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.gray500}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Title/Role</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="e.g., Pastor, Reverend, Minister"
                placeholderTextColor={theme.colors.gray500}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Church/Organization</Text>
              <TextInput
                style={styles.input}
                value={formData.church}
                onChangeText={(text) => setFormData({ ...formData, church: text })}
                placeholder="Enter your church or organization"
                placeholderTextColor={theme.colors.gray500}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Tell us about yourself..."
                placeholderTextColor={theme.colors.gray500}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </Card>

          {isAuthenticated && (
            <Card style={styles.syncCard}>
              <View style={styles.syncInfo}>
                <Ionicons name="cloud-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.syncText}>
                  Your profile will be synced to the cloud when you save
                </Text>
              </View>
            </Card>
          )}

          <Pressable
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : 'Save Profile'}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  headerButton: {
    padding: theme.spacing.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  saveButtonText: {
    ...theme.typography.body1,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: theme.colors.gray400,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  input: {
    ...theme.typography.body1,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 8,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  bioInput: {
    minHeight: 100,
  },
  syncCard: {
    backgroundColor: theme.colors.primary + '10',
    borderColor: theme.colors.primary + '30',
    marginBottom: theme.spacing.lg,
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  syncText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.gray300,
  },
  submitButtonText: {
    ...theme.typography.body1,
    color: theme.colors.white,
    fontWeight: '600',
  },
  cancelButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...theme.typography.body1,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});
