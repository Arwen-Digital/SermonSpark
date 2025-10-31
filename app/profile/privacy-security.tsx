import { Card } from '@/components/common/Card';
import { FadeInView } from '@/components/common/FadeInView';
import { theme } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivacySecurityScreen() {
  const insets = useSafeAreaInsets();

  const topPadding = Math.max(insets.top || 0, theme.spacing.md);
  const bottomPadding = Math.max(insets.bottom || 0, theme.spacing.md);

  return (
    <FadeInView style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last Updated: October 31, 2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.paragraph}>
              We collect information you provide directly to us, such as when you create an account,
              update your profile, create sermons, or contact us for support.
            </Text>
            <Text style={styles.paragraph}>
              This may include your name, email address, church information, sermon content, and
              any other information you choose to provide.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.paragraph}>
              We use the information we collect to:
            </Text>
            <Text style={styles.listItem}>• Provide and maintain our services</Text>
            <Text style={styles.listItem}>• Process and organize your sermons and series</Text>
            <Text style={styles.listItem}>• Sync your data across devices</Text>
            <Text style={styles.listItem}>• Provide customer support</Text>
            <Text style={styles.listItem}>• Send important updates about the service</Text>
            <Text style={styles.listItem}>• Improve our services</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Data Storage and Security</Text>
            <Text style={styles.paragraph}>
              Your data is stored securely using industry-standard encryption. We use:
            </Text>
            <Text style={styles.listItem}>• Local SQLite database for offline storage</Text>
            <Text style={styles.listItem}>• Convex cloud database for synchronization</Text>
            <Text style={styles.listItem}>• Clerk for secure authentication</Text>
            <Text style={styles.paragraph}>
              We implement appropriate security measures to protect against unauthorized access,
              alteration, disclosure, or destruction of your personal information.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Sharing</Text>
            <Text style={styles.paragraph}>
              We do not sell, trade, or otherwise transfer your personal information to third parties
              without your consent, except as described in this policy.
            </Text>
            <Text style={styles.paragraph}>
              We may share information in the following circumstances:
            </Text>
            <Text style={styles.listItem}>• With your explicit consent</Text>
            <Text style={styles.listItem}>• To comply with legal obligations</Text>
            <Text style={styles.listItem}>• To protect our rights and prevent fraud</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Your Rights</Text>
            <Text style={styles.paragraph}>You have the right to:</Text>
            <Text style={styles.listItem}>• Access and review your personal information</Text>
            <Text style={styles.listItem}>• Correct inaccurate information</Text>
            <Text style={styles.listItem}>• Delete your account and associated data</Text>
            <Text style={styles.listItem}>• Export your data at any time</Text>
            <Text style={styles.listItem}>• Control privacy settings</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Offline-First Architecture</Text>
            <Text style={styles.paragraph}>
              YouPreacher is designed with an offline-first approach. Your sermons and data are
              stored locally on your device first, then synchronized to the cloud when you're online.
              This means:
            </Text>
            <Text style={styles.listItem}>• Your data is accessible without internet</Text>
            <Text style={styles.listItem}>• Only you have access to your content</Text>
            <Text style={styles.listItem}>• Cloud sync requires explicit authentication</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Data Retention</Text>
            <Text style={styles.paragraph}>
              We retain your information for as long as your account is active or as needed to
              provide services. You may delete your account and associated data at any time through
              the app settings.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
            <Text style={styles.paragraph}>
              Our service is not intended for children under 13. We do not knowingly collect
              personal information from children under 13. If you become aware that a child
              has provided us with personal information, please contact us.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
            <Text style={styles.paragraph}>
              We may update this privacy policy from time to time. We will notify you of any
              changes by posting the new policy on this page and updating the "Last Updated" date.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions about this privacy policy, please contact us at:
            </Text>
            <Text style={styles.contactInfo}>support@youpreacher.com</Text>
          </View>
        </Card>

        <Card style={styles.securityCard}>
          <Text style={styles.title}>Security Features</Text>

          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={24} color={theme.colors.primary} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>End-to-End Encryption</Text>
              <Text style={styles.featureDescription}>
                Your data is encrypted both in transit and at rest
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="cloud-offline" size={24} color={theme.colors.primary} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Offline-First</Text>
              <Text style={styles.featureDescription}>
                Work without internet; sync when ready
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Secure Authentication</Text>
              <Text style={styles.featureDescription}>
                Powered by Clerk for enterprise-grade security
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="device-phone-mobile" size={24} color={theme.colors.primary} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Local Data Storage</Text>
              <Text style={styles.featureDescription}>
                Your content stays on your device by default
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For questions about privacy or security, contact us at support@youpreacher.com
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  backButtonText: {
    ...theme.typography.body1,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  headerTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  lastUpdated: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  paragraph: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  listItem: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginLeft: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  contactInfo: {
    ...theme.typography.body1,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: theme.spacing.sm,
  },
  securityCard: {
    backgroundColor: theme.colors.primary + '10',
    borderColor: theme.colors.primary + '30',
    marginBottom: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  featureDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  footer: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
});
