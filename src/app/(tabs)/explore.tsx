import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useGlobal, Channel } from '../../contexts/GlobalContext';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import AnimatedBackground from '../../components/AnimatedBackground';
import FilterModal from '../../components/FilterModal';

export default function ExploreScreen() {
  const { 
    channels, 
    setActiveChannel,
    searchQuery,
    selectedCategory,
    selectedCountry,
    selectedLanguage,
    selectedPlaylist
  } = useGlobal();
  
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCountry = selectedCountry ? c.country === selectedCountry : true;
      const matchCategory = selectedCategory ? c.category?.name === selectedCategory : true;
      const matchLanguage = selectedLanguage ? c.language === selectedLanguage : true;
      const matchPlaylist = selectedPlaylist ? c.playlist?.name === selectedPlaylist : true;
      
      return matchSearch && matchCountry && matchCategory && matchLanguage && matchPlaylist;
    });
  }, [channels, searchQuery, selectedCountry, selectedCategory, selectedLanguage, selectedPlaylist]);

  const handlePlay = (channel: Channel) => {
    setActiveChannel(channel);
    router.push(`/player`);
  };

  return (
    <View className="flex-1">
      <AnimatedBackground />

      <FilterModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onApply={() => setModalVisible(false)} 
      />

      <View className="px-6 mt-16 mb-6 flex-row items-center justify-between">
        <Text className="text-4xl font-black text-white tracking-tighter">Explorar</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-white/10 p-3 rounded-full border border-white/20 flex-row items-center gap-2">
          <Search color="white" size={20} />
          {(searchQuery || selectedCategory || selectedCountry || selectedLanguage || selectedPlaylist) && (
            <View className="w-3 h-3 rounded-full absolute right-2 top-2 border-2 border-transparent" style={{ backgroundColor: '#d9f943' }} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pb-24" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between">
          {filteredChannels.length === 0 ? (
            <View className="w-full mt-12 items-center justify-center">
              <Text className="text-white/40 text-center font-bold">No se encontraron canales con estos filtros.</Text>
            </View>
          ) : (
            filteredChannels.map(channel => (
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
                  <Text className="text-white/40 text-[10px] mt-1 text-center" numberOfLines={1}>{channel.category?.name || 'General'}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
        <View className="h-32" />
      </ScrollView>
    </View>
  );
}
