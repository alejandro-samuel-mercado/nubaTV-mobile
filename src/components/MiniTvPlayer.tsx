import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { memo, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGlobal } from "../contexts/GlobalContext";

const { width: SW, height: SH } = Dimensions.get("window");
const MW = 200;
const MH = Math.round((MW * 9) / 16);

/**
 * Floating, draggable mini TV player.
 *
 * The component stays mounted once the user has visited TV (pre-buffering).
 * `visible` controls opacity + interactivity only – the video is always active
 * so there's no rebuffering delay on show.
 */
function MiniTvPlayer({ visible }: { visible: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeChannel, setMiniPlayerAllowed } = useGlobal();

  // ── position & entrance animation ──────────────────────────────────────────
  const initPos = useRef({ x: SW - MW - 12, y: SH - MH - 200 });
  const pos = useRef(new Animated.ValueXY(initPos.current)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const last = useRef(initPos.current);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(opacity, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
          tension: 80,
        }),
      ]).start();
    } else {
      // Reset position on hide so next time it starts at the corner
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.7,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        pos.setValue(initPos.current);
        last.current = initPos.current;
      });
    }
  }, [visible]);

  // ── Web HLS – create once, pause/play on visible change ───────────────────
  const webVideoRef = useRef<any>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || !activeChannel?.url) return;

    // Only (re)create HLS when the stream URL actually changes
    const video = webVideoRef.current as HTMLVideoElement | null;
    if (!video) return;

    // Destroy previous instance only when URL changes
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    video.pause();

    (async () => {
      try {
        const mod: any = await import("hls.js");
        const Hls = mod.default;
        if (Hls?.isSupported()) {
          const hls = new Hls({ enableWorker: false, autoStartLoad: true });
          hlsRef.current = hls;
          hls.loadSource(activeChannel.url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            // Only auto-play if already visible
            if (visible) video.play().catch(() => {});
          });
        } else {
          video.src = activeChannel.url;
          if (visible) video.play().catch(() => {});
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      // Do NOT destroy HLS here – we want it to keep buffering in background
    };
  }, [activeChannel?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Play / pause web video when visible changes ───────────────────────────
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const video = webVideoRef.current as HTMLVideoElement | null;
    if (!video) return;
    if (visible) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [visible]);

  // ── Pan responder ──────────────────────────────────────────────────────────
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          visible && (Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8),
        onPanResponderMove: (_, g) => {
          pos.setValue({ x: last.current.x + g.dx, y: last.current.y + g.dy });
        },
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6) {
            router.navigate("/tv");
            return;
          }
          const x = Math.min(Math.max(8, last.current.x + g.dx), SW - MW - 8);
          const y = Math.min(
            Math.max(insets.top + 8, last.current.y + g.dy),
            SH - MH - 8,
          );
          const sx = x + MW / 2 < SW / 2 ? 8 : SW - MW - 8;
          last.current = { x: sx, y };
          Animated.spring(pos, {
            toValue: last.current,
            useNativeDriver: true,
            friction: 8,
          }).start();
        },
      }),
    [insets.top, visible, router],
  );

  if (!activeChannel) return null;

  return (
    <Animated.View
      {...pan.panHandlers}
      pointerEvents={visible ? "auto" : "none"}
      style={[
        s.wrap,
        {
          opacity,
          transform: [...pos.getTranslateTransform(), { scale }],
        },
      ]}
    >
      <Pressable
        onPress={() => router.navigate("/tv")}
        style={s.videoPressable}
      >
        {/* ── Video ── */}
        <View style={s.videoWrap} pointerEvents="none">
          {Platform.OS === "web" ? (
            <video
              ref={webVideoRef}
              style={
                { width: "100%", height: "100%", objectFit: "cover" } as any
              }
              muted={false}
              playsInline
            />
          ) : (
            /* Native: lazy require avoids web-bundle issues */
            (() => {
              const Video = require("react-native-video").default;
              return (
                <Video
                  source={{ uri: activeChannel.url }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                  paused={!visible} // buffered even when hidden
                  repeat
                />
              );
            })()
          )}
        </View>
      </Pressable>

      {/* ── Name bar ── */}
      <View style={s.bar} pointerEvents="none">
        <Text style={s.name} numberOfLines={1}>
          {activeChannel.name}
        </Text>
      </View>

      {/* ── Close ── */}
      <Pressable
        style={s.close}
        hitSlop={8}
        onPress={(e) => {
          e.stopPropagation();
          setMiniPlayerAllowed(false);
        }}
      >
        <X size={14} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

export default memo(MiniTvPlayer);

const s = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    top: 0,
    width: MW,
    height: MH,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    elevation: 16,
    zIndex: 9999,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 8px 32px rgba(0,0,0,0.6)", cursor: "grab" } as any)
      : {}),
  },
  videoPressable: {
    position: "absolute",
    inset: 0,
    borderRadius: 12,
  },
  videoWrap: { flex: 1, backgroundColor: "#000" },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  name: { color: "#fff", fontSize: 11, fontWeight: "700" },
  close: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
});
