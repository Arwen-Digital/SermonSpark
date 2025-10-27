import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/Theme';
import { Button } from './Button';
import { Card } from './Card';
import { LoadingIndicator } from './LoadingIndicator';
import { UpgradePrompt } from './UpgradePrompt';
import { AuthenticationPrompt } from './AuthenticationPrompt';
import { GracefulDegradation } from './GracefulDegradation';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { FeatureType } from '../../services/featureGate';
import { isAuthenticatedOnline } from '../../services/authSession';
import { router } from 'expo-router';

interface FeatureGateWrapperProps {
  feature: FeatureType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  onConnect?: () => void;
  degradationVariant?: 'minimal' | 'informative' | 'detailed';
  promptVariant?: 'inline' | 'card' | 'banner';
  showOfflineSupport?: boolean;
  enableGracefulDegradation?: boolean;
}

const FEATURE_DISPLAY_NAMES: Record<FeatureType, string> = {
  community: 'Community',
  research: 'AI Research Tools',
  sync: 'Device Sync',
  sermons: 'Sermons',
  series: 'Series',
};

/**
 * Wrapper component that handles feature gating automatically with offline-first support
 */
export const FeatureGateWrapper: React.FC<FeatureGateWrapperProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  onConnect,
  degradationVariant = 'informative',
  promptVariant = 'card',
  showOfflineSupport = true,
  enableGracefulDegradation = true,
}) => {
  const {
    canAccess,
    isLoading,
    upgradePromptVisible,
    upgradePrompt,
    showUpgradePrompt: showPrompt,
    hideUpgradePrompt,
  } = useFeatureGate(feature);

  const [isOnline, setIsOnline] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkNetworkAndAuth = async () => {
      // Check network status
      const online = Platform.OS === 'web' ? navigator.onLine : true;
      setIsOnline(online);

      // Check authentication status
      try {
        const authenticated = await isAuthenticatedOnline();
        setIsAuthenticated(authenticated);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkNetworkAndAuth();

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
      // Default navigation to auth screen
      onConnect();
    }
    hideUpgradePrompt();
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator size="large" />
        <Text style={styles.loadingText}>Checking access...</Text>
      </View>
    );
  }

  // Show children if access is granted
  if (canAccess) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Determine the reason for access denial
  const getDenialReason = (): 'offline' | 'auth_required' | 'unavailable' => {
    if (!isOnline && (feature === 'community' || feature === 'research')) {
      return 'offline';
    }
    if (!isAuthenticated && (feature === 'community' || feature === 'research' || feature === 'sync')) {
      return 'auth_required';
    }
    return 'unavailable';
  };

  const denialReason = getDenialReason();

  // Show graceful degradation for offline scenarios
  if (enableGracefulDegradation && denialReason === 'offline' && showOfflineSupport) {
    return (
      <GracefulDegradation
        feature={feature}
        reason="offline"
        variant={degradationVariant}
        onAction={() => {
          // Retry connection or show network settings
          if (Platform.OS === 'web') {
            window.location.reload();
          }
        }}
        actionText="Retry Connection"
      />
    );
  }

  // Show authentication prompt for auth-required features
  if (denialReason === 'auth_required') {
    return (
      <View style={styles.container}>
        <AuthenticationPrompt
          feature={feature}
          variant={promptVariant}
          onConnect={handleConnect}
          showBenefits={promptVariant === 'card'}
        />

        {/* Upgrade prompt modal */}
        {showUpgradePrompt && upgradePrompt && (
          <UpgradePrompt
            visible={upgradePromptVisible}
            onClose={hideUpgradePrompt}
            onConnect={handleConnect}
            prompt={upgradePrompt}
          />
        )}
      </View>
    );
  }

  // Show graceful degradation for unavailable features
  if (enableGracefulDegradation) {
    return (
      <GracefulDegradation
        feature={feature}
        reason="unavailable"
        variant={degradationVariant}
        onAction={() => {
          // Retry feature access
          window.location.reload();
        }}
        actionText="Try Again"
      />
    );
  }

  // Fallback to original upgrade prompt
  return (
    <View style={styles.container}>
      <Card style={styles.upgradeCard}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name="lock-closed" 
            size={48} 
            color={theme.colors.premium} 
          />
        </View>
        
        <Text style={styles.title}>
          {FEATURE_DISPLAY_NAMES[feature]} Requires Account
        </Text>
        
        <Text style={styles.message}>
          Connect your account to access {FEATURE_DISPLAY_NAMES[feature].toLowerCase()} and sync your data across devices.
        </Text>

        <View style={styles.actions}>
          <Button
            title="Connect Account"
            onPress={showUpgradePrompt ? showPrompt : handleConnect}
            variant="premium"
            icon="log-in"
            style={styles.connectButton}
          />
        </View>
      </Card>

      {/* Upgrade prompt modal */}
      {showUpgradePrompt && upgradePrompt && (
        <UpgradePrompt
          visible={upgradePromptVisible}
          onClose={hideUpgradePrompt}
          onConnect={handleConnect}
          prompt={upgradePrompt}
        />
      )}
    </View>
  );
};

/**
 * Higher-order component for feature gating with offline-first support
 */
export function withFeatureGate<P extends object>(
  Component: React.ComponentType<P>,
  feature: FeatureType,
  options?: {
    fallback?: React.ReactNode;
    showUpgradePrompt?: boolean;
    onConnect?: () => void;
    degradationVariant?: 'minimal' | 'informative' | 'detailed';
    promptVariant?: 'inline' | 'card' | 'banner';
    showOfflineSupport?: boolean;
    enableGracefulDegradation?: boolean;
  }
) {
  return function FeatureGatedComponent(props: P) {
    return (
      <FeatureGateWrapper
        feature={feature}
        fallback={options?.fallback}
        showUpgradePrompt={options?.showUpgradePrompt}
        onConnect={options?.onConnect}
        degradationVariant={options?.degradationVariant}
        promptVariant={options?.promptVariant}
        showOfflineSupport={options?.showOfflineSupport}
        enableGracefulDegradation={options?.enableGracefulDegradation}
      >
        <Component {...props} />
      </FeatureGateWrapper>
    );
  };
}

/**
 * Component for inline feature access checks
 */
interface FeatureAccessIndicatorProps {
  feature: FeatureType;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const FeatureAccessIndicator: React.FC<FeatureAccessIndicatorProps> = ({
  feature,
  size = 'medium',
  showText = true,
}) => {
  const { canAccess, isLoading } = useFeatureGate(feature);

  if (isLoading) {
    return (
      <View style={[styles.indicator, styles[`indicator_${size}`]]}>
        <LoadingIndicator size="small" />
      </View>
    );
  }

  const iconSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  const iconName = canAccess ? 'checkmark-circle' : 'lock-closed';
  const iconColor = canAccess ? theme.colors.success : theme.colors.premium;

  return (
    <View style={[styles.indicator, styles[`indicator_${size}`]]}>
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
      {showText && (
        <Text style={[styles.indicatorText, styles[`indicatorText_${size}`]]}>
          {canAccess ? 'Available' : 'Premium'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  upgradeCard: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.premium + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight as any,
    lineHeight: theme.typography.h4.lineHeight,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  message: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  actions: {
    width: '100%',
  },
  connectButton: {
    width: '100%',
  },
  
  // Indicator styles
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  indicator_small: {
    gap: 2,
  },
  indicator_medium: {
    gap: theme.spacing.xs,
  },
  indicator_large: {
    gap: theme.spacing.sm,
  },
  indicatorText: {
    fontWeight: '500' as any,
  },
  indicatorText_small: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.caption.fontWeight as any,
    lineHeight: theme.typography.caption.lineHeight,
    color: theme.colors.textTertiary,
  },
  indicatorText_medium: {
    fontSize: theme.typography.body2.fontSize,
    fontWeight: theme.typography.body2.fontWeight as any,
    lineHeight: theme.typography.body2.lineHeight,
    color: theme.colors.textSecondary,
  },
  indicatorText_large: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: theme.typography.body1.fontWeight as any,
    lineHeight: theme.typography.body1.lineHeight,
    color: theme.colors.textSecondary,
  },
});