import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { theme } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useMultipleFeatureGates } from '@/hooks/useFeatureGate';

// Premium indicator component for tab icons
const PremiumTabIcon = ({ 
  IconComponent, 
  color, 
  isPremium, 
  hasAccess 
}: { 
  IconComponent: React.ReactNode;
  color: string;
  isPremium: boolean;
  hasAccess: boolean;
}) => {
  return (
    <View style={{ position: 'relative' }}>
      {IconComponent}
      {isPremium && !hasAccess && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.premium,
          }}
        />
      )}
    </View>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  // Check access for all navigation features
  const { accessMap, isLoading } = useMultipleFeatureGates([
    'sermons',
    'research', 
    'community'
  ]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray500,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Remove absolute positioning to prevent overlap
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide the index tab
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sermons"
        options={{
          title: 'Sermons',
          tabBarIcon: ({ color }) => (
            <PremiumTabIcon
              IconComponent={<Ionicons name="document-text" size={24} color={color} />}
              color={color}
              isPremium={false}
              hasAccess={accessMap.sermons}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="research"
        options={{
          title: 'Research',
          tabBarIcon: ({ color }) => (
            <PremiumTabIcon
              IconComponent={<Ionicons name="search" size={24} color={color} />}
              color={color}
              isPremium={true}
              hasAccess={accessMap.research}
            />
          ),
          // Dim the tab if no access but keep it visible for discovery
          tabBarLabelStyle: !accessMap.research ? {
            opacity: 0.6,
          } : undefined,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          href: null, // Hide the community tab
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="debug"
        options={{
          title: 'Debug',
          tabBarIcon: ({ color }) => <Ionicons name="bug" size={24} color={color} />,
          tabBarLabelStyle: { fontSize: 10 },
        }}
      />
    </Tabs>
  );
}
