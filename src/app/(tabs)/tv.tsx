import Image from "../../components/FastImage";
import { useIsFocused, useRouter } from "expo-router";
import {
  ChevronDown,
  Heart,
  List,
  Maximize2,
  Search,
  Tv2,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Video from "react-native-video";
import { API_URL, Channel, useGlobal } from "../../contexts/GlobalContext";
import { useAppTheme } from "../../contexts/SettingsContext";

const SIDEBAR_W = 116;

type SidebarItem = { id: string; label: string };

export default function TvScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { width: winW, height: winH } = useWindowDimensions();
  const playerH = Math.min(
    Math.round((winW * 9) / 16),
    Math.round(winH * 0.42),
    380,
  );
  const {
    channels,
    activeChannel,
    setActiveChannel,
    favorites,
    toggleFavorite,
    loadingChannels,
    setMiniPlayerAllowed,
  } = useGlobal();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      // Mark that the user has visited TV → mini player can appear when they leave
      setMiniPlayerAllowed(true);
    } else {
      // Pause web video immediately when losing focus
      if (Platform.OS === "web") {
        webVideoRef.current?.pause?.();
      }
    }
  }, [isFocused]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeSidebarId, setActiveSidebarId] = useState("all");
  // '__default__' = lista(s) por defecto del backend, '__all__' = todas, o nombre de lista
  const [playlistSel, setPlaylistSel] = useState("__default__");
  const searchRef = useRef<TextInput>(null);
  const webVideoRef = useRef<any>(null);
  const hlsRef = useRef<any>(null);
  const nativeVideoRef = useRef<any>(null);
  const [nativeIsPlaying, setNativeIsPlaying] = useState(true);
  const [nativeIsBuffering, setNativeIsBuffering] = useState(true);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web" || !activeChannel || !nativeVideoRef.current)
      return;
    setNativeIsPlaying(true);
    setNativeIsBuffering(true);
  }, [activeChannel?.url]);

  const streamUrl = activeChannel
    ? Platform.OS === "web"
      ? `${API_URL}/proxy?url=${encodeURIComponent(activeChannel.url)}`
      : activeChannel.url
    : null;

  // Web playback (HLS)
  useEffect(() => {
    if (Platform.OS !== "web" || !streamUrl || !webVideoRef.current) return;
    const video = webVideoRef.current;
    let hls: any;
    (async () => {
      // Destroy previous HLS instance
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      video.pause();
      try {
        const mod: any = await import("hls.js");
        const Hls = mod.default;
        if (Hls?.isSupported()) {
          hls = new Hls({ enableWorker: false });
          hlsRef.current = hls;
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isFocused) video.play().catch(() => {});
          });
        } else {
          video.src = streamUrl;
          if (isFocused) video.play().catch(() => {});
        }
      } catch {
        video.src = streamUrl;
      }
    })();
    return () => {
      if (hls) { hls.destroy(); hlsRef.current = null; }
    };
  }, [streamUrl]);

  // Pause/resume web video when tab focus changes
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const video = webVideoRef.current;
    if (!video) return;
    if (isFocused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isFocused]);

  const sidebarItems = useMemo<SidebarItem[]>(() => {
    const categories = Array.from(
      new Set(channels.map((c) => c.category?.name).filter(Boolean)),
    ).sort() as string[];
    return [
      { id: "favorites", label: "Favorito" },
      { id: "all", label: "Lista" },
      ...categories.map((cat) => ({ id: `cat:${cat}`, label: cat })),
    ];
  }, [channels]);

  const filteredChannels = useMemo(() => {
    let list = channels;
    if (activeSidebarId === "favorites")
      list = list.filter((c) => favorites.includes(c.id));
    else if (activeSidebarId.startsWith("cat:")) {
      const cat = activeSidebarId.slice(4);
      list = list.filter((c) => c.category?.name === cat);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [channels, activeSidebarId, favorites, searchQuery]);

  const title =
    activeSidebarId === "all"
      ? "Lista"
      : activeSidebarId === "favorites"
        ? "Favorito"
        : activeSidebarId.slice(4);

  const toggleSearch = () => {
    const next = !showSearch;
    setShowSearch(next);
    if (next) setTimeout(() => searchRef.current?.focus(), 150);
    else setSearchQuery("");
  };

  const renderChannel = ({ item, index }: { item: Channel; index: number }) => {
    const isFav = favorites.includes(item.id);
    const isPlaying = activeChannel?.id === item.id;
    return (
      <TouchableOpacity
        style={[
          s.channelRow,
          { borderBottomWidth: 1, borderBottomColor: theme.divider },
          isPlaying && { backgroundColor: `${theme.accent}18` },
        ]}
        onPress={() => setActiveChannel(item)}
        activeOpacity={0.75}
      >
        <Text
          style={[
            s.channelNum,
            { color: isPlaying ? theme.accent : theme.textSub },
          ]}
        >
          {index + 1}
        </Text>
        <View
          style={[
            s.channelLogoWrap,
            {
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          {item.logo ? (
            <Image
              source={{ uri: item.logo }}
              style={s.channelLogo}
              contentFit="contain" cachePolicy="memory-disk"
            />
          ) : (
            <Tv2 size={20} color={theme.textSub} />
          )}
        </View>
        <View style={s.channelInfo}>
          <Text
            style={[s.channelName, { color: theme.text }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text
            style={[s.channelMeta, { color: theme.textSub }]}
            numberOfLines={1}
          >
            {item.category?.name ?? "Sin categoría"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart
            size={16}
            color={isFav ? "#E50914" : theme.textMuted}
            fill={isFav ? "#E50914" : "none"}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const playlistOptions = useMemo(() => {
    const map = new Map<string, boolean>();
    channels.forEach((c) => {
      const name = c.playlist?.name;
      if (name)
        map.set(name, (map.get(name) ?? false) || !!c.playlist?.isDefault);
    });
    return Array.from(map.entries()).map(([name, isDefault]) => ({
      name,
      isDefault,
    }));
  }, [channels]);

  const hasDefault = playlistOptions.some((p) => p.isDefault);

  const selectPlaylist = (key: string) => {
    setPlaylistSel(key);
    setActiveSidebarId("all");
  };

  const activePlaylistLabel =
    playlistSel === "__all__"
      ? "Todas las listas"
      : playlistSel === "__default__"
        ? hasDefault
          ? "Por defecto"
          : "Todas"
        : playlistSel;

  const isWide = winW >= 768;
  const sidebarW = isWide ? 200 : Math.round(winW * 0.36);

  // Auto-select initial channel ONLY when channels first load and nothing is playing.
  // isFocused is intentionally NOT in deps – auto-select must NOT run on every
  // focus change (that's what was causing random channel switches on return).
  useEffect(() => {
    if (activeChannel) return;        // never overwrite user's current channel
    if (channels.length === 0) return;

    const visible =
      playlistSel === "__all__"
        ? channels
        : playlistSel === "__default__"
          ? hasDefault
            ? channels.filter((c) => c.playlist?.isDefault)
            : channels
          : channels.filter((c) => c.playlist?.name === playlistSel);

    if (visible.length > 0) {
      setActiveChannel(visible[Math.floor(Math.random() * visible.length)]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels, playlistSel, hasDefault]); // NO isFocused in deps

  return (
    <View style={[s.root, { backgroundColor: theme.bg, zIndex: 10 }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      {/* ── Live player (auto plays active/random channel) ─────────────────── */}
      <View style={[s.playerWrap, { marginTop: insets.top, height: playerH }]}>
        {streamUrl ? (
          Platform.OS === "web" ? (
            React.createElement("video", {
              ref: webVideoRef,
              style: {
                width: "100%",
                height: "100%",
                objectFit: "contain",
                background: "#000",
              },
              autoPlay: true,
              muted: false,
              playsInline: true,
            })
          ) : activeChannel ? (
            <Video
              ref={nativeVideoRef}
              source={{ uri: activeChannel.url }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
              paused={!nativeIsPlaying || !isFocused}
              repeat={true}
              onError={(error: any) => {
                console.error("TvScreen RNVideo error:", error);
                setNativeIsBuffering(false);
              }}
              onLoad={() => {
                setNativeIsBuffering(false);
                setNativeIsPlaying(true);
              }}
              onBuffer={({ isBuffering }: any) => {
                setNativeIsBuffering(isBuffering);
              }}
            />
          ) : null
        ) : (
          <View style={s.playerEmpty}>
            <ActivityIndicator color="#E50914" />
          </View>
        )}

        {activeChannel && (
          <View style={s.playerOverlay} pointerEvents="box-none">
            <Text style={s.playerName} numberOfLines={1}>
              {activeChannel.name}
            </Text>
            <TouchableOpacity
              style={s.fullscreenBtn}
              onPress={() => router.push("/player")}
              activeOpacity={0.8}
            >
              <Maximize2 size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Title row + playlist selector (no horizontal pill buttons) */}
      <View style={[s.header, { backgroundColor: theme.bg }]}>
        <Text style={[s.headerTitle, { color: theme.text }]}>
          {title}{" "}
          <Text style={[s.headerArrow, { color: theme.textSub }]}>›</Text>
        </Text>
        <TouchableOpacity
          onPress={() => setShowPlaylistMenu(true)}
          style={[
            s.playlistBtn,
            { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
          ]}
          activeOpacity={0.75}
        >
          <Text
            style={[s.playlistBtnTxt, { color: theme.text }]}
            numberOfLines={1}
          >
            {activePlaylistLabel}
          </Text>
          <ChevronDown size={14} color={theme.textSub} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleSearch}
          style={[
            s.headerIconBtn,
            { backgroundColor: theme.cardBg, borderRadius: 20 },
          ]}
          activeOpacity={0.7}
        >
          {showSearch ? (
            <X size={22} color={theme.text} />
          ) : (
            <Search size={22} color={theme.text} />
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showPlaylistMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlaylistMenu(false)}
      >
        <TouchableOpacity
          style={s.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowPlaylistMenu(false)}
        >
          <View
            style={[
              s.modalCard,
              { backgroundColor: theme.bg, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[s.modalTitle, { color: theme.text }]}>
              Seleccionar lista
            </Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {[
                {
                  key: "__default__",
                  label: hasDefault ? "Por defecto" : "Todas",
                },
                { key: "__all__", label: "Todas las listas" },
                ...playlistOptions.map((p) => ({
                  key: p.name,
                  label: p.name,
                })),
              ].map((o) => {
                const on = playlistSel === o.key;
                return (
                  <TouchableOpacity
                    key={o.key}
                    style={[
                      s.modalOption,
                      on && { backgroundColor: `${theme.accent}22` },
                    ]}
                    onPress={() => {
                      selectPlaylist(o.key);
                      setShowPlaylistMenu(false);
                    }}
                  >
                    <Text
                      style={[
                        s.modalOptionTxt,
                        { color: on ? theme.accent : theme.text },
                      ]}
                    >
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {showSearch && (
        <View
          style={[
            s.searchWrap,
            { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
          ]}
        >
          <Search size={15} color={theme.textSub} />
          <TextInput
            ref={searchRef}
            style={[s.searchInput, { color: theme.text }]}
            placeholder="Buscar canal..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={14} color={theme.textSub} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Sidebar + channel list */}
      <View
        style={[s.body, { borderTopWidth: 1, borderTopColor: theme.divider }]}
      >
        <FlatList
          data={sidebarItems}
          keyExtractor={(i) => i.id}
          style={[
            s.sidebar,
            {
              width: sidebarW,
              borderRightWidth: 1,
              borderRightColor: theme.divider,
            },
          ]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          renderItem={({ item }) => {
            const isActive = activeSidebarId === item.id;
            return (
              <TouchableOpacity
                style={[
                  s.sidebarItem,
                  isActive && { backgroundColor: theme.cardBg },
                ]}
                onPress={() => setActiveSidebarId(item.id)}
                activeOpacity={0.8}
              >
                {item.id === "favorites" ? (
                  <Heart
                    size={14}
                    color={isActive ? theme.accent : theme.textSub}
                  />
                ) : item.id === "all" ? (
                  <List
                    size={14}
                    color={isActive ? theme.accent : theme.textSub}
                  />
                ) : (
                  <View
                    style={[
                      s.dot,
                      {
                        backgroundColor: isActive
                          ? theme.accent
                          : theme.textMuted,
                      },
                    ]}
                  />
                )}
                <Text
                  style={[
                    s.sidebarLabel,
                    { color: isActive ? theme.accent : theme.textSub },
                  ]}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {loadingChannels ? (
          <View style={s.centerSpinner}>
            <ActivityIndicator size="large" color="#E50914" />
          </View>
        ) : (
          <FlatList
            data={filteredChannels}
            keyExtractor={(item) => item.id}
            style={s.channelList}
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={8}
            renderItem={renderChannel}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={[s.emptyText, { color: theme.textMuted }]}>
                  {activeSidebarId === "favorites"
                    ? "Sin favoritos aún"
                    : "Sin canales"}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, minHeight: 0, overflow: "hidden" },

  playerWrap: {
    width: "100%",
    flexShrink: 0,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  playerEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
  playerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  playerName: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "700" },
  fullscreenBtn: { padding: 6 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
    flexShrink: 0,
  },
  headerTitle: { flex: 1, fontSize: 24, fontWeight: "800" },
  headerArrow: { fontWeight: "400" },
  headerIconBtn: { padding: 6 },
  playlistBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 160,
  },
  playlistBtnTxt: { fontSize: 12, fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", marginBottom: 10 },
  modalOption: { paddingVertical: 11, paddingHorizontal: 10, borderRadius: 8 },
  modalOptionTxt: { fontSize: 14, fontWeight: "600" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  plWrap: { height: 38, flexGrow: 0, flexShrink: 0, marginBottom: 8 },
  plChip: {
    paddingHorizontal: 14,
    height: 32,
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(128,128,128,0.10)",
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.20)",
  },
  plChipOn: { backgroundColor: "#E50914", borderColor: "#E50914" },
  plChipTxt: { fontSize: 12, fontWeight: "700", maxWidth: 160 },
  plChipTxtOn: { color: "#fff" },

  body: {
    flex: 1,
    minHeight: 0,
    flexDirection: "row",
    overflow: "hidden",
  },

  sidebar: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 0,
    height: "100%",
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  sidebarItemActive: {}, // overridden inline
  dot: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 5 },
  sidebarLabel: { flex: 1, fontSize: 13, fontWeight: "600" },
  sidebarLabelActive: {}, // overridden inline

  channelList: { flex: 1, minHeight: 0, height: "100%" },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 14,
    paddingVertical: 9,
    gap: 10,
  },
  channelRowActive: { backgroundColor: "rgba(229,9,20,0.10)" },
  channelNum: {
    fontSize: 16,
    fontWeight: "700",
    width: 30,
    textAlign: "center",
  },
  channelLogoWrap: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "rgba(128,128,128,0.12)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  channelLogo: { width: "90%", height: "90%" },
  channelInfo: { flex: 1 },
  channelName: { fontSize: 14, fontWeight: "700" },
  channelMeta: { fontSize: 12, marginTop: 2 },

  centerSpinner: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyWrap: { alignItems: "center", paddingTop: 40 },
  emptyText: { fontSize: 13, fontWeight: "600" },
});
