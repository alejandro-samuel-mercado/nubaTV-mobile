import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function AnimatedBackground() {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createAnimation(anim1, 8000).start();
    createAnimation(anim2, 12000).start();
    createAnimation(anim3, 10000).start();
  }, []);

  const spin1 = anim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const scale1 = anim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.5, 1]
  });

  const translateY2 = anim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -height * 0.2]
  });

  const translateX3 = anim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.3]
  });

  return (
    <View style={StyleSheet.absoluteFillObject} className="bg-[#050014]">
      {/* Deep Space Base */}
      <LinearGradient
        colors={['#050014', '#0f0c29', '#302b63', '#050014']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Cyan Aurora (Top Left) */}
      <LinearGradient
        colors={['rgba(0, 242, 254, 0.25)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '60%' }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Magenta/Pink Aurora (Bottom Right) */}
      <LinearGradient
        colors={['rgba(255, 8, 68, 0.2)', 'transparent']}
        style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '70%' }}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0.2 }}
      />

      {/* Lime Accent Aurora (Center Left) */}
      <LinearGradient
        colors={['rgba(217, 249, 67, 0.12)', 'transparent']}
        style={{ position: 'absolute', top: '20%', left: '-20%', width: '100%', height: '60%' }}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.8 }}
      />
      
      {/* Deep Violet Overlay for blending */}
      <LinearGradient
        colors={['transparent', 'rgba(48, 43, 99, 0.4)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </View>
  );
}
