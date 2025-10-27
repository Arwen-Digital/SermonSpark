import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/Theme';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { AuthScreen } from './AuthScreen';
import { FeatureType } from '../../services/featureGate';
import { hasOfflineDataToLink } from '../../services/authSession';

interface ConnectAccountFlowProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  feature?: FeatureType;
  title?: string;
  message?: string;
}

type FlowStep = 'intro' | 'auth' | 'linking' | 'success';

const FEATURE_BENEFITS: Record<FeatureType, string[]> = {
  community: [
    'Share sermons with other preachers',
    'Get feedback and suggestions',
    'Discover new sermon ideas',
  ],
  research: [
    'AI-powered sermon title generation',
    'Scripture research assistance',
    'Content outline recommendations',
  ],
  sync: [
    'Access sermons on all devices',
    'Automatic backup and sync',
    'Never lose your sermon data',
  ],
  sermons: [
    'Full offline sermon creation',
    'Rich text editing capabilities',
    'Local storage and backup',
  ],
  series: [
    'Organize sermons into series',
    'Track sermon progression',
    'Plan multi-week messages',
  ],
};

export const ConnectAccountFlow: React.FC<ConnectAccountFlowProps> = ({
  visible,
  onClose,
  onSuccess,
  feature,
  title,
  message,
}) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('intro');
  const [hasOfflineData, setHasOfflineData] = useState(false);

  React.useEffect(() => {
    if (visible) {
      // Check if user has offline data when flow opens
      hasOfflineDataToLink().then(setHasOfflineData);
      setCurrentStep('intro');
    }
  }, [visible]);

  const handleAuthSuccess = () => {
    if (hasOfflineData) {
      setCurrentStep('linking');
      // Simulate data linking process
      setTimeout(() => {
        setCurrentStep('success');
      }, 2000);
    } else {
      setCurrentStep('success');
    }
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
  };

  const renderIntroStep = () => (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-add" size={32} color={theme.colors.premium} />
        </View>
        <Text style={styles.title}>
          {title || 'Connect Your Account'}
        </Text>
        <Text style={styles.message}>
          {message || 'Connect your account to unlock premium features and sync your data across devices.'}
        </Text>
      </View>

      {feature && (
        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>What you'll get:</Text>
          {FEATURE_BENEFITS[feature]?.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={theme.colors.success} 
              />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      )}

      {hasOfflineData && (
        <View style={styles.dataNotice}>
          <Ionicons name="information-circle" size={16} color={theme.colors.info} />
          <Text style={styles.dataNoticeText}>
            Your offline sermons and series will be preserved and synced to your account.
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          title="Get Started"
          onPress={() => setCurrentStep('auth')}
          variant="premium"
          style={styles.primaryButton}
        />
        <Button
          title="Maybe Later"
          onPress={onClose}
          variant="ghost"
        />
      </View>
    </Card>
  );

  const renderAuthStep = () => (
    <View style={styles.authContainer}>
      <AuthScreen onAuthenticated={handleAuthSuccess} />
    </View>
  );

  const renderLinkingStep = () => (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="sync" size={32} color={theme.colors.premium} />
        </View>
        <Text style={styles.title}>Syncing Your Data</Text>
        <Text style={styles.message}>
          We're securely transferring your offline sermons and series to your account...
        </Text>
      </View>

      <View style={styles.linkingProgress}>
        <View style={styles.progressItem}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          <Text style={styles.progressText}>Account created successfully</Text>
        </View>
        <View style={styles.progressItem}>
          <Ionicons name="sync" size={20} color={theme.colors.premium} />
          <Text style={styles.progressText}>Transferring your sermons...</Text>
        </View>
        <View style={styles.progressItem}>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textTertiary} />
          <Text style={[styles.progressText, styles.progressTextPending]}>
            Setting up sync...
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={32} color={theme.colors.success} />
        </View>
        <Text style={styles.title}>Welcome to YouPreacher!</Text>
        <Text style={styles.message}>
          {hasOfflineData 
            ? 'Your account is set up and your offline data has been synced successfully.'
            : 'Your account is ready! You now have access to all premium features.'
          }
        </Text>
      </View>

      <View style={styles.successFeatures}>
        <Text style={styles.successFeaturesTitle}>You now have access to:</Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={16} color={theme.colors.success} />
            <Text style={styles.featureText}>Community features</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="bulb" size={16} color={theme.colors.success} />
            <Text style={styles.featureText}>AI research tools</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="sync" size={16} color={theme.colors.success} />
            <Text style={styles.featureText}>Cross-device sync</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Start Exploring"
          onPress={handleComplete}
          variant="premium"
          style={styles.primaryButton}
        />
      </View>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'intro':
        return renderIntroStep();
      case 'auth':
        return renderAuthStep();
      case 'linking':
        return renderLinkingStep();
      case 'success':
        return renderSuccessStep();
      default:
        return renderIntroStep();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {currentStep !== 'auth' && (
          <View style={styles.modalHeader}>
            <Button
              title="Close"
              onPress={onClose}
              variant="ghost"
              icon="close"
            />
          </View>
        )}
        <View style={styles.content}>
          {renderCurrentStep()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
    paddingBottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  authContainer: {
    flex: 1,
  },
  card: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.premium + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight as any,
    lineHeight: theme.typography.h3.lineHeight,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  message: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  benefits: {
    marginBottom: theme.spacing.lg,
  },
  benefitsTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontWeight: theme.typography.h6.fontWeight as any,
    lineHeight: theme.typography.h6.lineHeight,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  benefitText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  dataNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.info + '10',
    borderColor: theme.colors.info + '40',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  dataNoticeText: {
    ...theme.typography.body2,
    color: theme.colors.info,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    gap: theme.spacing.sm,
  },
  primaryButton: {
    width: '100%',
  },
  linkingProgress: {
    gap: theme.spacing.md,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  progressText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  progressTextPending: {
    color: theme.colors.textTertiary,
  },
  successFeatures: {
    marginBottom: theme.spacing.lg,
  },
  successFeaturesTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontWeight: theme.typography.h6.fontWeight as any,
    lineHeight: theme.typography.h6.lineHeight,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  featureList: {
    gap: theme.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  featureText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
});