/**
 * Conversion Optimization Helpers
 * Based on female psychology and beauty app best practices
 */

/**
 * Generate dynamic scarcity numbers (realistic but attention-grabbing)
 */
export function getTrialSpotsLeft(): number {
  const hour = new Date().getHours();
  const baseSpots = 7;
  const variation = Math.floor(Math.sin(hour) * 3);
  return Math.max(3, Math.min(12, baseSpots + variation));
}

/**
 * Generate social proof numbers (upgrades this week)
 */
export function getUpgradesThisWeek(): number {
  const dayOfWeek = new Date().getDay();
  const baseNumber = 12487;
  const dailyIncrease = 1247;
  return baseNumber + (dayOfWeek * dailyIncrease);
}

/**
 * Generate active users count
 */
export function getActiveUsersCount(): number {
  const hour = new Date().getHours();
  const isPeakTime = hour >= 19 && hour <= 22;
  const baseUsers = 47283;
  const peakBonus = isPeakTime ? 3421 : 0;
  return baseUsers + peakBonus;
}

/**
 * Generate testimonials for conversion optimization
 */
export interface Testimonial {
  name: string;
  achievement: string;
  timeframe: string;
  verified: boolean;
  avatar: string;
}

export const conversionTestimonials: Testimonial[] = [
  {
    name: 'Sarah',
    achievement: 'improved her glow score by 23 points',
    timeframe: '30 days',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    name: 'Emma',
    achievement: 'achieved radiant skin',
    timeframe: '21 days',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  {
    name: 'Maya',
    achievement: 'transformed her skincare routine',
    timeframe: '14 days',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
  },
  {
    name: 'Isabella',
    achievement: 'reached her glow goals',
    timeframe: '45 days',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face'
  }
];

/**
 * Get a random testimonial
 */
export function getRandomTestimonial(): Testimonial {
  const index = Math.floor(Math.random() * conversionTestimonials.length);
  return conversionTestimonials[index];
}

/**
 * Calculate time remaining until expiry
 */
export function getTimeRemaining(expiryTime: string): {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isUrgent: boolean;
} {
  const now = Date.now();
  const expiry = new Date(expiryTime).getTime();
  const diff = expiry - now;

  if (diff <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      isUrgent: false
    };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const isUrgent = hours < 6;

  return {
    hours,
    minutes,
    seconds,
    isExpired: false,
    isUrgent
  };
}

/**
 * Get urgency message based on time remaining
 */
export function getUrgencyMessage(hoursRemaining: number): string {
  if (hoursRemaining < 1) {
    return '⚠️ URGENT: Results expire in less than 1 hour!';
  } else if (hoursRemaining < 6) {
    return `🔥 Hurry! Results expire in ${hoursRemaining} hours!`;
  } else if (hoursRemaining < 24) {
    return `⏰ Results expire today! ${hoursRemaining} hours left`;
  } else {
    return `✨ Results available for ${hoursRemaining} more hours`;
  }
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(hours: number, minutes: number, seconds: number): string {
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Get conversion copy based on user state
 */
export interface ConversionCopy {
  heading: string;
  subheading: string;
  cta: string;
  urgency: string;
}

export function getConversionCopy(
  isFreeUser: boolean,
  isTrialUser: boolean,
  scansUsed: number
): ConversionCopy {
  if (isFreeUser && scansUsed === 0) {
    return {
      heading: '🎁 Your Personal Glow Journey Awaits',
      subheading: 'Unlock unlimited AI-powered beauty analysis',
      cta: 'Start 3-Day Free Trial',
      urgency: 'Only 7 trial spots left today!'
    };
  } else if (isFreeUser && scansUsed >= 1) {
    return {
      heading: '✨ Ready to Transform Your Glow?',
      subheading: 'Join 47,283 women tracking their beauty journey',
      cta: 'Unlock Full Analysis',
      urgency: 'Don\'t lose your results! They expire in 48 hours'
    };
  } else if (isTrialUser) {
    return {
      heading: '💎 Upgrade to Keep Your Glow Forever',
      subheading: 'Don\'t lose your progress and insights',
      cta: 'Continue Unlimited Access',
      urgency: 'Your trial ends soon - Keep all your data!'
    };
  }

  return {
    heading: '🌟 Welcome Back, Beautiful!',
    subheading: 'Continue your transformation journey',
    cta: 'View My Glow Plan',
    urgency: ''
  };
}

/**
 * Premium features for conversion messaging
 */
export const premiumFeatures = [
  {
    icon: '✨',
    title: 'Unlimited AI Analysis',
    description: 'Scan as many times as you want, track your progress'
  },
  {
    icon: '📸',
    title: 'Progress Photo Timeline',
    description: 'Visual journey of your transformation with before/after'
  },
  {
    icon: '💬',
    title: 'Personal Beauty Coach',
    description: 'AI-powered daily tips personalized just for you'
  },
  {
    icon: '👗',
    title: 'Style Guide & Recommendations',
    description: 'Discover your aesthetic with AI outfit suggestions'
  },
  {
    icon: '🎯',
    title: 'Product Tracking & Alerts',
    description: 'Never waste products - track expiry and effectiveness'
  },
  {
    icon: '🌸',
    title: 'Circle Community Access',
    description: 'Share your journey with 47k+ supportive women'
  },
  {
    icon: '🌦️',
    title: 'Seasonal Skin Advisor',
    description: 'Weather-based skincare tips and product recommendations'
  }
];

/**
 * Get achievement badges based on score
 */
export function getAchievementBadge(score: number): {
  badge: string;
  icon: string;
  color: string;
  message: string;
} {
  if (score >= 90) {
    return {
      badge: 'Diamond Glow',
      icon: '💎',
      color: '#E8D5F0',
      message: 'Outstanding! You\'re glowing like a diamond!'
    };
  } else if (score >= 85) {
    return {
      badge: 'Platinum Glow',
      icon: '💫',
      color: '#F2C2C2',
      message: 'Amazing! Your glow is truly radiant!'
    };
  } else if (score >= 80) {
    return {
      badge: 'Gold Glow',
      icon: '✨',
      color: '#F5E6D3',
      message: 'Excellent! You\'re shining bright!'
    };
  } else if (score >= 75) {
    return {
      badge: 'Silver Glow',
      icon: '🌟',
      color: '#D4F0E8',
      message: 'Very good! Your glow is beautiful!'
    };
  } else {
    return {
      badge: 'Rising Glow',
      icon: '⭐',
      color: '#FFF0E5',
      message: 'Great start! Your glow journey begins!'
    };
  }
}
