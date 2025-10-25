import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { Clock } from 'lucide-react-native';

interface CountdownTimerProps {
  expiryTime: string | null;
  style?: any;
  textStyle?: any;
  showIcon?: boolean;
}

export default function CountdownTimer({ expiryTime, style, textStyle, showIcon = true }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (!expiryTime) return;

    const updateTimer = () => {
      const diff = new Date(expiryTime).getTime() - Date.now();
      
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      clearInterval(interval);
      pulse.stop();
    };
  }, [expiryTime, pulseAnim]);

  if (!expiryTime || !timeLeft) return null;

  return (
    <Animated.View style={[styles.container, style, { transform: [{ scale: pulseAnim }] }]}>
      {showIcon && <Clock color="#FFF" size={16} strokeWidth={2.5} />}
      <Text style={[styles.text, textStyle]}>
        {timeLeft}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
  },
  text: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
