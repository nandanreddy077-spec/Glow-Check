import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ReferralStats, ReferralHistoryItem } from '@/types/referral';
import * as Clipboard from 'expo-clipboard';
import { Share, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReferralContextType {
  referralCode: string | null;
  referralLink: string;
  stats: ReferralStats | null;
  history: ReferralHistoryItem[];
  loading: boolean;
  error: string | null;
  loadReferralData: () => Promise<void>;
  shareReferralLink: () => Promise<void>;
  copyReferralCode: () => Promise<boolean>;
  copyReferralLink: () => Promise<boolean>;
  trackReferralSignup: (code: string) => Promise<boolean>;
}

const REFERRAL_CODE_KEY = 'lumyn_pending_referral_code';

export const [ReferralProvider, useReferral] = createContextHook<ReferralContextType>(() => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const referralLink = useMemo(() => {
    if (!referralCode) return '';
    const baseUrl = Platform.select({
      web: typeof window !== 'undefined' ? window.location.origin : 'https://lumyn.app',
      default: 'https://lumyn.app'
    });
    return `${baseUrl}?ref=${referralCode}`;
  }, [referralCode]);

  const loadReferralData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: statsData, error: statsError } = await supabase
        .rpc('get_user_referral_stats', { user_uuid: user.id });

      if (statsError) {
        console.error('Error loading referral stats:', statsError);
        
        const { data: codeData, error: codeError } = await supabase
          .from('referral_codes')
          .select('code')
          .eq('user_id', user.id)
          .single();

        if (!codeError && codeData) {
          setReferralCode(codeData.code);
          setStats({
            referralCode: codeData.code,
            totalReferrals: 0,
            totalConversions: 0,
            totalEarned: 0,
            totalPending: 0,
            totalPaidOut: 0,
            conversionRate: 0,
          });
        } else {
          const { data: newCode } = await supabase
            .rpc('create_user_referral_code', { user_uuid: user.id });

          if (newCode) {
            setReferralCode(newCode);
            setStats({
              referralCode: newCode,
              totalReferrals: 0,
              totalConversions: 0,
              totalEarned: 0,
              totalPending: 0,
              totalPaidOut: 0,
              conversionRate: 0,
            });
          }
        }
      } else if (statsData && statsData.length > 0) {
        const stat = statsData[0];
        setReferralCode(stat.referral_code);
        setStats({
          referralCode: stat.referral_code,
          totalReferrals: Number(stat.total_referrals),
          totalConversions: Number(stat.total_conversions),
          totalEarned: Number(stat.total_earned),
          totalPending: Number(stat.total_pending),
          totalPaidOut: Number(stat.total_paid_out),
          conversionRate: Number(stat.conversion_rate),
        });
      }

      const { data: historyData, error: historyError } = await supabase
        .rpc('get_user_referral_history', { user_uuid: user.id });

      if (historyError) {
        console.error('Error loading referral history:', historyError);
      } else if (historyData) {
        setHistory(historyData.map((item: any) => ({
          referralId: item.referral_id,
          referredUserEmail: item.referred_user_email,
          status: item.status,
          rewardAmount: Number(item.reward_amount),
          createdAt: item.created_at,
          convertedAt: item.converted_at,
        })));
      }
    } catch (err) {
      console.error('Error in loadReferralData:', err);
      setError('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);

  const shareReferralLink = useCallback(async () => {
    if (!referralLink || !referralCode) return;

    const message = `Join me on Lumyn - Your AI Beauty & Style Coach! Get personalized skincare routines and style advice. Use my code ${referralCode} to start your glow journey! ${referralLink}`;

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Join Lumyn - AI Beauty Coach',
            text: message,
            url: referralLink,
          });
        } else {
          await Clipboard.setStringAsync(referralLink);
          alert('Referral link copied to clipboard!');
        }
      } else {
        await Share.share({
          message,
          title: 'Join Lumyn - AI Beauty Coach',
          url: referralLink,
        });
      }
    } catch (err) {
      console.error('Error sharing referral link:', err);
    }
  }, [referralLink, referralCode]);

  const copyReferralCode = useCallback(async () => {
    if (!referralCode) return false;
    try {
      await Clipboard.setStringAsync(referralCode);
      return true;
    } catch (err) {
      console.error('Error copying referral code:', err);
      return false;
    }
  }, [referralCode]);

  const copyReferralLink = useCallback(async () => {
    if (!referralLink) return false;
    try {
      await Clipboard.setStringAsync(referralLink);
      return true;
    } catch (err) {
      console.error('Error copying referral link:', err);
      return false;
    }
  }, [referralLink]);

  const trackReferralSignup = useCallback(async (code: string): Promise<boolean> => {
    if (!user?.id) {
      await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);
      return false;
    }

    try {
      const { data, error } = await supabase
        .rpc('track_referral_signup', { 
          referred_user_uuid: user.id, 
          referral_code_text: code 
        });

      if (error) {
        console.error('Error tracking referral signup:', error);
        return false;
      }

      await AsyncStorage.removeItem(REFERRAL_CODE_KEY);
      return data === true;
    } catch (err) {
      console.error('Exception tracking referral signup:', err);
      return false;
    }
  }, [user?.id]);

  useEffect(() => {
    const checkPendingReferral = async () => {
      if (!user?.id) return;
      
      const pendingCode = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
      if (pendingCode) {
        await trackReferralSignup(pendingCode);
      }
    };

    checkPendingReferral();
  }, [user?.id, trackReferralSignup]);

  return useMemo(() => ({
    referralCode,
    referralLink,
    stats,
    history,
    loading,
    error,
    loadReferralData,
    shareReferralLink,
    copyReferralCode,
    copyReferralLink,
    trackReferralSignup,
  }), [
    referralCode,
    referralLink,
    stats,
    history,
    loading,
    error,
    loadReferralData,
    shareReferralLink,
    copyReferralCode,
    copyReferralLink,
    trackReferralSignup,
  ]);
});
