import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { getPalette } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface GlowCheckLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const LOGO_URL = 'https://r2-pub.rork.com/generated-images/1d61a6ae-47c0-48c3-a067-40e5455955d5.png';

export default function GlowCheckLogo({ size = 'medium', showText = true }: GlowCheckLogoProps) {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  
  const sizes = {
    small: { logo: 32, text: 18 },
    medium: { logo: 48, text: 24 },
    large: { logo: 64, text: 28 },
  };
  
  const currentSize = sizes[size];
  
  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: LOGO_URL }} 
        style={[styles.logo, { width: currentSize.logo, height: currentSize.logo }]}
        resizeMode="contain"
      />
      {showText && (
        <Text style={[styles.text, { fontSize: currentSize.text, color: palette.textPrimary }]}>
          GlowCheck
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    // Size set dynamically
  },
  text: {
    fontWeight: '900' as const,
    letterSpacing: -0.5,
  },
});
