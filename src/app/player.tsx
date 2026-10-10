import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, Platform, ScrollView, FlatList, Image, TextInput } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useGlobal, API_URL, Channel } from '../contexts/GlobalContext';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { ArrowLeft, Heart, Play, Pause, RotateCcw, RotateCw, Maximize, Minimize, Volume2, VolumeX, List, Tv2, X, SkipForward, SkipBack, Search } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useThemeColors } from '../theme/colors';
import Hls from 'hls.js';


export default function PlayerScreen() {
  const { channels, activeChannel, setActiveChannel, favorites, toggleFavorite } = useGlobal();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const theme = useThemeColors(colorScheme);

  const nativeVideoRef = useRef<Video>(null);
  const webVideoRef = useRef<any>(null); // HTMLVideoElement for web
  
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  
  // Web specific state
  const [webIsPlaying, setWebIsPlaying] = useState(false);
  const [webIsBuffering, setWebIsBuffering] = useState(true);
  const [webPosition, setWebPosition] = useState(0);
  const [webDuration, setWebDuration] = useState(0);

  const [showControls, setShowControls] = useState(true);
  const [isLandscape, setIsLandscape] = useState(true);
  const [showChannelList, setShowChannelList] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredChannels = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    if (!query) return channels;
    return channels.filter(c => c.name.toLowerCase().includes(query));
  }, [channels, debouncedSearch]);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const lockLandscape = async () => {
    if (Platform.OS !== 'web') {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setIsLandscape(true);
      } catch (error) {}
    }
  };

  const lockPortrait = async () => {
    if (Platform.OS !== 'web') {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsLandscape(false);
      } catch (error) {}
    }
  };

  const unlockOrientation = async () => {
    if (Platform.OS !== 'web') {
      try {
        await ScreenOrientation.unlockAsync();
      } catch (error) {}
    }
  };

  useEffect(() => {
    lockLandscape();
    return () => {
      unlockOrientation();
    };
  }, []);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showChannelList && !showVolumeSlider) setShowControls(false);
    }, 4000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showChannelList, showVolumeSlider]);

  if (!activeChannel) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Cargando...</Text>
      </View>
    );
  }

  const isFav = favorites.includes(activeChannel.id);
  const proxyUrl = `${API_URL}/proxy?url=${encodeURIComponent(activeChannel.url)}`;

  // Combine Native and Web playback states
  const isPlaying = Platform.OS === 'web' ? webIsPlaying : (status?.isLoaded ? status.isPlaying : false);
  const isBuffering = Platform.OS === 'web' ? webIsBuffering : (status?.isLoaded ? status.isBuffering : false);
  const currentPosition = Platform.OS === 'web' ? webPosition : (status?.isLoaded ? status.positionMillis : 0);
  const duration = Platform.OS === 'web' ? webDuration : (status?.isLoaded ? status.durationMillis : 0);

  // Web HLS Initialization
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const video = webVideoRef.current;
    if (!video || !proxyUrl) return;

    setWebIsBuffering(true);
    let hls: Hls;

    const onPlay = () => setWebIsPlaying(true);
    const onPause = () => setWebIsPlaying(false);
    const onWaiting = () => setWebIsBuffering(true);
    const onPlaying = () => setWebIsBuffering(false);
    const onTimeUpdate = () => setWebPosition(video.currentTime * 1000);
    const onDurationChange = () => setWebDuration(video.duration * 1000);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);

    if (Hls.isSupported()) {
      hls = new Hls({ startLevel: -1 });
      hls.loadSource(proxyUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxyUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
      });
    }

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      if (hls) {
        try {
          hls.stopLoad();
          hls.detachMedia();
          hls.destroy();
        } catch (error) {
          // Ignore DOMException on abort
        }
      }
    };
  }, [proxyUrl]);

  const handlePlayPause = () => {
    if (Platform.OS === 'web' && webVideoRef.current) {
      if (isPlaying) webVideoRef.current.pause();
      else webVideoRef.current.play();
    } else if (nativeVideoRef.current) {
      if (isPlaying) nativeVideoRef.current.pauseAsync();
      else nativeVideoRef.current.playAsync();
    }
    resetControlsTimeout();
  };

  const handleSkip = (millis: number) => {
    const newPos = Math.max(0, currentPosition + millis);
    if (Platform.OS === 'web' && webVideoRef.current) {
      webVideoRef.current.currentTime = newPos / 1000;
    } else if (nativeVideoRef.current && status?.isLoaded) {
      nativeVideoRef.current.setPositionAsync(newPos);
    }
    resetControlsTimeout();
  };

  const handleLive = () => {
    if (Platform.OS === 'web' && webVideoRef.current) {
      if (duration) webVideoRef.current.currentTime = (duration - 5000) / 1000;
      else webVideoRef.current.load(); // Reload stream
    } else if (nativeVideoRef.current && status?.isLoaded) {
      if (duration) nativeVideoRef.current.setPositionAsync(duration - 5000);
      else nativeVideoRef.current.replayAsync();
    }
    resetControlsTimeout();
  };

  const handleVolume = (change: number) => {
    handleVolumeSet(volume + change);
  };

  const handleVolumeSet = (newVol: number) => {
    newVol = Math.max(0, Math.min(1, newVol));
    setVolume(newVol);
    if (Platform.OS === 'web' && webVideoRef.current) {
      webVideoRef.current.volume = newVol;
      if (newVol > 0 && isMuted) {
        setIsMuted(false);
        webVideoRef.current.muted = false;
      }
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.setVolumeAsync(newVol);
      if (newVol > 0 && isMuted) {
        setIsMuted(false);
        nativeVideoRef.current.setIsMutedAsync(false);
      }
    }
    resetControlsTimeout();
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (Platform.OS === 'web' && webVideoRef.current) {
      webVideoRef.current.muted = newMuted;
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.setIsMutedAsync(newMuted);
    }
    resetControlsTimeout();
  };

  const toggleOrientation = () => {
    if (isLandscape) lockPortrait();
    else lockLandscape();
    resetControlsTimeout();
  };

  const currentIndex = channels.findIndex(c => c.id === activeChannel.id);
  const handleNext = () => {
    if (currentIndex < channels.length - 1) setActiveChannel(channels[currentIndex + 1]);
    resetControlsTimeout();
  };
  const handlePrev = () => {
    if (currentIndex > 0) setActiveChannel(channels[currentIndex - 1]);
    resetControlsTimeout();
  };

  return (
    <View className="flex-1 bg-black">
      <TouchableWithoutFeedback onPress={resetControlsTimeout}>
        <View className="flex-1 w-full h-full relative" style={{ backgroundColor: 'black' }}>
          {Platform.OS === 'web' ? (
            React.createElement('video', {
              ref: webVideoRef,
              style: { width: '100%', height: '100%', objectFit: 'contain' },
              autoPlay: true,
              playsInline: true,
            })
          ) : (
            <Video
              ref={nativeVideoRef}
              className="flex-1 w-full h-full"
              source={{ uri: proxyUrl }}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
              volume={volume}
              isMuted={isMuted}
              onPlaybackStatusUpdate={setStatus}
            />
          )}
          
          {/* Loading & Error Indicator */}
          {Platform.OS !== 'web' && status && !status.isLoaded && 'error' in status ? (
            <View className="absolute inset-0 items-center justify-center bg-black/80 pointer-events-none z-0">
              <Text className="text-red-400 font-bold mb-2">Error al cargar el canal</Text>
              <Text className="text-white/50 text-xs text-center px-12">{status.error}</Text>
            </View>
          ) : isBuffering ? (
            <View className="absolute inset-0 items-center justify-center pointer-events-none z-0">
              <ActivityIndicator size="large" color="#f97316" />
            </View>
          ) : null}

          {/* Controls Overlay */}
          {showControls && (
            <View className="absolute inset-0 z-10" pointerEvents="box-none">
              <View className="absolute inset-0 bg-black/40 pointer-events-none" />
              {/* Top Bar */}
              <View className="absolute top-0 left-0 right-0 p-4 md:p-6 flex-row items-center justify-between gap-2" pointerEvents="box-none">
                <View className="flex-row items-center gap-2 flex-1">
                  <TouchableOpacity onPress={() => router.back()} className="bg-black/50 p-2.5 rounded-full flex-shrink-0">
                    <ArrowLeft color="white" size={24} />
                  </TouchableOpacity>
                  <View className="bg-black/50 px-3 py-2.5 rounded-xl flex-row items-center flex-1">
                    {activeChannel.logo && (
                      <Image source={{ uri: activeChannel.logo }} style={{ width: 24, height: 24, marginRight: 8 }} resizeMode="contain" />
                    )}
                    <Text className="text-white font-bold" numberOfLines={1}>{activeChannel.name}</Text>
                  </View>
                </View>
                
                <View className="flex-row items-center gap-2 flex-shrink-0">
                  <TouchableOpacity onPress={() => setShowChannelList(true)} className="bg-black/50 p-2.5 rounded-full flex-row items-center gap-2">
                    <List color="white" size={20} />
                    {!isLandscape && <Text className="text-white font-bold text-xs">Canales</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleFavorite(activeChannel.id)} className="bg-black/50 p-2.5 rounded-full">
                    <Heart color={isFav ? '#f97316' : 'white'} fill={isFav ? '#f97316' : 'transparent'} size={20} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Center Controls */}
              <View className="absolute inset-0 items-center justify-center flex-row gap-4 sm:gap-8" pointerEvents="box-none">
                <TouchableOpacity onPress={handlePrev} className="p-2 sm:p-3 bg-black/40 rounded-full">
                  <SkipBack color="white" size={24} />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => handleSkip(-10000)} className="p-3">
                  <RotateCcw color="white" size={32} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handlePlayPause} className="p-5 bg-orange-500/90 rounded-full shadow-lg">
                  {isPlaying ? <Pause color="white" size={40} fill="white" /> : <Play color="white" size={40} fill="white" className="ml-1" />}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleSkip(10000)} className="p-3">
                  <RotateCw color="white" size={32} />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={handleNext} className="p-2 sm:p-3 bg-black/40 rounded-full">
                  <SkipForward color="white" size={24} />
                </TouchableOpacity>
              </View>

              {/* Bottom Bar */}
              <View className="absolute bottom-0 left-0 right-0 p-4 md:p-6 pb-8 flex-row items-center justify-between gap-2" pointerEvents="box-none">
                <View className="flex-row items-center gap-2 flex-shrink-1">
                  <TouchableOpacity onPress={handleLive} className="flex-row items-center gap-1.5 bg-red-600/90 px-2 py-1.5 rounded-md">
                    <View className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <Text className="text-white text-[10px] font-black tracking-widest uppercase" numberOfLines={1}>EN VIVO</Text>
                  </TouchableOpacity>
                  
                  <View className="bg-black/50 px-2 py-1.5 rounded-md hidden sm:flex">
                    <Text className="text-white/70 text-[10px] font-bold uppercase" numberOfLines={1}>Calidad: Auto</Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2 flex-shrink-0">
                  <View className="relative z-50">
                    {showVolumeSlider && (
                      <View 
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-10 h-32 bg-black/80 rounded-full items-center justify-center"
                        onStartShouldSetResponder={() => true}
                        onResponderGrant={(e) => {
                          const locY = e.nativeEvent.locationY;
                          // Slider inner height is ~100px. Y is 0 at top, 100 at bottom
                          let newVol = 1 - ((locY - 14) / 100); 
                          handleVolumeSet(newVol);
                        }}
                        onResponderMove={(e) => {
                          const locY = e.nativeEvent.locationY;
                          let newVol = 1 - ((locY - 14) / 100);
                          handleVolumeSet(newVol);
                        }}
                      >
                        <View className="w-1.5 h-[100px] bg-white/20 rounded-full overflow-hidden flex-col justify-end pointer-events-none">
                          <View className="w-full bg-white rounded-full" style={{ height: `${volume * 100}%` }} />
                        </View>
                      </View>
                    )}
                    <TouchableOpacity onPress={() => setShowVolumeSlider(!showVolumeSlider)} className="bg-black/50 p-2.5 rounded-full">
                      {isMuted || volume === 0 ? <VolumeX color="red" size={20} /> : <Volume2 color="white" size={20} />}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={toggleOrientation} className="bg-black/50 p-2.5 rounded-full">
                    {isLandscape ? <Minimize color="white" size={20} /> : <Maximize color="white" size={20} />}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Channel List Overlay */}
          {showChannelList && (
            <View className={`absolute top-0 bottom-0 right-0 ${isLandscape ? 'w-80' : 'w-[80%]'} bg-[#0a0a0a]/95 border-l border-white/10 z-20`}>
              <View className="p-4 border-b border-white/10 flex-row items-center justify-between">
                <Text className="text-white font-black text-lg">Canales</Text>
                <TouchableOpacity onPress={() => setShowChannelList(false)} className="p-2 bg-white/10 rounded-full">
                  <X color="white" size={20} />
                </TouchableOpacity>
              </View>
              <View className="px-4 pb-4 border-b border-white/10 relative">
                <View className="absolute left-7 top-3 z-10">
                  <Search color="rgba(255,255,255,0.4)" size={16} />
                </View>
                <TextInput
                  className="w-full bg-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm font-bold"
                  placeholder="Buscar canal..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => {
                    // Keep controls visible while typing
                    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                  }}
                />
              </View>
              
              <FlatList
                className="flex-1"
                contentContainerStyle={{ padding: 12 }}
                data={filteredChannels}
                keyExtractor={(item) => item.id}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={10}
                renderItem={({ item: channel }) => (
                  <TouchableOpacity 
                    onPress={() => {
                      setActiveChannel(channel);
                      setShowChannelList(false);
                      resetControlsTimeout();
                    }}
                    className={`flex-row items-center gap-3 p-3 mb-2 rounded-xl transition-all ${activeChannel.id === channel.id ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-white/5 border border-transparent'}`}
                  >
                    <View className="w-10 h-10 rounded-lg bg-black/50 items-center justify-center overflow-hidden border border-white/5">
                      {channel.logo ? (
                        <Image source={{ uri: channel.logo }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                      ) : (
                        <Tv2 size={16} color="rgba(255,255,255,0.3)" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className={`text-sm font-bold ${activeChannel.id === channel.id ? 'text-orange-500' : 'text-white/90'}`} numberOfLines={1}>{channel.name}</Text>
                      <Text className="text-[10px] text-white/40 uppercase tracking-widest">{channel.country || 'General'}</Text>
                    </View>
                    {activeChannel.id === channel.id && (
                      <View className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}
