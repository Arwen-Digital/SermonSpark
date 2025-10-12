import { configService } from '@/services/configService';
import { theme } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ClaudeSettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState<'claude-3-haiku-20240307' | 'claude-3-sonnet-20240229' | 'claude-3-opus-20240229'>('claude-3-haiku-20240307');
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await configService.getClaudeConfig();
      setApiKey(config.apiKey);
      setModel(config.model);
      setEnabled(config.enabled);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (apiKey.trim()) {
        await configService.setClaudeApiKey(apiKey.trim());
        await configService.setClaudeModel(model);
        await configService.setClaudeEnabled(true);
        setEnabled(true);
        
        Alert.alert('Success', 'Claude API configuration saved successfully!');
      } else {
        await configService.setClaudeEnabled(false);
        setEnabled(false);
        
        Alert.alert('Success', 'Claude API disabled.');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      Alert.alert('Error', 'Failed to save configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    Alert.alert(
      'Clear Configuration',
      'Are you sure you want to clear the Claude API configuration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await configService.clearClaudeConfig();
              setApiKey('');
              setModel('claude-3-haiku-20240307');
              setEnabled(false);
              Alert.alert('Success', 'Configuration cleared.');
            } catch (error) {
              console.error('Error clearing config:', error);
              Alert.alert('Error', 'Failed to clear configuration.');
            }
          },
        },
      ]
    );
  };

  const models = [
    { value: 'claude-3-haiku-20240307', label: 'Claude Haiku 3.5 (Fast & Cost-effective)' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude Sonnet 3.5 (Balanced)' },
    { value: 'claude-3-opus-20240229', label: 'Claude Opus 3.5 (Most Capable)' },
  ] as const;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Claude API Settings</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading configuration...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Claude API Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Configuration</Text>
          <Text style={styles.sectionDescription}>
            Configure your Claude API key to enable AI-powered Bible verse searching.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>API Key</Text>
            <TextInput
              style={styles.textInput}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Enter your Claude API key"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.inputHelp}>
              Get your API key from{' '}
              <Text style={styles.link}>https://console.anthropic.com/</Text>
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Model</Text>
            {models.map((modelOption) => (
              <Pressable
                key={modelOption.value}
                style={[
                  styles.modelOption,
                  model === modelOption.value && styles.modelOptionSelected,
                ]}
                onPress={() => setModel(modelOption.value)}
              >
                <View style={styles.modelOptionContent}>
                  <Text style={[
                    styles.modelOptionText,
                    model === modelOption.value && styles.modelOptionTextSelected,
                  ]}>
                    {modelOption.label}
                  </Text>
                  {model === modelOption.value && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Configuration</Text>
          </Pressable>
          
          <Pressable style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear Configuration</Text>
          </Pressable>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Claude API</Text>
          <Text style={styles.infoText}>
            • Claude Haiku: Fastest and most cost-effective for simple tasks{'\n'}
            • Claude Sonnet: Balanced performance and capability{'\n'}
            • Claude Opus: Most capable for complex tasks{'\n\n'}
            Your API key is stored securely on your device and never shared.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
    ...theme.shadows.sm,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  sectionDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    minHeight: 44,
  },
  inputHelp: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  link: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  modelOption: {
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  modelOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  modelOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modelOptionText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  modelOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  actions: {
    marginBottom: theme.spacing.lg,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  saveButtonText: {
    ...theme.typography.button,
    color: theme.colors.textOnPrimary,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'transparent',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  clearButtonText: {
    ...theme.typography.button,
    color: theme.colors.error,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  infoTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});