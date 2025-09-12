import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notification handler
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const MORNING_HOUR = 10;
const EVENING_HOUR = 22;

const STORAGE_KEYS = {
  morningDonePrefix: 'glow_morning_done_',
  eveningDonePrefix: 'glow_evening_done_',
  morningNotifId: 'glow_morning_notif_id',
  eveningNotifId: 'glow_evening_notif_id',
} as const;

function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.log('[Notifications] getItem error', e);
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.log('[Notifications] setItem error', e);
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.log('[Notifications] removeItem error', e);
  }
}

function nextTimeTodayOrTomorrow(targetHour: number): Date {
  const now = new Date();
  const target = new Date();
  target.setHours(targetHour, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      if (!('Notification' in globalThis)) {
        console.log('[Notifications] Web Notification API not available');
        return false;
      }
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'denied') {
        console.log('[Notifications] Web notifications denied by user');
        return false;
      }
      const perm = await Notification.requestPermission();
      console.log('[Notifications] Web permission result:', perm);
      return perm === 'granted';
    } catch (e) {
      console.log('[Notifications] Web permission error', e);
      return false;
    }
  }

  try {
    const settings = await Notifications.getPermissionsAsync();
    console.log('[Notifications] Current permissions:', settings);
    
    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }
    
    const req = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    
    console.log('[Notifications] Permission request result:', req);
    return req.granted || req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  } catch (e) {
    console.log('[Notifications] Permission request error', e);
    return false;
  }
}

export type RoutineType = 'morning' | 'evening';

export async function initializeNotifications() {
  console.log('[Notifications] Initializing notifications...');
  
  try {
    const ok = await requestPermission();
    console.log('[Notifications] Permission granted:', ok);
    
    if (!ok) {
      console.log('[Notifications] Permission denied, notifications disabled');
      return false;
    }

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Skincare Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF69B4',
        });
        console.log('[Notifications] Android channel created');
      } catch (e) {
        console.log('[Notifications] Android channel creation error', e);
      }
    }

    console.log('[Notifications] Initialization complete');
    return true;
  } catch (e) {
    console.log('[Notifications] Initialization error', e);
    return false;
  }
}

export async function scheduleDailyReminder(type: RoutineType) {
  const hour = type === 'morning' ? MORNING_HOUR : EVENING_HOUR;
  const title = type === 'morning' ? 'Morning routine reminder' : 'Evening routine reminder';
  const body = type === 'morning' ? "Haven't finished your morning skincare yet? Let's glow!" : "Time for your evening routine. Your skin will thank you.";

  const dateKey = getLocalDateKey();
  const doneKey = (type === 'morning' ? STORAGE_KEYS.morningDonePrefix : STORAGE_KEYS.eveningDonePrefix) + dateKey;
  const isDone = (await getItem(doneKey)) === '1';
  if (isDone) {
    console.log(`[Notifications] ${type} already done for ${dateKey}, skipping schedule for today`);
    return;
  }

  const now = new Date();
  const currentHour = now.getHours();
  
  // Only schedule notification if we haven't passed the time yet today
  // Morning: only schedule if it's before 10 AM
  // Evening: only schedule if it's before 10 PM
  if ((type === 'morning' && currentHour >= MORNING_HOUR) || 
      (type === 'evening' && currentHour >= EVENING_HOUR)) {
    console.log(`[Notifications] ${type} time has passed for today, scheduling for tomorrow`);
  }

  const when = nextTimeTodayOrTomorrow(hour);

  if (Platform.OS === 'web') {
    const ms = when.getTime() - Date.now();
    console.log(`[Notifications] Web scheduling ${type} in ${Math.round(ms / 1000)}s at`, when.toString());
    
    // Clear any existing timeout for this type
    const timeoutKey = `${type}_timeout`;
    const existingTimeout = (globalThis as any)[timeoutKey];
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    (globalThis as any)[timeoutKey] = setTimeout(() => {
      if (!('Notification' in globalThis)) return console.log('[Notifications] Notification API not available');
      getItem(doneKey).then(val => {
        if (val === '1') {
          console.log(`[Notifications] ${type} done by trigger time, not showing web notification`);
          return;
        }
        try {
          new Notification(title, { body });
        } catch (e) {
          console.log('[Notifications] Web show error', e);
        }
      });
    }, Math.max(0, ms));
    return;
  }

  try {
    const idKey = type === 'morning' ? STORAGE_KEYS.morningNotifId : STORAGE_KEYS.eveningNotifId;
    const existingId = await getItem(idKey);
    if (existingId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(existingId);
        console.log('[Notifications] Cancelled existing notification:', existingId);
      } catch (e) {
        console.log('[Notifications] Error cancelling existing notification:', e);
      }
    }

    const notificationContent: Notifications.NotificationContentInput = {
      title,
      body,
      sound: 'default',
      data: { type, scheduledFor: when.toISOString() },
    };

    const trigger = {
      date: when,
    } as Notifications.DateTriggerInput;

    // Add channelId for Android
    if (Platform.OS === 'android') {
      (trigger as any).channelId = 'reminders';
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
    });
    
    await setItem(idKey, identifier);
    console.log(`[Notifications] Scheduled ${type} notification:`, {
      id: identifier,
      time: when.toString(),
      title,
      body
    });
  } catch (e) {
    console.log('[Notifications] Schedule error:', e);
  }
}

export async function markRoutineDone(type: RoutineType, date = new Date()) {
  const key = (type === 'morning' ? STORAGE_KEYS.morningDonePrefix : STORAGE_KEYS.eveningDonePrefix) + getLocalDateKey(date);
  await setItem(key, '1');
  console.log('[Notifications] marked done', type, getLocalDateKey(date));

  if (Platform.OS !== 'web') {
    try {
      const idKey = type === 'morning' ? STORAGE_KEYS.morningNotifId : STORAGE_KEYS.eveningNotifId;
      const existingId = await getItem(idKey);
      if (existingId) await Notifications.cancelScheduledNotificationAsync(existingId);
    } catch {}
  } else {
    // Clear web timeout
    const timeoutKey = `${type}_timeout`;
    const existingTimeout = (globalThis as any)[timeoutKey];
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      delete (globalThis as any)[timeoutKey];
    }
  }

  // Schedule for tomorrow
  await scheduleDailyReminder(type);
}

export async function resetTodayFlags() {
  const today = getLocalDateKey();
  await removeItem(STORAGE_KEYS.morningDonePrefix + today);
  await removeItem(STORAGE_KEYS.eveningDonePrefix + today);
}

export async function startDailyNotifications() {
  console.log('[Notifications] Starting daily notifications');
  
  try {
    // Initialize notifications first
    const initialized = await initializeNotifications();
    if (!initialized) {
      console.log('[Notifications] Failed to initialize, skipping scheduling');
      return false;
    }

    await scheduleDailyReminder('morning');
    await scheduleDailyReminder('evening');
    
    console.log('[Notifications] Daily notifications started successfully');
    return true;
  } catch (e) {
    console.log('[Notifications] Error starting daily notifications:', e);
    return false;
  }
}

export async function getNotificationStatus() {
  const status = {
    permissionGranted: false,
    scheduledNotifications: 0,
    morningScheduled: false,
    eveningScheduled: false,
    platform: Platform.OS,
  };

  try {
    if (Platform.OS === 'web') {
      status.permissionGranted = 'Notification' in globalThis && Notification.permission === 'granted';
    } else {
      const permissions = await Notifications.getPermissionsAsync();
      status.permissionGranted = permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
      
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      status.scheduledNotifications = scheduled.length;
      
      const morningId = await getItem(STORAGE_KEYS.morningNotifId);
      const eveningId = await getItem(STORAGE_KEYS.eveningNotifId);
      
      status.morningScheduled = !!morningId && scheduled.some(n => n.identifier === morningId);
      status.eveningScheduled = !!eveningId && scheduled.some(n => n.identifier === eveningId);
    }
  } catch (e) {
    console.log('[Notifications] Error getting status:', e);
  }

  return status;
}

export async function testNotification() {
  console.log('[Notifications] Testing immediate notification...');
  
  if (Platform.OS === 'web') {
    if ('Notification' in globalThis && Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from Glow Check!',
      });
      console.log('[Notifications] Web test notification sent');
    } else {
      console.log('[Notifications] Web notifications not available or not permitted');
    }
    return;
  }

  try {
    const permissions = await Notifications.getPermissionsAsync();
    if (!permissions.granted && permissions.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL) {
      console.log('[Notifications] No permission for test notification');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification from Glow Check!',
        sound: 'default',
      },
      trigger: {
        seconds: 1,
      } as Notifications.TimeIntervalTriggerInput,
    });
    
    console.log('[Notifications] Test notification scheduled for 1 second');
  } catch (e) {
    console.log('[Notifications] Test notification error:', e);
  }
}

export async function clearAllNotifications() {
  console.log('[Notifications] Clearing all notifications...');
  
  if (Platform.OS === 'web') {
    // Clear web timeouts
    const timeoutKeys = ['morning_timeout', 'evening_timeout'];
    timeoutKeys.forEach(key => {
      const timeout = (globalThis as any)[key];
      if (timeout) {
        clearTimeout(timeout);
        delete (globalThis as any)[key];
      }
    });
    console.log('[Notifications] Web timeouts cleared');
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Clear stored notification IDs
    await removeItem(STORAGE_KEYS.morningNotifId);
    await removeItem(STORAGE_KEYS.eveningNotifId);
    
    console.log('[Notifications] All notifications cleared');
  } catch (e) {
    console.log('[Notifications] Error clearing notifications:', e);
  }
}
