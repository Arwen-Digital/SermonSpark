import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Text, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { FadeInView } from '@/components/common/FadeInView';
import { theme } from '@/constants/Theme';
import { ResearchTool } from '@/types';

// Mock research tools data
const mockResearchTools: ResearchTool[] = [
  {
    id: '1',
    name: 'Sermon Title Generator',
    description: 'AI-powered sermon title suggestions based on scripture or topic',
    icon: 'bulb',
    isPremium: true,
    category: 'outline',
  },
  {
    id: '2',
    name: 'Outline Generator',
    description: 'Create structured sermon outlines with AI assistance',
    icon: 'list',
    isPremium: true,
    category: 'outline',
  },
  {
    id: '3',
    name: 'Bible Finder',
    description: 'Advanced scripture search across multiple translations',
    icon: 'book',
    isPremium: false,
    category: 'context',
  },
  {
    id: '4',
    name: 'Illustration Finder',
    description: 'Discover compelling stories and examples for your sermons',
    icon: 'images',
    isPremium: true,
    category: 'illustration',
  },
  {
    id: '5',
    name: 'Historical Context',
    description: 'Explore the historical and cultural background of Bible passages',
    icon: 'library',
    isPremium: true,
    category: 'context',
  },
  {
    id: '6',
    name: 'Original Language Study',
    description: 'Greek and Hebrew word studies with etymology',
    icon: 'language',
    isPremium: true,
    category: 'language',
  },
  {
    id: '7',
    name: 'Discussion Questions',
    description: 'Generate thought-provoking questions for small groups',
    icon: 'help-circle',
    isPremium: true,
    category: 'outline',
  },
  {
    id: '8',
    name: 'Topic Explorer',
    description: 'Systematic theology topics and cross-references',
    icon: 'compass',
    isPremium: true,
    category: 'topic',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Tools', icon: 'grid' },
  { key: 'outline', label: 'Outline & Structure', icon: 'list' },
  { key: 'context', label: 'Context & Background', icon: 'library' },
  { key: 'illustration', label: 'Illustrations', icon: 'images' },
  { key: 'language', label: 'Original Languages', icon: 'language' },
  { key: 'topic', label: 'Topics & Themes', icon: 'compass' },
  { key: 'history', label: 'Church History', icon: 'time' },
];

export default function ResearchScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isPremiumUser] = useState(true); // Mock premium status - now premium user

  const filteredTools = selectedCategory === 'all' 
    ? mockResearchTools 
    : mockResearchTools.filter(tool => tool.category === selectedCategory);

  const handleToolPress = (tool: ResearchTool) => {
    if (tool.isPremium && !isPremiumUser) {
      console.log('Show premium upgrade modal');
      return;
    }
    
    // Navigate to specific tool pages based on tool name/ID
    switch (tool.name) {
      case 'Sermon Title Generator':
        router.push('/research/sermon-title-generator');
        break;
      default:
        console.log('Opening research tool:', tool.name);
        // For other tools, implement their specific navigation
        break;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleSection}>
        <Text style={styles.headerTitle}>Research Tools</Text>
        <Text style={styles.headerSubtitle}>
          Enhance your sermon preparation with AI-powered research
        </Text>
      </View>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categories}>
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.key}
              style={[
                styles.categoryChip,
                selectedCategory === category.key && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={
                  selectedCategory === category.key
                    ? theme.colors.white
                    : theme.colors.gray600
                }
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.key && styles.categoryTextActive,
                ]}
              >
                {category.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderTool = ({ item }: { item: ResearchTool }) => (
    <Card
      style={styles.toolCard}
      onPress={() => handleToolPress(item)}
      variant="elevated"
    >
      <View style={styles.toolCardContent}>
        <View style={styles.toolIconContainer}>
          <Ionicons
            name={item.icon as any}
            size={24}
            color={theme.colors.primary}
          />
          {item.isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={12} color={theme.colors.premium} />
            </View>
          )}
        </View>
        
        <View style={styles.toolInfo}>
          <Text style={styles.toolName}>{item.name}</Text>
          <Text style={styles.toolDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        <View style={styles.toolActions}>
          <Pressable
            style={styles.toolActionButton}
            onPress={() => handleToolPress(item)}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.colors.gray600} />
          </Pressable>
        </View>
      </View>
      
      {item.isPremium && (
        <View style={styles.lockedOverlay}>
          <Ionicons name="lock-closed" size={16} color={theme.colors.gray500} />
          <Text style={styles.lockedText}>Premium</Text>
        </View>
      )}
    </Card>
  );


  const topPadding = Math.max(insets.top || 0, theme.spacing.md);
  const bottomPadding = Math.max(insets.bottom || 0, theme.spacing.md);

  return (
    <FadeInView style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderHeader()}
          {renderCategories()}
          
          <View style={styles.toolsSection}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'All Research Tools' : CATEGORIES.find(c => c.key === selectedCategory)?.label}
            </Text>
            <FlatList
              data={filteredTools}
              keyExtractor={(item) => item.id}
              renderItem={renderTool}
              scrollEnabled={false}
              contentContainerStyle={styles.toolsList}
              ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
            />
          </View>
        </ScrollView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  titleSection: {
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  categoriesContainer: {
    marginBottom: theme.spacing.lg,
  },
  categories: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: theme.colors.white,
  },
  promoCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  promoTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  promoDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  promoFeatures: {
    gap: theme.spacing.sm,
  },
  promoFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  promoFeatureText: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  sectionTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  toolsSection: {
    marginBottom: theme.spacing.xxl,
  },
  toolsList: {
    gap: theme.spacing.sm,
  },
  toolCard: {
    marginHorizontal: 0,
  },
  toolCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  toolIconContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.premium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    ...theme.typography.overline,
    color: theme.colors.black,
    fontSize: 9,
    fontWeight: '700',
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  toolDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  toolActions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolActionButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  lockedOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  lockedText: {
    ...theme.typography.body2,
    color: theme.colors.gray500,
    fontWeight: '500',
  },
});