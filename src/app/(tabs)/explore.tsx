import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import axios from 'axios';
import { NEXOPLAY_API_BASE, NexoContentItem, NexoTypeCount, getTypes } from '../../services/nexoplay';
import { useAppTheme } from '../../contexts/SettingsContext';

const { width: SCREEN_W } = Dimensions.get('window');
const COL = 3;
const GAP = 8;
const H_PAD = 12;
const POSTER_W = (SCREEN_W - H_PAD * 2 - GAP * (COL - 1)) / COL;
const POSTER_H = POSTER_W * 1.5;

type SortMode = 'recent' | 'popular' | 'rating' | 'az';

const TYPE_LABELS: Record<string, string> = {
  MOVIE: 'Películas',
  SERIES: 'Series',
  ANIME: 'Anime',
  DOCUMENTARY: 'Documentales',
  KIDS: 'Infantil',
  SPORT: 'Deportes',
};

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'recent', label: 'Recientes' },
  { id: 'popular', label: 'Populares' },
  { id: 'rating', label: 'Valorados' },
  { id: 'az', label: 'A - Z' },
];

async function fetchPage(params: {
  type: string | null; sort: SortMode | null; search?: string; page: number;
}): Promise<{ items: NexoContentItem[]; hasNextPage: boolean }> {
  try {
    const q = new URLSearchParams();
    if (params.type) q.append('type', params.type);
    if (params.sort) q.append('sort', params.sort);
    q.append('limit', '30');
    q.append('page', String(params.page));
    if (params.search?.trim()) q.append('search', params.search.trim());
    const res = await axios.get(`${NEXOPLAY_API_BASE}/api/content?${q.toString()}`, { timeout: 10000 });
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return { items: res.data.data, hasNextPage: res.data?.meta?.hasNextPage ?? false };
    }
  } catch (e) { console.warn(e); }
  return { items: [], hasNextPage: false };
}

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  const [types, setTypes] = useState<NexoTypeCount[]>([]);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode | null>(null);
  const [typesReady, setTypesReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);

  const [items, setItems] = useState<NexoContentItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const searchRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getTypes().then(t => { setTypes(t); setTypesReady(true); });
  }, []);

  const doFetch = useCallback(async (
    type: string | null, sort: SortMode | null, search: string, pageNum: number, replace: boolean
  ) => {
    setLoading(true);
    const r = await fetchPage({ type, sort, search, page: pageNum });
    setItems(prev => replace ? r.items : [...prev, ...r.items]);
    setHasNextPage(r.hasNextPage);
    setPage(pageNum);
    setLoading(false);
    setRefreshing(false);
    setFirstLoad(false);
  }, []);

  useEffect(() => {
    if (!typesReady) return;
    setItems([]); setPage(1); setHasNextPage(true); setFirstLoad(true);
    doFetch(activeType, sortMode, searchQuery, 1, true);
  }, [activeType, sortMode, typesReady]);

  useEffect(() => {
    if (!searchActive) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setItems([]); setPage(1); setHasNextPage(true);
      doFetch(activeType, sortMode, searchQuery, 1, true);
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const handleTypeChange = (t: string) => {
    // Toggle: tapping the active type clears the filter (shows all types)
    setActiveType(prev => (prev === t ? null : t));
    setSearchQuery('');
    setSearchActive(false);
  };

  const handleSearchToggle = () => {
    const next = !searchActive;
    setSearchActive(next);
    if (next) setTimeout(() => searchRef.current?.focus(), 150);
    else {
      setSearchQuery('');
      setItems([]); setPage(1); setHasNextPage(true);
      doFetch(activeType, sortMode, '', 1, true);
    }
  };

  const renderItem = ({ item }: { item: NexoContentItem }) => (
    <TouchableOpacity
      style={s.posterWrap}
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/detail', params: { slug: item.slug } })}
    >
      <Image
        source={{ uri: item.posterUrl ?? item.backdropUrl ?? undefined }}
        style={s.poster}
        contentFit="cover"
        transition={200}
      />
      <Text style={[s.posterTitle, { color: theme.textSub }]} numberOfLines={2}>{item.title}</Text>
      {item.releaseYear ? <Text style={[s.posterYear, { color: theme.textMuted }]}>{item.releaseYear}</Text> : null}
    </TouchableOpacity>
  );


  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8, backgroundColor: theme.bg }]}>
        <TouchableOpacity style={[s.backBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, borderWidth: 1 }]} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.text }]}>Explorar</Text>
        <TouchableOpacity style={[s.searchToggle, { backgroundColor: theme.cardBg }]} onPress={handleSearchToggle} activeOpacity={0.7}>
          {searchActive ? <X size={22} color={theme.text} /> : <Search size={22} color={theme.text} />}
        </TouchableOpacity>
      </View>

      {/* Search input */}
      {searchActive && (
        <View style={[s.searchBar, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, borderWidth: 1 }]}>
          <Search size={15} color={theme.textSub} />
          <TextInput
            ref={searchRef}
            style={[s.searchInput, { color: theme.text }]}
            placeholder={activeType ? `Buscar ${TYPE_LABELS[activeType] ?? activeType}...` : "Buscar..."}
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color={theme.textSub} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Type tabs + Sort pills in a single scrollable row ──────────────── */}
      {!searchActive && (
        <>
          {/* Content type tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[s.tabsScroll, { backgroundColor: theme.bg }]}
            contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 8 }}
          >
          {types.map(tp => {
              const isActive = tp.type === activeType;
              return (
                <TouchableOpacity
                  key={tp.type}
                  style={[s.typeTab, isActive
                    ? { backgroundColor: theme.accent, borderColor: theme.accent }
                    : { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }
                  ]}
                  onPress={() => handleTypeChange(tp.type)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.typeTabLabel, { color: isActive ? '#fff' : theme.textSub }]}>
                    {TYPE_LABELS[tp.type] ?? tp.type}
                  </Text>
                  <Text style={[s.typeTabCount, { color: isActive ? 'rgba(255,255,255,0.7)' : theme.textMuted }]}>
                    {tp.count >= 1000 ? `${(tp.count / 1000).toFixed(1)}k` : tp.count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Sort pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[s.sortScroll, { backgroundColor: theme.bg }]}
            contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 8 }}
          >
            {SORT_OPTIONS.map(opt => {
              const isActive = opt.id === sortMode;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[s.sortPill,
                    isActive
                      ? { backgroundColor: `${theme.accent}22`, borderColor: theme.accent }
                      : { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                  ]}
                  onPress={() => setSortMode(prev => (prev === opt.id ? null : opt.id))}
                  activeOpacity={0.8}
                >
                  <Text style={[s.sortPillLabel, { color: isActive ? theme.accent : theme.textSub }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      {firstLoad && loading ? (
        <View style={s.centerSpinner}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          numColumns={COL}
          style={s.grid}
          contentContainerStyle={s.gridContent}
          columnWrapperStyle={s.gridRow}
          onEndReached={() => { if (hasNextPage && !loading) doFetch(activeType, sortMode, searchQuery, page + 1, false); }}
          onEndReachedThreshold={0.5}
          onRefresh={() => { setRefreshing(true); doFetch(activeType, sortMode, searchQuery, 1, true); }}
          refreshing={refreshing}
          ListFooterComponent={loading && !firstLoad ? <View style={{ paddingVertical: 20 }}><ActivityIndicator color="#E50914" /></View> : null}
          ListEmptyComponent={!loading ? (
            <View style={s.emptyWrap}>
              <Text style={[s.emptyText, { color: theme.textMuted }]}>Sin resultados</Text>
            </View>
          ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingBottom: 10,
    flexShrink: 0,
  },
  backBtn: { marginRight: 10, padding: 4 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  searchToggle: { padding: 8 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: H_PAD,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  tabsScroll: { flexGrow: 0, flexShrink: 0, height: 42, maxHeight: 42, marginBottom: 8 },
  typeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.22)',
    gap: 5,
  },
  typeTabActive: { backgroundColor: '#E50914', borderColor: '#E50914' }, // overridden inline
  typeTabLabel: { fontWeight: '700', fontSize: 13 },
  typeTabLabelActive: { color: '#fff' }, // overridden inline
  typeTabCount: { fontSize: 10, fontWeight: '700' },
  typeTabCountActive: { color: 'rgba(255,255,255,0.7)' },

  sortScroll: { flexGrow: 0, flexShrink: 0, height: 36, maxHeight: 36, marginBottom: 10 },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.22)',
  },
  sortPillActive: {}, // overridden inline by theme
  sortPillLabel: { fontWeight: '600', fontSize: 12 },
  sortPillLabelActive: { color: '#000' },

  grid: { flex: 1, minHeight: 0 },
  gridContent: { paddingHorizontal: H_PAD, paddingBottom: 110 },
  gridRow: { gap: GAP, marginBottom: 14 },
  posterWrap: { width: POSTER_W },
  poster: { width: POSTER_W, height: POSTER_H, borderRadius: 8, backgroundColor: 'rgba(128,128,128,0.12)' },
  posterTitle: { fontSize: 11, fontWeight: '600', marginTop: 5, lineHeight: 15 },
  posterYear: { fontSize: 10, marginTop: 1 },

  centerSpinner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, fontWeight: '600' },
});
