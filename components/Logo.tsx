import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  style?: object;
}

const LOGO_URL = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zsc13tion56pq13u5u1wp';

export default function Logo({ size = 80, style }: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={{ uri: LOGO_URL }}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  logo: {
    borderRadius: 1000,
  },
});
