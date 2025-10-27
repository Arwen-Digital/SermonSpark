// Export existing components
export { Button } from './Button';
export { Card } from './Card';
export { FadeInView } from './FadeInView';
export { LoadingIndicator } from './LoadingIndicator';
export { RichHtml } from './RichHtml';

// Export new feature gate components
export { UpgradePrompt } from './UpgradePrompt';
export { 
  FeatureGateWrapper, 
  withFeatureGate, 
  FeatureAccessIndicator 
} from './FeatureGateWrapper';

// Export offline-first components
export { OfflineStatusIndicator } from './OfflineStatusIndicator';
export { AuthenticationPrompt } from './AuthenticationPrompt';
export { GracefulDegradation } from './GracefulDegradation';
export { FeatureAccessDashboard } from './FeatureAccessDashboard';