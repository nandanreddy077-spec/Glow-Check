/**
 * Conversion Optimization Helpers
 * Based on female psychology and beauty app best practices
 */

// Removed fake scarcity functions - these were manipulative dark patterns

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
      heading: '✨ Discover Your Unique Beauty',
      subheading: 'Start your personalized glow journey today',
      cta: 'Start 7-Day Free Trial',
      urgency: ''
    };
  } else if (isFreeUser && scansUsed >= 1) {
    return {
      heading: '💫 Continue Your Glow Journey',
      subheading: 'Get unlimited scans and track your progress over time',
      cta: 'Start Free Trial',
      urgency: ''
    };
  } else if (isTrialUser) {
    return {
      heading: '💎 Upgrade to Keep Your Progress',
      subheading: 'Continue tracking your transformation',
      cta: 'Upgrade to Premium',
      urgency: ''
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
    icon: '📸',
    title: 'Unlimited Skin Analysis',
    description: 'Scan as many times as you want, track changes over time'
  },
  {
    icon: '✨',
    title: 'Progress Tracking',
    description: 'Visual timeline showing your skin improvements'
  },
  {
    icon: '🧠',
    title: 'Personalized Recommendations',
    description: 'Custom skincare advice based on your skin type'
  },
  {
    icon: '📊',
    title: 'Detailed Reports',
    description: 'In-depth analysis of all skin metrics and trends'
  },
  {
    icon: '💕',
    title: 'Save Your History',
    description: 'Keep all your scan results forever'
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
