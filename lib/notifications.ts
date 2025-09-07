import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

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
    if (Platform.OS === 'web') return localStorage.getItem(key);
    const mod = await import('@react-native-async-storage/async-storage');
    return await mod.default.getItem(key);
  } catch (e) {
    console.log('[Notifications] getItem error', e);
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') return void localStorage.setItem(key, value);
    const mod = await import('@react-native-async-storage/async-storage');
    await mod.default.setItem(key, value);
  } catch (e) {
    console.log('[Notifications] setItem error', e);
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') return void localStorage.removeItem(key);
    const mod = await import('@react-native-async-storage/async-storage');
    await mod.default.removeItem(key);
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
      if (!('Notification' in globalThis)) return false;
      if (Notification.permission === 'granted') return true;
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch (e) {
      console.log('[Notifications] Web permission error', e);
      return false;
    }
  }

  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted || req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export type RoutineType = 'morning' | 'evening';

export async function initializeNotifications() {
  console.log('[Notifications] initialize');
  const ok = await requestPermission();
  console.log('[Notifications] permission', ok);
  if (!ok) return;

  if (Platform.OS !== 'web') {
    await Notifications.setNotificationChannelAsync?.('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  // Don't schedule notifications immediately on app open
  // They will be scheduled when needed
  console.log('[Notifications] initialized, notifications will be scheduled when needed');
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
      } catch {}
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: {
        channelId: 'reminders',
        date: when,
      } as Notifications.DateTriggerInput,
    });
    await setItem(idKey, identifier);
    console.log('[Notifications] scheduled', type, 'at', when.toString(), identifier);
  } catch (e) {
    console.log('[Notifications] schedule error', e);
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
  await scheduleDailyReminder('morning');
  await scheduleDailyReminder('evening');
}
