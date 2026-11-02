import axios from "axios";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronRight, Play, Search, Tv2, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL, Channel, useGlobal } from "../../contexts/GlobalContext";
import { useAppTheme, useSettings } from "../../contexts/SettingsContext";
import {
  ContinueItem,
  getContinueWatching,
  removeContinue,
} from "../../services/continueWatching";
import {
  getConfig,
  getContentList,
  getGenres,
  getHomepage,
  getTypes,
  NexoContentItem,
  NexoSiteConfig,
  searchContent,
} from "../../services/nexoplay";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface CategoryTabItem {
  id: string;
  label: string;
  type?: string;
  genreId?: string;
  isLive?: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { channels, setActiveChannel, token } = useGlobal();
  const { settings } = useSettings();
  const theme = useAppTheme();

  // Dynamic Site Config from backend
  const [siteConfig, setSiteConfig] = useState<NexoSiteConfig>({});

  // Dynamic Categories from backend
  const [dynamicTabs, setDynamicTabs] = useState<CategoryTabItem[]>([
    { id: "inicio", label: "INICIO" },
  ]);
  const [activeTabId, setActiveTabId] = useState("inicio");

  // NexoPlay VOD data from backend
  const [heroItems, setHeroItems] = useState<NexoContentItem[]>([]);
  const [recentMovies, setRecentMovies] = useState<NexoContentItem[]>([]);
  const [trendingContent, setTrendingContent] = useState<NexoContentItem[]>([]);
  const [featuredContent, setFeaturedContent] = useState<NexoContentItem[]>([]);
  const [estrenosContent, setEstrenosContent] = useState<NexoContentItem[]>([]);
  const [categoryContent, setCategoryContent] = useState<NexoContentItem[]>([]);
  const [loadingCategoryContent, setLoadingCategoryContent] = useState(false);
  const [loadingVod, setLoadingVod] = useState(true);

  // Hero carousel
  const [heroIndex, setHeroIndex] = useState(0);
  const heroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real-time Search input state in top bar
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NexoContentItem[]>([]);
  const [searching, setSearching] = useState(false);

  // TV Connection states
  const [showTvModal, setShowTvModal] = useState(false);
  const [tvDevices, setTvDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);

  // ── 1. Fetch Dynamic Backend Config & Categories ──────────────────────────
  useEffect(() => {
    async function initBackendMetadata() {
      try {
        const [cfg, types, genres] = await Promise.all([
          getConfig(),
          getTypes(),
          getGenres(),
        ]);
        if (cfg) setSiteConfig(cfg);

        // Build dynamic tabs directly from backend data
        const tabs: CategoryTabItem[] = [{ id: "inicio", label: "INICIO" }];

        // Add types returned by backend
        types.forEach((t) => {
          if (t.type === "MOVIE") {
            tabs.push({ id: "type_movie", label: "PELÍCULAS", type: "MOVIE" });
          } else if (t.type === "SERIES") {
            tabs.push({ id: "type_series", label: "SERIES", type: "SERIES" });
          } else if (t.type === "ANIME") {
            tabs.push({ id: "type_anime", label: "ANIMÉ", type: "ANIME" });
          } else if (t.type === "DOCUMENTARY") {
            tabs.push({
              id: "type_doc",
              label: "DOCUMENTALES",
              type: "DOCUMENTARY",
            });
          }
        });

        // Add special genres from backend if present
        const soapGenre = genres.find(
          (g) => g.slug === "soap" || g.name.toLowerCase().includes("novela"),
        );
        if (soapGenre) {
          tabs.push({
            id: `genre_${soapGenre.id}`,
            label: "NOVELAS",
            genreId: soapGenre.id,
          });
        }

        const kidsGenre = genres.find(
          (g) =>
            g.slug === "kids" ||
            g.name.toLowerCase().includes("niñ") ||
            g.slug === "familia",
        );
        if (kidsGenre) {
          tabs.push({
            id: `genre_${kidsGenre.id}`,
            label: "NIÑOS",
            genreId: kidsGenre.id,
          });
        }

        // Live TV tab
        tabs.push({ id: "live_tv", label: "TV EN VIVO", isLive: true });

        setDynamicTabs(tabs);
      } catch (e) {
        console.warn("Error initializing backend metadata:", e);
      }
    }
    initBackendMetadata();
  }, []);

  // ── 2. Fetch Homepage Content from Backend ────────────────────────────────
  const loadHomepageData = useCallback(async () => {
    setLoadingVod(true);
    try {
      const data = await getHomepage();
      if (data.heroItems && data.heroItems.length > 0) {
        setHeroItems(data.heroItems);
      }
      if (data.recent && data.recent.length > 0) {
        setRecentMovies(data.recent);
      }
      if (data.trending && data.trending.length > 0) {
        setTrendingContent(data.trending);
      }
      if (data.featured && data.featured.length > 0) {
        setFeaturedContent(data.featured);
      }
      getContentList({ sort: "releaseYear", limit: 20 })
        .then((items) => setEstrenosContent(items))
        .catch(() => {});
    } catch (e) {
      console.warn("Error loading homepage VOD:", e);
    } finally {
      setLoadingVod(false);
    }
  }, []);

  useEffect(() => {
    loadHomepageData();
  }, [loadHomepageData]);

  // ── 3. Handle Tab Change (Fetch Dynamic Category Data from Backend) ───────
  const handleTabChange = async (tab: CategoryTabItem) => {
    setActiveTabId(tab.id);
    if (searchQuery) setSearchQuery("");

    if (tab.id === "inicio" || tab.isLive) {
      setCategoryContent([]);
      return;
    }

    setLoadingCategoryContent(true);
    try {
      const items = await getContentList({
        type: tab.type,
        genreId: tab.genreId,
        limit: 30,
        sort: "popular",
      });
      setCategoryContent(items);
    } catch (e) {
      console.warn("Error loading category content:", e);
    } finally {
      setLoadingCategoryContent(false);
    }
  };

  // ── 4. Auto-scroll Hero slides ────────────────────────────────────────────
  useEffect(() => {
    if (heroItems.length <= 1) return;
    heroTimerRef.current = setTimeout(() => {
      setHeroIndex((prev) => (prev + 1) % heroItems.length);
    }, 6000);
    return () => {
      if (heroTimerRef.current) clearTimeout(heroTimerRef.current);
    };
  }, [heroIndex, heroItems.length]);

  // ── 5. Live Search Query to Backend ───────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchContent(q);
      setSearchResults(results);
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Live TV search filter
  const filteredChannelsSearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return channels.filter((c) => c.name.toLowerCase().includes(q));
  }, [channels, searchQuery]);

  // ── 6. Content Detail Navigation ───────────────────────────────────────────
  const handleOpenDetail = (item: NexoContentItem) => {
    router.push({
      pathname: "/detail",
      params: {
        slug: item.slug || item.id,
        title: item.title,
      },
    });
  };

  const handlePlayChannel = (channel: Channel) => {
    setActiveChannel(channel);
    router.push("/player");
  };

  // Active hero slide from backend
  const currentHero = heroItems[heroIndex] || heroItems[0] || null;

  // Listas sin repetidos entre secciones (orden de prioridad = orden de pantalla)
  const { estrenosList, trendingList, recentList } = useMemo(() => {
    const seen = new Set<string>();
    const uniq = (arr: NexoContentItem[]) =>
      arr.filter((i) => {
        if (!i?.id || seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      });
    const estrenos = uniq(estrenosContent);
    const trending = uniq(trendingContent);
    const recent = uniq(recentMovies);
    return {
      estrenosList: estrenos,
      trendingList: trending,
      recentList: recent,
    };
  }, [estrenosContent, trendingContent, recentMovies]);

  // Continuar viendo: se recarga cada vez que la pantalla gana foco
  const [continueItems, setContinueItems] = useState<ContinueItem[]>([]);

  const fetchTvDevices = useCallback(async () => {
    if (!token) {
      setTvDevices([]);
      setSelectedDevice(null);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/tv/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const devices = response.data?.devices ?? [];
      const connectedName = response.data?.connectedDevice ?? null;
      setTvDevices(devices);
      setSelectedDevice(
        connectedName
          ? (devices.find((device: any) => device.name === connectedName) ?? {
              name: connectedName,
            })
          : null,
      );
    } catch (error) {
      const e = error as any;
      console.warn(
        "TV devices no disponible:",
        e?.response?.status ?? e?.message ?? "error de red",
      );
      setTvDevices([]);
      setSelectedDevice(null);
    }
  }, [token]);

  const handleConnectToTv = async (device: any) => {
    if (!token) {
      Alert.alert(
        "No autenticado",
        "Necesitás iniciar sesión antes de conectar la TV.",
        [{ text: "OK" }],
      );
      return;
    }
    try {
      setConnecting(true);
      await axios.post(
        `${API_URL}/tv/connect`,
        { deviceName: device.name },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSelectedDevice(device);
      Alert.alert("Conectado", `Conectado a ${device.name}`);
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar. Intente de nuevo.");
    } finally {
      setConnecting(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTvDevices();
      getContinueWatching().then(setContinueItems);
    }, []),
  );

  const handleResume = (ci: ContinueItem) => {
    router.push({
      pathname: "/watch",
      params: {
        slug: ci.slug,
        ...(ci.episodeId ? { episodeId: ci.episodeId } : {}),
        initialProgress: String(
          Math.max(0, Math.floor(ci.positionMs / 1000) - 3),
        ),
      },
    });
  };

  const handleRemoveContinue = async (slug: string) => {
    await removeContinue(slug);
    setContinueItems((prev) => prev.filter((i) => i.slug !== slug));
  };

  const renderRow = (
    title: string,
    list: NexoContentItem[],
    onSeeAll: () => void,
  ) =>
    list.length > 0 ? (
      <View style={s.sectionContainer}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: theme.text }]}>{title}</Text>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onSeeAll}
            style={[
              s.chevronCircleBtn,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <ChevronRight size={18} color={theme.text} />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.cardsRow}
        >
          {list.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => handleOpenDetail(item)}
              style={s.posterCard}
            >
              <Image
                source={{ uri: item.posterUrl || item.backdropUrl || "" }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    ) : null;
  const heroGenre = currentHero?.genres?.[0]?.name || "";
  const heroType =
    currentHero?.type === "SERIES"
      ? "Serie"
      : currentHero?.type === "MOVIE"
        ? "Película"
        : currentHero?.type || "";
  const heroYear = currentHero?.releaseYear || "";

  // Branding text from backend
  const brandName = siteConfig.site_name || "epro";

  // TV transmit button - always visible, but modal only when real devices exist.
  const handleTvButtonPress = () => {
    setShowTvModal(true);
  };

  const hasTvDevices = tvDevices.length > 0 || !!selectedDevice;

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={theme.statusBar}
        translucent
        backgroundColor={theme.bg}
      />

      {/* TOP BAR */}
      <View
        style={[
          s.topBar,
          { paddingTop: insets.top + 6, backgroundColor: theme.bg },
        ]}
      >
        <View style={s.logoContainer}>
          <Text style={[s.logoText, { color: theme.text }]}>
            NUBA<Text style={{ color: theme.accent }}>TV</Text>
          </Text>
        </View>

        {/* Search input */}
        <View
          style={[
            s.searchBarContainer,
            { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
          ]}
        >
          <Search size={16} color={theme.textSub} style={{ marginRight: 6 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              trendingContent.length > 0
                ? `${trendingContent[0].title.slice(0, 16)}...`
                : "Buscar títulos, canales..."
            }
            placeholderTextColor={theme.textMuted}
            returnKeyType="search"
            autoCapitalize="none"
            style={[s.searchBarInput, { color: theme.text }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ padding: 2 }}
            >
              <X size={15} color={theme.textSub} />
            </TouchableOpacity>
          )}
        </View>

        {/* Right: transmit / open TV */}
        <View style={s.topBarIcons}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleTvButtonPress}
            style={[s.iconBtn, { backgroundColor: theme.cardBg }]}
          >
            <Tv2 size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {showTvModal && (
        <Modal
          visible={showTvModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTvModal(false)}
        >
          <View style={s.modalBackdrop}>
            <View style={s.modalContainer}>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setShowTvModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={18} color="#fff" />
              </TouchableOpacity>

              <View style={{ padding: 20, paddingTop: 50 }}>
                <Text style={s.modalTitle}>Transmitir a TV</Text>

                {tvDevices.length > 0 ? (
                  <>
                    <Text style={s.modalGenres}>
                      Seleccioná una pantalla disponible
                    </Text>

                    {tvDevices.map((device) => {
                      const isSelected =
                        selectedDevice?.name === device.name ||
                        (!selectedDevice && device.name === tvDevices[0]?.name);

                      return (
                        <TouchableOpacity
                          key={device.name}
                          activeOpacity={0.85}
                          onPress={() => {
                            setSelectedDevice(device);
                            setShowTvModal(false);
                          }}
                          style={[
                            s.episodeRow,
                            {
                              backgroundColor: isSelected
                                ? "#1d1d1d"
                                : "#121212",
                              borderWidth: isSelected ? 1 : 0,
                              borderColor: isSelected
                                ? theme.accent
                                : "transparent",
                            },
                          ]}
                        >
                          <Tv2
                            size={16}
                            color={
                              isSelected
                                ? theme.accent
                                : "rgba(255,255,255,0.6)"
                            }
                          />
                          <Text style={s.episodeTitle}>{device.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <Text
                      style={[s.modalGenres, { fontSize: 15, lineHeight: 22 }]}
                    >
                      No hay dispositivos disponibles para transmitir en este
                      momento.
                    </Text>
                    <Text
                      style={[s.modalGenres, { marginTop: 12, opacity: 0.7 }]}
                    >
                      Asegurate de que tu TV o dispositivo compatible esté
                      encendido y en la misma red.
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* CATEGORY TABS */}
      <View
        style={[
          s.tabsContainer,
          { backgroundColor: theme.bg, borderBottomColor: theme.divider },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsScroll}
        >
          {dynamicTabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => handleTabChange(tab)}
                activeOpacity={0.75}
                style={s.tabItem}
              >
                <Text
                  style={[
                    s.tabLabel,
                    { color: isActive ? theme.accent : theme.textSub },
                  ]}
                >
                  {tab.label}
                </Text>
                {isActive && (
                  <View
                    style={[
                      s.activeTabIndicator,
                      { backgroundColor: theme.accent },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ──────────────────────────────────────────────────────────────────────
          3. SCROLLABLE BODY
      ──────────────────────────────────────────────────────────────────────── */}
      <ScrollView
        style={[s.scroll, { backgroundColor: theme.bg }]}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* LIVE SEARCH RESULTS */}
        {searchQuery.trim().length > 0 ? (
          <View style={{ padding: 16 }}>
            <Text style={[s.searchResultsHeader, { color: theme.text }]}>
              Resultados para "{searchQuery}"
            </Text>

            {searching ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#e50914" />
              </View>
            ) : searchResults.length === 0 &&
              filteredChannelsSearch.length === 0 ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ color: theme.textSub, fontSize: 14 }}>
                  No se encontraron resultados para "{searchQuery}"
                </Text>
              </View>
            ) : (
              <>
                {/* VOD Results from Backend */}
                {searchResults.length > 0 && (
                  <View style={{ marginBottom: 24 }}>
                    <Text style={[s.searchSubHeader, { color: theme.textSub }]}>
                      Películas y Series ({searchResults.length})
                    </Text>
                    <View style={s.searchGrid}>
                      {searchResults.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          activeOpacity={0.8}
                          onPress={() => handleOpenDetail(item)}
                          style={[
                            s.gridPoster,
                            { backgroundColor: theme.cardBg },
                          ]}
                        >
                          <Image
                            source={{
                              uri: item.posterUrl || item.backdropUrl || "",
                            }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                            transition={200}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Live Channels Results from Backend */}
                {filteredChannelsSearch.length > 0 && (
                  <View>
                    <Text style={[s.searchSubHeader, { color: theme.textSub }]}>
                      Canales de TV ({filteredChannelsSearch.length})
                    </Text>
                    <View style={s.searchGrid}>
                      {filteredChannelsSearch.map((ch) => (
                        <TouchableOpacity
                          key={ch.id}
                          activeOpacity={0.8}
                          onPress={() => handlePlayChannel(ch)}
                          style={s.channelCard}
                        >
                          <View
                            style={[
                              s.channelLogoWrapper,
                              {
                                backgroundColor: theme.cardBg,
                                borderColor: theme.cardBorder,
                              },
                            ]}
                          >
                            {ch.logo ? (
                              <Image
                                source={{ uri: ch.logo }}
                                style={StyleSheet.absoluteFill}
                                contentFit="contain"
                              />
                            ) : (
                              <Tv2 size={28} color={theme.textSub} />
                            )}
                          </View>
                          <Text
                            style={[s.channelName, { color: theme.textSub }]}
                            numberOfLines={1}
                          >
                            {ch.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        ) : activeTabId === "live_tv" ? (
          /* LIVE TV CHANNELS VIEW */
          <View style={{ padding: 16 }}>
            <Text style={[s.searchResultsHeader, { color: theme.text }]}>
              Canales de TV en Vivo
            </Text>
            <View style={s.searchGrid}>
              {channels.map((ch) => (
                <TouchableOpacity
                  key={ch.id}
                  activeOpacity={0.8}
                  onPress={() => handlePlayChannel(ch)}
                  style={s.channelCard}
                >
                  <View
                    style={[
                      s.channelLogoWrapper,
                      {
                        backgroundColor: theme.cardBg,
                        borderColor: theme.cardBorder,
                      },
                    ]}
                  >
                    {ch.logo ? (
                      <Image
                        source={{ uri: ch.logo }}
                        style={StyleSheet.absoluteFill}
                        contentFit="contain"
                      />
                    ) : (
                      <Tv2 size={28} color={theme.textSub} />
                    )}
                  </View>
                  <Text
                    style={[s.channelName, { color: theme.textSub }]}
                    numberOfLines={1}
                  >
                    {ch.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : activeTabId !== "inicio" ? (
          /* DYNAMIC CATEGORY VIEW (Movies, Series, Novelas, etc.) */
          <View style={{ padding: 16 }}>
            <Text style={[s.searchResultsHeader, { color: theme.text }]}>
              {dynamicTabs.find((t) => t.id === activeTabId)?.label ||
                "Contenido"}
            </Text>

            {loadingCategoryContent ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#e50914" />
              </View>
            ) : (
              <View style={s.searchGrid}>
                {categoryContent.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => handleOpenDetail(item)}
                    style={[s.gridPoster, { backgroundColor: theme.cardBg }]}
                  >
                    <Image
                      source={{ uri: item.posterUrl || item.backdropUrl || "" }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={200}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* DEFAULT INICIO VIEW (Dynamic Hero + Backend Rows) */
          <>
            {/* HERO SECTION (100% Dynamic from Backend) */}
            {currentHero ? (
              <View style={s.heroContainer}>
                <Image
                  source={{
                    uri:
                      currentHero.posterUrl ||
                      currentHero.thumbnails?.find((t) => t.type === "POSTER")
                        ?.url ||
                      currentHero.backdropUrl ||
                      "",
                  }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={300}
                />

                {/* Smooth bottom shadow gradient */}
                <LinearGradient
                  colors={["transparent", "rgba(13,13,13,0.55)", "#0d0d0d"]}
                  locations={[0, 0.6, 1]}
                  style={s.heroBottomGradient}
                />

                {/* Hero details container */}
                <View style={s.heroContent}>
                  {/* Dynamic Title from Backend */}

                  {/* Dynamic Tagline or Original Title if available */}
                  {!!currentHero.tagline && (
                    <Text style={s.heroSubtitle} numberOfLines={1}>
                      {currentHero.tagline}
                    </Text>
                  )}

                  {/* Dynamic Metadata: Type • Genre • Year */}
                  <Text style={s.heroMetaText}>
                    {[heroType, heroGenre, heroYear]
                      .filter(Boolean)
                      .join(" • ")}
                  </Text>

                  {/* "Ver detalles" button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleOpenDetail(currentHero)}
                    style={s.verDetallesBtn}
                  >
                    <Text style={s.verDetallesText}>Ver detalles</Text>
                  </TouchableOpacity>

                  {/* Dynamic Indicator dots from backend heroItems */}
                  {heroItems.length > 1 && (
                    <View style={s.heroDotsRow}>
                      {heroItems.slice(0, 10).map((_, idx) => {
                        const isSelected = idx === heroIndex;
                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => setHeroIndex(idx)}
                            style={
                              isSelected ? s.heroDotActive : s.heroDotInactive
                            }
                          />
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View
                style={[
                  s.heroContainer,
                  {
                    backgroundColor: theme.cardBg,
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
              >
                {loadingVod ? (
                  <ActivityIndicator size="large" color="#e50914" />
                ) : (
                  <Text style={{ color: theme.textSub }}>
                    Cargando catálogo...
                  </Text>
                )}
              </View>
            )}

            {/* Continuar viendo */}
            {continueItems.length > 0 && (
              <View style={s.sectionContainer}>
                <View style={s.sectionHeader}>
                  <Text style={[s.sectionTitle, { color: theme.text }]}>
                    Continuar viendo
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.cardsRow}
                >
                  {continueItems.map((ci) => {
                    const pct =
                      ci.durationMs > 0
                        ? Math.min(100, (ci.positionMs / ci.durationMs) * 100)
                        : 0;
                    return (
                      <TouchableOpacity
                        key={ci.slug}
                        activeOpacity={0.85}
                        onPress={() => handleResume(ci)}
                        style={s.continueCard}
                      >
                        <Image
                          source={{ uri: ci.backdropUrl || ci.posterUrl || "" }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                          transition={200}
                        />
                        <LinearGradient
                          colors={["transparent", "rgba(0,0,0,0.85)"]}
                          style={StyleSheet.absoluteFill}
                        />
                        <TouchableOpacity
                          style={s.continueRemove}
                          onPress={() => handleRemoveContinue(ci.slug)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X size={14} color="#fff" />
                        </TouchableOpacity>
                        <View style={s.continuePlay}>
                          <Play size={16} color="#fff" fill="#fff" />
                        </View>
                        <View style={s.continueInfo}>
                          <Text style={s.continueTitle} numberOfLines={1}>
                            {ci.title}
                          </Text>
                          <View style={s.continueBarBg}>
                            <View
                              style={[s.continueBarFill, { width: `${pct}%` }]}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Estrenos */}
            {renderRow("Estrenos", estrenosList, () =>
              router.push("/(tabs)/explore"),
            )}

            {/* En Tendencia */}
            {renderRow("En Tendencia", trendingList, () =>
              router.push("/(tabs)/explore"),
            )}

            {/* Recién Agregados */}
            {renderRow("Recién Agregados", recentList, () =>
              router.push("/(tabs)/explore"),
            )}

            {/* Canales de TV en Vivo */}
            {channels.length > 0 && (
              <View style={s.sectionContainer}>
                <View style={s.sectionHeader}>
                  <Text style={[s.sectionTitle, { color: theme.text }]}>
                    Canales de TV en Vivo
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setActiveTabId("live_tv")}
                    style={[
                      s.chevronCircleBtn,
                      {
                        backgroundColor: theme.cardBg,
                        borderColor: theme.cardBorder,
                      },
                    ]}
                  >
                    <ChevronRight size={18} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.cardsRow}
                >
                  {channels.slice(0, 15).map((ch) => (
                    <TouchableOpacity
                      key={ch.id}
                      activeOpacity={0.8}
                      onPress={() => handlePlayChannel(ch)}
                      style={s.channelCard}
                    >
                      <View
                        style={[
                          s.channelLogoWrapper,
                          { backgroundColor: theme.cardBg },
                        ]}
                      >
                        {ch.logo ? (
                          <Image
                            source={{ uri: ch.logo }}
                            style={StyleSheet.absoluteFill}
                            contentFit="contain"
                          />
                        ) : (
                          <Tv2 size={28} color={theme.textSub} />
                        )}
                      </View>
                      <Text
                        style={[s.channelName, { color: theme.textSub }]}
                        numberOfLines={1}
                      >
                        {ch.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 170,
  },

  // ── Top Bar ──────────────────────────────────────────────────────────────
  topBar: {
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,

    marginTop: 18,
    paddingBottom: 24,
    height: 58,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontSize: 26,
    fontWeight: "900",
    color: "transparent", // overridden inline
    letterSpacing: -0.6,
  },
  logoRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 1,
    padding: 2.2,
  },
  logoInnerRing: {
    flex: 1,
    width: "100%",
    borderRadius: 9,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlayTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#ffffff",
    marginLeft: 1.5,
  },
  searchBarContainer: {
    flex: 1,
    height: 38,
    backgroundColor: "transparent", // overridden inline
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginHorizontal: 12,
  },
  searchBarInput: {
    flex: 1,
    color: "inherit", // overridden inline
    fontSize: 13,
    fontWeight: "500",
    paddingVertical: 0,
  },
  topBarIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 2,
  },

  // ── Category Tabs ─────────────────────────────────────────────────────────
  tabsContainer: {
    backgroundColor: "transparent",
    paddingBottom: 4,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 22,
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
    paddingBottom: 4,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "inherit",
    letterSpacing: 0.4,
  },
  tabLabelActive: {
    color: "transparent", // overridden inline
  },
  activeTabIndicator: {
    width: 28,
    height: 3,
    backgroundColor: "transparent", // overridden inline
    borderRadius: 2,
    marginTop: 4,
  },

  // ── Search Results ────────────────────────────────────────────────────────
  searchResultsHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111", // overridden inline
    marginBottom: 16,
  },
  searchSubHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "transparent", // overridden inline
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  searchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  // 3-column poster grid that fills the full width (16px side padding, 12px gaps)
  gridPoster: {
    width: Math.floor((SCREEN_W - 32 - 12 * 2) / 3),
    aspectRatio: 2 / 3,
    borderRadius: 10,
    overflow: "hidden",
  },

  // ── Hero Section ──────────────────────────────────────────────────────────
  heroContainer: {
    width: SCREEN_W,
    height: 540,
    position: "relative",
    backgroundColor: "transparent",
  },
  heroBottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  heroContent: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  heroDynamicTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 1.2,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fbbf24",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  heroMetaText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  verDetallesBtn: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 24,
    marginBottom: 16,
    elevation: 4,
  },
  verDetallesText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "800",
  },
  heroDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroDotActive: {
    width: 26,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
  },
  heroDotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },

  // ── Content Sections ──────────────────────────────────────────────────────
  sectionContainer: {
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "transparent", // overridden inline
    letterSpacing: 0.2,
  },
  chevronCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "transparent", // overridden inline
    alignItems: "center",
    justifyContent: "center",
  },
  cardsRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  continueCard: {
    width: 210,
    height: 118,
    borderRadius: 12,
    backgroundColor: "#1a1a1e",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  continueRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  continuePlay: {
    position: "absolute",
    top: 40,
    left: 90,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  continueInfo: { padding: 10 },
  continueTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  continueBarBg: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  continueBarFill: { height: 3, borderRadius: 2, backgroundColor: "#E50914" },
  posterCard: {
    width: 124,
    height: 182,
    borderRadius: 12,
    backgroundColor: "#1a1a1e",
    overflow: "hidden",
  },

  // Channels
  channelCard: {
    width: 120,
    alignItems: "center",
  },
  channelLogoWrapper: {
    width: 110,
    height: 80,
    borderRadius: 12,
    backgroundColor: "transparent", // overridden inline
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 10,
    borderWidth: 1,
    borderColor: "transparent", // overridden inline
  },
  channelName: {
    color: "transparent", // overridden inline
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },

  // ── Modal Detail ──────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: SCREEN_H * 0.85,
    backgroundColor: "#0d0d0d",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeroImgWrapper: {
    width: "100%",
    height: 220,
    position: "relative",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
  },
  modalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  modalYear: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  modalRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(250,204,21,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  modalRatingText: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "700",
  },
  modalTypeBadge: {
    color: "#e50914",
    fontSize: 12,
    fontWeight: "700",
  },
  modalGenres: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 16,
  },
  modalPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  modalPlayBtnText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "800",
  },
  modalDescription: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    lineHeight: 20,
  },
  episodesHeader: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  episodeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161616",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  episodeTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});
