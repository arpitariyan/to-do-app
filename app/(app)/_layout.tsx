import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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

  let labelWidthNum = 40;
  if (route.name === 'index') labelWidthNum = 42;
  else if (route.name === 'tasks/index') labelWidthNum = 44;
  else if (route.name === 'notes/index') labelWidthNum = 44;
  else if (route.name === 'ai') labelWidthNum = 18;
  else if (route.name === 'settings/index') labelWidthNum = 48;

  // Store closed-over JS values in shared values so worklets can safely access them
  const labelWidth = useSharedValue(labelWidthNum);
  const activeBgColor = useSharedValue(colors.textPrimary);
  const activeTextColor = colors.bg1;

  useEffect(() => {
    activeBgColor.value = colors.textPrimary;
  }, [colors.textPrimary]);

  const pillAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const activeWidth = 48 + 6 + labelWidth.value;
    return {
      width: 48 + progress.value * (activeWidth - 48),
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        ['transparent', activeBgColor.value]
      ) as string,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      width: progress.value * labelWidth.value,
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
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const currentRoute = state.routes[state.index];
  const isTabBarHidden = 
    currentRoute.name === 'tasks/new' ||
    currentRoute.name === 'tasks/[id]' ||
    currentRoute.name === 'notes/new' ||
    currentRoute.name === 'notes/[id]' ||
    currentRoute.name === 'settings/privacy' ||
    currentRoute.name === 'settings/terms';

  if (isTabBarHidden) {
    return null;
  }

  return (
    <BlurView
      intensity={85}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: colors.glassLight,
          borderColor: colors.glassBorder,
          bottom: Platform.OS === 'ios'
            ? insets.bottom || spacing.md
            : insets.bottom > 35
              ? insets.bottom + 8
              : spacing.md,
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
          route.name === 'notes/[id]' ||
          route.name === 'settings/privacy' ||
          route.name === 'settings/terms';

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
    </BlurView>
  );
}

export default function AppLayout() {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg0 }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          // @ts-ignore - expo-router/react-navigation types might be slightly out of sync
          sceneStyle: { backgroundColor: 'transparent' }
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
      <Tabs.Screen name="settings/privacy" options={{ href: null }} />
      <Tabs.Screen name="settings/terms" options={{ href: null }} />
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    height: TAB_BAR_HEIGHT,
    borderRadius: 100, // Safe radius for Android
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    justifyContent: 'space-evenly',
    overflow: 'hidden',
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
