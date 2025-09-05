import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient'; // Removed for now
import { theme } from '@/constants/Theme';
import { Card } from '@/components/common/Card';

interface DailyScriptureCardProps {
  verse: string;
  reference: string;
  theme: string;
  onShare?: () => void;
  onSave?: () => void;
}

export const DailyScriptureCard: React.FC<DailyScriptureCardProps> = ({
  verse,
  reference,
  theme: verseTheme,
  onShare,
  onSave
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.();
  };

  const shouldTruncate = verse.length > 120;
  const displayVerse = shouldTruncate && !isExpanded ? verse.substring(0, 120) + '...' : verse;

  return (
    <Card style={styles.container}>
      <View 
        style={[
          styles.gradient,
          { backgroundColor: '#667eea' }
        ]}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <View style={styles.scriptureIcon}>
                <Ionicons name="book" size={16} color={theme.colors.white} />
              </View>
              <Text style={styles.label}>Daily Scripture</Text>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.actionButton} onPress={handleSave}>
                <Ionicons 
                  name={isSaved ? "bookmark" : "bookmark-outline"} 
                  size={18} 
                  color={theme.colors.white} 
                />
              </Pressable>
              <Pressable style={styles.actionButton} onPress={onShare}>
                <Ionicons name="share-outline" size={18} color={theme.colors.white} />
              </Pressable>
            </View>
          </View>

          <View style={styles.themeContainer}>
            <Text style={styles.themeText}>{verseTheme}</Text>
          </View>

          <Pressable 
            onPress={() => shouldTruncate && setIsExpanded(!isExpanded)}
            disabled={!shouldTruncate}
          >
            <Text style={styles.verse}>
              "{displayVerse}"
            </Text>
          </Pressable>

          {shouldTruncate && (
            <Pressable 
              style={styles.expandButton}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Text style={styles.expandText}>
                {isExpanded ? 'Show less' : 'Read more'}
              </Text>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="rgba(255, 255, 255, 0.8)" 
              />
            </Pressable>
          )}

          <Text style={styles.reference}>— {reference}</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  gradient: {
    padding: theme.spacing.lg,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  scriptureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  themeContainer: {
    marginBottom: theme.spacing.md,
  },
  themeText: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  verse: {
    ...theme.typography.body1,
    color: theme.colors.white,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  expandText: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  reference: {
    ...theme.typography.body2,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'right',
  },
});