import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useGlobal, API_URL } from '../contexts/GlobalContext';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { ArrowLeft, Heart } from 'lucide-react-native';

export default function PlayerScreen() {
  const { activeChannel, favorites, toggleFavorite } = useGlobal();
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);

  const lockLandscape = async () => {
    if (Platform.OS !== 'web') {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (error) {
        console.log('Orientation lock failed:', error);
      }
    }
  };

  const unlockOrientation = async () => {
    if (Platform.OS !== 'web') {
      try {
        await ScreenOrientation.unlockAsync();
      } catch (error) {
        console.log('Orientation unlock failed:', error);
      }
    }
  };

  useEffect(() => {
    lockLandscape();
    return () => {
      unlockOrientation();
    };
  }, []);

  if (!activeChannel) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Cargando...</Text>
      </View>
    );
  }

  const isFav = favorites.includes(activeChannel.id);

  // In the real app, we need to proxy the URL if necessary, or just use the M3U8 directly.
  // The backend already proxies it if we use the backend proxy endpoint, but we can try direct first.
  const proxyUrl = `${API_URL}/proxy?url=${encodeURIComponent(activeChannel.url)}`;

  return (
    <View className="flex-1 bg-black">
      <Video
        ref={videoRef}
        className="flex-1 w-full h-full"
        source={{
          uri: proxyUrl,
        }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        shouldPlay
        onPlaybackStatusUpdate={setStatus}
      />
      
      {/* Overlay UI */}
      <View className="absolute top-0 left-0 right-0 p-6 flex-row items-center justify-between" pointerEvents="box-none">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-black/50 p-3 rounded-full"
        >
          <ArrowLeft color="white" />
        </TouchableOpacity>

        <View className="flex-row items-center gap-4">
          <View className="bg-black/50 px-4 py-2 rounded-xl">
            <Text className="text-white font-bold">{activeChannel.name}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => toggleFavorite(activeChannel.id)}
            className="bg-black/50 p-3 rounded-full"
          >
            <Heart color={isFav ? '#22d3ee' : 'white'} fill={isFav ? '#22d3ee' : 'transparent'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading & Error Indicator */}
      {status && !status.isLoaded && 'error' in status ? (
        <View className="absolute inset-0 items-center justify-center bg-black/80 pointer-events-none z-0">
          <Text className="text-red-400 font-bold mb-2">Error al cargar el canal</Text>
          <Text className="text-white/50 text-xs text-center px-12">{status.error}</Text>
        </View>
      ) : (!status?.isLoaded || (status.isLoaded && status.isBuffering)) ? (
        <View className="absolute inset-0 items-center justify-center pointer-events-none z-0">
          <ActivityIndicator size="large" color="#06b6d4" />
        </View>
      ) : null}
    </View>
  );
}
