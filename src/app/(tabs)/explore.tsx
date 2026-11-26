import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowUpDown,
  Clapperboard,
  Film,
  Flame,
  Layers,
  Search,
  Sparkles,
  Star,
  Tag,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import Image from "../../components/FastImage";
import { FadeInItem } from "../../components/Motion";
import { useAppTheme } from "../../contexts/SettingsContext";
import {
  getGenres,
  getTypes,
  NEXOPLAY_API_BASE,
  NexoContentItem,
  NexoGenre,
  NexoTypeCount,
} from "../../services/nexoplay";

const GAP = 10;
const H_PAD = 14;
const PAGE_LIMIT = 30;

type SortMode = "recent" | "popular" | "rating" | "az";

const TYPE_LABELS: Record<string, string> = {
  MOVIE: "Películas",
  SERIES: "Series",
  ANIME: "Anime",
  DOCUMENTARY: "Documentales",
  KIDS: "Infantil",
  SPORT: "Deportes",
};

const TYPE_ICONS: Record<string, any> = {
  MOVIE: Film,
  SERIES: Clapperboard,
  ANIME: Sparkles,
  DOCUMENTARY: Film,
};

const SORT_OPTIONS: { id: SortMode | null; label: string; icon: any }[] = [
  { id: null, label: "Todos", icon: Layers },
  { id: "recent", label: "Estrenos", icon: Sparkles },
  { id: "popular", label: "Populares", icon: Flame },
  { id: "rating", label: "Valoradas", icon: Star },
  { id: "az", label: "A - Z", icon: ArrowUpDown },
];

async function fetchPage(params: {
  type: string | null;
  sort: SortMode | null;
  genreId: string | null;
  search?: string;
  page: number;
}): Promise<{ items: NexoContentItem[]; hasNextPage: boolean }> {
  try {
    const q = new URLSearchParams();
    if (params.type) q.append("type", params.type);
    if (params.sort) q.append("sort", params.sort);
    if (params.genreId) q.append("genreId", params.genreId);
    q.append("limit", String(PAGE_LIMIT));
    q.append("page", String(params.page));
    if (params.search?.trim()) q.append("search", params.search.trim());
    const res = await axios.get(
      `${NEXOPLAY_API_BASE}/api/content?${q.toString()}`,
      { timeout: 10000 },
    );
    if (res.data?.success && Array.isArray(res.data?.data)) {
      const list: NexoContentItem[] = res.data.data;
      const metaHasNext = res.data?.meta?.hasNextPage;
      const hasNextPage =
        typeof metaHasNext === "boolean"
          ? metaHasNext
          : list.length >= PAGE_LIMIT;
      return { items: list, hasNextPage };
    }
  } catch (e) {
    console.warn("Explore fetch error:", e);
  }
  return { items: [], hasNextPage: false };
}

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { width: winW } = useWindowDimensions();

  const cols =
    winW >= 1200 ? 6 : winW >= 900 ? 5 : winW >= 600 ? 4 : 3;
  const posterW = Math.floor(
    (winW - H_PAD * 2 - GAP * (cols - 1)) / cols,
  );
  const posterH = Math.round(posterW * 1.48);

  const [types, setTypes] = useState<NexoTypeCount[]>([]);
  const [genres, setGenres] = useState<NexoGenre[]>([]);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode | null>(null);
  const [activeGenreId, setActiveGenreId] = useState<string | null>(null);
  const [filtersReady, setFiltersReady] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);

  const [items, setItems] = useState<NexoContentItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const busyRef = useRef(false);
  const searchRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([getTypes(), getGenres()])
      .then(([t, g]) => {
        setTypes(t);
        setGenres(g);
      })
      .finally(() => setFiltersReady(true));
  }, []);

  const doFetch = useCallback(
    async (
      type: string | null,
      sort: SortMode | null,
      genreId: string | null,
      search: string,
      pageNum: number,
      replace: boolean,
    ) => {
      if (busyRef.current && !replace) return;
      busyRef.current = true;
      setLoading(true);

      const r = await fetchPage({
        type,
        sort,
        genreId,
        search,
        page: pageNum,
      });

      setItems((prev) => {
        if (replace) return r.items;
        const seen = new Set(prev.map((x) => x.id));
        const next = [...prev];
        for (const it of r.items) {
          if (it?.id && !seen.has(it.id)) {
            seen.add(it.id);
            next.push(it);
          }
        }
        return next;
      });
      setHasNextPage(r.hasNextPage);
      setPage(pageNum);
      setLoading(false);
      setRefreshing(false);
      setFirstLoad(false);
      busyRef.current = false;
    },
    [],
  );

  useEffect(() => {
    if (!filtersReady) return;
    setItems([]);
    setPage(1);
    setHasNextPage(true);
    setFirstLoad(true);
    doFetch(activeType, sortMode, activeGenreId, searchQuery, 1, true);
  }, [activeType, sortMode, activeGenreId, filtersReady]);

  useEffect(() => {
    if (!searchActive) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setItems([]);
      setPage(1);
      setHasNextPage(true);
      doFetch(activeType, sortMode, activeGenreId, searchQuery, 1, true);
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || busyRef.current || loading) return;
    doFetch(activeType, sortMode, activeGenreId, searchQuery, page + 1, false);
  }, [
    hasNextPage,
    loading,
    doFetch,
    activeType,
    sortMode,
    activeGenreId,
    searchQuery,
    page,
  ]);

  const handleSearchToggle = () => {
    const next = !searchActive;
    setSearchActive(next);
    if (next) {
      setTimeout(() => searchRef.current?.focus(), 150);
    } else {
      setSearchQuery("");
      setItems([]);
      setPage(1);
      setHasNextPage(true);
      doFetch(activeType, sortMode, activeGenreId, "", 1, true);
    }
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: NexoContentItem;
    index: number;
  }) => (
    <FadeInItem index={index % 12} style={{ width: posterW }}>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() =>
          router.push({ pathname: "/detail", params: { slug: item.slug } })
        }
      >
        <View style={[s.posterBox, { width: posterW, height: posterH }]}>
          <Image
            source={{ uri: item.posterUrl ?? item.backdropUrl ?? undefined }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="normal"
            transition={200}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.72)"]}
            locations={[0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          {item.rating ? (
            <View style={s.ratingBadge}>
              <Star size={10} color="#000" fill="#000" />
              <Text style={s.ratingBadgeTxt}>{item.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[s.posterTitle, { color: theme.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[s.posterYear, { color: theme.textMuted }]}>
          {[
            TYPE_LABELS[item.type] || item.type,
            item.releaseYear ? String(item.releaseYear) : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </TouchableOpacity>
    </FadeInItem>
  );

  return (
    <View style={[s.root, { backgroundColor: "transparent" }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      {/* Header */}
      <View
        style={[
          s.header,
          { paddingTop: insets.top + 8, backgroundColor: "transparent" },
        ]}
      >
        <TouchableOpacity
          style={[
            s.backBtn,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
              borderWidth: 1,
            },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.text }]}>Explorar</Text>
        <TouchableOpacity
          style={[
            s.searchToggle,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
              borderWidth: 1,
            },
          ]}
          onPress={handleSearchToggle}
          activeOpacity={0.7}
        >
          {searchActive ? (
            <X size={20} color={theme.text} />
          ) : (
            <Search size={20} color={theme.text} />
          )}
        </TouchableOpacity>
      </View>

      {/* Search input */}
      {searchActive && (
        <View
          style={[
            s.searchBar,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
              borderWidth: 1,
            },
          ]}
        >
          <Search size={15} color={theme.textSub} />
          <TextInput
            ref={searchRef}
            style={[s.searchInput, { color: theme.text }]}
            placeholder={
              activeType
                ? `Buscar ${TYPE_LABELS[activeType] ?? activeType}...`
                : "Buscar películas, series, anime..."
            }
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={14} color={theme.textSub} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter bars (Tipos, Orden, Géneros) */}
      {!searchActive && (
        <View style={s.filtersWrap}>
          {/* 1. Tipo */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.filterRow}
            contentContainerStyle={s.filterRowContent}
          >
            <TouchableOpacity
              style={[
                s.pill,
                activeType === null
                  ? { backgroundColor: theme.accent, borderColor: theme.accent }
                  : {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.cardBorder,
                    },
              ]}
              onPress={() => setActiveType(null)}
              activeOpacity={0.8}
            >
              <Layers
                size={13}
                color={activeType === null ? "#fff" : theme.textSub}
              />
              <Text
                style={[
                  s.pillLabel,
                  { color: activeType === null ? "#fff" : theme.textSub },
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>

            {types.map((tp) => {
              const isActive = tp.type === activeType;
              const IconComp = TYPE_ICONS[tp.type] || Film;
              return (
                <TouchableOpacity
                  key={tp.type}
                  style={[
                    s.pill,
                    isActive
                      ? {
                          backgroundColor: theme.accent,
                          borderColor: theme.accent,
                        }
                      : {
                          backgroundColor: theme.cardBg,
                          borderColor: theme.cardBorder,
                        },
                  ]}
                  onPress={() =>
                    setActiveType((prev) => (prev === tp.type ? null : tp.type))
                  }
                  activeOpacity={0.8}
                >
                  <IconComp
                    size={13}
                    color={isActive ? "#fff" : theme.textSub}
                  />
                  <Text
                    style={[
                      s.pillLabel,
                      { color: isActive ? "#fff" : theme.textSub },
                    ]}
                  >
                    {TYPE_LABELS[tp.type] ?? tp.type}
                  </Text>
                  <Text
                    style={[
                      s.pillCount,
                      {
                        color: isActive
                          ? "rgba(255,255,255,0.78)"
                          : theme.textMuted,
                      },
                    ]}
                  >
                    {tp.count >= 1000
                      ? `${(tp.count / 1000).toFixed(1)}k`
                      : tp.count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 2. Orden */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.filterRow}
            contentContainerStyle={s.filterRowContent}
          >
            {SORT_OPTIONS.map((opt) => {
              const isActive = opt.id === sortMode;
              const IconComp = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.id ?? "all"}
                  style={[
                    s.pill,
                    isActive
                      ? {
                          backgroundColor: `${theme.accent}28`,
                          borderColor: theme.accent,
                        }
                      : {
                          backgroundColor: theme.cardBg,
                          borderColor: theme.cardBorder,
                        },
                  ]}
                  onPress={() => setSortMode(opt.id)}
                  activeOpacity={0.8}
                >
                  <IconComp
                    size={13}
                    color={isActive ? theme.accent : theme.textSub}
                  />
                  <Text
                    style={[
                      s.pillLabel,
                      { color: isActive ? theme.accent : theme.textSub },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 3. Géneros */}
          {genres.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.filterRow}
              contentContainerStyle={s.filterRowContent}
            >
              <TouchableOpacity
                style={[
                  s.pill,
                  activeGenreId === null
                    ? {
                        backgroundColor: `${theme.accent}28`,
                        borderColor: theme.accent,
                      }
                    : {
                        backgroundColor: theme.cardBg,
                        borderColor: theme.cardBorder,
                      },
                ]}
                onPress={() => setActiveGenreId(null)}
                activeOpacity={0.8}
              >
                <Tag
                  size={12}
                  color={activeGenreId === null ? theme.accent : theme.textSub}
                />
                <Text
                  style={[
                    s.pillLabel,
                    {
                      color:
                        activeGenreId === null ? theme.accent : theme.textSub,
                    },
                  ]}
                >
                  Todos los géneros
                </Text>
              </TouchableOpacity>

              {genres.map((g) => {
                const isActive = g.id === activeGenreId;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      s.pill,
                      isActive
                        ? {
                            backgroundColor: `${theme.accent}28`,
                            borderColor: theme.accent,
                          }
                        : {
                            backgroundColor: theme.cardBg,
                            borderColor: theme.cardBorder,
                          },
                    ]}
                    onPress={() =>
                      setActiveGenreId((prev) => (prev === g.id ? null : g.id))
                    }
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        s.pillLabel,
                        { color: isActive ? theme.accent : theme.textSub },
                      ]}
                    >
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* Grid */}
      {firstLoad && loading ? (
        <View style={s.centerSpinner}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          key={`grid-${cols}`}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={cols}
          style={s.grid}
          contentContainerStyle={s.gridContent}
          columnWrapperStyle={s.gridRow}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          onRefresh={() => {
            setRefreshing(true);
            doFetch(activeType, sortMode, activeGenreId, searchQuery, 1, true);
          }}
          refreshing={refreshing}
          ListFooterComponent={
            loading && !firstLoad ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color={theme.accent} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={s.emptyWrap}>
                <Text style={[s.emptyText, { color: theme.textMuted }]}>
                  Sin resultados
                </Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          initialNumToRender={18}
          maxToRenderPerBatch={12}
          windowSize={5}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingBottom: 10,
    flexShrink: 0,
  },
  backBtn: {
    marginRight: 10,
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  searchToggle: {
    padding: 8,
    borderRadius: 12,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: H_PAD,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  filtersWrap: {
    flexShrink: 0,
    gap: 8,
    marginBottom: 10,
  },
  filterRow: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterRowContent: {
    paddingHorizontal: H_PAD,
    gap: 8,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  pillLabel: {
    fontWeight: "700",
    fontSize: 13,
  },
  pillCount: {
    fontSize: 11,
    fontWeight: "700",
  },

  grid: { flex: 1, minHeight: 0 },
  gridContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 4,
    paddingBottom: 140,
  },
  gridRow: { gap: GAP, marginBottom: 16 },
  posterBox: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(128,128,128,0.12)",
  },
  ratingBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(250, 204, 21, 0.92)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingBadgeTxt: {
    color: "#000",
    fontSize: 10,
    fontWeight: "800",
  },
  posterTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
    lineHeight: 16,
  },
  posterYear: { fontSize: 10, marginTop: 2 },

  centerSpinner: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyWrap: { flex: 1, alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 14, fontWeight: "600" },
});
