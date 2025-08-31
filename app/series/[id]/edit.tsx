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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FadeInView } from '@/components/common/FadeInView';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { theme } from '@/constants/Theme';
import { SermonSeries } from '@/types';
import { getSeriesById } from '@/data/mockData';

const THEME_COLORS = [
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Green', color: '#10B981' },
  { name: 'Purple', color: '#8B5CF6' },
  { name: 'Orange', color: '#F59E0B' },
  { name: 'Red', color: '#EF4444' },
  { name: 'Pink', color: '#EC4899' },
  { name: 'Indigo', color: '#6366F1' },
  { name: 'Teal', color: '#14B8A6' },
];

const COMMON_THEMES = [
  'Gospel', 'Faith', 'Love', 'Hope', 'Prayer', 'Discipleship',
  'Kingdom of God', 'Worship', 'Grace', 'Redemption', 'Joy',
  'Peace', 'Forgiveness', 'Salvation', 'Christian Living'
];

export default function EditSeriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const existingSeries = getSeriesById(id!);
  
  const [formData, setFormData] = useState({
    title: existingSeries?.title || '',
    description: existingSeries?.description || '',
    theme: existingSeries?.theme || '',
    startDate: existingSeries?.startDate || new Date(),
    endDate: existingSeries?.endDate || null,
    color: existingSeries?.color || THEME_COLORS[0].color,
    isActive: existingSeries?.isActive || false,
  });
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(!!existingSeries?.endDate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!existingSeries) {
    return (
      <FadeInView style={styles.container}>
        <Stack.Screen options={{ title: 'Series Not Found', headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.notFound}>
            <Ionicons name="library-outline" size={64} color={theme.colors.gray400} />
            <Text style={styles.notFoundTitle}>Series Not Found</Text>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </FadeInView>
    );
  }

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
      const updatedSeries = {
        ...existingSeries,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        theme: formData.theme.trim() || undefined,
        startDate: formData.startDate,
        endDate: hasEndDate ? formData.endDate : undefined,
        color: formData.color,
        isActive: formData.isActive,
        updatedAt: new Date(),
      };
      
      console.log('Updating series:', updatedSeries);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Success',
        'Sermon series updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update series. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Changes',
      'Are you sure you want to cancel? Your changes will be lost.',
      [
        { text: 'Continue Editing', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable style={styles.cancelButton} onPress={handleCancel}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
      </Pressable>
      <Text style={styles.headerTitle}>Edit Series</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  // The rest of the render methods are the same as create.tsx
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
        <Text style={styles.inputLabel}>Theme</Text>
        <TextInput
          style={styles.textInput}
          value={formData.theme}
          onChangeText={(text) => setFormData(prev => ({ ...prev, theme: text }))}
          placeholder="e.g., Faith, Love, Gospel..."
          maxLength={50}
        />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.themeSuggestions}
        >
          {COMMON_THEMES.map((theme) => (
            <Pressable
              key={theme}
              style={styles.themeChip}
              onPress={() => setFormData(prev => ({ ...prev, theme }))}
            >
              <Text style={styles.themeChipText}>{theme}</Text>
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
        <View style={styles.switchContainer}>
          <View>
            <Text style={styles.inputLabel}>Mark as Active</Text>
            <Text style={styles.inputDescription}>
              Active series appear prominently and can have sermons added immediately
            </Text>
          </View>
          <Switch
            value={formData.isActive}
            onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
            trackColor={{ false: theme.colors.gray300, true: theme.colors.primary + '40' }}
            thumbColor={formData.isActive ? theme.colors.primary : theme.colors.gray500}
          />
        </View>
      </View>
    </Card>
  );

  const renderColorPicker = () => (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Series Color</Text>
      <Text style={styles.sectionDescription}>
        Choose a color to help identify this series throughout the app
      </Text>
      
      <View style={styles.colorGrid}>
        {THEME_COLORS.map((colorOption) => (
          <Pressable
            key={colorOption.color}
            style={[
              styles.colorOption,
              { backgroundColor: colorOption.color },
              formData.color === colorOption.color && styles.selectedColor,
            ]}
            onPress={() => setFormData(prev => ({ ...prev, color: colorOption.color }))}
          >
            {formData.color === colorOption.color && (
              <Ionicons name="checkmark" size={20} color="white" />
            )}
          </Pressable>
        ))}
      </View>
    </Card>
  );

  return (
    <FadeInView style={styles.container}>
      <Stack.Screen options={{ title: `Edit ${existingSeries.title}`, headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          {renderBasicInfo()}
          {renderDatesAndStatus()}
          {renderColorPicker()}
          
          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="secondary"
              style={styles.cancelActionButton}
            />
            <Button
              title={isSubmitting ? "Saving..." : "Save Changes"}
              onPress={handleSubmit}
              variant="primary"
              disabled={isSubmitting || !formData.title.trim()}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={formData.startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) {
                setFormData(prev => ({ ...prev, startDate: selectedDate }));
                if (formData.endDate && selectedDate >= formData.endDate) {
                  setFormData(prev => ({ ...prev, endDate: null }));
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
      </SafeAreaView>
    </FadeInView>
  );
}

// Styles are the same as create.tsx
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
    marginBottom: theme.spacing.sm,
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
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  notFoundTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  backButtonText: {
    ...theme.typography.body1,
    color: theme.colors.white,
    fontWeight: '600',
  },
});