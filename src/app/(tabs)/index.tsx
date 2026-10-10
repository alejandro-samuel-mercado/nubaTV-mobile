import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGlobal, Channel, API_URL } from '../../contexts/GlobalContext';
import { useRouter } from 'expo-router';
import { Play, Tv, Search } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import { useThemeColors } from '../../theme/colors';
import FilterModal from '../../components/FilterModal';
import AnimatedBackground from '../../components/AnimatedBackground';

export default function HomeScreen() {
  const { channels, activeChannel, setActiveChannel, loadingChannels } = useGlobal();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const theme = useThemeColors(colorScheme);
  const isDark = colorScheme !== 'light';
  const [modalVisible, setModalVisible] = useState(false);
  const video = React.useRef<Video>(null);

  // Autoplay is handled by the onLoad prop of the Video component now.

  const channelsByCategory = useMemo(() => {
    const grouped = channels.reduce((acc, channel) => {
      let categoryName = channel.category?.name || 'General';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(channel);
      return acc;
    }, {} as Record<string, Channel[]>);

    return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
  }, [channels]);

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
        
        <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-black/30 p-2.5 rounded-full backdrop-blur-md">
          <Search color="white" size={20} />
        </TouchableOpacity>
      </View>

      <FilterModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onApply={() => setModalVisible(false)} 
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {loadingChannels ? (
          <View className="px-6 mt-40 items-center">
            <ActivityIndicator size="large" color={theme.accent} />
            <Text className="text-center font-bold mt-4" style={{ color: theme.textSecondary }}>Cargando canales...</Text>
          </View>
        ) : channels.length > 0 && (
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => handlePlay(channels[0])}
            className="w-full mb-10"
          >
            <View className="w-full h-[450px] bg-black">
              <Video
                ref={video}
                source={{ uri: `${API_URL}/proxy?url=${encodeURIComponent(channels[0].url)}` }}
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
                  <Text className="text-xs font-black uppercase tracking-widest" style={{ color: theme.accent }}>{channels[0].category?.name || 'Destacado'}</Text>
                </View>
                
                <Text className="text-4xl font-black mb-1 tracking-tighter" style={{ color: theme.textPrimary }} numberOfLines={1}>{channels[0].name}</Text>
              </View>
            </View>
          </TouchableOpacity>
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
