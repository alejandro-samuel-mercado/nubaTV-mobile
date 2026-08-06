import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useGlobal, Channel } from '../../contexts/GlobalContext';
import { useRouter } from 'expo-router';
import { HeartCrack } from 'lucide-react-native';

export default function FavoritesScreen() {
  const { channels, favorites, setActiveChannel } = useGlobal();
  const router = useRouter();
  
  const favoriteChannels = useMemo(() => {
    return channels.filter(c => favorites.includes(c.id));
  }, [channels, favorites]);

  const handlePlay = (channel: Channel) => {
    setActiveChannel(channel);
    router.push(`/player`);
  };

  return (
    <View className="flex-1 bg-[#02050a] pt-12">
      <View className="px-6 mb-6">
        <Text className="text-3xl font-black text-white">Favoritos</Text>
      </View>

      {favoriteChannels.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <HeartCrack color="rgba(255,255,255,0.2)" size={64} className="mb-4" />
          <Text className="text-white/40 text-center text-lg font-bold">Aún no tienes canales favoritos.</Text>
          <Text className="text-white/30 text-center text-sm mt-2">Explora y presiona el corazón para guardarlos aquí.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 pb-24" showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap justify-between">
            {favoriteChannels.map(channel => (
              <TouchableOpacity 
                key={channel.id}
                onPress={() => handlePlay(channel)}
                className="w-[48%] mb-4 bg-white/5 rounded-2xl p-4 border border-white/5 items-center justify-center relative overflow-hidden"
                style={{ height: 140 }}
              >
                <View className="absolute top-0 right-0 w-full h-full bg-cyan-500/10 pointer-events-none" />
                {channel.logo ? (
                  <Image source={{ uri: channel.logo }} className="w-16 h-16 mb-3" resizeMode="contain" />
                ) : (
                  <View className="w-16 h-16 mb-3 rounded-full bg-white/10 items-center justify-center">
                    <Text className="text-white/30 font-black text-2xl">{channel.name.charAt(0)}</Text>
                  </View>
                )}
                <Text className="text-white text-xs font-bold text-center" numberOfLines={2}>{channel.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="h-24" />
        </ScrollView>
      )}
    </View>
  );
}
