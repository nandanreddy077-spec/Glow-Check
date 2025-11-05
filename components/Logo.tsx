import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  style?: object;
}

const LOGO_URL = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zsc13tion56pq13u5u1wp';

export default function Logo({ size = 80, style }: LogoProps) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: LOGO_URL }}
        style={[styles.logo, { width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4 }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    overflow: 'hidden',
  },
});
