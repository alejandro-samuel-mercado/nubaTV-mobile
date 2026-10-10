import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { useThemeColors } from '../theme/colors';

export default function AnimatedBackground() {
  const { colorScheme } = useColorScheme();
  const theme = useThemeColors(colorScheme);
  const isDark = colorScheme !== 'light';

  // Deep, subtle gradients instead of noisy auroras
  const baseGradient = [theme.bgBase, theme.bgPanel, theme.bgBase] as const;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bgBase }]}>
      <LinearGradient
        colors={baseGradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Extremely subtle brand glow in the top-right corner */}
      <LinearGradient
        colors={[theme.accentGlow, 'transparent']}
        style={{ position: 'absolute', top: 0, right: 0, width: '60%', height: '40%' }}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </View>
  );
}
