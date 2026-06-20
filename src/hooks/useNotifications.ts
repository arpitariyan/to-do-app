import '../lib/suppressWarnings';
import { useEffect, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Notification Channel IDs ─────────────────────────────────────────────────
const TASK_CHANNEL_ID = 'task-reminders';
const KEEP_ALIVE_STORAGE_KEY = 'appwrite_last_ping_date';
const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? 'https://sgp.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? '';

// ─── Configure Foreground Notification Behavior ───────────────────────────────
// This makes notifications show up even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  } as Notifications.NotificationBehavior),
});

// ─── Register Android Notification Channel ────────────────────────────────────
// CRITICAL: Must be done BEFORE any notifications are scheduled.
// MAX importance = shows heads-up notification banner even when phone is locked.
async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(TASK_CHANNEL_ID, {
      name: 'Task Reminders',
      description: 'Notifications for your scheduled task alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      sound: 'default',
    });
  }
}

// ─── Request Notification Permissions ─────────────────────────────────────────
async function requestNotificationPermissions(): Promise<boolean> {
  // Setup channel first (Android requirement)
  await setupNotificationChannel();

  if (Platform.OS === 'android') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } else {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: true,
          provideAppNotificationSettings: true,
        },
      });
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }
}

// ─── Appwrite Keep-Alive Ping ─────────────────────────────────────────────────
// Pings Appwrite once per day to keep the free-tier project from going to sleep.
// Only runs if last ping was NOT today (uses AsyncStorage to track).
async function pingAppwriteIfNeeded() {
  try {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    const lastPingDate = await AsyncStorage.getItem(KEEP_ALIVE_STORAGE_KEY);

    if (lastPingDate === today) {
      // Already pinged today, no need to do it again
      return;
    }

    // Ping the Appwrite health endpoint (lightweight, no auth required)
    const response = await fetch(`${APPWRITE_ENDPOINT}/health`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      await AsyncStorage.setItem(KEEP_ALIVE_STORAGE_KEY, today);
      console.log('[Appwrite Keep-Alive] Pinged successfully on', today);
    }
  } catch (error) {
    // Silent fail — no internet or server issue. Will retry next time app opens.
    console.log('[Appwrite Keep-Alive] Ping failed (will retry later):', error);
  }
}

// ─── Midnight Ping Scheduler ──────────────────────────────────────────────────
// Schedules a midnight ping using expo-notifications (a silent internal notification
// is NOT used here — instead we use an AppState listener + time check).
function scheduleMidnightPing() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 1, 0); // Next midnight (00:00:01 AM)
  const msUntilMidnight = midnight.getTime() - now.getTime();

  // Set a one-shot timer to ping at midnight
  setTimeout(async () => {
    await pingAppwriteIfNeeded();
    // Re-schedule for next midnight
    scheduleMidnightPing();
  }, msUntilMidnight);
}

// ─── Main Hook ────────────────────────────────────────────────────────────────
export function useNotifications() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Request permissions and setup channel
    requestNotificationPermissions().then(granted => {
      setHasPermission(granted);
    });

    // 2. Ping Appwrite on app startup (if not already pinged today)
    pingAppwriteIfNeeded();

    // 3. Schedule daily midnight ping
    scheduleMidnightPing();

    // 4. Also ping when app comes back to foreground (e.g., after being in background)
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          pingAppwriteIfNeeded();
        }
      }
    );

    // 5. Handle foreground notifications (show them)
    const notificationReceivedSub = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notification] Received in foreground:', notification.request.content.title);
    });

    // 6. Handle notification tap — could route to the task
    const notificationResponseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const taskId = response.notification.request.content.data?.taskId;
      if (taskId) {
        console.log('[Notification] User tapped notification for task:', taskId);
        // TODO: Could navigate to the task: router.push(`/tasks/${taskId}`);
      }
    });

    return () => {
      appStateSubscription.remove();
      notificationReceivedSub.remove();
      notificationResponseSub.remove();
    };
  }, []);

  return { hasPermission };
}

// ─── Schedule Task Reminder ───────────────────────────────────────────────────
// This is called when user creates/updates a task with an alert.
// Uses DATE trigger which fires at the EXACT given time.
export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  description: string,
  triggerDate: Date,
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'none' | 'custom' | 'weekday'
): Promise<string | null> {
  // Always cancel existing before re-scheduling
  await cancelTaskReminder(taskId);

  // Cannot schedule in the past
  if (triggerDate.getTime() <= Date.now()) {
    console.warn('[Notification] Cannot schedule in the past:', triggerDate.toISOString());
    return null;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 ${title}`,
        body: description || 'Your task reminder is due!',
        data: { taskId },
        sound: 'default',
        // Android-specific
        ...(Platform.OS === 'android' && {
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
          color: '#7C3AED',
          sticky: false,
          autoDismiss: true,
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: TASK_CHANNEL_ID,
      },
    });

    console.log(
      `[Notification] Scheduled "${title}" for ${triggerDate.toLocaleString()} (id: ${notificationId})`
    );
    return notificationId;
  } catch (error) {
    console.error('[Notification] Failed to schedule:', error);
    return null;
  }
}

// ─── Cancel Task Reminder ─────────────────────────────────────────────────────
export async function cancelTaskReminder(taskId: string) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(n => n.content.data?.taskId === taskId);

    for (const n of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }

    if (toCancel.length > 0) {
      console.log(`[Notification] Cancelled ${toCancel.length} reminder(s) for task:`, taskId);
    }
  } catch (error) {
    console.error('[Notification] Failed to cancel:', error);
  }
}

// ─── Sync Task Reminders ──────────────────────────────────────────────────────
// Call this on app startup to re-sync all scheduled notifications with tasks.
// This ensures reminders survive app restarts.
export async function syncTaskReminders(tasks: any[]) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const scheduledTaskIds = new Set(scheduled.map(n => n.content.data?.taskId).filter(Boolean));

    for (const task of tasks) {
      const hasDueAt = task.dueAt && task.dueAt !== null;
      const hasReminder = task.reminders && task.reminders.length > 0 && task.reminders[0] !== 'none';
      const isActive = task.status !== 'done' && task.status !== 'archived' && task.status !== 'cancelled';

      if (hasDueAt && hasReminder && isActive) {
        const reminderValue = task.reminders[0];
        const minutesToSubtract = parseInt(reminderValue, 10);

        if (!isNaN(minutesToSubtract)) {
          const dueDate = new Date(task.dueAt);
          const triggerTime = new Date(dueDate.getTime() - minutesToSubtract * 60 * 1000);

          if (triggerTime.getTime() > Date.now()) {
            // Only schedule if not already scheduled for this task
            if (!scheduledTaskIds.has(task.$id)) {
              await scheduleTaskReminder(
                task.$id,
                task.title,
                task.description || '',
                triggerTime,
                task.repeatType
              );
            }
          }
        }
      } else if (scheduledTaskIds.has(task.$id)) {
        // Task is done/archived or has no reminder — cancel if was scheduled
        await cancelTaskReminder(task.$id);
      }
    }

    console.log(`[Notification] Synced reminders for ${tasks.length} tasks`);
  } catch (error) {
    console.error('[Notification] Sync failed:', error);
  }
}
