import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, StatusBar,
} from 'react-native';
import Image from "../../components/FastImage";
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark, Heart, Tv2, X } from 'lucide-react-native';
import { useGlobal, Channel } from '../../contexts/GlobalContext';
import { getMyList, removeFromMyList, MyListItem } from '../../services/myList';
import { useAppTheme } from '../../contexts/SettingsContext';

const { width: SCREEN_W } = Dimensions.get('window');
const COL = 3;
const GAP = 8;
const H_PAD = 12;
const POSTER_W = (SCREEN_W - H_PAD * 2 - GAP * (COL - 1)) / COL;

type Tab = 'content' | 'channels';

export default function MyListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { channels, favorites, setActiveChannel, toggleFavorite } = useGlobal();
  const theme = useAppTheme();

  const [tab, setTab] = useState<Tab>('content');
  const [list, setList] = useState<MyListItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      getMyList().then(setList);
    }, [])
  );

  const favChannels = channels.filter(c => favorites.includes(c.id));

  const remove = async (slug: string) => {
    await removeFromMyList(slug);
    setList(prev => prev.filter(i => i.slug !== slug));
  };

  const playChannel = (c: Channel) => {
    setActiveChannel(c);
    router.push('/player');
  };

  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      
      <View style={[s.header, { paddingTop: insets.top + 12, backgroundColor: theme.bg }]}>
        <Text style={[s.title, { color: theme.text }]}>Mi lista</Text>
      </View>

      <View style={[s.tabs, { borderBottomColor: theme.divider, backgroundColor: theme.bg }]}>
        {([
          { id: 'content', label: `Películas y series (${list.length})` },
          { id: 'channels', label: `Canales (${favChannels.length})` },
        ] as { id: Tab; label: string }[]).map(tp => (
          <TouchableOpacity
            key={tp.id}
            style={[s.tab, tab === tp.id && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]}
            onPress={() => setTab(tp.id)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabLabel, { color: tab === tp.id ? theme.accent : theme.textSub }]}>{tp.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'content' ? (
        <FlatList
          key="content"
          data={list}
          keyExtractor={i => i.slug}
          numColumns={COL}
          contentContainerStyle={s.grid}
          columnWrapperStyle={{ gap: GAP, marginBottom: 14 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ width: POSTER_W }}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/detail', params: { slug: item.slug } })}
            >
              <Image
                source={{ uri: item.posterUrl ?? undefined }}
                style={s.poster}
                contentFit="cover"
        cachePolicy="memory-disk"
        priority="normal"
              />
              <TouchableOpacity style={s.removeBtn} onPress={() => remove(item.slug)} hitSlop={8}>
                <X size={14} color="#fff" />
              </TouchableOpacity>
              <Text style={[s.posterTitle, { color: theme.textSub }]} numberOfLines={2}>{item.title}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Bookmark size={44} color={theme.textMuted} />
              <Text style={[s.emptyTitle, { color: theme.text }]}>Tu lista está vacía</Text>
              <Text style={[s.emptySub, { color: theme.textSub }]}>Toca el botón + en una película o serie para guardarla aquí.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="channels"
          data={favChannels}
          keyExtractor={c => c.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.chRow, { borderBottomColor: theme.divider, borderBottomWidth: 1 }]} onPress={() => playChannel(item)} activeOpacity={0.75}>
              <View style={[s.chLogo, { backgroundColor: theme.cardBg }]}>
                {item.logo
                  ? <Image source={{ uri: item.logo }} style={{ width: '90%', height: '90%' }} contentFit="contain" />
                  : <Tv2 size={20} color={theme.textSub} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.chName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.chMeta} numberOfLines={1}>{item.category?.name ?? 'Sin categoría'}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleFavorite(item.id)} hitSlop={10}>
                <Heart size={18} color="#E50914" fill="#E50914" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Heart size={44} color="#444" />
              <Text style={s.emptyTitle}>Sin contenido favorito</Text>
              <Text style={s.emptySub}>Marca el corazón en la sección Tv para verlos aquí.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: '800' },
  tabs: { flexDirection: 'row', paddingHorizontal: H_PAD, gap: 8, marginBottom: 12 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.12)', borderWidth: 1, borderColor: 'rgba(128,128,128,0.2)',
  },
  tabActive: {}, // overridden inline
  tabLabel: { fontWeight: '700', fontSize: 12 },
  tabLabelActive: {}, // overridden inline
  grid: { paddingHorizontal: H_PAD, paddingBottom: 120 },
  poster: { width: POSTER_W, height: POSTER_W * 1.5, borderRadius: 8, backgroundColor: 'rgba(128,128,128,0.1)' },
  posterTitle: { fontSize: 11, fontWeight: '600', marginTop: 5 },
  removeBtn: {
    position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center',
  },
  chRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 9, gap: 12 },
  chLogo: {
    width: 46, height: 46, borderRadius: 10, backgroundColor: 'rgba(128,128,128,0.15)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  chName: { fontSize: 14, fontWeight: '700' },
  chMeta: { fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { color: '#ddd', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#666', fontSize: 13, textAlign: 'center' },
});
