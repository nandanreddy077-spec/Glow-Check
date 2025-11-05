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
      title: "Your skin missed you last night 😴",
      body: "But it's ready to forgive. Let's glow up together this morning!",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Bestie, your skincare is waiting ☕️",
      body: "Coffee first or glow first? (Hint: Both!) 3 mins to radiance.",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Good morning, gorgeous! ☀️",
      body: "1,247 women just did their routine. You're next, right? 😉",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Remember that glow you wanted? 🌟",
      body: "It starts with 5 mins today. Future you is already thankful.",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Plot twist: You woke up flawless 💁‍♀️",
      body: "Kidding! But you will be after this 4-min routine. Let's go!",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Your mirror is calling... 🪞",
      body: "Time to show your skin some serious love. It deserves it!",
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
      title: "Netflix can wait. Your skin can't! 🌙",
      body: "5 mins now = tomorrow's compliments. Worth it?",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Before you scroll to sleep... 📱",
      body: "Give your skin the TLC it needs. Your pillowcase will thank you!",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Psst... beauty sleep starts now 😴✨",
      body: "But first, the 5-min evening ritual that changes everything.",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Today's makeup: Off. Tonight's glow: On 💫",
      body: "Time to let your skin breathe and repair. You've got this!",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Dear skin, we're sorry for the day 🌙",
      body: "But we're about to make it all better. Evening glow time!",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "The secret to waking up flawless? 🤫",
      body: "This 6-min evening routine. Shall we?",
      data: { screen: "(tabs)/glow-coach" }
    },
  ],
  consistency_streak: [
    {
      title: "3 days in! You're literally glowing 🔥",
      body: "Your skin cells are throwing a party. Keep it going!",
      data: { screen: "(tabs)/profile" }
    },
    {
      title: "WEEK ONE COMPLETE! 🎉🎉🎉",
      body: "You just lapped everyone still thinking about starting. Legend!",
      data: { screen: "(tabs)/profile" }
    },
    {
      title: "14 days?! Who even are you? 😱👑",
      body: "This is where skin transformation goes from 'meh' to 'WOW!'",
      data: { screen: "(tabs)/profile" }
    },
    {
      title: "30 DAYS! You're basically a superhero 💎",
      body: "Only 3% make it this far. Your skin is unrecognizable (in a good way!)",
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
      title: "Spill the tea ☕: Dermatologist secret",
      body: "Thin to thick product order = 3x better absorption. Mind. Blown. 🤯",
      data: { screen: "(tabs)/index" }
    },
    {
      title: "Your grandma was right about this 👵✨",
      body: "Pat, don't rub! Her skin looked amazing for a reason.",
      data: { screen: "(tabs)/index" }
    },
    {
      title: "Plot twist: You're doing it wrong 😱",
      body: "Wait 60 secs between products for 2x effectiveness. Who knew?!",
      data: { screen: "(tabs)/index" }
    },
    {
      title: "This one trick costs $0 💰",
      body: "Upward massage motions = natural facelift. You're welcome!",
      data: { screen: "(tabs)/index" }
    },
    {
      title: "Why didn't anyone tell us this sooner?! 🤦‍♀️",
      body: "Damp skin absorbs products 10x better. Game changer!",
      data: { screen: "(tabs)/index" }
    },
    {
      title: "Rich auntie energy unlocked 💅",
      body: "Silk pillowcase = less wrinkles. Invest in your sleep!",
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
      title: "Your skincare routine is ghosting you 👻",
      body: "But unlike your ex, it'll take you back. 2 hours left!",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Houston, we have a problem 🚨",
      body: "Your 7-day streak is in danger! Quick 5-min save?",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Plot twist: Your skin is judging you 😏",
      body: "JK! But seriously, you've got 3 hours to keep that streak alive.",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "This is awkward... 😬",
      body: "Your morning routine is still waiting. Coffee break glow-up?",
      data: { screen: "(tabs)/glow-coach" }
    },
    {
      title: "Breaking: Local woman too busy to glow 📰",
      body: "But wait! She has 90 mins to prove them wrong. That's you!",
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
      body: "Start 7-day FREE trial for unlimited scans + progress tracking!",
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

export async function scheduleAllNotifications(userContext?: {
  isTrialUser?: boolean;
  isPremium?: boolean;
  hasUsedFreeScan?: boolean;
  trialDaysLeft?: number;
  lastScanDate?: string;
}) {
  console.log('[Notifications] Scheduling smart notifications with context:', userContext);
  
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('[Notifications] Cannot schedule - no permission');
    return false;
  }

  try {
    const lastScheduledStr = await getStorageItem('last_notification_schedule');
    const lastScheduled = lastScheduledStr ? new Date(lastScheduledStr) : null;
    const now = new Date();
    
    if (lastScheduled && (now.getTime() - lastScheduled.getTime()) < 12 * 60 * 60 * 1000) {
      console.log('[Notifications] Already scheduled in last 12 hours, skipping');
      return true;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const scheduledIds: string[] = [];
    const schedule = getSmartNotificationSchedule(userContext);

    for (const config of schedule) {
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
        console.log('[Notifications] Web notification scheduling skipped - handled by context');
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
    await setStorageItem('last_notification_schedule', now.toISOString());
    console.log(`[Notifications] Scheduled ${scheduledIds.length} smart notifications`);
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

export async function sendMorningRoutineReminder() {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const dateKey = new Date().toDateString();
  const morningRoutineDone = await getStorageItem(`routine_morning_${dateKey}`);
  
  if (morningRoutineDone) {
    console.log('[Notifications] Morning routine already done, skipping reminder');
    return;
  }

  const template = getRandomTemplate('morning_motivation');

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
    console.log('[Notifications] Sent morning routine reminder');
  } catch (error) {
    console.error('[Notifications] Error sending morning routine reminder:', error);
  }
}

export async function sendEveningRoutineReminder() {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const dateKey = new Date().toDateString();
  const eveningRoutineDone = await getStorageItem(`routine_evening_${dateKey}`);
  
  if (eveningRoutineDone) {
    console.log('[Notifications] Evening routine already done, skipping reminder');
    return;
  }

  const template = getRandomTemplate('evening_wind_down');

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
    console.log('[Notifications] Sent evening routine reminder');
  } catch (error) {
    console.error('[Notifications] Error sending evening routine reminder:', error);
  }
}

export async function sendMissedRoutineNotification(routineType: 'morning' | 'evening' = 'morning') {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const dateKey = new Date().toDateString();
  const routineDone = await getStorageItem(`routine_${routineType}_${dateKey}`);
  
  if (routineDone) {
    console.log(`[Notifications] ${routineType} routine already done, skipping missed notification`);
    return;
  }

  const template = getRandomTemplate('missed_routine');
  const customTitle = routineType === 'morning' 
    ? template.title
    : template.title.replace('morning', 'evening').replace('Coffee break', 'Evening wind-down');

  try {
    if (Platform.OS === 'web') {
      if ('Notification' in globalThis && Notification.permission === 'granted') {
        new Notification(customTitle, { body: template.body });
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: customTitle,
          body: template.body,
          data: { ...template.data, routineType },
          sound: true,
        },
        trigger: null,
      });
    }
    console.log(`[Notifications] Sent ${routineType} missed routine notification immediately`);
  } catch (error) {
    console.error('[Notifications] Error sending missed routine notification:', error);
  }
}

function getSmartNotificationSchedule(userContext?: {
  isTrialUser?: boolean;
  isPremium?: boolean;
  hasUsedFreeScan?: boolean;
  trialDaysLeft?: number;
  lastScanDate?: string;
}): ScheduleConfig[] {
  const baseSchedule: ScheduleConfig[] = [];
  
  if (!userContext) {
    return [
      { type: 'glow_tip', hour: 17, minute: 0 },
    ];
  }

  if (userContext.isPremium) {
    return [
      { type: 'midday_boost', hour: 14, minute: 0 },
      { type: 'glow_tip', hour: 16, minute: 0 },
      { type: 'community_engagement', hour: 19, minute: 0 },
      { type: 'weekly_progress', hour: 10, minute: 0, days: [0] },
    ];
  }

  if (userContext.isTrialUser) {
    baseSchedule.push(
      { type: 'glow_tip', hour: 16, minute: 0 },
    );

    if (userContext.trialDaysLeft && userContext.trialDaysLeft <= 2) {
      baseSchedule.push(
        { type: 'trial_ending_soon', hour: 19, minute: 0 },
      );
    }

    if (userContext.trialDaysLeft === 5) {
      baseSchedule.push(
        { type: 'trial_day5_payment', hour: 18, minute: 0 },
      );
    }

    return baseSchedule;
  }

  if (userContext.hasUsedFreeScan) {
    return [
      { type: 'results_expiring', hour: 19, minute: 0 },
      { type: 'free_scan_used', hour: 14, minute: 0 },
    ];
  }

  return [
    { type: 'glow_tip', hour: 17, minute: 0 },
  ];
}

export async function initializeNotifications(userContext?: {
  isTrialUser?: boolean;
  isPremium?: boolean;
  hasUsedFreeScan?: boolean;
  trialDaysLeft?: number;
  lastScanDate?: string;
}) {
  console.log('[Notifications] Initializing smart notification system...');
  
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('[Notifications] Permission not granted, skipping');
      return false;
    }

    await scheduleAllNotifications(userContext);
    
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
