import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGlobal, Channel, API_URL } from '../../contexts/GlobalContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { Play, Tv, Search } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import { useThemeColors } from '../../theme/colors';
import AnimatedBackground from '../../components/AnimatedBackground';

export default function HomeScreen() {
  const { 
    channels, activeChannel, setActiveChannel, loadingChannels,
    searchQuery, selectedCategory, selectedCountry, selectedLanguage, selectedPlaylist
  } = useGlobal();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const theme = useThemeColors(colorScheme);
  const isDark = colorScheme !== 'light';
  const video = React.useRef<Video>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      if (video.current && channels.length > 0) {
        video.current.playAsync().catch(console.log);
      }
      return () => {
        isActive = false;
        if (video.current) {
          video.current.pauseAsync().catch(console.log);
        }
      };
    }, [channels.length])
  );

  const [heroChannel, setHeroChannel] = useState<Channel | null>(null);

  const pickRandomChannel = React.useCallback((pool: Channel[]): Channel | null => {
    if (pool.length === 0) return null;
    const livePool = pool.filter(
      c => !c.url.includes('.mkv') && !c.url.includes('.mp4') && !c.url.includes('/movie/') && !c.url.includes('/series/')
    );
    const activePool = livePool.length > 0 ? livePool : pool;
    return activePool[Math.floor(Math.random() * activePool.length)];
  }, []);

  useEffect(() => {
    if (channels.length > 0 && !heroChannel) {
      setHeroChannel(pickRandomChannel(channels));
    }
  }, [channels]);

  // Intentar forzar el play si el componente se monta despues de cargar canales
  useEffect(() => {
    if (video.current && heroChannel && !loadingChannels) {
      setTimeout(() => {
         video.current?.playAsync().catch(console.log);
      }, 500);
    }
  }, [heroChannel, loadingChannels]);

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategory && c.category?.name !== selectedCategory) return false;
      if (selectedCountry && c.country !== selectedCountry) return false;
      if (selectedLanguage && c.language !== selectedLanguage) return false;
      if (selectedPlaylist && c.playlist?.name !== selectedPlaylist) return false;
      return true;
    });
  }, [channels, searchQuery, selectedCategory, selectedCountry, selectedLanguage, selectedPlaylist]);

  const channelsByCategory = useMemo(() => {
    const countries = new Set(channels.map(c => c.country).filter(Boolean));
    const grouped = filteredChannels.reduce((acc, channel) => {
      let categoryName = channel.category?.name || 'General';
      if (countries.has(categoryName)) return acc;
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(channel);
      return acc;
    }, {} as Record<string, Channel[]>);

    return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
  }, [filteredChannels, channels]);

  const relatedChannels = useMemo(() => {
    if (!heroChannel) return [];
    const cat = heroChannel.category?.name || 'General';
    
    let pool = channels.filter(c => 
      (c.category?.name || 'General') === cat && 
      c.id !== heroChannel.id && 
      c.logo && 
      c.logo.trim() !== ''
    );

    // If we have very few related channels with logos, fill the list with other channels that DO have logos
    if (pool.length < 5) {
      const otherChannels = channels.filter(c => 
        c.id !== heroChannel.id && 
        c.logo && 
        c.logo.trim() !== '' &&
        !pool.find(p => p.id === c.id)
      ).slice(0, 10 - pool.length); // Just take the first few to keep it stable
      
      pool = [...pool, ...otherChannels];
    }

    return pool.slice(0, 10);
  }, [heroChannel, channels]);

  const handlePlay = (channel: Channel) => {
    setActiveChannel(channel);
    router.push(`/player`);
  };

  return (
    <View className="flex-1">
      <AnimatedBackground />

      {/* Top Header Gradient for text readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: 49 }}
      />

      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        paddingTop: 40, // iOS safe area approximate
        paddingBottom: 10,
        paddingHorizontal: 24,
        zIndex: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Text className="text-3xl font-black tracking-tighter text-white">
          Nuba<Text style={{ color: theme.accent }}>TV</Text>
        </Text>
        
        <TouchableOpacity onPress={() => router.push({ pathname: '/explore', params: { focus: 'true' }})} className="bg-black/30 p-2.5 rounded-full backdrop-blur-md">
          <Search color="white" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {loadingChannels ? (
          <View className="px-6 mt-40 items-center">
            <ActivityIndicator size="large" color={theme.accent} />
            <Text className="text-center font-bold mt-4" style={{ color: theme.textSecondary }}>Cargando canales...</Text>
          </View>
        ) : heroChannel && (
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => handlePlay(heroChannel)}
            className="w-full mb-10"
          >
            <View className="w-full h-[450px] bg-black">
              <Video
                ref={video}
                source={{ uri: Platform.OS === 'web' ? `${API_URL}/proxy?url=${encodeURIComponent(heroChannel.url)}` : heroChannel.url }}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.COVER}
                shouldPlay={true}
                isMuted={true}
                isLooping={true}
                useNativeControls={false}
                onLoad={() => {
                  if (video.current) {
                    video.current.playAsync().catch(console.log);
                  }
                }}
              />
              
              <LinearGradient
                colors={['transparent', isDark ? 'rgba(5,5,5,0.4)' : 'rgba(248,250,252,0.4)', theme.bgBase] as const}
                style={StyleSheet.absoluteFill}
              />

              <View className="absolute inset-0 items-center justify-center z-10" pointerEvents="none">
                <View className="w-16 h-16 rounded-full items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.4)]" style={{ backgroundColor: theme.accent }}>
                  <Play fill="white" color="white" size={24} className="ml-1" />
                </View>
              </View>

              <View className="absolute bottom-0 left-0 right-0 p-6 pt-20 z-20">
                <View className="flex-row items-center mb-3">
                  <View className="bg-red-500 px-2.5 py-1 rounded-sm mr-3 flex-row items-center">
                    <View className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 shadow-sm" />
                    <Text className="text-white text-[10px] font-black tracking-widest uppercase">En Vivo</Text>
                  </View>
                  <Text className="text-xs font-black uppercase tracking-widest" style={{ color: theme.accent }}>{heroChannel.category?.name || 'Destacado'}</Text>
                </View>
                
                <Text className="text-4xl font-black mb-1 tracking-tighter" style={{ color: theme.textPrimary }} numberOfLines={1}>{heroChannel.name}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {heroChannel && relatedChannels.length > 0 && (
          <View className="mb-10">
            <View className="flex-row items-center px-6 mb-4 gap-2">
              <Tv size={18} color={theme.accent} />
              <Text className="font-black text-xl tracking-tight" style={{ color: theme.textPrimary }}>Canales Similares</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6 pb-4">
              {relatedChannels.map(channel => (
                <View key={channel.id} className="mr-6" style={{ width: 90 }}>
                  <TouchableOpacity 
                    onPress={() => handlePlay(channel)}
                    className="items-center"
                  >
                    <View className="w-20 h-20 mb-3 rounded-full overflow-hidden items-center justify-center shadow-lg border-2 border-transparent" style={{ backgroundColor: theme.bgPanel }}>
                      {channel.logo ? (
                        <Image source={{ uri: channel.logo }} className="w-full h-full bg-white/5" resizeMode="cover" />
                      ) : (
                        <Text className="font-black text-3xl opacity-50" style={{ color: theme.textPrimary }}>{channel.name.charAt(0)}</Text>
                      )}
                    </View>
                    <Text className="text-[11px] font-bold text-center leading-tight opacity-90" style={{ color: theme.textPrimary }} numberOfLines={2}>{channel.name}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View className="w-12" />
            </ScrollView>
          </View>
        )}

        {channelsByCategory.map(([category, catChannels]) => (
          <View key={category} className="mb-10">
            <View className="flex-row items-center px-6 mb-4 gap-2">
              <Tv size={18} color={theme.accent} />
              <Text className="font-black text-xl tracking-tight" style={{ color: theme.textPrimary }}>{category}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6 pb-4">
              {catChannels.map(channel => (
                <View key={channel.id} className="mr-6" style={{ width: 90 }}>
                  <TouchableOpacity 
                    onPress={() => handlePlay(channel)}
                    className="items-center"
                  >
                    <View className="w-20 h-20 mb-3 rounded-full overflow-hidden items-center justify-center shadow-lg border-2 border-transparent" style={{ backgroundColor: theme.bgPanel }}>
                      {channel.logo ? (
                        <Image source={{ uri: channel.logo }} className="w-full h-full bg-white/5" resizeMode="cover" />
                      ) : (
                        <Text className="font-black text-3xl opacity-50" style={{ color: theme.textPrimary }}>{channel.name.charAt(0)}</Text>
                      )}
                    </View>
                    <Text className="text-[11px] font-bold text-center leading-tight opacity-90" style={{ color: theme.textPrimary }} numberOfLines={2}>{channel.name}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View className="w-12" />
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
