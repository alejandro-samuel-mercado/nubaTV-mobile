import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { useThemeColors } from '../theme/colors';

export default function AnimatedBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0d0d0d' }]} />
  );
}
