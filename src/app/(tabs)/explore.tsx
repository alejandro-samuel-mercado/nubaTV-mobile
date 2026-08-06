import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { useGlobal, Channel } from '../../contexts/GlobalContext';
import { useRouter } from 'expo-router';
import { Search, Filter } from 'lucide-react-native';

export default function ExploreScreen() {
  const { channels, setActiveChannel } = useGlobal();
  const router = useRouter();
  
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  
  const countries = useMemo(() => {
    return Array.from(new Set(channels.map(c => c.country).filter(Boolean))).sort();
  }, [channels]);

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchCountry = selectedCountry ? c.country === selectedCountry : true;
      return matchSearch && matchCountry;
    });
  }, [channels, search, selectedCountry]);

  const handlePlay = (channel: Channel) => {
    setActiveChannel(channel);
    router.push(`/player`);
  };

  return (
    <View className="flex-1 bg-[#02050a] pt-12">
      <View className="px-6 mb-4">
        <Text className="text-3xl font-black text-white mb-6">Explorar</Text>
        
        {/* Search Bar */}
        <View className="relative mb-6">
          <View className="absolute left-4 top-3.5 z-10">
            <Search color="rgba(255,255,255,0.4)" size={20} />
          </View>
          <TextInput
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-bold"
            placeholder="Buscar canales..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <TouchableOpacity 
            onPress={() => setSelectedCountry('')}
            className={`px-4 py-2 rounded-full mr-3 border ${selectedCountry === '' ? 'bg-cyan-500 border-transparent' : 'bg-transparent border-white/20'}`}
          >
            <Text className="text-white font-bold text-sm">Todos los Países</Text>
          </TouchableOpacity>
          {countries.map(country => (
            <TouchableOpacity 
              key={country}
              onPress={() => setSelectedCountry(country)}
              className={`px-4 py-2 rounded-full mr-3 border ${selectedCountry === country ? 'bg-cyan-500 border-transparent' : 'bg-transparent border-white/20'}`}
            >
              <Text className="text-white font-bold text-sm">{country}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-6 pb-24" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between">
          {filteredChannels.length === 0 ? (
            <View className="w-full mt-12 items-center justify-center">
              <Text className="text-white/40 text-center font-bold">No se encontraron canales.</Text>
            </View>
          ) : (
            filteredChannels.map(channel => (
              <TouchableOpacity 
                key={channel.id}
                onPress={() => handlePlay(channel)}
                className="w-[48%] mb-4 bg-white/5 rounded-2xl p-4 border border-white/5 items-center justify-center"
                style={{ height: 140 }}
              >
                {channel.logo ? (
                  <Image source={{ uri: channel.logo }} className="w-16 h-16 mb-3" resizeMode="contain" />
                ) : (
                  <View className="w-16 h-16 mb-3 rounded-full bg-white/10 items-center justify-center">
                    <Text className="text-white/30 font-black text-2xl">{channel.name.charAt(0)}</Text>
                  </View>
                )}
                <Text className="text-white text-xs font-bold text-center" numberOfLines={2}>{channel.name}</Text>
                <Text className="text-white/40 text-[10px] mt-1 text-center" numberOfLines={1}>{channel.category?.name || 'General'}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
