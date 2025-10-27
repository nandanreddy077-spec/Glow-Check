import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, TrendingUp } from 'lucide-react-native';
import { shadow } from '@/constants/theme';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
}

export default function StreakCounter({ currentStreak, longestStreak }: StreakCounterProps) {
  const getStreakColor = (): [string, string] => {
    if (currentStreak >= 30) return ['#FF6B35', '#F7931E'];
    if (currentStreak >= 14) return ['#F7931E', '#FFC837'];
    if (currentStreak >= 7) return ['#FF9800', '#FFB74D'];
    if (currentStreak >= 3) return ['#FFB74D', '#FFCC80'];
    return ['#FFE0B2', '#FFECB3'];
  };

  const getStreakMessage = () => {
    if (currentStreak === 0) return 'Start your streak today!';
    if (currentStreak === 1) return 'Great start!';
    if (currentStreak >= 30) return 'Legendary streak!';
    if (currentStreak >= 14) return 'On fire!';
    if (currentStreak >= 7) return 'Week strong!';
    if (currentStreak >= 3) return 'Building momentum!';
    return 'Keep going!';
  };

  return (
    <LinearGradient
      colors={getStreakColor()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, shadow.elevated]}
    >
      <View style={styles.flameContainer}>
        <Flame
          color="#FFF"
          size={48}
          fill={currentStreak > 0 ? '#FFF' : 'transparent'}
          strokeWidth={2.5}
        />
        {currentStreak > 0 && (
          <View style={styles.glowEffect}>
            <Flame
              color="#FFE0B2"
              size={56}
              fill="#FFE0B2"
              strokeWidth={0}
              style={styles.glowFlame}
            />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.streakRow}>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>DAY STREAK</Text>
        </View>
        <Text style={styles.streakMessage}>{getStreakMessage()}</Text>

        {longestStreak > currentStreak && (
          <View style={styles.bestRow}>
            <TrendingUp color="#FFF" size={14} strokeWidth={2.5} />
            <Text style={styles.bestText}>Best: {longestStreak} days</Text>
          </View>
        )}
      </View>

      <View style={styles.decorativeElements}>
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        <View style={[styles.decorativeCircle, styles.circle3]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  flameContainer: {
    marginRight: 20,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
    opacity: 0.3,
  },
  glowFlame: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  streakNumber: {
    fontSize: 42,
    fontWeight: '900' as const,
    color: '#FFF',
    marginRight: 12,
    letterSpacing: -1,
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFF',
    letterSpacing: 1.2,
    opacity: 0.9,
  },
  streakMessage: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFF',
    marginBottom: 8,
    opacity: 0.95,
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bestText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFF',
    opacity: 0.85,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 999,
  },
  circle1: {
    width: 80,
    height: 80,
    top: -20,
    right: -10,
  },
  circle2: {
    width: 50,
    height: 50,
    bottom: -10,
    right: 40,
    opacity: 0.6,
  },
  circle3: {
    width: 30,
    height: 30,
    top: 30,
    right: 70,
    opacity: 0.4,
  },
});
