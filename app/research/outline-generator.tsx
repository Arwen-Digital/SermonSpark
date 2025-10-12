import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { RichHtml } from '@/components/common/RichHtml';
import { theme } from '@/constants/Theme';

const OUTLINE_TYPES = ['Expository', 'Topical'] as const;
type OutlineType = (typeof OUTLINE_TYPES)[number];

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function toHtml(preformatted: string): string {
  const safe = escapeHtml(preformatted);
  return `<div style="white-space: pre-wrap; font-size: 16px; line-height: 1.6;">${safe}</div>`;
}

export default function OutlineGeneratorPage() {
  const [outlineType, setOutlineType] = useState<OutlineType>('Expository');
  const [verse, setVerse] = useState<string>('John 3:16-17');
  const [preacher, setPreacher] = useState<string>('Andy Stanley');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');

  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

  const prompt = useMemo(() => {
    return `Create a sermon outline with the following parameters: ${outlineType} Outline using verses ${verse} in the preaching tone of ${preacher}. Structure it with: Introduction, 3-5 Main Points (with subpoints and scripture references), Application, and Conclusion. Use clear headings and bullet points.`;
  }, [outlineType, verse, preacher]);

  const handleBack = () => router.back();

  const handleGenerate = async () => {
    setError(null);
    if (!apiKey) {
      setError('Missing OpenAI API key. Please set EXPO_PUBLIC_OPENAI_API_KEY.');
      Alert.alert('Configuration Error', 'Missing OpenAI API key.');
      return;
    }
    if (!verse.trim() || !preacher.trim()) {
      Alert.alert('Incomplete Form', 'Please enter both Bible verse and Preacher inspiration.');
      return;
    }

    setIsGenerating(true);
    setResult('');
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are SermonSpark, an assistant that crafts pastor-friendly sermon outlines with biblical fidelity and practical application.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const content: string = data?.choices?.[0]?.message?.content || '';
      if (!content) throw new Error('No content returned from model');
      setResult(content.trim());
    } catch (e: any) {
      const message = e?.message || 'Failed to generate outline';
      setError(message);
      Alert.alert('Generation Failed', Platform.OS === 'web' ? message : 'Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await Clipboard.setStringAsync(result);
      if (Platform.OS === 'web') {
        alert('Outline copied to clipboard');
      } else {
        Alert.alert('Copied', 'Outline copied to clipboard');
      }
    } catch {
      Alert.alert('Copy Failed', 'Unable to copy to clipboard.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Outline Generator</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tool description */}
        <Card style={styles.descriptionCard}>
          <View style={styles.toolHeader}>
            <View style={styles.toolIcon}>
              <Ionicons name="list" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>AI-Powered Outline Builder</Text>
              <Text style={styles.toolDescription}>
                Generate clear, structured sermon outlines tailored to your passage and preaching voice.
              </Text>
            </View>
          </View>
        </Card>

        {/* Form */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Parameters</Text>
          <Text style={styles.sectionDescription}>Choose your outline type and inputs.</Text>

          {/* Outline Type */}
          <Text style={styles.label}>Outline Type</Text>
          <Pressable style={styles.dropdownButton} onPress={() => setShowTypePicker(true)}>
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownText}>{outlineType}</Text>
              <Ionicons name="chevron-down" size={18} color={theme.colors.gray600} />
            </View>
          </Pressable>

          {/* Bible Verse */}
          <Text style={[styles.label, { marginTop: theme.spacing.md }]}>Bible Verse</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={verse}
              onChangeText={setVerse}
              placeholder="e.g., John 3:16-17"
              placeholderTextColor={theme.colors.gray500}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          {/* Preacher Inspiration */}
          <Text style={[styles.label, { marginTop: theme.spacing.md }]}>Preacher Inspiration</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={preacher}
              onChangeText={setPreacher}
              placeholder="e.g., Andy Stanley"
              placeholderTextColor={theme.colors.gray500}
              style={styles.input}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
        </Card>

        {/* Generate */}
        <Card style={styles.generateCard}>
          <Button
            title={isGenerating ? 'Generating Outline...' : 'Generate Outline'}
            onPress={handleGenerate}
            variant="primary"
            disabled={isGenerating}
            icon={isGenerating ? <LoadingIndicator size="small" /> : 'sparkles'}
          />
          {!!error && (
            <Text style={styles.errorText} numberOfLines={2}>
              {error}
            </Text>
          )}
        </Card>

        {/* Result */}
        {!!result && (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>Generated Outline</Text>
              <Button title="Copy" onPress={handleCopy} variant="outline" size="sm" icon="copy" />
            </View>
            <RichHtml html={toHtml(result)} />
          </Card>
        )}
      </ScrollView>

      {/* Outline Type Picker */}
      <Modal visible={showTypePicker} transparent animationType="fade" onRequestClose={() => setShowTypePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Outline Type</Text>
              <Pressable style={styles.modalCloseButton} onPress={() => setShowTypePicker(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 260 }}>
              {OUTLINE_TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.optionItem, outlineType === t && styles.optionItemSelected]}
                  onPress={() => {
                    setOutlineType(t);
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={styles.optionText}>{t}</Text>
                  {outlineType === t && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  headerRight: { width: 40 },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  descriptionCard: { marginBottom: theme.spacing.md },
  toolHeader: { flexDirection: 'row', gap: theme.spacing.md },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolInfo: { flex: 1 },
  toolTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  toolDescription: { ...theme.typography.body2, color: theme.colors.textSecondary, lineHeight: 20 },

  formCard: { marginBottom: theme.spacing.md },
  sectionTitle: { ...theme.typography.h6, color: theme.colors.textPrimary, fontWeight: '600', marginBottom: theme.spacing.xs },
  sectionDescription: { ...theme.typography.body2, color: theme.colors.textSecondary, marginBottom: theme.spacing.md, lineHeight: 20 },
  label: { ...theme.typography.body2, color: theme.colors.textSecondary, marginBottom: 6 },
  dropdownButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  dropdownText: { ...theme.typography.body1, color: theme.colors.textPrimary, fontWeight: '500' },

  inputWrapper: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  input: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.select({ web: 12, default: theme.spacing.sm }) as number,
  },

  generateCard: { marginBottom: theme.spacing.md },
  errorText: { ...theme.typography.caption, color: theme.colors.error, textAlign: 'center', marginTop: theme.spacing.sm },

  resultCard: { marginBottom: theme.spacing.xxl },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  modalTitle: { ...theme.typography.h5, color: theme.colors.textPrimary, fontWeight: '600' },
  modalCloseButton: { padding: theme.spacing.xs },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  optionItemSelected: { backgroundColor: theme.colors.primary + '10' },
  optionText: { ...theme.typography.body1, color: theme.colors.textPrimary, fontWeight: '500' },
});
