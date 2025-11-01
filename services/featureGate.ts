import { isAuthenticatedOnline, isAuthenticatedOffline } from './authSession';

// Feature types as defined in the design document
export type FeatureType = 'sermons' | 'series' | 'community' | 'research' | 'sync';

// Authentication status types
export type AuthStatus = 'offline' | 'online' | 'required';

// Access result types
export type AccessResult = 'granted' | 'denied' | 'auth_required';

// Feature access levels
export type AccessLevel = 'free' | 'premium';

// Feature configuration interface
interface FeatureConfig {
  requiresAuth: boolean;
  accessLevel: AccessLevel;
  description: string;
  upgradeMessage?: string;
}

// Feature configurations based on requirements
const FEATURE_CONFIGS: Record<FeatureType, FeatureConfig> = {
  sermons: {
    requiresAuth: false,
    accessLevel: 'free',
    description: 'Create and manage your sermons offline',
  },
  series: {
    requiresAuth: false,
    accessLevel: 'free', 
    description: 'Organize sermons into series offline',
  },
  community: {
    requiresAuth: true,
    accessLevel: 'premium',
    description: 'Share and discuss with other preachers',
    upgradeMessage: 'Connect your account to join the community and share your sermons with other preachers.',
  },
  research: {
    requiresAuth: false,
    accessLevel: 'free',
    description: 'AI-powered sermon research and title generation',
  },
  sync: {
    requiresAuth: true,
    accessLevel: 'premium',
    description: 'Sync your content across devices',
    upgradeMessage: 'Connect your account to sync your sermons and series across all your devices.',
  },
};

// Upgrade prompt interface
export interface UpgradePrompt {
  title: string;
  message: string;
  actionText: string;
  feature: FeatureType;
}

/**
 * Feature Gate Service
 * Determines access to features based on authentication status and feature requirements
 */
class FeatureGateService {
  /**
   * Check if a user can access a specific feature
   */
  async canAccess(feature: FeatureType): Promise<boolean> {
    const config = FEATURE_CONFIGS[feature];
    
    // Free features that don't require auth are always accessible
    if (!config.requiresAuth) {
      return true;
    }
    
    // Premium features require online authentication
    if (config.requiresAuth) {
      return await isAuthenticatedOnline();
    }
    
    return false;
  }

  /**
   * Get the authentication status for feature access decisions
   */
  async getAuthenticationStatus(): Promise<AuthStatus> {
    const isOnline = await isAuthenticatedOnline();
    if (isOnline) return 'online';
    
    const isOffline = await isAuthenticatedOffline();
    if (isOffline) return 'offline';
    
    return 'required';
  }

  /**
   * Check if a feature requires authentication
   */
  isRequiredForFeature(feature: FeatureType): boolean {
    return FEATURE_CONFIGS[feature].requiresAuth;
  }

  /**
   * Get feature configuration
   */
  getFeatureConfig(feature: FeatureType): FeatureConfig {
    return FEATURE_CONFIGS[feature];
  }

  /**
   * Get upgrade prompt for a premium feature
   */
  getUpgradePrompt(feature: FeatureType): UpgradePrompt {
    const config = FEATURE_CONFIGS[feature];
    
    return {
      title: `Connect Account Required`,
      message: config.upgradeMessage || `This feature requires an account connection.`,
      actionText: 'Connect Account',
      feature,
    };
  }

  /**
   * Handle feature access request and return appropriate result
   */
  async handleFeatureRequest(feature: FeatureType): Promise<AccessResult> {
    const canAccess = await this.canAccess(feature);
    
    if (canAccess) {
      return 'granted';
    }
    
    const config = FEATURE_CONFIGS[feature];
    if (config.requiresAuth) {
      return 'auth_required';
    }
    
    return 'denied';
  }

  /**
   * Get all features that are currently accessible
   */
  async getAccessibleFeatures(): Promise<FeatureType[]> {
    const features: FeatureType[] = ['sermons', 'series', 'community', 'research', 'sync'];
    const accessible: FeatureType[] = [];
    
    for (const feature of features) {
      if (await this.canAccess(feature)) {
        accessible.push(feature);
      }
    }
    
    return accessible;
  }

  /**
   * Get all features that require authentication
   */
  getAuthRequiredFeatures(): FeatureType[] {
    return Object.entries(FEATURE_CONFIGS)
      .filter(([_, config]) => config.requiresAuth)
      .map(([feature, _]) => feature as FeatureType);
  }

  /**
   * Get all free features (accessible without authentication)
   */
  getFreeFeatures(): FeatureType[] {
    return Object.entries(FEATURE_CONFIGS)
      .filter(([_, config]) => !config.requiresAuth)
      .map(([feature, _]) => feature as FeatureType);
  }

  /**
   * Check if user has access to any premium features
   */
  async hasPremiumAccess(): Promise<boolean> {
    return await isAuthenticatedOnline();
  }

  /**
   * Get feature access summary for UI display
   */
  async getFeatureAccessSummary(): Promise<{
    accessible: FeatureType[];
    requiresAuth: FeatureType[];
    authStatus: AuthStatus;
  }> {
    const accessible = await this.getAccessibleFeatures();
    const requiresAuth = this.getAuthRequiredFeatures();
    const authStatus = await this.getAuthenticationStatus();
    
    return {
      accessible,
      requiresAuth,
      authStatus,
    };
  }
}

// Export singleton instance
export const featureGate = new FeatureGateService();

// Export class for testing
export { FeatureGateService };

// Default export
export default featureGate;