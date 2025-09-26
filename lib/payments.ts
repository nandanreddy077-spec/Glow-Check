import { Platform, Linking, Alert } from 'react-native';

// Note: In production build, you'll need to install react-native-purchases
// For Expo managed workflow, use: expo install react-native-purchases
// import Purchases from 'react-native-purchases';

// RevenueCat Configuration
export const REVENUECAT_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || 'YOUR_REVENUECAT_PUBLIC_API_KEY',
  ENTITLEMENT_ID: 'premium', // This should match your RevenueCat entitlement
} as const;

// Product IDs for App Store and Google Play
export const PRODUCT_IDS = {
  MONTHLY: 'com.glowcheck.app.premium.monthly',
  YEARLY: 'com.glowcheck.app.premium.annual',
} as const;

// App Store Connect Configuration
export const APP_STORE_CONFIG = {
  TEAM_ID: '2V4DJQD8G3',
  BUNDLE_ID: 'com.glowcheck01.app',
  SHARED_SECRET: '5063e6dd7c174550b12001c140f6b803',
} as const;

// Google Play Configuration
export const GOOGLE_PLAY_CONFIG = {
  PACKAGE_NAME: 'com.glowcheck01.app',
  SERVICE_ACCOUNT_KEY: 'google-services.json',
} as const;

// Pricing Configuration
export const PRICING = {
  MONTHLY: {
    price: 8.99,
    currency: 'USD',
    period: 'P1M', // ISO 8601 duration format
    trialPeriod: 'P3D', // 3 days free trial
  },
  YEARLY: {
    price: 99.00,
    currency: 'USD',
    period: 'P1Y', // ISO 8601 duration format
    trialPeriod: 'P3D', // 3 days free trial
  },
} as const;

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  purchaseToken?: string;
  productId?: string;
  error?: string;
  cancelled?: boolean;
}

export interface SubscriptionInfo {
  isActive: boolean;
  productId: string;
  purchaseDate: string;
  expiryDate: string;
  isTrialPeriod: boolean;
  autoRenewing: boolean;
  originalTransactionId?: string;
  purchaseToken?: string;
}

class PaymentService {
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing payment service...');
      
      if (Platform.OS === 'web') {
        console.log('Payment service not available on web');
        return false;
      }

      // In production build with react-native-purchases:
      /*
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      await Purchases.configure({
        apiKey: REVENUECAT_CONFIG.API_KEY,
        appUserID: null, // Optional: set user ID
      });
      */
      
      // For Expo Go, we'll simulate initialization
      this.isInitialized = true;
      console.log('Payment service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize payment service:', error);
      return false;
    }
  }

  async getProducts(): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // In a real app, this would fetch actual product information from the stores
      const products = [
        {
          productId: PRODUCT_IDS.MONTHLY,
          price: PRICING.MONTHLY.price,
          currency: PRICING.MONTHLY.currency,
          title: 'Monthly Glow Premium',
          description: 'Unlimited scans, AI coach, and premium features',
          subscriptionPeriod: PRICING.MONTHLY.period,
          freeTrialPeriod: PRICING.MONTHLY.trialPeriod,
        },
        {
          productId: PRODUCT_IDS.YEARLY,
          price: PRICING.YEARLY.price,
          currency: PRICING.YEARLY.currency,
          title: 'Yearly Glow Premium',
          description: 'Unlimited scans, AI coach, and premium features - Best Value!',
          subscriptionPeriod: PRICING.YEARLY.period,
          freeTrialPeriod: PRICING.YEARLY.trialPeriod,
        },
      ];

      console.log('Retrieved products:', products);
      return products;
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    try {
      console.log(`Attempting to purchase product: ${productId}`);
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (Platform.OS === 'web') {
        return {
          success: false,
          error: 'In-app purchases are not supported on web. Please use the mobile app.',
        };
      }

      // Check if running in Expo Go (development)
      const isExpoGo = __DEV__ && (Platform.OS === 'ios' ? 
        (await import('expo-constants')).default.appOwnership === 'expo' : 
        true);

      if (isExpoGo) {
        // For Expo Go, redirect to store
        console.log('Running in Expo Go - redirecting to store for subscription...');
        
        const storeUrl = this.getStoreSubscriptionUrl();
        const canOpen = await Linking.canOpenURL(storeUrl);
        
        if (canOpen) {
          await Linking.openURL(storeUrl);
          return {
            success: false,
            error: 'STORE_REDIRECT',
            productId,
          };
        } else {
          return {
            success: false,
            error: 'Unable to open app store. Please visit the App Store or Google Play Store manually to subscribe.',
          };
        }
      }

      // Production build with react-native-purchases:
      /*
      try {
        const offerings = await Purchases.getOfferings();
        const currentOffering = offerings.current;
        
        if (!currentOffering) {
          throw new Error('No offerings available');
        }
        
        const packageToPurchase = currentOffering.availablePackages.find(
          pkg => pkg.product.identifier === productId
        );
        
        if (!packageToPurchase) {
          throw new Error(`Product ${productId} not found`);
        }
        
        const purchaseResult = await Purchases.purchasePackage(packageToPurchase);
        
        if (purchaseResult.customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID]) {
          return {
            success: true,
            transactionId: purchaseResult.transaction?.transactionIdentifier,
            productId: productId,
          };
        } else {
          return {
            success: false,
            error: 'Purchase completed but entitlement not active',
          };
        }
      } catch (purchaseError: any) {
        if (purchaseError.userCancelled) {
          return {
            success: false,
            cancelled: true,
            error: 'Purchase cancelled by user',
          };
        }
        throw purchaseError;
      }
      */
      
      // Fallback for development
      return {
        success: false,
        error: 'Payment system not configured for development environment',
      };
    } catch (error) {
      console.error('Purchase failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  async restorePurchases(): Promise<SubscriptionInfo[]> {
    try {
      console.log('Restoring purchases...');
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (Platform.OS === 'web') {
        return [];
      }

      // Production build with react-native-purchases:
      /*
      try {
        const customerInfo = await Purchases.restorePurchases();
        const activeEntitlements = Object.values(customerInfo.entitlements.active);
        
        return activeEntitlements.map(entitlement => ({
          isActive: true,
          productId: entitlement.productIdentifier,
          purchaseDate: entitlement.originalPurchaseDate,
          expiryDate: entitlement.expirationDate || '',
          isTrialPeriod: entitlement.isTrialPeriod,
          autoRenewing: entitlement.willRenew,
          originalTransactionId: entitlement.originalTransactionId,
        }));
      } catch (error) {
        console.error('Failed to restore purchases:', error);
      }
      */
      
      // For development, return empty array
      return [];
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return [];
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionInfo | null> {
    try {
      console.log('Checking subscription status...');
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (Platform.OS === 'web') {
        return null;
      }

      // Production build with react-native-purchases:
      /*
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID];
        
        if (entitlement) {
          return {
            isActive: true,
            productId: entitlement.productIdentifier,
            purchaseDate: entitlement.originalPurchaseDate,
            expiryDate: entitlement.expirationDate || '',
            isTrialPeriod: entitlement.isTrialPeriod,
            autoRenewing: entitlement.willRenew,
            originalTransactionId: entitlement.originalTransactionId,
          };
        }
      } catch (error) {
        console.error('Failed to get customer info:', error);
      }
      */
      
      // For development, return null (no active subscription)
      return null;
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return null;
    }
  }

  private async verifyPurchase(purchase: PurchaseResult): Promise<boolean> {
    try {
      console.log('Verifying purchase with backend...');
      
      // In a real app, you would send the purchase data to your backend
      // for verification with Apple/Google servers
      const verificationData = {
        platform: Platform.OS,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        purchaseToken: purchase.purchaseToken,
        timestamp: Date.now(),
      };

      console.log('Verification data:', verificationData);
      
      // Simulate backend verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Purchase verified successfully');
      return true;
    } catch (error) {
      console.error('Purchase verification failed:', error);
      return false;
    }
  }

  private getStoreSubscriptionUrl(): string {
    if (Platform.OS === 'ios') {
      // iOS App Store - you'll need to replace 'YOUR_APP_ID' with your actual App Store app ID
      // For now, redirect to App Store search for your app name
      return `https://apps.apple.com/search?term=glow%20check%20beauty`;
    } else {
      // Google Play Store subscription URL
      return `https://play.google.com/store/apps/details?id=${GOOGLE_PLAY_CONFIG.PACKAGE_NAME}`;
    }
  }

  async openSubscriptionManagement(): Promise<boolean> {
    try {
      console.log('Opening subscription management...');
      
      let url: string;
      if (Platform.OS === 'ios') {
        // iOS subscription management
        url = 'https://apps.apple.com/account/subscriptions';
      } else {
        // Android subscription management
        url = 'https://play.google.com/store/account/subscriptions';
      }
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to open subscription management:', error);
      return false;
    }
  }

  async cancelSubscription(): Promise<boolean> {
    try {
      console.log('Directing user to cancel subscription...');
      
      const opened = await this.openSubscriptionManagement();
      if (!opened) {
        // Fallback: Show instructions
        Alert.alert(
          'Manage Subscription',
          Platform.OS === 'ios' 
            ? 'To cancel your subscription:\n\n1. Open Settings on your device\n2. Tap your Apple ID\n3. Tap Subscriptions\n4. Find Glow Check and tap Cancel'
            : 'To cancel your subscription:\n\n1. Open Google Play Store\n2. Tap Menu → Subscriptions\n3. Find Glow Check and tap Cancel',
          [{ text: 'OK' }]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }
}

export const paymentService = new PaymentService();

// Helper functions for subscription management
export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
};

export const getTrialEndDate = (startDate: Date = new Date()): Date => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 3); // 3 days trial
  return endDate;
};

export const isTrialActive = (trialEndDate: string): boolean => {
  return new Date(trialEndDate) > new Date();
};

export const getDaysUntilExpiry = (expiryDate: string): number => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Revenue tracking and analytics
export const trackPurchaseEvent = (productId: string, price: number, currency: string) => {
  console.log('Purchase event tracked:', { productId, price, currency });
  // In a real app, you would send this to your analytics service
};

export const trackTrialStartEvent = () => {
  console.log('Trial start event tracked');
  // In a real app, you would send this to your analytics service
};

export const trackSubscriptionCancelEvent = (productId: string, reason?: string) => {
  console.log('Subscription cancel event tracked:', { productId, reason });
  // In a real app, you would send this to your analytics service
};