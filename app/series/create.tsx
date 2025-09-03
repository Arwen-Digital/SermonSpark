import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  Alert,
  Switch,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FadeInView } from '@/components/common/FadeInView';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { theme } from '@/constants/Theme';
import seriesService from '@/services/supabaseSeriesService';


const COMMON_THEMES = [
  'Gospel', 'Faith', 'Love', 'Hope', 'Prayer', 'Discipleship',
  'Kingdom of God', 'Worship', 'Grace', 'Redemption', 'Joy',
  'Peace', 'Forgiveness', 'Salvation', 'Christian Living'
];

export default function CreateSeriesScreen() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    startDate: new Date(),
    endDate: null as Date | null,
    status: 'planning' as 'planning' | 'active' | 'completed' | 'archived',
  });
  
  const [currentThemeInput, setCurrentThemeInput] = useState('');
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigateToSeriesList = () => {
    try {
      if (Platform.OS === 'web') {
        // On web, use push to ensure navigation works
        router.push('/series');
      } else {
        // On mobile, prefer back if available
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push('/series');
        }
      }
    } catch (error) {
      console.log('Navigation error:', error);
      // Final fallback
      router.push('/series');
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a series title');
      return false;
    }
    
    if (hasEndDate && formData.endDate && formData.endDate <= formData.startDate) {
      Alert.alert('Validation Error', 'End date must be after start date');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const newSeriesData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        startDate: formData.startDate.toISOString().split('T')[0],
        endDate: hasEndDate && formData.endDate ? formData.endDate.toISOString().split('T')[0] : undefined,
        tags: formData.tags,
        status: formData.status,
      };
      
      console.log('Creating new series:', newSeriesData);
      
      await seriesService.createSeries(newSeriesData);
      
      if (Platform.OS === 'web') {
        // On web, navigate immediately for better UX
        console.log('Series created successfully');
        navigateToSeriesList();
      } else {
        // On mobile, show alert then navigate
        Alert.alert(
          'Success',
          'Sermon series created successfully!',
          [
            {
              text: 'OK',
              onPress: navigateToSeriesList,
            },
          ]
        );
      }
    } catch (error) {
      console.error('Create series error:', error);
      Alert.alert('Error', 'Failed to create series. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Check if form has any data to show confirmation
    const hasData = formData.title.trim() || formData.description.trim() || formData.tags.length > 0;
    
    if (hasData && Platform.OS !== 'web') {
      Alert.alert(
        'Cancel Creation',
        'Are you sure you want to cancel? Your changes will be lost.',
        [
          { text: 'Continue Editing', style: 'cancel' },
          { 
            text: 'Cancel', 
            style: 'destructive', 
            onPress: navigateToSeriesList
          },
        ]
      );
    } else {
      // On web or if no data, navigate directly
      navigateToSeriesList();
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable 
        style={({ pressed }) => [
          styles.cancelButton,
          pressed && styles.cancelButtonPressed
        ]} 
        onPress={handleCancel}
        hitSlop={8}
      >
        <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
      </Pressable>
      <Text style={styles.headerTitle}>New Series</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderBasicInfo = () => (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Series Title *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.title}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
          placeholder="Enter series title..."
          maxLength={100}
          returnKeyType="next"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          placeholder="Describe the focus and goals of this series..."
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Tags</Text>
        
        {/* Selected tags pills */}
        {formData.tags.length > 0 && (
          <View style={styles.selectedThemes}>
            {formData.tags.map((tagText, index) => (
              <View key={index} style={styles.selectedThemePill}>
                <Text style={styles.selectedThemeText}>{tagText}</Text>
                <Pressable
                  onPress={() => {
                    setFormData(prev => ({
                      ...prev,
                      tags: prev.tags.filter((_, i) => i !== index)
                    }));
                  }}
                  style={styles.removeThemeButton}
                >
                  <Ionicons name="close" size={14} color={theme.colors.gray600} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        
        {/* Tag input */}
        <View style={styles.themeInputContainer}>
          <TextInput
            style={styles.themeInput}
            value={currentThemeInput}
            onChangeText={setCurrentThemeInput}
            placeholder="Add a tag and press Enter..."
            maxLength={30}
            onSubmitEditing={() => {
              const trimmedTag = currentThemeInput.trim();
              if (trimmedTag && !formData.tags.includes(trimmedTag)) {
                setFormData(prev => ({
                  ...prev,
                  tags: [...prev.tags, trimmedTag]
                }));
                setCurrentThemeInput('');
              }
            }}
            returnKeyType="done"
          />
          {currentThemeInput.trim() && (
            <Pressable
              style={styles.addThemeButton}
              onPress={() => {
                const trimmedTag = currentThemeInput.trim();
                if (trimmedTag && !formData.tags.includes(trimmedTag)) {
                  setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, trimmedTag]
                  }));
                  setCurrentThemeInput('');
                }
              }}
            >
              <Ionicons name="add" size={20} color={theme.colors.primary} />
            </Pressable>
          )}
        </View>
        
        {/* Tag suggestions */}
        <Text style={styles.suggestionsLabel}>Suggestions:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.themeSuggestions}
        >
          {COMMON_THEMES.filter(commonTag => !formData.tags.includes(commonTag)).map((commonTag) => (
            <Pressable
              key={commonTag}
              style={styles.themeChip}
              onPress={() => {
                if (!formData.tags.includes(commonTag)) {
                  setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, commonTag]
                  }));
                }
              }}
            >
              <Text style={styles.themeChipText}>{commonTag}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Card>
  );

  const renderDatesAndStatus = () => (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Timeline & Status</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Start Date</Text>
        <Pressable
          style={styles.dateButton}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Ionicons name="calendar" size={20} color={theme.colors.gray600} />
          <Text style={styles.dateButtonText}>
            {formData.startDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </Pressable>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.switchContainer}>
          <Text style={styles.inputLabel}>Set End Date</Text>
          <Switch
            value={hasEndDate}
            onValueChange={setHasEndDate}
            trackColor={{ false: theme.colors.gray300, true: theme.colors.primary + '40' }}
            thumbColor={hasEndDate ? theme.colors.primary : theme.colors.gray500}
          />
        </View>
        
        {hasEndDate && (
          <Pressable
            style={styles.dateButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color={theme.colors.gray600} />
            <Text style={styles.dateButtonText}>
              {formData.endDate?.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }) || 'Select end date'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Status</Text>
        <View style={styles.colorGrid}>
          {[
            { value: 'planning', label: 'Planning', color: '#F59E0B' },
            { value: 'active', label: 'Active', color: '#10B981' },
            { value: 'completed', label: 'Completed', color: '#3B82F6' },
            { value: 'archived', label: 'Archived', color: '#6B7280' }
          ].map((status) => (
            <Pressable
              key={status.value}
              style={[
                styles.statusOption,
                { backgroundColor: status.color },
                formData.status === status.value && styles.selectedColor,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, status: status.value as any }))}
            >
              {formData.status === status.value && (
                <Ionicons name="checkmark" size={20} color="white" />
              )}
              <Text style={[styles.statusText, { color: formData.status === status.value ? 'white' : 'transparent' }]}>
                {status.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Card>
  );


  const renderPreview = () => (
    <Card style={[styles.section, styles.previewCard]}>
      <Text style={styles.sectionTitle}>Preview</Text>
      <View style={[styles.previewSeries, { borderLeftColor: theme.colors.primary }]}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>
            {formData.title || 'Series Title'}
          </Text>
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>
              {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
            </Text>
          </View>
        </View>
        {formData.description && (
          <Text style={styles.previewDescription} numberOfLines={2}>
            {formData.description}
          </Text>
        )}
        <View style={styles.previewMeta}>
          <Text style={styles.previewMetaText}>0 sermons</Text>
          {formData.tags.length > 0 && (
            <Text style={styles.previewMetaText}>• {formData.tags.join(', ')}</Text>
          )}
        </View>
      </View>
    </Card>
  );

  return (
    <FadeInView style={styles.container}>
      <Stack.Screen options={{ title: 'Create Series', headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          {renderBasicInfo()}
          {renderDatesAndStatus()}
          {renderPreview()}
          
          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="secondary"
              style={styles.cancelActionButton}
            />
            <Button
              title={isSubmitting ? "Creating..." : "Create Series"}
              onPress={handleSubmit}
              variant="primary"
              disabled={isSubmitting || !formData.title.trim()}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>

        {/* Date Pickers */}
        {Platform.OS === 'web' ? (
          <>
            {/* Web Date Pickers */}
            {showStartDatePicker && (
              <Modal
                visible={showStartDatePicker}
                transparent={true}
                animationType="fade"
              >
                <Pressable 
                  style={styles.modalOverlay}
                  onPress={() => setShowStartDatePicker(false)}
                  activeOpacity={1}
                >
                  <Pressable 
                    style={styles.modalContent}
                    onPress={() => {}} // Prevent modal close when tapping inside
                  >
                    <View style={styles.modalHeader}>
                      <Pressable onPress={() => setShowStartDatePicker(false)}>
                        <Text style={styles.modalButton}>Cancel</Text>
                      </Pressable>
                      <Text style={styles.modalTitle}>Select Start Date</Text>
                      <Pressable 
                        onPress={() => {
                          setShowStartDatePicker(false);
                          // Clear end date if it's before new start date
                          if (formData.endDate && formData.startDate >= formData.endDate) {
                            setFormData(prev => ({ ...prev, endDate: null }));
                            setHasEndDate(false);
                          }
                        }}
                      >
                        <Text style={[styles.modalButton, styles.modalButtonPrimary]}>Done</Text>
                      </Pressable>
                    </View>
                    <View style={styles.webDatePickerContainer}>
                      <input
                        type="date"
                        value={formData.startDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          if (e.target.value) {
                            const newDate = new Date(e.target.value);
                            setFormData(prev => ({ ...prev, startDate: newDate }));
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: 12,
                          fontSize: 16,
                          border: '1px solid #ccc',
                          borderRadius: 8,
                          backgroundColor: 'white'
                        }}
                      />
                    </View>
                  </Pressable>
                </Pressable>
              </Modal>
            )}

            {showEndDatePicker && (
              <Modal
                visible={showEndDatePicker}
                transparent={true}
                animationType="fade"
              >
                <Pressable 
                  style={styles.modalOverlay}
                  onPress={() => setShowEndDatePicker(false)}
                  activeOpacity={1}
                >
                  <Pressable 
                    style={styles.modalContent}
                    onPress={() => {}} // Prevent modal close when tapping inside
                  >
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
                        value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
                        min={formData.startDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          if (e.target.value) {
                            const newDate = new Date(e.target.value);
                            setFormData(prev => ({ ...prev, endDate: newDate }));
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: 12,
                          fontSize: 16,
                          border: '1px solid #ccc',
                          borderRadius: 8,
                          backgroundColor: 'white'
                        }}
                      />
                    </View>
                  </Pressable>
                </Pressable>
              </Modal>
            )}
          </>
        ) : Platform.OS === 'ios' ? (
          <>
            {/* iOS Modal Date Pickers */}
            <Modal
              visible={showStartDatePicker}
              transparent={true}
              animationType="fade"
            >
              <Pressable 
                style={styles.modalOverlay}
                onPress={() => setShowStartDatePicker(false)}
                activeOpacity={1}
              >
                <Pressable 
                  style={styles.modalContent}
                  onPress={() => {}} // Prevent modal close when tapping inside
                >
                  <View style={styles.modalHeader}>
                    <Pressable onPress={() => setShowStartDatePicker(false)}>
                      <Text style={styles.modalButton}>Cancel</Text>
                    </Pressable>
                    <Text style={styles.modalTitle}>Select Start Date</Text>
                    <Pressable 
                      onPress={() => {
                        setShowStartDatePicker(false);
                        // Clear end date if it's before new start date
                        if (formData.endDate && formData.startDate >= formData.endDate) {
                          setFormData(prev => ({ ...prev, endDate: null }));
                        }
                      }}
                    >
                      <Text style={[styles.modalButton, styles.modalButtonPrimary]}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={formData.startDate}
                    mode="date"
                    display="compact"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setFormData(prev => ({ ...prev, startDate: selectedDate }));
                      }
                    }}
                    style={styles.datePicker}
                  />
                </Pressable>
              </Pressable>
            </Modal>

            <Modal
              visible={showEndDatePicker}
              transparent={true}
              animationType="fade"
            >
              <Pressable 
                style={styles.modalOverlay}
                onPress={() => setShowEndDatePicker(false)}
                activeOpacity={1}
              >
                <Pressable 
                  style={styles.modalContent}
                  onPress={() => {}} // Prevent modal close when tapping inside
                >
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
                    value={formData.endDate || new Date()}
                    mode="date"
                    display="compact"
                    minimumDate={formData.startDate}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setFormData(prev => ({ ...prev, endDate: selectedDate }));
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
            {/* Android Date Pickers */}
            {showStartDatePicker && (
              <DateTimePicker
                value={formData.startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartDatePicker(false);
                  if (selectedDate) {
                    setFormData(prev => ({ ...prev, startDate: selectedDate }));
                    // Clear end date if it's before new start date
                    if (formData.endDate && selectedDate >= formData.endDate) {
                      setFormData(prev => ({ ...prev, endDate: null }));
                      setHasEndDate(false);
                    }
                  }
                }}
              />
            )}
            
            {showEndDatePicker && (
              <DateTimePicker
                value={formData.endDate || new Date()}
                mode="date"
                display="default"
                minimumDate={formData.startDate}
                onChange={(event, selectedDate) => {
                  setShowEndDatePicker(false);
                  if (selectedDate) {
                    setFormData(prev => ({ ...prev, endDate: selectedDate }));
                  }
                }}
              />
            )}
          </>
        )}
      </SafeAreaView>
    </FadeInView>
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
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  cancelButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  cancelButtonPressed: {
    backgroundColor: theme.colors.gray200,
    opacity: 0.7,
  },
  headerTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  sectionDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  inputDescription: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: theme.spacing.sm,
  },
  themeSuggestions: {
    marginTop: theme.spacing.sm,
  },
  themeChip: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  themeChipText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  dateButtonText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: theme.colors.textPrimary,
  },
  statusOption: {
    width: 80,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    margin: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  previewCard: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  previewSeries: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  previewTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  previewBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  previewBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  previewDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  previewMetaText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  cancelActionButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  
  // Theme pills styles
  selectedThemes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  selectedThemePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  selectedThemeText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  removeThemeButton: {
    padding: 2,
  },
  themeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderRadius: theme.borderRadius.md,
    paddingRight: theme.spacing.sm,
  },
  themeInput: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  addThemeButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  suggestionsLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  
  // Modal styles
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