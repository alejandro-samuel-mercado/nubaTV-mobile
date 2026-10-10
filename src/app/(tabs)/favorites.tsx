import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useGlobal, Channel } from '../../contexts/GlobalContext';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useThemeColors } from '../../theme/colors';
import AnimatedBackground from '../../components/AnimatedBackground';

export default function FavoritesScreen() {
  const { channels, favorites, setActiveChannel } = useGlobal();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const theme = useThemeColors(colorScheme);

  const favoriteChannels = channels.filter(c => favorites.includes(c.id));

  const handlePlay = (channel: Channel) => {
    setActiveChannel(channel);
    router.push(`/player`);
  };

  return (
    <View className="flex-1">
      <AnimatedBackground />

      <View className="px-6 mt-16 mb-6">
        <Text className="text-4xl font-black tracking-tighter" style={{ color: theme.textPrimary }}>Favoritos</Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {favoriteChannels.length === 0 ? (
          <View className="mt-20 items-center justify-center">
            <View className="w-24 h-24 rounded-full items-center justify-center mb-6 border" style={{ backgroundColor: theme.bgPanel, borderColor: theme.borderSubtle }}>
              <Heart color={theme.textSecondary} size={40} />
            </View>
            <Text className="text-xl font-bold mb-2" style={{ color: theme.textPrimary }}>Sin favoritos aún</Text>
            <Text className="text-center px-8" style={{ color: theme.textSecondary }}>Explora canales y márcalos como favoritos para verlos aquí.</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {favoriteChannels.map(channel => (
              <View key={channel.id} className="w-[48%] mb-4 rounded-3xl overflow-hidden border" style={{ height: 140, backgroundColor: theme.bgPanel, borderColor: theme.borderSubtle }}>
                <TouchableOpacity 
                  onPress={() => handlePlay(channel)}
                  className="flex-1 p-4 items-center justify-center"
                >
                  {channel.logo ? (
                    <Image source={{ uri: channel.logo }} className="w-16 h-16 mb-3 rounded-full border" style={{ borderColor: theme.borderSubtle }} resizeMode="cover" />
                  ) : (
                    <View className="w-16 h-16 mb-3 rounded-full items-center justify-center border" style={{ backgroundColor: theme.bgCard, borderColor: theme.borderSubtle }}>
                      <Text className="font-black text-2xl opacity-30" style={{ color: theme.textPrimary }}>{channel.name.charAt(0)}</Text>
                    </View>
                  )}
                  <Text className="text-xs font-bold text-center" style={{ color: theme.textPrimary }} numberOfLines={2}>{channel.name}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
