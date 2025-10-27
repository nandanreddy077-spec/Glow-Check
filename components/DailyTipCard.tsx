import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lightbulb, Sparkles, Lock } from 'lucide-react-native';
import { shadow } from '@/constants/theme';
import { DailyTip } from '@/types/routine';

interface DailyTipCardProps {
  tip: DailyTip;
  onUpgrade?: () => void;
}

const CATEGORY_COLORS: Record<string, [string, string]> = {
  skincare: ['#F2C2C2', '#E8A87C'],
  makeup: ['#E8D5F0', '#D4A574'],
  wellness: ['#D4F0E8', '#F5D5C2'],
  nutrition: ['#FFE5CC', '#FFDBB5'],
  lifestyle: ['#E5F4FF', '#D5E8F7'],
};

export default function DailyTipCard({ tip, onUpgrade }: DailyTipCardProps) {
  const colors = CATEGORY_COLORS[tip.category] || CATEGORY_COLORS.skincare;

  if (tip.isPremium && onUpgrade) {
    return (
      <TouchableOpacity onPress={onUpgrade} activeOpacity={0.9}>
        <LinearGradient
          colors={['#F5F5F5', '#ECECEC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, shadow.card]}
        >
          <View style={styles.lockedOverlay}>
            <Lock color="#999" size={24} strokeWidth={2.5} />
            <Text style={styles.lockedText}>Premium Tip</Text>
            <Text style={styles.lockedSubtext}>Unlock with trial or premium</Text>
          </View>

          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: '#E0E0E0' }]}>
              <Text style={styles.icon}>{tip.icon}</Text>
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.category, { color: '#999' }]}>
                {tip.category.toUpperCase()}
              </Text>
              <Text style={[styles.title, { color: '#999' }]} numberOfLines={1}>
                {tip.title}
              </Text>
            </View>
            <View style={styles.lockBadge}>
              <Lock color="#666" size={16} strokeWidth={2.5} />
            </View>
          </View>

          <Text style={[styles.content, { color: '#AAA' }]} numberOfLines={2}>
            {tip.content.substring(0, 40)}...
          </Text>

          <View style={styles.upgradeButton}>
            <Sparkles color="#FF9800" size={16} fill="#FF9800" strokeWidth={2.5} />
            <Text style={styles.upgradeText}>Unlock Now</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, shadow.card]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{tip.icon}</Text>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.category}>{tip.category.toUpperCase()}</Text>
          <Text style={styles.title}>{tip.title}</Text>
        </View>
        <View style={styles.tipBadge}>
          <Lightbulb color="#FFF" size={18} fill="#FFF" strokeWidth={2.5} />
        </View>
      </View>

      <Text style={styles.content}>{tip.content}</Text>

      <View style={styles.footer}>
        <View style={styles.dailyBadge}>
          <Sparkles color="#FFF" size={12} fill="#FFF" strokeWidth={2.5} />
          <Text style={styles.dailyText}>Daily Tip</Text>
        </View>
      </View>

      <View style={styles.decorativeElements}>
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 160,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
  },
  category: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#FFF',
    letterSpacing: 1,
    marginBottom: 4,
    opacity: 0.9,
  },
  title: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFF',
    letterSpacing: -0.2,
  },
  tipBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#FFF',
    lineHeight: 22,
    marginBottom: 16,
    opacity: 0.95,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  dailyText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  decorativeCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
  },
  circle1: {
    width: 100,
    height: 100,
    top: -30,
    right: -20,
  },
  circle2: {
    width: 60,
    height: 60,
    bottom: -15,
    right: 50,
    opacity: 0.6,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lockedText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#666',
    marginTop: 12,
    letterSpacing: -0.2,
  },
  lockedSubtext: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#999',
    marginTop: 4,
  },
  lockBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 16,
    gap: 8,
    ...shadow.elevated,
  },
  upgradeText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FF9800',
    letterSpacing: 0.5,
  },
});
