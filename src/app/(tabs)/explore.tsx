import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, Image, TextInput, BackHandler } from 'react-native';
import { useGlobal, Channel } from '../../contexts/GlobalContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, X, ChevronRight, ChevronLeft, Tv2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useThemeColors } from '../../theme/colors';
import AnimatedBackground from '../../components/AnimatedBackground';

export default function ExploreScreen() {
  const { 
    channels, 
    setActiveChannel,
    playlists
  } = useGlobal();
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const theme = useThemeColors(colorScheme);

  const [explorerType, setExplorerType] = useState<'category' | 'country' | 'language' | 'playlist' | null>(null);
  const [explorerValue, setExplorerValue] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  
  const [globalSearch, setGlobalSearch] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (params.focus === 'true') {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [params.focus]);

  const countries = useMemo(() => Array.from(new Set(channels.map(c => c.country).filter(Boolean))).sort() as string[], [channels]);
  const categories = useMemo(() => Array.from(new Set(channels.map(c => c.category?.name).filter(Boolean))).filter(cat => !countries.includes(cat as any)).sort() as string[], [channels, countries]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backAction = () => {
      if (globalSearch) {
        setGlobalSearch('');
        return true;
      }
      if (explorerValue) {
        setExplorerValue(null);
        setLocalSearch('');
        return true;
      }
      if (explorerType) {
        setExplorerType(null);
        setLocalSearch('');
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [explorerType, explorerValue, globalSearch]);

  const handlePlay = (channel: Channel) => {
    setActiveChannel(channel);
    router.push(`/player`);
  };

  const renderChannelItem = (channel: Channel) => (
    <TouchableOpacity 
      key={channel.id}
      onPress={() => handlePlay(channel)}
      className="w-full mb-3 rounded-2xl p-3 flex-row items-center border"
      style={{ backgroundColor: theme.bgPanel, borderColor: theme.borderSubtle }}
    >
      <View className="w-12 h-12 rounded-xl items-center justify-center mr-4 border" style={{ backgroundColor: theme.bgBase, borderColor: theme.borderSubtle, overflow: 'hidden' }}>
        {channel.logo ? (
          <Image source={{ uri: channel.logo }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        ) : (
          <Tv2 size={20} color={theme.textSecondary} />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold mb-1" style={{ color: theme.textPrimary }} numberOfLines={1}>{channel.name}</Text>
        <Text className="text-[10px] uppercase tracking-widest font-bold" style={{ color: theme.textSecondary }} numberOfLines={1}>{channel.country || 'Desconocido'}</Text>
      </View>
      <ChevronRight color={theme.textSecondary} size={20} />
    </TouchableOpacity>
  );

  const renderGlobalSearch = () => {
    const listChannels = channels.filter(c => c.name.toLowerCase().includes(globalSearch.toLowerCase()));
    return (
      <FlatList
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        data={listChannels}
        keyExtractor={(item) => item.id}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        renderItem={({ item }) => renderChannelItem(item)}
        ListEmptyComponent={
          <Text className="text-center mt-8 font-bold" style={{ color: theme.textSecondary }}>No se encontraron canales.</Text>
        }
      />
    );
  };

  const renderExplorerTypes = () => (
    <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => { setExplorerType('category'); setLocalSearch(''); }} className="w-full mb-3 rounded-2xl p-5 flex-row items-center justify-between border" style={{ backgroundColor: theme.bgPanel, borderColor: theme.borderSubtle }}>
        <Text className="font-bold text-lg" style={{ color: theme.textPrimary }}>Categorías</Text>
        <ChevronRight color={theme.textSecondary} size={20} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { setExplorerType('country'); setLocalSearch(''); }} className="w-full mb-3 rounded-2xl p-5 flex-row items-center justify-between border" style={{ backgroundColor: theme.bgPanel, borderColor: theme.borderSubtle }}>
        <Text className="font-bold text-lg" style={{ color: theme.textPrimary }}>Países</Text>
        <ChevronRight color={theme.textSecondary} size={20} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { setExplorerType('language'); setLocalSearch(''); }} className="w-full mb-3 rounded-2xl p-5 flex-row items-center justify-between border" style={{ backgroundColor: theme.bgPanel, borderColor: theme.borderSubtle }}>
        <Text className="font-bold text-lg" style={{ color: theme.textPrimary }}>Idiomas</Text>
        <ChevronRight color={theme.textSecondary} size={20} />
      </TouchableOpacity>

      {playlists.length > 0 && (
        <TouchableOpacity onPress={() => { setExplorerType('playlist'); setLocalSearch(''); }} className="w-full mb-3 rounded-2xl p-5 flex-row items-center justify-between border" style={{ backgroundColor: theme.bgPanel, borderColor: theme.borderSubtle }}>
          <Text className="font-bold text-lg" style={{ color: theme.textPrimary }}>Listas de Reproducción</Text>
          <ChevronRight color={theme.textSecondary} size={20} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderValuesList = () => {
    let items: string[] = [];
    if (explorerType === 'category') items = categories;
    if (explorerType === 'country') items = countries;
    if (explorerType === 'language') items = Array.from(new Set(channels.map(c => c.language).filter(Boolean))).sort() as string[];
    if (explorerType === 'playlist') items = playlists;

    const filteredItems = items.filter(item => item.toLowerCase().includes(localSearch.toLowerCase()));
    const title = explorerType === 'category' ? 'Categorías' : explorerType === 'country' ? 'Países' : explorerType === 'language' ? 'Idiomas' : 'Listas';

    return (
      <View className="flex-1">
        <View className="px-6 mb-4 flex-row items-center">
          <TouchableOpacity onPress={() => { setExplorerType(null); setLocalSearch(''); }} className="mr-4 p-2 rounded-full" style={{ backgroundColor: theme.bgPanel }}>
            <ChevronLeft color={theme.textPrimary} size={24} />
          </TouchableOpacity>
          <Text className="text-2xl font-black" style={{ color: theme.textPrimary }}>{title}</Text>
        </View>

        <View className="px-6 mb-4 relative">
          <View className="absolute left-10 top-3.5 z-10">
            <Search color={theme.textSecondary} size={16} />
          </View>
          <TextInput
            className="w-full rounded-xl py-3 pl-12 pr-4 border font-bold"
            style={{ backgroundColor: theme.bgPanel, borderColor: theme.borderSubtle, color: theme.textPrimary }}
            placeholder={`Buscar ${title.toLowerCase()}...`}
            placeholderTextColor={theme.textSecondary}
            value={localSearch}
            onChangeText={setLocalSearch}
          />
        </View>

        <FlatList
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          data={filteredItems}
          keyExtractor={(item) => item}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
          renderItem={({ item }) => {
            const count = channels.filter(c => 
              (explorerType === 'category' && c.category?.name === item) ||
              (explorerType === 'country' && c.country === item) ||
              (explorerType === 'language' && c.language === item) ||
              (explorerType === 'playlist' && c.playlist?.name === item)
            ).length;

            return (
              <TouchableOpacity 
                onPress={() => { setExplorerValue(item); setLocalSearch(''); }}
                className="w-full mb-3 rounded-xl p-4 flex-row items-center justify-between border"
                style={{ backgroundColor: theme.bgPanel, borderColor: theme.borderSubtle }}
              >
                <Text className="font-bold text-base" style={{ color: theme.textPrimary }}>{item}</Text>
                <View className="px-3 py-1 rounded-md" style={{ backgroundColor: theme.bgBase }}>
                  <Text className="text-xs font-mono font-bold" style={{ color: theme.textSecondary }}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text className="text-center mt-8 font-bold" style={{ color: theme.textSecondary }}>No se encontraron resultados.</Text>
          }
        />
      </View>
    );
  };

  const renderChannelsList = () => {
    const listChannels = channels.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(localSearch.toLowerCase());
      const matchType = 
        (explorerType === 'category' && c.category?.name === explorerValue) ||
        (explorerType === 'country' && c.country === explorerValue) ||
        (explorerType === 'language' && c.language === explorerValue) ||
        (explorerType === 'playlist' && c.playlist?.name === explorerValue);
      return matchSearch && matchType;
    });

    return (
      <View className="flex-1">
        <View className="px-6 mb-4 flex-row items-center">
          <TouchableOpacity onPress={() => { setExplorerValue(null); setLocalSearch(''); }} className="mr-4 p-2 rounded-full" style={{ backgroundColor: theme.bgPanel }}>
            <ChevronLeft color={theme.textPrimary} size={24} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-black" style={{ color: theme.textPrimary }} numberOfLines={1}>{explorerValue}</Text>
            <Text className="text-xs font-bold" style={{ color: theme.accent }}>{listChannels.length} canales</Text>
          </View>
        </View>

        <View className="px-6 mb-4 relative">
          <View className="absolute left-10 top-3.5 z-10">
            <Search color={theme.textSecondary} size={16} />
          </View>
          <TextInput
            className="w-full rounded-xl py-3 pl-12 pr-4 border font-bold"
            style={{ backgroundColor: theme.bgPanel, borderColor: theme.borderSubtle, color: theme.textPrimary }}
            placeholder="Buscar canal..."
            placeholderTextColor={theme.textSecondary}
            value={localSearch}
            onChangeText={setLocalSearch}
          />
        </View>

        <FlatList
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          data={listChannels}
          keyExtractor={(item) => item.id}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
          renderItem={({ item }) => renderChannelItem(item)}
          ListEmptyComponent={
            <Text className="text-center mt-8 font-bold" style={{ color: theme.textSecondary }}>No se encontraron canales.</Text>
          }
        />
      </View>
    );
  };

  return (
    <View className="flex-1">
      <AnimatedBackground />

      <View className="px-6 mt-16 mb-4">
        <Text className="text-4xl font-black tracking-tighter" style={{ color: theme.textPrimary }}>Explorar</Text>
      </View>

      {/* Global Search Input */}
      {!explorerType && (
        <View className="px-6 mb-4 relative">
          <View className="absolute left-10 top-3.5 z-10">
            <Search color={theme.textSecondary} size={16} />
          </View>
          <TextInput
            ref={searchInputRef}
            className="w-full rounded-xl py-3 pl-12 pr-10 border font-bold"
            style={{ backgroundColor: theme.bgPanel, borderColor: theme.borderSubtle, color: theme.textPrimary }}
            placeholder="Buscar canales..."
            placeholderTextColor={theme.textSecondary}
            value={globalSearch}
            onChangeText={setGlobalSearch}
          />
          {globalSearch.length > 0 && (
            <TouchableOpacity 
              onPress={() => setGlobalSearch('')}
              className="absolute right-10 top-3.5 z-10"
            >
              <X color={theme.textSecondary} size={16} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {globalSearch.length > 0 && !explorerType ? (
        renderGlobalSearch()
      ) : (
        <>
          {!explorerType && renderExplorerTypes()}
          {explorerType && !explorerValue && renderValuesList()}
          {explorerType && explorerValue && renderChannelsList()}
        </>
      )}
    </View>
  );
}
