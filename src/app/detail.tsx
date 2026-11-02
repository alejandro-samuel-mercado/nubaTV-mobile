import Image from '../components/FastImage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
      ArrowLeft,
      Check,
      ChevronDown,
      MoreHorizontal,
      Play,
      Plus
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { isInMyList, toggleMyList } from '../services/myList';
import {
      ActivityIndicator,
      Dimensions,
      NativeScrollEvent,
      NativeSyntheticEvent,
      ScrollView,
      StyleSheet,
      StatusBar,
      Text,
      TouchableOpacity,
      View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
      getContentDetail,
      getWatchStream,
  NexoContentItem,
  NEXOPLAY_API_BASE,
} from '../services/nexoplay';
import { useSettings, useAppTheme } from '../contexts/SettingsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Default fallback production companies for premium visual fidelity
const DEFAULT_PRODUCTION = [
  { id: '1', name: 'Warner Bros.', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Warner_Bros_logo.svg/300px-Warner_Bros_logo.svg.png' },
  { id: '2', name: 'Blossom Films', logo: null, textLogo: 'Blossom films' },
  { id: '3', name: 'Fortis Productions', logo: null, textLogo: 'FORTIS PRODUCTIONS' },
  { id: '4', name: 'Domain Entertainment', logo: null, textLogo: 'Domain ENTERTAINMENT' },
  { id: '5', name: 'Alcon Entertainment', logo: null, textLogo: 'ALCON ENTERTAINMENT' },
];

// Default fallback cast members
const DEFAULT_CAST = [
  {
    id: 'c1',
    name: 'Susanne Bier',
    role: 'Director',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'c2',
    name: 'Sandra Bullock',
    role: 'Sally Owens',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'c3',
    name: 'Nicole Kidman',
    role: 'Gillian Owens',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'c4',
    name: 'Joey King',
    role: 'Kylie Owens',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
  },
];

export default function DetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ slug?: string; id?: string; title?: string }>();
  const { settings } = useSettings();
  const theme = useAppTheme();
  const styles = makeStyles(theme);

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<NexoContentItem | null>(null);
  const [playing, setPlaying] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [inMyList, setInMyList] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const slug = params.slug || params.id || '';
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    let on = true;
    setRelated([]);
    fetch(`${NEXOPLAY_API_BASE}/api/content/${slug}/related`)
      .then((r) => r.json())
      .then((j) => { if (on && j?.success && Array.isArray(j.data)) setRelated(j.data); })
      .catch(() => {});
    return () => { on = false; };
  }, [slug]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!slug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getContentDetail(slug);
        if (isMounted) {
          if (data) {
            setContent(data);
            isInMyList(data.slug).then(v => { if (isMounted) setInMyList(v); });
          }
        }
      } catch (e) {
        console.warn('Error loading content detail:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  };

  const handlePlay = (episodeId?: string) => {
    if (!content) return;
    router.push({
      pathname: '/watch',
      params: {
        slug: content.slug || content.id,
        ...(episodeId ? { episodeId } : {}),
      },
    });
  };

  const formatDuration = (mins?: number) => {
    if (!mins || mins <= 0) return '2h 10m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
    return `${m}m`;
  };

  const title = content?.title || params.title || 'Detalles';
  const tagline = content?.tagline || '';
  const backdrop =
    content?.backdropUrl ||
    content?.posterUrl ||
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80';
  const genres =
    content?.genres && content.genres.length > 0
      ? content.genres.map((g) => g.name).join(' • ')
      : 'Romance • Fantasía • Comedia';
  const year = content?.releaseYear || 2026;
  const durationStr = formatDuration(content?.duration);
  const rating = content?.rating ? Number(content.rating).toFixed(1) : '6.3';
  const ageRating = (content as any)?.ageRating || 'B';
  const description =
    content?.description ||
    'En un mundo envuelto en travesuras a la luz de la luna y una poderosa magia ancestral, las hermanas Owens deberán enfrentar la oscura maldición que amenaza con destruir los lazos familiares que tanto les costó reconstruir.';

  const directors =
    (content as any)?.directors && (content as any).directors.length > 0
      ? (content as any).directors.map((d: any) => d?.name || d).join(', ')
      : 'Susanne Bier';

  const cast =
    (content as any)?.actors && (content as any).actors.length > 0
      ? (content as any).actors.map((act: any, idx: number) => ({
          id: act.id || String(idx),
          name: act.name || act,
          role: act.character || act.role || 'Reparto',
          photo: act.photo || act.profileUrl || DEFAULT_CAST[idx % DEFAULT_CAST.length].photo,
        }))
      : DEFAULT_CAST;

  const hasRealCast = true;

  const c: any = content || {};
  const rawProd = c.productionCompanies || c.studios || c.production || [];
  const productionItems: { label: string; value: string }[] = (Array.isArray(rawProd) ? rawProd : [])
    .map((p: any) => (typeof p === 'string' ? p : p?.name || ''))
    .filter((n: string) => !!n)
    .map((n: string) => ({ label: 'Productora', value: n }));

  const showScrolledHeader = scrollY > 200;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      {/* ────────────────────────────────────────────────────────────────────────
          1. STICKY TOP APP BAR (Fade in on scroll or absolute back button)
      ──────────────────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: insets.top > 0 ? insets.top : 12,
            backgroundColor: showScrolledHeader ? 'rgba(13, 13, 13, 0.95)' : 'transparent',
            borderBottomColor: showScrolledHeader ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            borderBottomWidth: showScrolledHeader ? 1 : 0,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>

        {showScrolledHeader ? (
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText} numberOfLines={1}>
              {title.toUpperCase()}
            </Text>
            {!!tagline && (
              <Text style={styles.headerSubtitleText} numberOfLines={1}>
                {tagline.toUpperCase()}
              </Text>
            )}
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}

      
      </View>

      {/* ────────────────────────────────────────────────────────────────────────
          2. SCROLLABLE BODY
      ──────────────────────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO BACKDROP BANNER */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: backdrop }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.2)',
              'transparent',
              'rgba(0,0,0,0.6)',
              theme.bg,
            ]}
            locations={[0, 0.35, 0.75, 1]}
            style={styles.heroGradient}
          />

          {/* Center Title overlay on the backdrop */}
          <View style={styles.titleOverlay}>
            <Text style={styles.heroTitle}>{title.toUpperCase()}</Text>
            {!!tagline && <Text style={styles.heroTagline}>{tagline.toUpperCase()}</Text>}
            <Text style={styles.heroGenres}>{genres}</Text>
          </View>
        </View>

        {/* DETAILS CONTENT CONTAINER */}
        <View style={styles.bodyContent}>
          {/* ACTION BUTTONS: REPRODUCIR & MORE */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => handlePlay()}
              activeOpacity={0.85}
              disabled={playing}
              style={styles.playButton}
            >
              {playing ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Play size={20} color="#000000" fill="#000000" style={{ marginRight: 8 }} />
                  <Text style={styles.playButtonText}>Reproducir</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => { if (content) setInMyList(await toggleMyList(content)); }}
              activeOpacity={0.7}
              style={[styles.moreButton, inMyList && { backgroundColor: 'rgba(229,9,20,0.25)' }]}
            >
              {inMyList ? <Check size={22} color="#e50914" /> : <Plus size={22} color="#ffffff" />}
            </TouchableOpacity>
          </View>

          {/* METADATA BADGES */}
          <View style={styles.metaRow}>
            <Text style={[styles.metaYear, { color: theme.textSub }]}>{year}</Text>
            <Text style={[styles.metaDuration, { color: theme.textSub }]}>{durationStr}</Text>

            <View style={[styles.ageBadge, { borderColor: theme.textMuted }]}>
              <Text style={[styles.ageBadgeText, { color: theme.textSub }]}>{ageRating}</Text>
            </View>

            <View style={styles.imdbContainer}>
              <View style={styles.imdbPill}>
                <Text style={styles.imdbPillText}>IMDb</Text>
              </View>
              <Text style={[styles.imdbRating, { color: theme.textSub }]}>{rating}</Text>
            </View>
          </View>

          {/* DIRECTOR */}
          <Text style={[styles.directorText, { color: theme.text }]}>
            <Text style={{ color: theme.textSub }}>Director: </Text>
            {directors}
          </Text>

          {/* SYNOPSIS */}
          <View style={styles.synopsisContainer}>
            <Text style={[styles.synopsisText, { color: theme.textSub }]} numberOfLines={expandedDesc ? undefined : 3}>
              {description}
            </Text>
            <TouchableOpacity onPress={() => setExpandedDesc(!expandedDesc)} activeOpacity={0.7} style={styles.expandToggle}>
              <Text style={[styles.expandToggleText, { color: theme.accent }]}>
                {expandedDesc ? 'Mostrar menos ▴' : 'Mostrar más ▾'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ──────────────────────────────────────────────────────────────────
              PRODUCCIÓN SECTION
          ────────────────────────────────────────────────────────────────── */}
          {productionItems.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Producción</Text>
              <View style={styles.productionGrid}>
                {productionItems.map((p) => (
                  <View key={p.label} style={[styles.productionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.productionLabel, { color: theme.textMuted }]}>{p.label.toUpperCase()}</Text>
                    <Text style={[styles.productionValue, { color: theme.text }]} numberOfLines={2}>{p.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              REPARTO (CAST) SECTION
          ────────────────────────────────────────────────────────────────── */}
          {hasRealCast && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Reparto</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castList}>
              {cast.map((actor: any) => (
                <View key={actor.id} style={styles.castItem}>
                  <Image source={{ uri: actor.photo }} style={styles.castAvatar} resizeMode="cover" />
                  <Text style={[styles.castName, { color: theme.text }]} numberOfLines={1}>{actor.name}</Text>
                  <Text style={[styles.castRole, { color: theme.textSub }]} numberOfLines={1}>{actor.role}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
          )}


          {/* ──────────────────────────────────────────────────────────────────
              DETALLES DE LA PELÍCULA / SERIE
          ────────────────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {content?.type === 'SERIES' ? 'Detalles de la serie' : 'Detalles de la película'}
            </Text>

            <View style={styles.detailsTable}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estado</Text>
                <Text style={styles.detailValue}>
                  {(content as any)?.status === 'ACTIVE' ? 'Released' : 'Released'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Información de estreno</Text>
                <Text style={styles.detailValue}>{year}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duración</Text>
                <Text style={styles.detailValue}>{durationStr}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Clasificación</Text>
                <Text style={styles.detailValue}>{ageRating}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>País de origen</Text>
                <Text style={styles.detailValue}>{(content as any)?.country || 'US'}</Text>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Idioma original</Text>
                <Text style={styles.detailValue}>
                  {((content as any)?.originalLanguage || 'EN').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {related.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Relacionados</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {related.map((r) => (
                  <TouchableOpacity
                    key={r.id || r.slug}
                    style={styles.relatedItem}
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/detail', params: { slug: r.slug || r.id } })}
                  >
                    <Image source={{ uri: r.posterUrl || r.backdropUrl || undefined }} style={styles.relatedPoster} resizeMode="cover" />
                    <Text style={styles.relatedTitle} numberOfLines={2}>{r.title}</Text>
                    {!!r.releaseYear && <Text style={styles.relatedYear}>{r.releaseYear}</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* BOTTOM EXTRA SPACING */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(t: import('../contexts/SettingsContext').AppTheme) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ── Top Header Bar ─────────────────────────────────────────────────────────
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitleText: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  headerSubtitleText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerRightBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero Backdrop ──────────────────────────────────────────────────────────
  heroWrapper: {
    width: SCREEN_WIDTH,
    height: 440,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: 440,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  titleOverlay: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  heroTitle: {
    color: '#f0caa3',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroTagline: {
    color: '#e5b882',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
    textAlign: 'center',
  },
  heroGenres: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },

  // ── Body Content ───────────────────────────────────────────────────────────
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // ── Action Row: Reproducir + More ──────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  playButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  moreButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: t.cardBg,
    borderWidth: 1,
    borderColor: t.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Metadata Row ───────────────────────────────────────────────────────────
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 14,
  },
  metaYear: {
    color: t.text,
    fontSize: 16,
    fontWeight: '800',
  },
  metaDuration: {
    color: t.text,
    fontSize: 16,
    fontWeight: '800',
  },
  ageBadge: {
    borderWidth: 1,
    borderColor: t.textMuted,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  ageBadgeText: {
    color: t.textSub,
    fontSize: 12,
    fontWeight: '700',
  },
  imdbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imdbPill: {
    backgroundColor: '#f5c518',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  imdbPillText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
  imdbRating: {
    color: '#f5c518',
    fontSize: 16,
    fontWeight: '800',
  },

  // ── Director ───────────────────────────────────────────────────────────────
  directorText: {
    color: t.text,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },

  // ── Synopsis ───────────────────────────────────────────────────────────────
  synopsisContainer: {
    marginTop: 10,
  },
  synopsisText: {
    color: t.textSub,
    fontSize: 14,
    lineHeight: 21,
  },
  expandToggle: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  expandToggleText: {
    color: t.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Sections ───────────────────────────────────────────────────────────────
  section: {
    marginTop: 26,
  },
  sectionTitle: {
    color: t.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },

  // ── Producción ─────────────────────────────────────────────────────────────
  productionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  productionCard: {
    width: (SCREEN_WIDTH - 32 - 10) / 2,
    minHeight: 62,
    borderRadius: 14,
    backgroundColor: t.cardBg,
    borderWidth: 1,
    borderColor: t.cardBorder,
    justifyContent: 'center',
    padding: 12,
  },
  productionLabel: {
    color: t.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  productionValue: {
    color: t.text,
    fontSize: 14,
    fontWeight: '700',
  },
  relatedItem: { width: 112 },
  relatedPoster: {
    width: 112,
    height: 168,
    borderRadius: 10,
    backgroundColor: t.cardBg,
  },
  relatedTitle: {
    color: t.text,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  relatedYear: { color: t.textMuted, fontSize: 11, marginTop: 1 },
  productionLogo: {
    width: '80%',
    height: '70%',
  },
  productionText: {
    color: '#1a1a1a',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },

  // ── Reparto (Cast) ─────────────────────────────────────────────────────────
  castList: {
    gap: 16,
  },
  castItem: {
    width: 84,
    alignItems: 'center',
  },
  castAvatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: t.cardBg,
    borderWidth: 1.5,
    borderColor: t.cardBorder,
  },
  castName: {
    color: t.text,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  castRole: {
    color: t.textSub,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },

  // ── Tráilers ───────────────────────────────────────────────────────────────
  trailersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  trailerFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  trailerFilterText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  trailerList: {
    gap: 14,
  },
  trailerCard: {
    width: 230,
  },
  trailerThumbWrapper: {
    width: 230,
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: t.cardBg,
  },
  trailerThumb: {
    width: '100%',
    height: '100%',
  },
  trailerPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  trailerTitle: {
    color: t.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    lineHeight: 18,
  },
  trailerYear: {
    color: t.textSub,
    fontSize: 12,
    marginTop: 2,
  },

  // ── Detalles de la película Table ──────────────────────────────────────────
  detailsTable: {
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: t.divider,
  },
  detailLabel: {
    color: t.text,
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    color: t.textSub,
    fontSize: 14,
    fontWeight: '500',
  },
});
}
