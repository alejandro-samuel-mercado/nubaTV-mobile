import React, { useMemo, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useGlobal } from '../contexts/GlobalContext';
import { Search, X, Check, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
}

type MenuState = 'main' | 'category' | 'country' | 'language' | 'playlist';

export default function FilterModal({ visible, onClose, onApply }: FilterModalProps) {
  const { 
    channels, 
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    selectedCountry, setSelectedCountry,
    selectedLanguage, setSelectedLanguage,
    selectedPlaylist, setSelectedPlaylist
  } = useGlobal();

  const [activeMenu, setActiveMenu] = useState<MenuState>('main');

  const categories = useMemo(() => Array.from(new Set(channels.map(c => c.category?.name).filter(Boolean))).sort() as string[], [channels]);
  const countries = useMemo(() => Array.from(new Set(channels.map(c => c.country).filter(Boolean))).sort() as string[], [channels]);
  const languages = useMemo(() => Array.from(new Set(channels.map(c => c.language).filter(Boolean))).sort() as string[], [channels]);
  const playlists = useMemo(() => Array.from(new Set(channels.map(c => c.playlist?.name).filter(Boolean))).sort() as string[], [channels]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedCountry(null);
    setSelectedLanguage(null);
    setSelectedPlaylist(null);
  };

  const renderSubMenu = (
    title: string, 
    options: string[], 
    selectedValue: string | null, 
    onSelect: (val: string | null) => void
  ) => {
    return (
      <View className="flex-1">
        {/* Sub-menu Header */}
        <View className="flex-row items-center px-6 pt-16 pb-6 border-b border-border-subtle">
          <TouchableOpacity onPress={() => setActiveMenu('main')} className="bg-bg-panel p-2 rounded-full mr-4">
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-text-base text-xl font-black">{title}</Text>
        </View>

        <ScrollView className="flex-1 py-4" showsVerticalScrollIndicator={false}>
          <TouchableOpacity 
            onPress={() => { onSelect(null); setActiveMenu('main'); }}
            className="flex-row items-center justify-between px-6 py-4 border-b border-border-subtle"
          >
            <Text className={`text-lg ${!selectedValue ? 'font-bold' : 'text-text-base'}`} style={!selectedValue ? { color: '#ff9100' } : {}}>Todos</Text>
            {!selectedValue && <Check color="#ff9100" size={20} />}
          </TouchableOpacity>
          
          {options.map(opt => (
            <TouchableOpacity 
              key={opt}
              onPress={() => { onSelect(opt); setActiveMenu('main'); }}
              className="flex-row items-center justify-between px-6 py-4 border-b border-border-subtle"
            >
              <Text className={`text-lg ${selectedValue === opt ? 'font-bold' : 'text-text-base'}`} style={selectedValue === opt ? { color: '#ff9100' } : {}}>{opt}</Text>
              {selectedValue === opt && <Check color="#ff9100" size={20} />}
            </TouchableOpacity>
          ))}
          <View className="h-32" />
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <BlurView intensity={60} tint="dark" className="flex-1">
        
        {activeMenu === 'category' && renderSubMenu('Seleccionar Categoría', categories, selectedCategory, setSelectedCategory)}
        {activeMenu === 'country' && renderSubMenu('Seleccionar País', countries, selectedCountry, setSelectedCountry)}
        {activeMenu === 'language' && renderSubMenu('Seleccionar Idioma', languages, selectedLanguage, setSelectedLanguage)}
        {activeMenu === 'playlist' && renderSubMenu('Seleccionar Lista', playlists, selectedPlaylist, setSelectedPlaylist)}

        {activeMenu === 'main' && (
          <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-16 pb-6 border-b border-border-subtle">
              <Text className="text-text-base text-3xl font-black">Filtros</Text>
              <TouchableOpacity onPress={onClose} className="bg-bg-panel p-2 rounded-full">
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 py-6" showsVerticalScrollIndicator={false}>
              {/* Search */}
              <View className="px-6 mb-8">
                <View className="relative">
                  <View className="absolute left-4 top-3.5 z-10">
                    <Search color="rgba(255,255,255,0.4)" size={20} />
                  </View>
                  <TextInput
                    className="w-full bg-bg-panel border border-border-subtle rounded-2xl py-3 pl-12 pr-4 text-text-base font-bold"
                    placeholder="Buscar por nombre..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {/* Filter Rows */}
              <View className="px-6 mb-6">
                <TouchableOpacity onPress={() => setActiveMenu('category')} className="bg-bg-panel border border-border-subtle rounded-t-3xl p-5 flex-row items-center justify-between border-b-0">
                  <Text className="text-text-base/70 font-bold text-lg">Categoría</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="font-bold" style={{ color: '#ff9100' }}>{selectedCategory || 'Todas'}</Text>
                    <ChevronRight color="rgba(255,255,255,0.4)" size={20} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveMenu('country')} className="bg-bg-panel border border-border-subtle p-5 flex-row items-center justify-between border-b-0">
                  <Text className="text-text-base/70 font-bold text-lg">País</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="font-bold" style={{ color: '#ff9100' }}>{selectedCountry || 'Todos'}</Text>
                    <ChevronRight color="rgba(255,255,255,0.4)" size={20} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveMenu('language')} className="bg-bg-panel border border-border-subtle p-5 flex-row items-center justify-between border-b-0">
                  <Text className="text-text-base/70 font-bold text-lg">Idioma</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="font-bold" style={{ color: '#ff9100' }}>{selectedLanguage || 'Todos'}</Text>
                    <ChevronRight color="rgba(255,255,255,0.4)" size={20} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveMenu('playlist')} className="bg-bg-panel border border-border-subtle rounded-b-3xl p-5 flex-row items-center justify-between">
                  <Text className="text-text-base/70 font-bold text-lg">Lista de Reproducción</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="font-bold" style={{ color: '#ff9100' }}>{selectedPlaylist || 'Todas'}</Text>
                    <ChevronRight color="rgba(255,255,255,0.4)" size={20} />
                  </View>
                </TouchableOpacity>
              </View>

              <View className="h-32" />
            </ScrollView>

            {/* Footer Actions */}
            <View className="absolute bottom-0 left-0 right-0 p-6 border-t border-border-subtle flex-row justify-between bg-black/40">
              <TouchableOpacity onPress={clearFilters} className="px-6 py-4 rounded-[25px] border border-border-subtle items-center justify-center w-[48%]">
                <Text className="text-text-base font-bold">Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onApply} className="px-6 py-4 rounded-[25px] shadow-xl flex-row items-center justify-center w-[48%] gap-2" style={{ backgroundColor: '#ff9100' }}>
                <Check color="black" size={20} />
                <Text className="text-black font-black text-lg">Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </BlurView>
    </Modal>
  );
}
