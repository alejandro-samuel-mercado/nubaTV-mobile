import { Image } from "expo-image";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";
import { usePathname } from "expo-router";
import { useAppTheme } from "../contexts/SettingsContext";
import { getHomepage } from "../services/nexoplay";

const { width: W, height: H } = Dimensions.get("window");

let posterCache: string[] | null = null;
async function loadPosters(): Promise<string[]> {
  if (posterCache) return posterCache;
  try {
    const d = await getHomepage();
    const all = [
      ...(d.heroItems ?? []),
      ...(d.trending ?? []),
      ...(d.recent ?? []),
      ...(d.featured ?? []),
    ];
    posterCache = all.map((i) => i.posterUrl).filter(Boolean) as string[];
  } catch {
    posterCache = [];
  }
  return posterCache;
}

const rnd = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const Sparkle = memo(function Sparkle({ i, color }: { i: number; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  const d = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.delay(rnd(i) * 2500),
        Animated.timing(v, { toValue: 1, duration: 1200 + rnd(i + 1) * 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 1200 + rnd(i + 2) * 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(rnd(i + 3) * 1500),
      ]),
    );
    const drift = Animated.loop(
      Animated.sequence([
        Animated.timing(d, { toValue: 1, duration: 6000 + rnd(i + 7) * 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 6000 + rnd(i + 8) * 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    twinkle.start();
    drift.start();
    return () => { twinkle.stop(); drift.stop(); };
  }, []);
  const size = 4 + Math.round(rnd(i + 4) * 5);
  const star = rnd(i + 9) > 0.55;
  const dx = (rnd(i + 10) - 0.5) * 60;
  const dy = -20 - rnd(i + 11) * 50;
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: rnd(i + 5) * W,
        top: rnd(i + 6) * H,
        width: size * 3,
        height: size * 3,
        alignItems: "center",
        justifyContent: "center",
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
        transform: [
          { translateX: d.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
          { translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.3] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] }) },
        ],
      }}
    >
      {star ? (
        <>
          <View style={{ position: "absolute", width: size * 3, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ position: "absolute", width: 1.5, height: size * 3, backgroundColor: color, borderRadius: 1 }} />
        </>
      ) : null}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 1,
          shadowRadius: 6,
          elevation: 0,
        }}
      />
    </Animated.View>
  );
});

const Bubble = memo(function Bubble({ i, color }: { i: number; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const rise = Animated.loop(
      Animated.sequence([
        Animated.delay(rnd(i + 20) * 4000),
        Animated.timing(v, { toValue: 1, duration: 9000 + rnd(i + 21) * 6000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    const sw = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 2200 + rnd(i + 24) * 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 2200 + rnd(i + 25) * 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    rise.start();
    sw.start();
    return () => { rise.stop(); sw.stop(); };
  }, []);
  const size = 24 + Math.round(rnd(i + 22) * 46);
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: rnd(i + 23) * (W - size),
        top: H,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        backgroundColor: color + "22",
        opacity: v.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 0.16, 0.16, 0] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -(H + size * 2)] }) },
          { translateX: sway.interpolate({ inputRange: [-1, 1], outputRange: [-18, 18] }) },
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] }) },
        ],
      }}
    >
      <View
        style={{
          position: "absolute",
          top: size * 0.18,
          left: size * 0.22,
          width: size * 0.22,
          height: size * 0.14,
          borderRadius: size,
          backgroundColor: "rgba(255,255,255,0.55)",
          transform: [{ rotate: "-30deg" }],
        }}
      />
    </Animated.View>
  );
});

const SLOTS = [
  { left: "4%", top: "10%" },
  { left: "56%", top: "30%" },
  { left: "18%", top: "58%" },
  { left: "60%", top: "72%" },
] as const;

const GhostPoster = memo(function GhostPoster({ slot, posters }: { slot: number; posters: string[] }) {
  const v = useRef(new Animated.Value(0)).current;
  const [idx, setIdx] = useState(slot * 3);
  useEffect(() => {
    if (!posters.length) return;
    let alive = true;
    const run = () => {
      v.setValue(0);
      Animated.sequence([
        Animated.delay(slot * 1800),
        Animated.timing(v, { toValue: 1, duration: 2500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(v, { toValue: 2, duration: 4000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(v, { toValue: 3, duration: 2500, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.delay(1500 + slot * 900),
      ]).start(({ finished }) => {
        if (finished && alive) {
          setIdx((p) => p + 4 + slot);
          run();
        }
      });
    };
    run();
    return () => {
      alive = false;
      v.stopAnimation();
    };
  }, [posters.length]);
  if (!posters.length) return null;
  const w = 120 + (slot % 2) * 40;
  const rot = slot % 2 ? 8 : -8;
  const dir = slot % 2 ? -1 : 1;
  return (
    <Animated.View
      style={{
        position: "absolute",
        ...SLOTS[slot % SLOTS.length],
        width: w,
        height: w * 1.5,
        borderRadius: 12,
        overflow: "hidden",
        opacity: v.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, 0.07, 0.07, 0] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 3], outputRange: [40, -40] }) },
          { translateX: v.interpolate({ inputRange: [0, 3], outputRange: [-20 * dir, 20 * dir] }) },
          { rotate: v.interpolate({ inputRange: [0, 3], outputRange: [`${rot}deg`, `${-rot / 2}deg`] }) },
          { scale: v.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0.85, 1, 1.05, 1.15] }) },
        ],
      }}
    >
      <Image
        source={{ uri: posters[idx % posters.length] }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
      />
    </Animated.View>
  );
});

/** Decorative, non-interactive, very subtle animated background overlay. */
function AmbientEffects() {
  const theme = useAppTheme();
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "/index";
  const [posters, setPosters] = useState<string[]>(posterCache ?? []);
  useEffect(() => {
    loadPosters().then(setPosters);
  }, []);
  const color = useMemo(() => (theme.isLight ? "#475569" : "#ffffff"), [theme.isLight]);
  const sparkles = useMemo(() => Array.from({ length: 22 }, (_, i) => i), []);
  const bubbles = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {!isHome && [0, 1, 2, 3].map((s) => (
        <GhostPoster key={`g${s}`} slot={s} posters={posters} />
      ))}
      {bubbles.map((i) => (
        <Bubble key={`b${i}`} i={i} color={theme.accent} />
      ))}
      {sparkles.map((i) => (
        <Sparkle key={`s${i}`} i={i} color={color} />
      ))}
    </View>
  );
}

export default memo(AmbientEffects);
