import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useGlobal, Channel } from '../../contexts/GlobalContext';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import AnimatedBackground from '../../components/AnimatedBackground';

export default function FavoritesScreen() {
  const { channels, favorites, setActiveChannel } = useGlobal();
  const router = useRouter();

  const favoriteChannels = channels.filter(c => favorites.includes(c.id));

  const handlePlay = (channel: Channel) => {
    setActiveChannel(channel);
    router.push(`/player`);
  };

  return (
    <View className="flex-1">
      <AnimatedBackground />

      <View className="px-6 mt-16 mb-6">
        <Text className="text-4xl font-black text-white tracking-tighter">Favoritos</Text>
      </View>

      <ScrollView className="flex-1 px-6 pb-24" showsVerticalScrollIndicator={false}>
        {favoriteChannels.length === 0 ? (
          <View className="mt-20 items-center justify-center">
            <View className="w-24 h-24 rounded-full bg-white/5 items-center justify-center mb-6 border border-white/10">
              <Heart color="rgba(255,255,255,0.2)" size={40} />
            </View>
            <Text className="text-white text-xl font-bold mb-2">Sin favoritos aún</Text>
            <Text className="text-white/40 text-center px-8">Explora canales y márcalos como favoritos para verlos aquí.</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {favoriteChannels.map(channel => (
              <View key={channel.id} className="w-[48%] mb-4 rounded-3xl overflow-hidden bg-white/5 border border-white/10" style={{ height: 140 }}>
                <TouchableOpacity 
                  onPress={() => handlePlay(channel)}
                  className="flex-1 p-4 items-center justify-center"
                >
                  {channel.logo ? (
                    <Image source={{ uri: channel.logo }} className="w-16 h-16 mb-3" resizeMode="contain" />
                  ) : (
                    <View className="w-16 h-16 mb-3 rounded-full bg-white/10 items-center justify-center border border-white/5">
                      <Text className="text-white/30 font-black text-2xl">{channel.name.charAt(0)}</Text>
                    </View>
                  )}
                  <Text className="text-white text-xs font-bold text-center" numberOfLines={2}>{channel.name}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <View className="h-32" />
      </ScrollView>
    </View>
  );
}
