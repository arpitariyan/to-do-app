import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radii } from '@/src/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_BAR_HEIGHT = 64;

function TabItem({
  route,
  isFocused,
  options,
  onPress,
  onLongPress,
}: {
  route: any;
  isFocused: boolean;
  options: any;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();

  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, { duration: 300 });
  }, [isFocused]);

  let labelWidth = 40;
  if (route.name === 'index') labelWidth = 42;
  else if (route.name === 'tasks/index') labelWidth = 44;
  else if (route.name === 'notes/index') labelWidth = 44;
  else if (route.name === 'ai') labelWidth = 18;
  else if (route.name === 'settings/index') labelWidth = 48;

  const activeBgColor = colors.textPrimary;
  const activeTextColor = colors.bg1;

  const pillAnimatedStyle = useAnimatedStyle(() => {
    const activeWidth = 48 + 6 + labelWidth; // Icon(24+padding) + margin(6) + text
    return {
      width: 48 + progress.value * (activeWidth - 48),
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        ['transparent', activeBgColor]
      ) as string,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: progress.value * labelWidth,
      marginLeft: progress.value * 6,
      opacity: progress.value,
      overflow: 'hidden',
    };
  });

  const getIconName = (): IconName => {
    if (route.name === 'index') return isFocused ? 'home' : 'home-outline';
    if (route.name === 'tasks/index') return isFocused ? 'checkmark-circle' : 'checkmark-circle-outline';
    if (route.name === 'notes/index') return isFocused ? 'document-text' : 'document-text-outline';
    if (route.name === 'ai') return isFocused ? 'sparkles' : 'sparkles-outline';
    if (route.name === 'settings/index') return isFocused ? 'person' : 'person-outline';
    return 'ellipse';
  };

  const getLabel = (): string => {
    if (options.title) return options.title;
    if (route.name === 'index') return 'Home';
    if (route.name === 'tasks/index') return 'Tasks';
    if (route.name === 'notes/index') return 'Notes';
    if (route.name === 'ai') return 'AI';
    if (route.name === 'settings/index') return 'Profile';
    return route.name;
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.pillContainer, pillAnimatedStyle]}>
        <Ionicons 
          name={getIconName()} 
          size={20} 
          color={isFocused ? activeTextColor : colors.textMuted} 
        />
        <Animated.View style={[textAnimatedStyle, { height: 20, justifyContent: 'center' }]}>
          <Text
            style={[styles.tabLabel, { color: activeTextColor, width: 60 }]}
            numberOfLines={1}
          >
            {getLabel()}
          </Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: colors.bg1,
          borderColor: colors.borderLight,
          bottom: Platform.OS === 'android' ? spacing.md : insets.bottom || spacing.md,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const options = descriptors[route.key].options as any;

        const isHidden = 
          options.href === null ||
          route.name === 'tasks/new' ||
          route.name === 'tasks/[id]' ||
          route.name === 'notes/new' ||
          route.name === 'notes/[id]';

        if (isHidden) {
          return null;
        }

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabItem
            key={route.key}
            route={route}
            isFocused={isFocused}
            options={options}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="tasks/index" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="notes/index" options={{ title: 'Notes' }} />
      <Tabs.Screen name="ai" options={{ title: 'AI' }} />
      <Tabs.Screen name="settings/index" options={{ title: 'Profile' }} />
      {/* Hidden Screens */}
      <Tabs.Screen name="tasks/new" options={{ href: null }} />
      <Tabs.Screen name="tasks/[id]" options={{ href: null }} />
      <Tabs.Screen name="notes/new" options={{ href: null }} />
      <Tabs.Screen name="notes/[id]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    height: TAB_BAR_HEIGHT,
    borderRadius: 100, // Safe radius for Android
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    minHeight: 40,
    maxHeight: 40,
    borderRadius: 20, // Exactly half of height for perfect pill on Android
    overflow: 'hidden',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});
