export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  createdAt: string;
  isActive: boolean;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  status: 'pending' | 'active' | 'inactive' | 'cancelled';
  subscriptionStatus?: 'trial' | 'active' | 'paused' | 'cancelled';
  convertedAt?: string;
  cancelledAt?: string;
  lastPaymentDate?: string;
  totalMonthsPaid: number;
  totalEarned: number;
  monthlyRewardAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralEarnings {
  id: string;
  userId: string;
  totalEarned: number;
  totalPending: number;
  totalPaidOut: number;
  monthlyRecurringRevenue: number;
  activeReferralsCount: number;
  totalReferralsCount: number;
  convertedReferralsCount: number;
  lifetimeMonthsPaid: number;
  updatedAt: string;
}

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  totalConversions: number;
  totalEarned: number;
  totalPending: number;
  totalPaidOut: number;
  monthlyRecurringRevenue: number;
  lifetimeMonthsPaid: number;
  conversionRate: number;
}

export interface ReferralHistoryItem {
  referralId: string;
  referredUserEmail: string;
  status: 'pending' | 'active' | 'inactive' | 'cancelled';
  subscriptionStatus?: 'trial' | 'active' | 'paused' | 'cancelled';
  monthlyRewardAmount: number;
  totalEarned: number;
  totalMonthsPaid: number;
  createdAt: string;
  convertedAt?: string;
  lastPaymentDate?: string;
}

export interface ReferralMonthlyPayout {
  id: string;
  referralId: string;
  referrerId: string;
  referredUserId: string;
  amount: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  status: 'pending' | 'confirmed' | 'paid' | 'failed';
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface ReferralWithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod?: string;
  paymentDetails?: Record<string, any>;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  notes?: string;
}
