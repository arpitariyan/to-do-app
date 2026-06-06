import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radii } from '@/src/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  focused,
  color,
}: {
  name: IconName;
  focused: boolean;
  color: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: radii.lg,
        backgroundColor: focused ? colors.accentSoft : 'transparent',
      }}
    >
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bg1,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'android' ? 64 : 84,
          paddingBottom: Platform.OS === 'android' ? spacing.sm : spacing.lg,
          paddingTop: spacing.sm,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Inter_500Medium',
          marginTop: -2,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks/index"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes/index"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'document-text' : 'document-text-outline'} focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'sparkles' : 'sparkles-outline'} focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} color={color as string} />
          ),
        }}
      />
      {/* Hidden Screens (No Tab Button) */}
      <Tabs.Screen
        name="tasks/new"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tasks/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notes/new"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notes/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
