import { Platform } from 'react-native';

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

      // In a real app, you would initialize the payment SDK here
      // For now, we'll simulate initialization
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

      // Simulate purchase process
      // In a real app, this would trigger the native payment flow
      console.log('Starting native payment flow...');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For development/testing, simulate successful purchase
      // In production, this would be handled by the actual payment SDK
      const mockResult: PurchaseResult = {
        success: true,
        transactionId: `txn_${Date.now()}_${productId}`,
        purchaseToken: `token_${Date.now()}_${productId}`,
        productId,
      };

      console.log('Purchase completed:', mockResult);
      
      // In a real app, you would verify the purchase with your backend here
      await this.verifyPurchase(mockResult);
      
      return mockResult;
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

      // In a real app, this would restore purchases from the platform
      // For now, return empty array (no previous purchases)
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

      // In a real app, this would check the current subscription status
      // For now, return null (no active subscription)
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

  async cancelSubscription(): Promise<boolean> {
    try {
      console.log('Cancelling subscription...');
      
      // In a real app, you would direct users to the appropriate platform
      // to cancel their subscription
      if (Platform.OS === 'ios') {
        console.log('Directing user to App Store subscription management');
        // You could open the App Store subscription management URL here
      } else if (Platform.OS === 'android') {
        console.log('Directing user to Google Play subscription management');
        // You could open the Google Play subscription management URL here
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