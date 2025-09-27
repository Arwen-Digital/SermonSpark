import { Card } from '@/components/common/Card';
import { FadeInView } from '@/components/common/FadeInView';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { theme } from '@/constants/Theme';
import authService from '@/services/supabaseAuthService';
import { supabase } from '@/services/supabaseClient';
import { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Fallback while loading
const emptyUser: User = {
  id: '',
  name: '',
  email: '',
  avatar: '',
  title: '',
  church: '',
  bio: '',
  isPremium: false,
  joinedDate: new Date(),
};

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { key: 'edit-profile', label: 'Edit Profile', icon: 'person-outline' },
      { key: 'preferences', label: 'Preferences', icon: 'settings-outline' },
      { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
      { key: 'privacy', label: 'Privacy & Security', icon: 'shield-outline' },
    ],
  },
  {
    title: 'Subscription',
    items: [
      { key: 'billing', label: 'Billing & Subscription', icon: 'card-outline' },
      { key: 'premium-features', label: 'Premium Features', icon: 'star-outline' },
    ],
  },
  {
    title: 'Content',
    items: [
      { key: 'export', label: 'Export Data', icon: 'download-outline' },
      { key: 'import', label: 'Import Sermons', icon: 'cloud-upload-outline' },
      { key: 'backup', label: 'Backup & Sync', icon: 'cloud-outline' },
    ],
  },
  {
    title: 'Support',
    items: [
      { key: 'help', label: 'Help Center', icon: 'help-circle-outline' },
      { key: 'feedback', label: 'Send Feedback', icon: 'chatbubble-outline' },
      { key: 'about', label: 'About YouPreacher', icon: 'information-circle-outline' },
    ],
  },
  {
    title: 'Account Actions',
    items: [
      { key: 'logout', label: 'Sign Out', icon: 'log-out-outline', isDestructive: true },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User>(emptyUser);
  const [loading, setLoading] = useState(true);
  const [sermonCount, setSermonCount] = useState<number | null>(null);
  const [seriesCount, setSeriesCount] = useState<number | null>(null);
  const [communityLikes, setCommunityLikes] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const authed = await authService.isAuthenticated();
        if (!authed) {
          router.replace('/auth');
          return;
        }
        // Ensure profile row exists and fetch user
        await authService.ensureProfileExists?.();
        const u = await authService.getUser();
        if (!u) {
          router.replace('/auth');
          return;
        }
        const mapped: User = {
          id: u.id,
          name: u.fullName || u.username || u.email.split('@')[0] || 'Pastor',
          email: u.email,
          avatar: '',
          title: u.title || '',
          church: u.church || '',
          bio: '',
          isPremium: false,
          joinedDate: new Date(u.createdAt),
        };
        if (!mounted) return;
        setUser(mapped);

        // Load simple stats
        const [{ count: sermons }, { count: series }] = await Promise.all([
          supabase.from('sermons').select('*', { count: 'exact', head: true }),
          supabase.from('series').select('*', { count: 'exact', head: true }),
        ]);
        if (mounted) {
          setSermonCount(sermons ?? 0);
          setSeriesCount(series ?? 0);
        }

        // Community likes on own posts
        const { data: postIds } = await supabase
          .from('community_posts')
          .select('id')
          .eq('author_id', u.id)
          .order('created_at', { ascending: false });
        if (postIds && postIds.length > 0) {
          const ids = postIds.map((p) => p.id);
          const { count } = await supabase
            .from('community_post_likes')
            .select('*', { count: 'exact', head: true })
            .in('post_id', ids);
          if (mounted) setCommunityLikes(count ?? 0);
        } else if (mounted) {
          setCommunityLikes(0);
        }
      } catch (e) {
        console.warn('Failed to load profile:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleMenuPress = (key: string) => {
    switch (key) {
      case 'upgrade':
        console.log('Show premium upgrade');
        break;
      case 'edit-profile':
        console.log('Navigate to edit profile');
        break;
      case 'logout': {
        const doLogout = async () => {
          try {
            await authService.signout();
            router.replace('/auth');
          } catch (e) {
            // Even if clear fails, force navigation; guard will handle state
            router.replace('/auth');
          }
        };
        if (Platform.OS === 'web') {
          const confirmed = typeof window !== 'undefined' ? window.confirm('Sign out of YouPreacher?') : true;
          if (confirmed) void doLogout();
        } else {
          Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: () => void doLogout() },
          ]);
        }
        break;
      }
      default:
        console.log('Menu item pressed:', key);
    }
  };

  const formatJoinDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const renderProfileHeader = () => (
    <Card style={styles.profileCard} variant="elevated">
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={theme.colors.gray600} />
          </View>
          {user.isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={12} color={theme.colors.black} />
            </View>
          )}
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user.name || 'Pastor'}</Text>
          {!!user.title && <Text style={styles.userTitle}>{user.title}</Text>}
          {!!user.church && <Text style={styles.userChurch}>{user.church}</Text>}
        </View>
        
        <Pressable
          style={styles.editButton}
          onPress={() => handleMenuPress('edit-profile')}
        >
          <Ionicons name="pencil" size={16} color={theme.colors.primary} />
        </Pressable>
      </View>
      
      {user.bio && (
        <View style={styles.bioSection}>
          <Text style={styles.bioText}>{user.bio}</Text>
        </View>
      )}
      
      <View style={styles.profileMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar" size={16} color={theme.colors.gray500} />
          <Text style={styles.metaText}>
            Joined {formatJoinDate(user.joinedDate)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="mail" size={16} color={theme.colors.gray500} />
          <Text style={styles.metaText}>{user.email}</Text>
        </View>
      </View>
    </Card>
  );

  const renderStatsCard = () => (
    <Card style={styles.statsCard} variant="elevated">
      <Text style={styles.statsTitle}>Your Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{sermonCount ?? '–'}</Text>
          <Text style={styles.statLabel}>Sermons</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{seriesCount ?? '–'}</Text>
          <Text style={styles.statLabel}>Series</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{communityLikes ?? '–'}</Text>
          <Text style={styles.statLabel}>Community Likes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>–</Text>
          <Text style={styles.statLabel}>Total Words</Text>
        </View>
      </View>
    </Card>
  );


  const renderMenuSection = (section: typeof MENU_SECTIONS[0]) => (
    <View key={section.title} style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Card style={styles.menuCard}>
        {section.items.map((item, index) => (
          <Pressable
            key={item.key}
            style={[
              styles.menuItem,
              index < section.items.length - 1 && styles.menuItemBorder,
            ]}
            onPress={() => handleMenuPress(item.key)}
          >
            <View style={styles.menuItemContent}>
              <Ionicons
                name={item.icon as any}
                size={20}
                color={
                  item.isDestructive
                    ? theme.colors.error
                    : theme.colors.gray600
                }
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.isDestructive && styles.menuItemTextDestructive,
                ]}
              >
                {item.label}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.gray400}
            />
          </Pressable>
        ))}
      </Card>
    </View>
  );

  const topPadding = Math.max(insets.top || 0, theme.spacing.md);
  const bottomPadding = Math.max(insets.bottom || 0, theme.spacing.md);

  return (
    <FadeInView style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          {loading ? (
            <View style={{ padding: theme.spacing.lg }}>
              <LoadingIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <>
          
          {renderProfileHeader()}
          {renderStatsCard()}
          
          <View style={styles.menuContainer}>
            {MENU_SECTIONS.map(renderMenuSection)}
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>YouPreacher v1.0.0</Text>
            <Text style={styles.footerText}>Made with ❤️ for pastors worldwide</Text>
          </View>
            </>
          )}
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
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  
  // Profile Header
  profileCard: {
    marginBottom: theme.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.premium,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  userTitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  userChurch: {
    ...theme.typography.body2,
    color: theme.colors.textTertiary,
  },
  editButton: {
    padding: theme.spacing.xs,
  },
  bioSection: {
    marginBottom: theme.spacing.md,
  },
  bioText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  profileMeta: {
    gap: theme.spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    ...theme.typography.body2,
    color: theme.colors.textTertiary,
  },
  
  // Stats Card
  statsCard: {
    marginBottom: theme.spacing.md,
  },
  statsTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...theme.typography.h4,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  
  // Premium Promo
  premiumPromoCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.premium + '10',
    borderColor: theme.colors.premium + '30',
  },
  premiumPromoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  premiumPromoInfo: {
    flex: 1,
  },
  premiumPromoTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  premiumPromoSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  
  // Menu
  menuContainer: {
    gap: theme.spacing.lg,
  },
  menuSection: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  menuCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  menuItemText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
  },
  menuItemTextDestructive: {
    color: theme.colors.error,
  },
  menuItemTextPremium: {
    color: theme.colors.premium,
    fontWeight: '500',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
});
