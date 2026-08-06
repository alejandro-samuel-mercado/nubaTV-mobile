import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useGlobal, Channel } from '../../contexts/GlobalContext';
import { useRouter } from 'expo-router';
import { Play, Info } from 'lucide-react-native';

export default function HomeScreen() {
  const { channels, playlists, selectedPlaylist, setSelectedPlaylist, activeChannel, setActiveChannel } = useGlobal();
  const router = useRouter();

  // Filter logic similar to web
  const filteredChannels = useMemo(() => {
    if (!selectedPlaylist) return channels;
    return channels.filter(c => c.playlist?.name === selectedPlaylist);
  }, [channels, selectedPlaylist]);

  const channelsByCategory = useMemo(() => {
    const grouped = filteredChannels.reduce((acc, channel) => {
      let categoryName = channel.category?.name || 'General';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(channel);
      return acc;
    }, {} as Record<string, Channel[]>);

    return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
  }, [filteredChannels]);

  const handlePlay = (channel: Channel) => {
    setActiveChannel(channel);
    router.push(`/player`);
  };

  return (
    <ScrollView className="flex-1 bg-[#02050a] pt-12 pb-24" showsVerticalScrollIndicator={false}>
      
      {/* Header / Logo */}
      <View className="px-6 mb-6 flex-row items-center justify-between">
        <Text className="text-2xl font-black tracking-tighter" style={{ color: 'white' }}>
          Nuba<Text className="text-cyan-500">TV</Text>
        </Text>
      </View>

      {/* Playlist Filter */}
      {channels.length === 0 && (
        <View className="px-6 mt-12 items-center">
          <Text className="text-white/40 text-center font-bold">No hay canales disponibles por el momento.</Text>
        </View>
      )}

      {playlists.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-8 max-h-12">
          <TouchableOpacity 
            onPress={() => setSelectedPlaylist(null)}
            className={`px-4 py-2 rounded-full mr-3 border ${selectedPlaylist === null ? 'bg-white text-black border-transparent' : 'bg-transparent border-white/20'}`}
          >
            <Text className={`font-bold text-sm ${selectedPlaylist === null ? 'text-black' : 'text-white'}`}>Todas las Listas</Text>
          </TouchableOpacity>
          {playlists.map(p => (
            <TouchableOpacity 
              key={p} 
              onPress={() => setSelectedPlaylist(p)}
              className={`px-4 py-2 rounded-full mr-3 border ${selectedPlaylist === p ? 'bg-cyan-500 text-white border-transparent' : 'bg-transparent border-white/20'}`}
            >
              <Text className={`font-bold text-sm ${selectedPlaylist === p ? 'text-white' : 'text-white'}`}>{p}</Text>
            </TouchableOpacity>
          ))}
          <View className="w-6" />
        </ScrollView>
      )}

      {/* Hero Section (Featured Channel) */}
      {activeChannel && (
        <View className="px-6 mb-10">
          <View className="w-full h-56 rounded-3xl overflow-hidden bg-white/5 relative border border-white/10">
            {activeChannel.logo ? (
              <Image source={{ uri: activeChannel.logo }} className="absolute inset-0 w-full h-full opacity-30" resizeMode="cover" />
            ) : null}
            <View className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            
            <View className="absolute bottom-4 left-4 right-4">
              <View className="bg-cyan-500/20 self-start px-2 py-1 rounded-md mb-2">
                <Text className="text-cyan-300 text-xs font-bold uppercase tracking-widest">{activeChannel.category?.name || 'General'}</Text>
              </View>
              <Text className="text-white text-2xl font-black mb-1" numberOfLines={1}>{activeChannel.name}</Text>
              <Text className="text-white/60 text-sm mb-4">{activeChannel.country} • {activeChannel.language}</Text>
              
              <View className="flex-row gap-3">
                <TouchableOpacity 
                  onPress={() => handlePlay(activeChannel)}
                  className="bg-white px-6 py-2 rounded-full flex-row items-center gap-2"
                >
                  <Play size={16} color="black" fill="black" />
                  <Text className="text-black font-bold">Reproducir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Categories */}
      {channelsByCategory.map(([category, catChannels]) => (
        <View key={category} className="mb-8">
          <Text className="text-white font-bold text-lg px-6 mb-4">{category}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6">
            {catChannels.map(channel => (
              <TouchableOpacity 
                key={channel.id}
                onPress={() => handlePlay(channel)}
                className="w-32 mr-4 bg-white/5 rounded-2xl p-4 border border-white/5 items-center justify-center"
                style={{ height: 120 }}
              >
                {channel.logo ? (
                  <Image source={{ uri: channel.logo }} className="w-16 h-16 mb-2" resizeMode="contain" />
                ) : (
                  <View className="w-16 h-16 mb-2 rounded-full bg-white/10 items-center justify-center">
                    <Text className="text-white/30 font-black text-xl">{channel.name.charAt(0)}</Text>
                  </View>
                )}
                <Text className="text-white text-xs font-bold text-center" numberOfLines={2}>{channel.name}</Text>
              </TouchableOpacity>
            ))}
            <View className="w-6" />
          </ScrollView>
        </View>
      ))}

    </ScrollView>
  );
}
