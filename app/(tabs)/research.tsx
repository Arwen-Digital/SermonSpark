import { ConnectAccountModal } from '@/components/auth/ConnectAccountModal';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { FadeInView } from '@/components/common/FadeInView';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { UpgradePrompt } from '@/components/common/UpgradePrompt';
import { theme } from '@/constants/Theme';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { ResearchTool } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Mock research tools data
const mockResearchTools: ResearchTool[] = [
  {
    id: '1',
    name: 'Sermon Title Generator',
    description: 'Sermon title suggestions based on scripture or topic',
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
  },{
    id: '9',
    name: 'Social Media Post Ideas',
    description: 'Generate engaging social media content for your sermons',
    icon: 'share-social',
    isPremium: true,
    category: 'social',
  },
  {
    id: '10',
    name: 'Blog Post Ideas',
    description: 'Generate compelling blog post content from your sermons',
    icon: 'document-text',
    isPremium: true,
    category: 'social',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Tools', icon: 'grid' },
  { key: 'outline', label: 'Outline & Structure', icon: 'list' },
  { key: 'context', label: 'Context & Background', icon: 'library' },
  { key: 'illustration', label: 'Illustrations', icon: 'images' },
  { key: 'language', label: 'Original Languages', icon: 'language' },
  { key: 'topic', label: 'Topics & Themes', icon: 'compass' },
  { key: 'social', label: 'Social Media', icon: 'list' },
  { key: 'history', label: 'Church History', icon: 'time' },
];

export default function ResearchScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [connectModalVisible, setConnectModalVisible] = useState(false);
  
  // Feature gating for research access
  const {
    canAccess,
    isLoading: featureLoading,
    upgradePromptVisible,
    upgradePrompt,
    showUpgradePrompt,
    hideUpgradePrompt,
    handleFeatureRequest,
    checkAccess,
  } = useFeatureGate('research');

  const filteredTools = selectedCategory === 'all' 
    ? mockResearchTools 
    : mockResearchTools.filter(tool => tool.category === selectedCategory);

  const handleToolPress = async (tool: ResearchTool) => {
    // Check feature access first
    const accessResult = await handleFeatureRequest();
    if (accessResult !== 'granted') {
      return;
    }
    
    // Navigate to specific tool pages based on tool name/ID
    switch (tool.name) {
      case 'Sermon Title Generator':
        router.push('/research/sermon-title-generator');
        break;
      case 'Outline Generator':
        router.push('/research/outline-generator');
        break;
      case 'Illustration Finder':
        router.push('/research/illustration-finder');
        break;
      case 'Historical Context':
        router.push('/research/historical-context');
        break;
      case 'Original Language Study':
        router.push('/research/original-language-study');
        break;
      case 'Discussion Questions':
        router.push('/research/discussion-questions');
        break;
      case 'Topic Explorer':
        router.push('/research/topic-explorer');
        break;
      case 'Social Media Post Ideas':
        router.push('/research/social-media-post-ideas');
        break;
      case 'Blog Post Ideas':
        router.push('/research/blog-post-ideas');
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

  // Show loading while checking feature access
  if (featureLoading) {
    return (
      <FadeInView style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
        <View style={styles.loadingScreen}>
          <LoadingIndicator size="large" color={theme.colors.primary} />
        </View>
      </FadeInView>
    );
  }

  // Show upgrade prompt if user doesn't have access to research features
  if (!canAccess) {
    return (
      <FadeInView style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
        <View style={styles.upgradeContainer}>
          <Ionicons name="search-outline" size={80} color={theme.colors.gray400} />
          <Text style={styles.upgradeTitle}>Unlock AI Research Tools</Text>
          <Text style={styles.upgradeSubtitle}>
            Enhance your sermon preparation with powerful AI-powered research and study tools.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>AI-powered sermon title generation</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>Intelligent outline suggestions</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>Historical context and background</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>Original language word studies</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>Illustration and story finder</Text>
            </View>
          </View>
          <Button
            title="Connect Account"
            onPress={() => setConnectModalVisible(true)}
            variant="primary"
            style={styles.upgradeButton}
            icon={<Ionicons name="person-add" size={16} color={theme.colors.white} />}
          />
          <Text style={styles.upgradeNote}>
            Your local sermons and series will remain private and accessible offline.
          </Text>
        </View>
        
        {/* Connect Account Modal */}
        <ConnectAccountModal
          visible={connectModalVisible}
          onClose={() => setConnectModalVisible(false)}
          onAuthenticated={() => {
            setConnectModalVisible(false);
            checkAccess(); // Refresh access status
          }}
        />
        
        {/* Upgrade prompt modal */}
        {upgradePrompt && (
          <UpgradePrompt
            visible={upgradePromptVisible}
            onClose={hideUpgradePrompt}
            prompt={upgradePrompt}
            onConnect={() => {
              hideUpgradePrompt();
              setConnectModalVisible(true);
            }}
          />
        )}
      </FadeInView>
    );
  }

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
        
        {/* Upgrade prompt modal */}
        {upgradePrompt && (
          <UpgradePrompt
            visible={upgradePromptVisible}
            onClose={hideUpgradePrompt}
            prompt={upgradePrompt}
            onConnect={() => {
              hideUpgradePrompt();
              setConnectModalVisible(true);
            }}
          />
        )}
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
  loadingScreen: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  upgradeTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  upgradeSubtitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  featureText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  upgradeButton: {
    alignSelf: 'stretch',
    marginBottom: theme.spacing.lg,
  },
  upgradeNote: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});