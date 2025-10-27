import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/Theme';
import { Card } from './Card';
import { Button } from './Button';
import { LoadingIndicator } from './LoadingIndicator';
import { OfflineStatusIndicator } from './OfflineStatusIndicator';
import { useMultipleFeatureGates, useFeatureAccessSummary } from '../../hooks/useFeatureGate';
import { FeatureType } from '../../services/featureGate';
import { isAuthenticatedOnline } from '../../services/authSession';
import { router } from 'expo-router';

interface FeatureAccessDashboardProps {
  style?: any;
  onConnect?: () => void;
  showHeader?: boolean;
  compact?: boolean;
}

const FEATURE_INFO: Record<FeatureType, {
  title: string;
  description: string;
  icon: string;
  category: 'core' | 'online' | 'premium';
}> = {
  sermons: {
    title: 'Sermon Management',
    description: 'Create and edit sermons offline',
    icon: 'document-text',
    category: 'core'
  },
  series: {
    title: 'Series Organization',
    description: 'Organize sermons into series',
    icon: 'library',
    category: 'core'
  },
  sync: {
    title: 'Device Sync',
    description: 'Sync across all your devices',
    icon: 'sync',
    category: 'premium'
  },
  community: {
    title: 'Community',
    description: 'Share and discuss with others',
    icon: 'people',
    category: 'premium'
  },
  research: {
    title: 'AI Research',
    description: 'AI-powered sermon tools',
    icon: 'bulb',
    category: 'premium'
  }
};

export const FeatureAccessDashboard: React.FC<FeatureAccessDashboardProps> = ({
  style,
  onConnect,
  showHeader = true,
  compact = false
}) => {
  const features: FeatureType[] = ['sermons', 'series', 'sync', 'community', 'research'];
  const { accessMap, isLoading: accessLoading } = useMultipleFeatureGates(features);
  const { summary, isLoading: summaryLoading } = useFeatureAccessSummary();
  
  const [isOnline, setIsOnline] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      // Check network status
      const online = Platform.OS === 'web' ? navigator.onLine : true;
      setIsOnline(online);

      // Check authentication
      try {
        const authenticated = await isAuthenticatedOnline();
        setIsAuthenticated(authenticated);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkStatus();

    // Set up network monitoring for web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const handleConnect = () => {
    if (onConnect) {
      onConnect();
    } else {
      onConnect();
    }
  };

  const getFeatureStatus = (feature: FeatureType): {
    available: boolean;
    reason?: string;
    color: string;
    icon: string;
  } => {
    const hasAccess = accessMap[feature];
    const info = FEATURE_INFO[feature];

    if (hasAccess) {
      return {
        available: true,
        color: theme.colors.success,
        icon: 'checkmark-circle'
      };
    }

    if (info.category === 'core') {
      return {
        available: true,
        color: theme.colors.success,
        icon: 'checkmark-circle'
      };
    }

    if (!isOnline && (feature === 'community' || feature === 'research')) {
      return {
        available: false,
        reason: 'Requires internet connection',
        color: '#9E9E9E',
        icon: 'cloud-offline'
      };
    }

    if (!isAuthenticated) {
      return {
        available: false,
        reason: 'Requires account connection',
        color: theme.colors.premium,
        icon: 'lock-closed'
      };
    }

    return {
      available: false,
      reason: 'Unavailable',
      color: '#F44336',
      icon: 'close-circle'
    };
  };

  const renderFeatureItem = (feature: FeatureType) => {
    const info = FEATURE_INFO[feature];
    const status = getFeatureStatus(feature);

    if (compact) {
      return (
        <View key={feature} style={styles.compactFeatureItem}>
          <Ionicons 
            name={info.icon as any} 
            size={16} 
            color={theme.colors.textSecondary} 
          />
          <Text style={styles.compactFeatureTitle}>{info.title}</Text>
          <Ionicons 
            name={status.icon as any} 
            size={14} 
            color={status.color} 
          />
        </View>
      );
    }

    return (
      <View key={feature} style={styles.featureItem}>
        <View style={styles.featureIcon}>
          <Ionicons 
            name={info.icon as any} 
            size={24} 
            color={status.available ? theme.colors.textPrimary : theme.colors.textSecondary} 
          />
        </View>
        
        <View style={styles.featureContent}>
          <Text style={[
            styles.featureTitle,
            !status.available && styles.featureTitleDisabled
          ]}>
            {info.title}
          </Text>
          <Text style={styles.featureDescription}>
            {status.reason || info.description}
          </Text>
        </View>
        
        <View style={styles.featureStatus}>
          <Ionicons 
            name={status.icon as any} 
            size={20} 
            color={status.color} 
          />
        </View>
      </View>
    );
  };

  if (accessLoading || summaryLoading) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" />
          <Text style={styles.loadingText}>Loading feature access...</Text>
        </View>
      </Card>
    );
  }

  const coreFeatures = features.filter(f => FEATURE_INFO[f].category === 'core');
  const premiumFeatures = features.filter(f => FEATURE_INFO[f].category === 'premium');
  const availableCount = features.filter(f => getFeatureStatus(f).available).length;

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>
            {availableCount}/{features.length} features available
          </Text>
          <OfflineStatusIndicator showDetails={false} />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.compactFeaturesList}
        >
          {features.map(renderFeatureItem)}
        </ScrollView>
        
        {!isAuthenticated && (
          <TouchableOpacity style={styles.compactConnectButton} onPress={handleConnect}>
            <Text style={styles.compactConnectText}>Connect for more features</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <Card style={[styles.container, style]}>
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Feature Access</Text>
            <Text style={styles.subtitle}>
              {availableCount} of {features.length} features available
            </Text>
          </View>
          <OfflineStatusIndicator showDetails={true} />
        </View>
      )}

      <ScrollView style={styles.featuresList} showsVerticalScrollIndicator={false}>
        {/* Core Features */}
        <View style={styles.categorySection}>
          <Text style={styles.categoryTitle}>Core Features</Text>
          <Text style={styles.categoryDescription}>
            Available offline without an account
          </Text>
          {coreFeatures.map(renderFeatureItem)}
        </View>

        {/* Premium Features */}
        <View style={styles.categorySection}>
          <Text style={styles.categoryTitle}>Premium Features</Text>
          <Text style={styles.categoryDescription}>
            Require account connection
          </Text>
          {premiumFeatures.map(renderFeatureItem)}
        </View>
      </ScrollView>

      {/* Action Section */}
      {!isAuthenticated && (
        <View style={styles.actionSection}>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Get More Features</Text>
            <Text style={styles.actionDescription}>
              Connect your account to access sync, community, and AI research tools.
            </Text>
          </View>
          <Button
            title="Connect Account"
            onPress={handleConnect}
            variant="premium"
            icon="log-in"
            style={styles.connectButton}
          />
        </View>
      )}

      {isAuthenticated && (
        <View style={styles.statusSection}>
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={theme.colors.success} 
          />
          <Text style={styles.statusText}>
            All features are available with your connected account
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '600' as any,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Features list styles
  featuresList: {
    maxHeight: 400,
  },
  categorySection: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  categoryDescription: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E050',
  },
  featureIcon: {
    width: 40,
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  featureTitleDisabled: {
    color: theme.colors.textSecondary,
  },
  featureDescription: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  featureStatus: {
    marginLeft: theme.spacing.sm,
  },

  // Action section styles
  actionSection: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: theme.colors.premium + '05',
  },
  actionContent: {
    marginBottom: theme.spacing.md,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  actionDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  connectButton: {
    width: '100%',
  },

  // Status section styles
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: theme.colors.success + '05',
    gap: theme.spacing.sm,
  },
  statusText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    flex: 1,
  },

  // Compact variant styles
  compactContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: theme.spacing.md,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  compactFeaturesList: {
    marginBottom: theme.spacing.sm,
  },
  compactFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 6,
    marginRight: theme.spacing.xs,
    gap: 4,
  },
  compactFeatureTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginRight: 4,
  },
  compactConnectButton: {
    backgroundColor: theme.colors.premium + '10',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
  },
  compactConnectText: {
    fontSize: 12,
    color: theme.colors.premium,
    fontWeight: '500',
  },
});

export default FeatureAccessDashboard;