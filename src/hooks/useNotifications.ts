import '../lib/suppressWarnings';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as Notifications.NotificationBehavior),
});

export function useNotifications() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    registerForLocalNotificationsAsync().then(granted => {
      setHasPermission(granted);
    });

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      // Notification received in foreground
      console.log('Notification received:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      // User tapped the notification
      const taskId = response.notification.request.content.data?.taskId;
      if (taskId) {
        // We could route to the task details page here
        // router.push(`/tasks/${taskId}`);
      }
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return {
    hasPermission,
    scheduleTaskReminder,
    cancelTaskReminder,
  };
}

async function registerForLocalNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return false;
  }

  return true;
}

export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  description: string,
  triggerDate: Date,
  recurrence?: 'daily' | 'weekly' | 'monthly'
) {
  // Always cancel existing before scheduling
  await cancelTaskReminder(taskId);

  if (triggerDate.getTime() < Date.now()) {
    // Cannot schedule in the past
    return null;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: description || 'You have a task reminder!',
      data: { taskId },
      sound: true,
      vibrate: [0, 250, 250, 250],
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: 'default',
    },
  });

  return notificationId;
}

export async function cancelTaskReminder(taskId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(n => n.content.data?.taskId === taskId);
  
  for (const n of toCancel) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}

export async function syncTaskReminders(tasks: any[]) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const scheduledTaskIds = scheduled.map(n => n.content.data?.taskId);

  for (const task of tasks) {
    if (task.dueAt && task.reminders && task.reminders.length > 0 && task.status !== 'done') {
      const minutesToSubtract = parseInt(task.reminders[0], 10);
      if (!isNaN(minutesToSubtract)) {
        const triggerTime = new Date(task.dueAt);
        triggerTime.setMinutes(triggerTime.getMinutes() - minutesToSubtract);
        
        if (triggerTime.getTime() > Date.now()) {
          // If not already scheduled, schedule it
          if (!scheduledTaskIds.includes(task.$id)) {
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
    } else {
      // If done or no reminder, cancel if exists
      if (scheduledTaskIds.includes(task.$id)) {
        await cancelTaskReminder(task.$id);
      }
    }
  }
}
