import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessResult, featureGate, FeatureType, UpgradePrompt } from '../services/featureGate';

interface UseFeatureGateResult {
  canAccess: boolean;
  isLoading: boolean;
  showUpgradePrompt: () => void;
  hideUpgradePrompt: () => void;
  upgradePromptVisible: boolean;
  upgradePrompt: UpgradePrompt | null;
  checkAccess: () => Promise<void>;
  handleFeatureRequest: () => Promise<AccessResult>;
}

/**
 * Hook for managing feature access and upgrade prompts
 */
export function useFeatureGate(feature: FeatureType): UseFeatureGateResult {
  const [canAccess, setCanAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradePromptVisible, setUpgradePromptVisible] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState<UpgradePrompt | null>(null);

  const checkAccess = useCallback(async () => {
    setIsLoading(true);
    try {
      const hasAccess = await featureGate.canAccess(feature);
      setCanAccess(hasAccess);
      
      // Prepare upgrade prompt for features that require auth
      if (!hasAccess && featureGate.isRequiredForFeature(feature)) {
        const prompt = featureGate.getUpgradePrompt(feature);
        setUpgradePrompt(prompt);
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      setCanAccess(false);
    } finally {
      setIsLoading(false);
    }
  }, [feature]);

  const showUpgradePrompt = useCallback(() => {
    if (upgradePrompt) {
      setUpgradePromptVisible(true);
    }
  }, [upgradePrompt]);

  const hideUpgradePrompt = useCallback(() => {
    setUpgradePromptVisible(false);
  }, []);

  const handleFeatureRequest = useCallback(async (): Promise<AccessResult> => {
    const result = await featureGate.handleFeatureRequest(feature);
    
    if (result === 'auth_required') {
      showUpgradePrompt();
    }
    
    return result;
  }, [feature, showUpgradePrompt]);

  // Check access on mount and when feature changes
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    canAccess,
    isLoading,
    showUpgradePrompt,
    hideUpgradePrompt,
    upgradePromptVisible,
    upgradePrompt,
    checkAccess,
    handleFeatureRequest,
  };
}

/**
 * Hook for managing multiple features at once
 */
export function useMultipleFeatureGates(features: FeatureType[]) {
  const [accessMap, setAccessMap] = useState<Record<FeatureType, boolean>>({} as Record<FeatureType, boolean>);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true);

  // Stabilize features array reference
  const stableFeatures = useMemo(() => features, [features.join(',')]);

  const checkAllAccess = useCallback(async (featuresToCheck: FeatureType[]) => {
    setIsLoading(true);
    try {
      const accessResults: Record<FeatureType, boolean> = {} as Record<FeatureType, boolean>;
      
      for (const feature of featuresToCheck) {
        accessResults[feature] = await featureGate.canAccess(feature);
      }
      
      setAccessMap(accessResults);
    } catch (error) {
      console.error('Error checking multiple feature access:', error);
      // Set all to false on error
      const errorResults: Record<FeatureType, boolean> = {} as Record<FeatureType, boolean>;
      featuresToCheck.forEach(feature => {
        errorResults[feature] = false;
      });
      setAccessMap(errorResults);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAllAccess(stableFeatures);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    accessMap,
    isLoading,
    checkAllAccess: () => checkAllAccess(stableFeatures),
    canAccess: (feature: FeatureType) => accessMap[feature] || false,
  };
}

/**
 * Hook for getting feature access summary
 */
export function useFeatureAccessSummary() {
  const [summary, setSummary] = useState<{
    accessible: FeatureType[];
    requiresAuth: FeatureType[];
    authStatus: 'offline' | 'online' | 'required';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const summaryData = await featureGate.getFeatureAccessSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading feature access summary:', error);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return {
    summary,
    isLoading,
    loadSummary,
  };
}