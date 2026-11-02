import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import Image from '../../components/FastImage';
import { useGlobal, Channel } from '../../contexts/GlobalContext';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useAppTheme } from '../../contexts/SettingsContext';

export default function FavoritesScreen() {
  const { channels, favorites, setActiveChannel } = useGlobal();
  const router = useRouter();
  const theme = useAppTheme();

  const favoriteChannels = channels.filter(c => favorites.includes(c.id));

  const handlePlay = (channel: Channel) => {
    setActiveChannel(channel);
    router.push(`/player`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {favoriteChannels.length === 0 ? (
          <View style={{ marginTop: 80, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{
              width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.cardBorder,
            }}>
              <Heart color={theme.textSub} size={38} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 8 }}>Sin favoritos aún</Text>
            <Text style={{ textAlign: 'center', paddingHorizontal: 32, color: theme.textSub, lineHeight: 20 }}>
              Explora canales y márcalos como favoritos para verlos aquí.
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {favoriteChannels.map(channel => (
              <View key={channel.id} style={{
                width: '48%', marginBottom: 14, borderRadius: 20, overflow: 'hidden',
                height: 130, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.cardBorder,
              }}>
                <TouchableOpacity onPress={() => handlePlay(channel)} style={{ flex: 1, padding: 14, alignItems: 'center', justifyContent: 'center' }}>
                  {channel.logo ? (
                    <Image source={{ uri: channel.logo }} style={{ width: 56, height: 56, marginBottom: 10, borderRadius: 28 }} resizeMode="cover" />
                  ) : (
                    <View style={{
                      width: 56, height: 56, marginBottom: 10, borderRadius: 28,
                      backgroundColor: theme.iconBg, alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontWeight: '900', fontSize: 22, opacity: 0.4, color: theme.text }}>
                        {channel.name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 12, fontWeight: '700', textAlign: 'center', color: theme.text }} numberOfLines={2}>
                    {channel.name}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
