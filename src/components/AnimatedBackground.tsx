import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { useThemeColors } from '../theme/colors';

export default function AnimatedBackground() {
  const { colorScheme } = useColorScheme();
  const theme = useThemeColors(colorScheme);
  const isDark = colorScheme !== 'light';

  const baseGradient = [theme.bgBase, theme.bgPanel, theme.bgBase] as const;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bgBase }]}>
      <LinearGradient
        colors={baseGradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Top Left Amber Glow */}
      <LinearGradient
        colors={['rgba(255, 183, 3, 0.15)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, width: '80%', height: '50%' }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Center Right Orange Glow */}
      <LinearGradient
        colors={['rgba(255, 85, 0, 0.12)', 'transparent']}
        style={{ position: 'absolute', top: '20%', right: 0, width: '70%', height: '60%' }}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0, y: 0.5 }}
      />

      {/* Bottom Left Lime/Neon Glow */}
      <LinearGradient
        colors={['rgba(204, 255, 0, 0.1)', 'transparent']}
        style={{ position: 'absolute', bottom: 0, left: 0, width: '60%', height: '40%' }}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
      />

      {/* Bottom Right White Glow */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'transparent']}
        style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%' }}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
    </View>
  );
}
