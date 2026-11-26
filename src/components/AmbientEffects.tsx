import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useSegments } from "expo-router";
import React, { memo, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useAppTheme } from "../contexts/SettingsContext";

const rnd = (seed: number) => {
  const x = Math.sin(seed * 9127 + 41183) * 192831;
  return x - Math.floor(x);
};

const STAR_COLORS = [
  "rgba(255, 198, 88, 0.95)",
  "rgba(253, 164, 175, 0.90)",
  "rgba(147, 197, 253, 0.92)",
  "rgba(255, 255, 255, 0.96)",
];

const DUST_COLORS = [
  "rgba(255, 183, 3, 0.65)",
  "rgba(167, 139, 250, 0.60)",
  "rgba(96, 165, 250, 0.55)",
];

const TwinkleStar = memo(function TwinkleStar({
  i,
  width,
  height,
  isLight,
}: {
  i: number;
  width: number;
  height: number;
  isLight: boolean;
}) {
  const v = useRef(new Animated.Value(rnd(i + 10))).current;

  useEffect(() => {
    const duration = 2200 + rnd(i + 4) * 3800;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(rnd(i + 5) * 2000),
        Animated.timing(v, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [i, v]);

  const rSize = rnd(i + 1);
  const size = rSize > 0.86 ? 2.6 : rSize > 0.52 ? 1.8 : 1.2;
  const color = isLight
    ? "rgba(180, 83, 9, 0.55)"
    : STAR_COLORS[Math.floor(rnd(i + 7) * STAR_COLORS.length)];

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: rnd(i + 2) * width,
        top: rnd(i + 3) * height,
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: color,
        opacity: v.interpolate({
          inputRange: [0, 1],
          outputRange: isLight ? [0.15, 0.55] : [0.18, 0.95],
        }),
        transform: [
          {
            scale: v.interpolate({
              inputRange: [0, 1],
              outputRange: [0.75, 1.4],
            }),
          },
        ],
      }}
    />
  );
});

const CrossSparkle = memo(function CrossSparkle({
  i,
  width,
  height,
  isLight,
}: {
  i: number;
  width: number;
  height: number;
  isLight: boolean;
}) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dur = 2600 + rnd(i + 31) * 3200;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(rnd(i + 32) * 3000),
        Animated.timing(v, {
          toValue: 1,
          duration: dur,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: dur,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [i, v]);

  const size = 10 + Math.round(rnd(i + 33) * 6);
  const baseScale = 0.65 + rnd(i + 34) * 0.55;
  const color = isLight ? "rgba(180, 83, 9, 0.45)" : "rgba(255, 235, 190, 0.92)";

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: (0.06 + rnd(i + 35) * 0.88) * width,
        top: (0.06 + rnd(i + 36) * 0.84) * height,
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        opacity: v.interpolate({
          inputRange: [0, 1],
          outputRange: isLight ? [0.05, 0.3] : [0.06, 0.8],
        }),
        transform: [
          {
            scale: v.interpolate({
              inputRange: [0, 1],
              outputRange: [baseScale * 0.35, baseScale * 1.15],
            }),
          },
          {
            rotate: v.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "45deg"],
            }),
          },
        ],
      }}
    >
      <View
        style={{
          position: "absolute",
          width: size,
          height: 1.3,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 1.3,
          height: size,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
    </Animated.View>
  );
});

const CosmicDust = memo(function CosmicDust({
  i,
  width,
  height,
  isLight,
}: {
  i: number;
  width: number;
  height: number;
  isLight: boolean;
}) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dur = 14000 + rnd(i + 61) * 14000;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(rnd(i + 62) * 5000),
        Animated.timing(v, {
          toValue: 1,
          duration: dur,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [i, v]);

  const size = 2 + rnd(i + 63) * 2.4;
  const driftX = (rnd(i + 64) - 0.5) * 90;
  const color = isLight
    ? "rgba(217, 119, 6, 0.35)"
    : DUST_COLORS[Math.floor(rnd(i + 65) * DUST_COLORS.length)];

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: rnd(i + 66) * width,
        top: height + 10,
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: color,
        opacity: v.interpolate({
          inputRange: [0, 0.12, 0.85, 1],
          outputRange: [0, isLight ? 0.35 : 0.75, isLight ? 0.25 : 0.65, 0],
        }),
        transform: [
          {
            translateY: v.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -(height + 40)],
            }),
          },
          {
            translateX: v.interpolate({
              inputRange: [0, 1],
              outputRange: [0, driftX],
            }),
          },
        ],
      }}
    />
  );
});

/**
 * Space ambient background inspired by nubaTV-web:
 * soft atmospheric color washes + twinkling starfield + cross sparkles + cosmic dust.
 * Hidden on video/channel player routes.
 */
function AmbientEffects() {
  const theme = useAppTheme();
  const pathname = usePathname();
  const segments = useSegments() as string[];
  const { width, height } = useWindowDimensions();
  const washAnim = useRef(new Animated.Value(0)).current;

  const isPlayerRoute =
    pathname === "/tv" ||
    pathname.endsWith("/tv") ||
    segments.includes("tv") ||
    pathname === "/watch" ||
    pathname.endsWith("/watch") ||
    segments.includes("watch") ||
    pathname === "/player" ||
    pathname.endsWith("/player") ||
    segments.includes("player");

  useEffect(() => {
    if (isPlayerRoute) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(washAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(washAnim, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isPlayerRoute, washAnim]);

  const stars = useMemo(() => Array.from({ length: 65 }, (_, i) => i), []);
  const sparkles = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  const dust = useMemo(() => Array.from({ length: 14 }, (_, i) => i), []);

  if (isPlayerRoute) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 0,
          elevation: 0,
          backgroundColor: theme.isLight ? "#efe8df" : "#040307",
          overflow: "hidden",
        },
      ]}
    >
      {/* Base deep space gradient */}
      <LinearGradient
        colors={
          theme.isLight
            ? ["#f7efe5", "#efe4d6", "#e8d9c8"]
            : ["#0a0612", "#05040b", "#09040a"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Atmospheric space wash layer A (warm amber / copper / crimson) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: washAnim.interpolate({
              inputRange: [0, 1],
              outputRange: theme.isLight ? [0.55, 0.2] : [0.85, 0.25],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(255, 160, 30, 0.38)",
            "rgba(194, 65, 12, 0.28)",
            "rgba(159, 18, 57, 0.22)",
            "transparent",
          ]}
          locations={[0, 0.35, 0.68, 1]}
          start={{ x: 0.05, y: 0.05 }}
          end={{ x: 0.95, y: 0.9 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Atmospheric space wash layer B (sapphire / indigo / violet) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: washAnim.interpolate({
              inputRange: [0, 1],
              outputRange: theme.isLight ? [0.2, 0.55] : [0.25, 0.85],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(59, 130, 246, 0.34)",
            "rgba(139, 92, 246, 0.32)",
            "rgba(225, 29, 72, 0.22)",
            "transparent",
          ]}
          locations={[0, 0.38, 0.72, 1]}
          start={{ x: 0.9, y: 0.1 }}
          end={{ x: 0.1, y: 0.95 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Atmospheric space wash layer C (emerald / gold bottom glow) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: washAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: theme.isLight ? [0.2, 0.45, 0.2] : [0.25, 0.65, 0.25],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={[
            "transparent",
            "rgba(16, 185, 129, 0.18)",
            "rgba(245, 158, 11, 0.26)",
            "rgba(168, 85, 247, 0.24)",
          ]}
          locations={[0.15, 0.5, 0.78, 1]}
          start={{ x: 0.2, y: 0.15 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Twinkling starfield */}
      {stars.map((i) => (
        <TwinkleStar
          key={`s${i}`}
          i={i}
          width={width}
          height={height}
          isLight={theme.isLight}
        />
      ))}

      {/* 4-point cross sparkles */}
      {sparkles.map((i) => (
        <CrossSparkle
          key={`sp${i}`}
          i={i}
          width={width}
          height={height}
          isLight={theme.isLight}
        />
      ))}

      {/* Floating cosmic dust */}
      {dust.map((i) => (
        <CosmicDust
          key={`d${i}`}
          i={i}
          width={width}
          height={height}
          isLight={theme.isLight}
        />
      ))}
    </View>
  );
}

export default memo(AmbientEffects);
