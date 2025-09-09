import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/Theme';
import { getContextualGreeting, getLiturgicalInfo } from '@/utils/homeUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface EnhancedHeaderProps {
  userName: string;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  hasNotifications?: boolean;
}

export const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({
  userName,
  onNotificationPress,
  onProfilePress,
  hasNotifications = false
}) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLargeScreen = Math.min(width, height) >= 768;
  const { greeting, timeContext } = getContextualGreeting(userName);
  const liturgical = getLiturgicalInfo();
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const topPadBase = isLargeScreen ? theme.spacing.xl * 1.2 : theme.spacing.xl;
  const bgPaddingTop = Math.max(insets.top + (isLargeScreen ? theme.spacing.md : theme.spacing.sm), topPadBase);

  return (
    <View style={[styles.container, { marginTop: isLargeScreen ? theme.spacing.sm : 0 }]}>
      <View style={[styles.backgroundGradient, { paddingTop: bgPaddingTop }]}>
        <View style={styles.mainContent}>
          <View style={styles.leftSection}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.date}>{today}</Text>
            <View style={styles.liturgicalContainer}>
              <View style={[styles.liturgicalDot, { backgroundColor: liturgical.color }]} />
              <Text style={styles.liturgicalText}>{liturgical.season}</Text>
            </View>
          </View>

        <View style={styles.rightSection}>
          <Pressable 
            style={styles.iconButton}
            onPress={onNotificationPress}
          >
            <Ionicons 
              name={hasNotifications ? "notifications" : "notifications-outline"} 
              size={24} 
              color="#ffffff"
            />
            {hasNotifications && <View style={styles.notificationBadge} />}
          </Pressable>

          <Pressable 
            style={styles.profileButton}
            onPress={onProfilePress}
          >
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={22} color="#6366f1" />
            </View>
          </Pressable>
          </View>
        </View>
        
        <Text style={styles.timeContext}>{timeContext}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  backgroundGradient: {
    backgroundColor: '#6366f1',
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  leftSection: {
    flex: 1,
  },
  greeting: {
    ...theme.typography.h2,
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: 6,
    fontSize: 28,
  },
  date: {
    ...theme.typography.body1,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: theme.spacing.xs,
    fontSize: 16,
    fontWeight: '500',
  },
  liturgicalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  liturgicalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liturgicalText: {
    ...theme.typography.caption,
    color: '#ffffff',
    fontWeight: '600',
    opacity: 0.9,
    fontSize: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconButton: {
    position: 'relative',
    padding: theme.spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
  profileButton: {
    padding: 2,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  timeContext: {
    ...theme.typography.body2,
    color: '#ffffff',
    fontStyle: 'italic',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});
