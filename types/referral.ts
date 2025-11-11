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
  status: 'pending' | 'converted' | 'paid';
  convertedAt?: string;
  paidAt?: string;
  rewardAmount: number;
  createdAt: string;
}

export interface ReferralEarnings {
  id: string;
  userId: string;
  totalEarned: number;
  totalPending: number;
  totalPaidOut: number;
  referralCount: number;
  conversionCount: number;
  updatedAt: string;
}

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalConversions: number;
  totalEarned: number;
  totalPending: number;
  totalPaidOut: number;
  conversionRate: number;
}

export interface ReferralHistoryItem {
  referralId: string;
  referredUserEmail: string;
  status: 'pending' | 'converted' | 'paid';
  rewardAmount: number;
  createdAt: string;
  convertedAt?: string;
}

export interface ReferralPayout {
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
