import '@/src/lib/suppressWarnings';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeContext';
import { useAuthStore } from '@/src/stores/authStore';
import { useAppLockStore } from '@/src/stores/appLockStore';
import { useNotifications, syncTaskReminders } from '@/src/hooks/useNotifications';
import { getTasks } from '@/src/lib/api/tasks';

SplashScreen.preventAutoHideAsync();

import { queryClient } from '@/src/lib/queryClient';

function AppNavigator() {
  const { colors, isDark } = useTheme();
  const { initialize, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { initializeLock, lockEnabled, isLocked } = useAppLockStore();
  useNotifications(); // Initialize notification listeners globally

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    Promise.all([initialize(), initializeLock()]);
  }, []);

  // Sync task reminders on startup so notifications survive phone restarts
  useEffect(() => {
    if (!isAuthenticated) return;
    const syncReminders = async () => {
      try {
        const tasks = await getTasks({ archived: false });
        await syncTaskReminders(tasks);
      } catch (e) {
        // Silent fail — no internet or not authenticated yet
      }
    };
    syncReminders();
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isLockScreen = segments[0] === 'lock';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && isLocked && !isLockScreen) {
      router.replace('/lock');
    } else if (isAuthenticated && !isLocked && (inAuthGroup || isLockScreen)) {
      router.replace('/');
    }
  }, [isAuthenticated, authLoading, segments, isLocked]);

  if (authLoading) return null;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AppNavigator />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
