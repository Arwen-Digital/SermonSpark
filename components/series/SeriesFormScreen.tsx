import { theme } from '@/constants/Theme';
import { seriesRepository } from '@/services/repositories';
import type { SeriesDTO } from '@/services/repositories/types';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { LoadingIndicator } from '../common/LoadingIndicator';

interface SeriesFormScreenProps {
  series?: SeriesDTO; // If provided, we're editing; if not, we're creating
  onSave: () => void;
  onCancel: () => void;
}

export const SeriesFormScreen: React.FC<SeriesFormScreenProps> = ({
  series,
  onSave,
  onCancel
}) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLargeScreen = Math.min(width, height) >= 768;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    tags: [],
    status: 'planning'
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const isEditing = !!series;

  useEffect(() => {
    if (series) {
      setFormData({
        title: series.title || '',
        description: series.description || '',
        startDate: (series.startDate as string) || '',
        endDate: (series.endDate as string) || '',
        tags: series.tags || [],
        status: series.status || 'planning'
      });
    }
  }, [series]);

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a series title');
      return false;
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (startDate > endDate) {
        Alert.alert('Validation Error', 'Start date cannot be after end date');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isEditing && series) {
        await seriesRepository.update(series.id, formData);
        Alert.alert('Success', 'Series updated successfully');
      } else {
        await seriesRepository.create(formData);
        Alert.alert('Success', 'Series created successfully');
      }
      onSave();
    } catch (error) {
      console.error('Error saving series:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} series. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined, type: 'start' | 'end') => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
    }

    if (selectedDate) {
      const isoDate = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        [type === 'start' ? 'startDate' : 'endDate']: isoDate
      }));
    }
  };

  const statusOptions = [
    { value: 'planning', label: 'Planning', icon: 'calendar-outline', color: theme.colors.warning },
    { value: 'active', label: 'Active', icon: 'play-circle-outline', color: theme.colors.success },
    { value: 'completed', label: 'Completed', icon: 'checkmark-circle-outline', color: theme.colors.primary },
    { value: 'archived', label: 'Archived', icon: 'archive-outline', color: theme.colors.textSecondary }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(
              insets.top || 0,
              isLargeScreen ? theme.spacing.xl : theme.spacing.md
            ),
          },
        ]}
      >
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="secondary"
          style={styles.cancelButton}
        />
        <Text style={styles.title}>
          {isEditing ? 'Edit Series' : 'New Series'}
        </Text>
        <Button
          title="Save"
          onPress={handleSave}
          disabled={loading}
          style={styles.saveButton}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Basic Information */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Enter series title"
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={200}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter series description"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
          </View>
        </Card>

        {/* Dates */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          
          <View style={styles.dateRow}>
            <View style={styles.dateGroup}>
              <Text style={styles.label}>Start Date</Text>
              <Button
                title={formData.startDate ? formatDateForDisplay(formData.startDate) : 'Select Date'}
                onPress={() => setShowStartDatePicker(true)}
                variant="secondary"
                style={styles.dateButton}
                icon="calendar-outline"
              />
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.label}>End Date</Text>
              <Button
                title={formData.endDate ? formatDateForDisplay(formData.endDate) : 'Select Date'}
                onPress={() => setShowEndDatePicker(true)}
                variant="secondary"
                style={styles.dateButton}
                icon="calendar-outline"
              />
            </View>
          </View>

          {/* Date pickers rendered outside the card to match New Series */}
        </Card>

        {/* Status */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          
          <View style={styles.statusGrid}>
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                title={option.label}
                onPress={() => setFormData(prev => ({ ...prev, status: option.value as any }))}
                variant={formData.status === option.value ? 'primary' : 'secondary'}
                style={[
                  styles.statusOption,
                  formData.status === option.value && { backgroundColor: option.color }
                ]}
                icon={option.icon as any}
              />
            ))}
          </View>
        </Card>

        {/* Tags */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.input, styles.tagInput]}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add a tag"
              placeholderTextColor={theme.colors.textSecondary}
              onSubmitEditing={addTag}
            />
            <Button
              title="Add"
              onPress={addTag}
              style={styles.addTagButton}
              disabled={!tagInput.trim()}
            />
          </View>

          {formData.tags && formData.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {formData.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <Button
                    title=""
                    onPress={() => removeTag(tag)}
                    style={styles.removeTagButton}
                    icon="close"
                  />
                </View>
              ))}
            </View>
          )}
        </Card>

        {loading && (
          <View style={styles.loadingOverlay}>
            <LoadingIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </ScrollView>
      {/* Date pickers: mirror New Series implementation */}
      {Platform.OS === 'web' ? (
        <>
          {showStartDatePicker && (
            <Modal visible transparent animationType="fade">
              <Pressable style={styles.modalOverlay} onPress={() => setShowStartDatePicker(false)}>
                <Pressable style={styles.modalContent} onPress={() => {}}>
                  <View style={styles.modalHeader}>
                    <Pressable onPress={() => setShowStartDatePicker(false)}>
                      <Text style={styles.modalButton}>Cancel</Text>
                    </Pressable>
                    <Text style={styles.modalTitle}>Select Start Date</Text>
                    <Pressable
                      onPress={() => {
                        setShowStartDatePicker(false);
                        // If end date before start date, clear it
                        if (formData.endDate && formData.startDate && formData.startDate >= formData.endDate) {
                          setFormData(prev => ({ ...prev, endDate: '' }));
                        }
                      }}
                    >
                      <Text style={[styles.modalButton, styles.modalButtonPrimary]}>Done</Text>
                    </Pressable>
                  </View>
                  <View style={styles.webDatePickerContainer}>
                    <input
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) setFormData(prev => ({ ...prev, startDate: val }));
                      }}
                      style={{ width: '100%', padding: 12, fontSize: 16, border: '1px solid #ccc', borderRadius: 8, backgroundColor: 'white' }}
                    />
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
          )}
          {showEndDatePicker && (
            <Modal visible transparent animationType="fade">
              <Pressable style={styles.modalOverlay} onPress={() => setShowEndDatePicker(false)}>
                <Pressable style={styles.modalContent} onPress={() => {}}>
                  <View style={styles.modalHeader}>
                    <Pressable onPress={() => setShowEndDatePicker(false)}>
                      <Text style={styles.modalButton}>Cancel</Text>
                    </Pressable>
                    <Text style={styles.modalTitle}>Select End Date</Text>
                    <Pressable onPress={() => setShowEndDatePicker(false)}>
                      <Text style={[styles.modalButton, styles.modalButtonPrimary]}>Done</Text>
                    </Pressable>
                  </View>
                  <View style={styles.webDatePickerContainer}>
                    <input
                      type="date"
                      value={formData.endDate || ''}
                      min={formData.startDate || undefined}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, endDate: val }));
                      }}
                      style={{ width: '100%', padding: 12, fontSize: 16, border: '1px solid #ccc', borderRadius: 8, backgroundColor: 'white' }}
                    />
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
          )}
        </>
      ) : Platform.OS === 'ios' ? (
        <>
          <Modal visible={showStartDatePicker} transparent animationType="fade">
            <Pressable style={styles.modalOverlay} onPress={() => setShowStartDatePicker(false)}>
              <Pressable style={styles.modalContent} onPress={() => {}}>
                <View style={styles.modalHeader}>
                  <Pressable onPress={() => setShowStartDatePicker(false)}>
                    <Text style={styles.modalButton}>Cancel</Text>
                  </Pressable>
                  <Text style={styles.modalTitle}>Select Start Date</Text>
                  <Pressable
                    onPress={() => {
                      setShowStartDatePicker(false);
                      if (formData.endDate && formData.startDate && formData.startDate >= formData.endDate) {
                        setFormData(prev => ({ ...prev, endDate: '' }));
                      }
                    }}
                  >
                    <Text style={[styles.modalButton, styles.modalButtonPrimary]}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={formData.startDate ? new Date(formData.startDate) : new Date()}
                  mode="date"
                  display="compact"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const iso = selectedDate.toISOString().split('T')[0];
                      setFormData(prev => ({ ...prev, startDate: iso }));
                    }
                  }}
                  style={styles.datePicker}
                />
              </Pressable>
            </Pressable>
          </Modal>

          <Modal visible={showEndDatePicker} transparent animationType="fade">
            <Pressable style={styles.modalOverlay} onPress={() => setShowEndDatePicker(false)}>
              <Pressable style={styles.modalContent} onPress={() => {}}>
                <View style={styles.modalHeader}>
                  <Pressable onPress={() => setShowEndDatePicker(false)}>
                    <Text style={styles.modalButton}>Cancel</Text>
                  </Pressable>
                  <Text style={styles.modalTitle}>Select End Date</Text>
                  <Pressable onPress={() => setShowEndDatePicker(false)}>
                    <Text style={[styles.modalButton, styles.modalButtonPrimary]}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={formData.endDate ? new Date(formData.endDate) : new Date()}
                  mode="date"
                  display="compact"
                  minimumDate={formData.startDate ? new Date(formData.startDate) : undefined}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const iso = selectedDate.toISOString().split('T')[0];
                      setFormData(prev => ({ ...prev, endDate: iso }));
                    }
                  }}
                  style={styles.datePicker}
                />
              </Pressable>
            </Pressable>
          </Modal>
        </>
      ) : (
        <>
          {showStartDatePicker && (
            <DateTimePicker
              value={formData.startDate ? new Date(formData.startDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  const iso = selectedDate.toISOString().split('T')[0];
                  setFormData(prev => ({ ...prev, startDate: iso }));
                }
              }}
            />
          )}
          {showEndDatePicker && (
            <DateTimePicker
              value={formData.endDate ? new Date(formData.endDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  const iso = selectedDate.toISOString().split('T')[0];
                  setFormData(prev => ({ ...prev, endDate: iso }));
                }
              }}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cancelButton: {
    minWidth: 80,
  },
  saveButton: {
    minWidth: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  section: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  dateGroup: {
    flex: 1,
  },
  dateButton: {
    justifyContent: 'flex-start',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statusOption: {
    flex: 1,
    minWidth: '48%',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    minWidth: 60,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    fontWeight: '500',
    marginRight: theme.spacing.xs,
  },
  removeTagButton: {
    minWidth: 20,
    minHeight: 20,
    padding: 0,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  // Modal styles (copied from New Series screen)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    paddingBottom: 20,
    boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.3)',
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  modalButton: {
    ...theme.typography.body1,
    color: theme.colors.gray600,
    fontWeight: '500',
  },
  modalButtonPrimary: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
  },
  datePicker: {
    height: 200,
  },
  webDatePickerContainer: {
    padding: theme.spacing.lg,
  },
});
