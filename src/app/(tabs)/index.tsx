import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGlobal, Channel, API_URL } from '../../contexts/GlobalContext';
import { useRouter } from 'expo-router';
import { Play, Tv, Search } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import FilterModal from '../../components/FilterModal';
import AnimatedBackground from '../../components/AnimatedBackground';

export default function HomeScreen() {
  const { channels, activeChannel, setActiveChannel, loadingChannels } = useGlobal();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const video = React.useRef<Video>(null);

  useEffect(() => {
    if (video.current) {
      video.current.playAsync().catch(e => console.log('Autoplay blocked/failed:', e));
    }
  }, [channels]);

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

      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 75,
        backgroundColor: 'rgba(30, 27, 75, 0.5)',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        borderBottomWidth: 1.5,
        borderColor: 'rgba(217, 248, 76, 0.3)',
        overflow: 'hidden',
        zIndex: 49,
      }}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
      </View>
      
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        paddingTop: 20,
        paddingBottom: 10,
        paddingHorizontal: 24,
        zIndex: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Text className="text-3xl font-black tracking-tighter" style={{ color: 'white' }}>
          Nuba<Text style={{ color: '#d9f943' }}>TV</Text>
        </Text>
        
        <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-white/5 p-2.5 rounded-full border border-white/10">
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
          <View className="px-6 mt-32 items-center">
            <ActivityIndicator size="large" color="#d9f943" />
            <Text className="text-white/60 text-center font-bold mt-4">Cargando canales...</Text>
          </View>
        ) : channels.length > 0 && (
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => handlePlay(channels[0])}
            className="w-full mt-24 mb-6 px-6"
          >
            <View className="w-full h-80 rounded-[40px] overflow-hidden bg-black border border-white/10 shadow-2xl">
              <Video
                ref={video}
                source={{ uri: `${API_URL}/proxy?url=${encodeURIComponent(channels[0].url)}` }}
                style={StyleSheet.absoluteFillObject}
                resizeMode={ResizeMode.COVER}
                shouldPlay={true}
                isMuted={true}
                isLooping={true}
                useNativeControls={false}
              />
              
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                style={StyleSheet.absoluteFillObject}
              />

              <View className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <View className="flex-row items-center mb-2">
                  <View className="bg-red-500 px-2 py-1 rounded-md mr-3 flex-row items-center">
                    <View className="w-1.5 h-1.5 bg-white rounded-full mr-1.5" />
                    <Text className="text-white text-[10px] font-black tracking-widest uppercase">En Vivo</Text>
                  </View>
                  <Text className="text-white/70 text-xs font-bold uppercase tracking-wider">{channels[0].category?.name || 'Destacado'}</Text>
                </View>
                
                <Text className="text-white text-3xl font-black mb-1 tracking-tight" numberOfLines={1}>{channels[0].name}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {channelsByCategory.map(([category, catChannels]) => (
          <View key={category} className="mb-10">
            <View className="flex-row items-center px-6 mb-4 gap-2">
              <Tv size={18} color="#d9f943" />
              <Text className="text-white font-black text-xl tracking-tight">{category}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6 pb-4">
              {catChannels.map(channel => (
                <View key={channel.id} className="mr-4 rounded-[30px] overflow-hidden bg-white/5 border border-white/10" style={{ width: 144, height: 140 }}>
                  <TouchableOpacity 
                    onPress={() => handlePlay(channel)}
                    className="flex-1 p-4 items-center justify-center"
                  >
                    {channel.logo ? (
                      <Image source={{ uri: channel.logo }} className="w-16 h-16 mb-3" resizeMode="contain" />
                    ) : (
                      <View className="w-16 h-16 mb-3 rounded-full bg-white/10 items-center justify-center border border-white/5">
                        <Text className="text-white/50 font-black text-2xl">{channel.name.charAt(0)}</Text>
                      </View>
                    )}
                    <Text className="text-white text-sm font-bold text-center leading-tight" numberOfLines={2}>{channel.name}</Text>
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
