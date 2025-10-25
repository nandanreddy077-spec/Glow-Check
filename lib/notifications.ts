import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type NotificationType = 
  | 'morning_motivation'
  | 'pre_routine_reminder'
  | 'routine_reminder'
  | 'midday_boost'
  | 'evening_wind_down'
  | 'consistency_streak'
  | 'weekly_progress'
  | 'glow_tip'
  | 'community_engagement'
  | 'missed_routine'
  | 'trial_day5_payment'
  | 'trial_ending_soon'
  | 'results_expiring'
  | 'free_scan_used';

interface NotificationTemplate {
  title: string;
  body: string;
  data?: Record<string, any>;
}

const PREMIUM_NOTIFICATIONS: Record<NotificationType, NotificationTemplate[]> = {
  morning_motivation: [
    {
      title: "Good morning, gorgeous! ☀️",
      body: "Your skin is waiting for its daily dose of love. Ready to glow?",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Rise & Shine, beauty! ✨",
      body: "3 minutes. That's all it takes to transform your skin today.",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Morning glow time! 🌅",
      body: "Your future skin will thank you for what you do in the next 5 minutes.",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Psst... Your skin is calling! 💆‍♀️",
      body: "Start your day with self-care. Your morning routine is ready.",
      data: { screen: "(tabs)/glow-coach" }
    },
  ],
  pre_routine_reminder: [
    {
      title: "10 minutes until glow time! ⏰",
      body: "Get ready to pamper yourself. Your skincare routine awaits!",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Almost time for your glow-up! ✨",
      body: "Prepare your products. Your personalized routine starts soon.",
      data: { screen: "(tabs)/glow-coach" }
    },
  ],
  routine_reminder: [
    {
      title: "Your skin routine is waiting! 🧴",
      body: "Tap to see your personalized steps. Let's make today beautiful.",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Time to treat yourself! 💅",
      body: "Your customized skincare routine is ready. 5 minutes to radiance.",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Don't keep your skin waiting! ⏳",
      body: "Your glow-up routine is here. Consistency = Results.",
      data: { screen: "(tabs)/glow-coach" }
    },
  ],
  midday_boost: [
    {
      title: "Midday beauty check! 💄",
      body: "Quick tip: Hydration is your skin's best friend. Drink up, glow up!",
      data: { screen: "(tabs)/index" }
    },
    {
      title: "Did you know? 🤔",
      body: "UV protection isn't just for summer. Your skin needs it year-round!",
      data: { screen: "(tabs)/index" }
    },
    {
      title: "Afternoon glow boost! ☀️",
      body: "Your skin loves you. Show some love back with proper hydration today.",
      data: { screen: "(tabs)/index" }
    },
  ],
  evening_wind_down: [
    {
      title: "Wind down with self-care 🌙",
      body: "Your evening routine is the secret to waking up beautiful. Ready?",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Time for your beauty sleep prep! 😴",
      body: "5 minutes now = glowing skin tomorrow. Your routine awaits.",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Before bed beauty ritual! ✨",
      body: "Never skip your evening routine. Your skin repairs itself while you sleep.",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "End your day beautifully! 🌟",
      body: "Your nighttime routine is ready. Let's prep that glow for tomorrow.",
      data: { screen: "(tabs)/glow-coach" }
    },
  ],
  consistency_streak: [
    {
      title: "🔥 3-day streak! You're on fire!",
      body: "Your skin is noticing the difference. Keep up the amazing work!",
      data: { screen: "(tabs)/profile" }
    },
    {
      title: "🎉 7 days strong! Incredible!",
      body: "Results are just around the corner. Your dedication is inspiring!",
      data: { screen: "(tabs)/profile" }
    },
    {
      title: "⭐ 14-day glow streak! Legend!",
      body: "This is when magic happens. Your skin is transforming!",
      data: { screen: "(tabs)/profile" }
    },
    {
      title: "💎 30-day milestone! Unstoppable!",
      body: "You're a skincare queen! Check out your amazing progress.",
      data: { screen: "(tabs)/profile" }
    },
  ],
  weekly_progress: [
    {
      title: "Your weekly glow report is here! 📊",
      body: "See how far you've come this week. Progress you can see!",
      data: { screen: "(tabs)/profile" }
    },
    {
      title: "Week completed! Check your stats! 🎯",
      body: "You completed 85% of routines this week. Let's aim for 100% next week!",
      data: { screen: "(tabs)/profile" }
    },
  ],
  glow_tip: [
    {
      title: "💡 Pro tip from dermatologists:",
      body: "Apply products from thinnest to thickest consistency for best absorption!",
      data: { screen: "(tabs)/index" }
    },
    {
      title: "✨ Beauty secret unlocked:",
      body: "Pat, don't rub! Gentle patting helps products absorb better.",
      data: { screen: "(tabs)/index" }
    },
    {
      title: "🎯 Expert advice:",
      body: "Wait 60 seconds between each product for maximum effectiveness!",
      data: { screen: "(tabs)/index" }
    },
    {
      title: "💆‍♀️ Skincare hack:",
      body: "Massage in upward motions to boost circulation and reduce puffiness!",
      data: { screen: "(tabs)/index" }
    },
  ],
  community_engagement: [
    {
      title: "Someone just shared their glow-up! 👀",
      body: "Join the community and celebrate their amazing transformation!",
      data: { screen: "(tabs)/community" }
    },
    {
      title: "New beauty tips from the community! 💬",
      body: "See what others are loving this week. You might discover your new favorite!",
      data: { screen: "(tabs)/community" }
    },
    {
      title: "Your glow tribe is active! 🌟",
      body: "Don't miss out on today's trending beauty discussions!",
      data: { screen: "(tabs)/community" }
    },
  ],
  missed_routine: [
    {
      title: "We missed you today! 💔",
      body: "Your skin routine is still here waiting. It's never too late to glow!",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Don't break your streak! 🔥",
      body: "Quick! You still have time to complete today's routine.",
      data: { screen: "(tabs)/glow-coach" }
    },
  ],
  trial_day5_payment: [
    {
      title: "Almost there! 🎯",
      body: "Add payment to continue your transformation. Your trial ends in 2 days!",
      data: { screen: "start-trial" }
    },
    {
      title: "Don't lose your progress! 💎",
      body: "Secure your subscription now. Your personalized plan is waiting!",
      data: { screen: "start-trial" }
    },
  ],
  trial_ending_soon: [
    {
      title: "⏰ Trial ends in 24 hours!",
      body: "Continue your glow journey. Don't lose access to your personalized plan!",
      data: { screen: "subscribe" }
    },
    {
      title: "Last chance! ⏳",
      body: "Your trial expires tomorrow. Keep your transformation going!",
      data: { screen: "subscribe" }
    },
  ],
  results_expiring: [
    {
      title: "Results expire in 24 hours! ⏰",
      body: "Start your free trial to keep your analysis forever!",
      data: { screen: "start-trial" }
    },
    {
      title: "Don't lose your glow score! 💫",
      body: "Your results expire soon. Start trial to unlock full access!",
      data: { screen: "start-trial" }
    },
  ],
  free_scan_used: [
    {
      title: "Loved your results? ✨",
      body: "Start 3-day FREE trial for unlimited scans + progress tracking!",
      data: { screen: "start-trial" }
    },
    {
      title: "Want more insights? 🔍",
      body: "Upgrade to premium for daily scans and personalized recommendations!",
      data: { screen: "start-trial" }
    },
  ],
};

interface ScheduleConfig {
  type: NotificationType;
  hour: number;
  minute: number;
  days?: number[];
}

const NOTIFICATION_SCHEDULE: ScheduleConfig[] = [
  { type: 'morning_motivation', hour: 8, minute: 0 },
  { type: 'pre_routine_reminder', hour: 9, minute: 50 },
  { type: 'routine_reminder', hour: 10, minute: 0 },
  { type: 'midday_boost', hour: 14, minute: 30 },
  { type: 'glow_tip', hour: 16, minute: 0 },
  { type: 'community_engagement', hour: 18, minute: 0 },
  { type: 'evening_wind_down', hour: 21, minute: 30 },
  { type: 'routine_reminder', hour: 22, minute: 0 },
  { type: 'weekly_progress', hour: 10, minute: 0, days: [0] },
];

function getRandomTemplate(type: NotificationType): NotificationTemplate {
  const templates = PREMIUM_NOTIFICATIONS[type];
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

async function getStorageItem(key: string): Promise<string | null> {
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

async function setStorageItem(key: string, value: string): Promise<void> {
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

export async function requestNotificationPermissions(): Promise<boolean> {
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
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return false;
    }
    
    console.log('[Notifications] Permission granted');
    return true;
  } catch (error) {
    console.log('[Notifications] Error requesting permissions:', error);
    return false;
  }
}

export async function scheduleAllNotifications() {
  console.log('[Notifications] Scheduling premium notifications...');
  
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('[Notifications] Cannot schedule - no permission');
    return false;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const scheduledIds: string[] = [];

    for (const config of NOTIFICATION_SCHEDULE) {
      const template = getRandomTemplate(config.type);
      
      const trigger: any = {
        hour: config.hour,
        minute: config.minute,
        repeats: true,
      };

      if (config.days) {
        trigger.weekday = config.days[0] + 1;
      }

      if (Platform.OS === 'web') {
        const now = new Date();
        let scheduleTime = new Date();
        scheduleTime.setHours(config.hour, config.minute, 0, 0);
        
        if (scheduleTime.getTime() <= now.getTime()) {
          scheduleTime.setDate(scheduleTime.getDate() + 1);
        }

        const ms = scheduleTime.getTime() - now.getTime();
        
        setTimeout(() => {
          if ('Notification' in globalThis && Notification.permission === 'granted') {
            new Notification(template.title, { body: template.body });
            
            setInterval(() => {
              const randomTemplate = getRandomTemplate(config.type);
              new Notification(randomTemplate.title, { body: randomTemplate.body });
            }, 24 * 60 * 60 * 1000);
          }
        }, ms);
      } else {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: template.title,
            body: template.body,
            data: template.data || {},
            sound: true,
          },
          trigger,
        });
        
        scheduledIds.push(id);
      }
    }

    await setStorageItem('scheduled_notification_ids', JSON.stringify(scheduledIds));
    console.log(`[Notifications] Scheduled ${scheduledIds.length} notifications successfully`);
    return true;
  } catch (error) {
    console.error('[Notifications] Error scheduling notifications:', error);
    return false;
  }
}

export async function sendStreakNotification(streakDays: number) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  let template: NotificationTemplate;
  
  if (streakDays >= 30) {
    template = PREMIUM_NOTIFICATIONS.consistency_streak[3];
  } else if (streakDays >= 14) {
    template = PREMIUM_NOTIFICATIONS.consistency_streak[2];
  } else if (streakDays >= 7) {
    template = PREMIUM_NOTIFICATIONS.consistency_streak[1];
  } else if (streakDays >= 3) {
    template = PREMIUM_NOTIFICATIONS.consistency_streak[0];
  } else {
    return;
  }

  try {
    if (Platform.OS === 'web') {
      if ('Notification' in globalThis && Notification.permission === 'granted') {
        new Notification(template.title, { body: template.body });
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: template.title,
          body: template.body,
          data: template.data || {},
          sound: true,
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.error('[Notifications] Error sending streak notification:', error);
  }
}

export async function sendMissedRoutineNotification() {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const template = getRandomTemplate('missed_routine');

  try {
    if (Platform.OS === 'web') {
      if ('Notification' in globalThis && Notification.permission === 'granted') {
        new Notification(template.title, { body: template.body });
      }
    } else {
      const trigger: Notifications.TimeIntervalTriggerInput = {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60 * 60 * 2,
        repeats: false,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: template.title,
          body: template.body,
          data: template.data || {},
          sound: true,
        },
        trigger,
      });
    }
  } catch (error) {
    console.error('[Notifications] Error sending missed routine notification:', error);
  }
}

export async function initializeNotifications() {
  console.log('[Notifications] Initializing premium notification system...');
  
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('[Notifications] Permission not granted, skipping scheduling');
      return false;
    }

    await scheduleAllNotifications();
    
    const lastScheduled = await getStorageItem('last_notification_schedule');
    const today = new Date().toDateString();
    
    if (lastScheduled !== today) {
      await scheduleAllNotifications();
      await setStorageItem('last_notification_schedule', today);
    }
    
    return true;
  } catch (error) {
    console.error('[Notifications] Initialization error:', error);
    return false;
  }
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] All notifications cancelled');
  } catch (error) {
    console.error('[Notifications] Error cancelling notifications:', error);
  }
}

export async function getScheduledNotificationsCount(): Promise<number> {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications.length;
  } catch (error) {
    console.error('[Notifications] Error getting scheduled count:', error);
    return 0;
  }
}

export type RoutineType = 'morning' | 'evening';

export async function markRoutineDone(type: RoutineType) {
  const key = `routine_${type}_${new Date().toDateString()}`;
  await setStorageItem(key, '1');
  console.log('[Notifications] Routine marked done:', type);
}

export async function startDailyNotifications() {
  return await initializeNotifications();
}

export async function testNotification() {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('[Notifications] Test notification - no permission');
    return;
  }

  const template = PREMIUM_NOTIFICATIONS.morning_motivation[0];

  try {
    if (Platform.OS === 'web') {
      if ('Notification' in globalThis && Notification.permission === 'granted') {
        new Notification(template.title, { body: template.body });
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: template.title,
          body: template.body,
          sound: true,
        },
        trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, repeats: false },
      });
    }
    console.log('[Notifications] Test notification scheduled');
  } catch (error) {
    console.error('[Notifications] Test notification error:', error);
  }
}

export async function sendTrialDay5Notification() {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const template = getRandomTemplate('trial_day5_payment');

  try {
    if (Platform.OS === 'web') {
      if ('Notification' in globalThis && Notification.permission === 'granted') {
        new Notification(template.title, { body: template.body });
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: template.title,
          body: template.body,
          data: template.data || {},
          sound: true,
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.error('[Notifications] Error sending trial day 5 notification:', error);
  }
}

export async function sendTrialEndingSoonNotification() {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const template = getRandomTemplate('trial_ending_soon');

  try {
    if (Platform.OS === 'web') {
      if ('Notification' in globalThis && Notification.permission === 'granted') {
        new Notification(template.title, { body: template.body });
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: template.title,
          body: template.body,
          data: template.data || {},
          sound: true,
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.error('[Notifications] Error sending trial ending notification:', error);
  }
}

export async function sendResultsExpiringNotification() {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const template = getRandomTemplate('results_expiring');

  try {
    if (Platform.OS === 'web') {
      if ('Notification' in globalThis && Notification.permission === 'granted') {
        new Notification(template.title, { body: template.body });
      }
    } else {
      const trigger: Notifications.TimeIntervalTriggerInput = {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60 * 60 * 24,
        repeats: false,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: template.title,
          body: template.body,
          data: template.data || {},
          sound: true,
        },
        trigger,
      });
    }
  } catch (error) {
    console.error('[Notifications] Error sending results expiring notification:', error);
  }
}

export async function scheduleTrialConversionReminders(resultsUnlockedUntil: string) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('[Notifications] No permission for trial conversion reminders');
    return;
  }

  try {
    const expiryTime = new Date(resultsUnlockedUntil).getTime();
    const now = Date.now();
    
    const sixHoursBeforeExpiry = expiryTime - (6 * 60 * 60 * 1000);
    const twentyTwoHoursBeforeExpiry = expiryTime - (22 * 60 * 60 * 1000);
    
    console.log('[Notifications] Scheduling trial conversion reminders');
    console.log('Expiry:', new Date(expiryTime));
    console.log('6hr reminder:', new Date(sixHoursBeforeExpiry));
    console.log('22hr reminder:', new Date(twentyTwoHoursBeforeExpiry));

    if (Platform.OS === 'web') {
      if (sixHoursBeforeExpiry > now) {
        const ms6hr = sixHoursBeforeExpiry - now;
        setTimeout(() => {
          if ('Notification' in globalThis && Notification.permission === 'granted') {
            new Notification('Results expire in 6 hours! ⏰', {
              body: 'Start your free trial now to keep your analysis forever!',
            });
          }
        }, ms6hr);
        console.log('[Notifications] 6hr reminder scheduled for', new Date(sixHoursBeforeExpiry));
      }

      if (twentyTwoHoursBeforeExpiry > now) {
        const ms22hr = twentyTwoHoursBeforeExpiry - now;
        setTimeout(() => {
          if ('Notification' in globalThis && Notification.permission === 'granted') {
            new Notification('Last chance! Results expire soon! ⏳', {
              body: 'Only 22 hours left to save your glow score. Start trial now!',
            });
          }
        }, ms22hr);
        console.log('[Notifications] 22hr reminder scheduled for', new Date(twentyTwoHoursBeforeExpiry));
      }
    } else {
      const notifications: string[] = [];

      if (sixHoursBeforeExpiry > now) {
        const secondsUntil6hr = Math.floor((sixHoursBeforeExpiry - now) / 1000);
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Results expire in 6 hours! ⏰',
            body: 'Start your free trial now to keep your analysis forever!',
            data: { screen: 'start-trial' },
            sound: true,
          },
          trigger: {
            type: SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntil6hr,
            repeats: false,
          },
        });
        notifications.push(id);
        console.log('[Notifications] 6hr reminder scheduled with ID:', id);
      }

      if (twentyTwoHoursBeforeExpiry > now) {
        const secondsUntil22hr = Math.floor((twentyTwoHoursBeforeExpiry - now) / 1000);
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Last chance! Results expire soon! ⏳',
            body: 'Only 22 hours left to save your glow score. Start trial now!',
            data: { screen: 'start-trial' },
            sound: true,
            badge: 1,
          },
          trigger: {
            type: SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntil22hr,
            repeats: false,
          },
        });
        notifications.push(id);
        console.log('[Notifications] 22hr reminder scheduled with ID:', id);
      }

      if (notifications.length > 0) {
        await setStorageItem('trial_conversion_notification_ids', JSON.stringify(notifications));
        console.log(`[Notifications] Scheduled ${notifications.length} trial conversion reminders`);
      }
    }
  } catch (error) {
    console.error('[Notifications] Error scheduling trial conversion reminders:', error);
  }
}

export async function sendFreeScanUsedNotification() {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const template = getRandomTemplate('free_scan_used');

  try {
    if (Platform.OS === 'web') {
      if ('Notification' in globalThis && Notification.permission === 'granted') {
        new Notification(template.title, { body: template.body });
      }
    } else {
      const trigger: Notifications.TimeIntervalTriggerInput = {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60 * 60,
        repeats: false,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: template.title,
          body: template.body,
          data: template.data || {},
          sound: true,
        },
        trigger,
      });
    }
  } catch (error) {
    console.error('[Notifications] Error sending free scan used notification:', error);
  }
}

export { NotificationType, NotificationTemplate };
