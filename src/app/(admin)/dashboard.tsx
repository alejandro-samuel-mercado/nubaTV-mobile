import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useGlobal, API_URL } from '../../contexts/GlobalContext';
import axios from 'axios';
import { Users, ListVideo, Trash2, RefreshCw } from 'lucide-react-native';

export default function AdminDashboard() {
  const { token, channels } = useGlobal();
  const [stats, setStats] = useState<any>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, plRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers }),
        axios.get(`${API_URL}/admin/playlists`, { headers })
      ]);
      setStats(statsRes.data);
      setPlaylists(plRes.data);
    } catch (error) {
      console.log('Error loading admin data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPlaylists = async () => {
    try {
      Alert.alert("Sincronizando", "Esto tomará unos minutos...");
      await axios.post(`${API_URL}/system/update`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      Alert.alert("Error", "No se pudo sincronizar.");
    }
  };

  const handleDeletePlaylist = async (id: string, name: string) => {
    Alert.alert(
      "Eliminar Lista",
      `¿Seguro que deseas eliminar "${name}" y todos sus canales?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/admin/playlists/${id}`, { headers: { Authorization: `Bearer ${token}` } });
              fetchData();
            } catch(e) {
              Alert.alert("Error", "No se pudo eliminar.");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#02050a] items-center justify-center">
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#02050a] p-4">
      {/* Stats */}
      <View className="flex-row flex-wrap justify-between mb-8">
        <View className="w-[48%] bg-white/5 p-4 rounded-2xl border border-white/10 mb-4 items-center">
          <Users color="#06b6d4" size={24} className="mb-2" />
          <Text className="text-white text-2xl font-black">{stats?.usersCount || 0}</Text>
          <Text className="text-white/40 text-xs font-bold uppercase">Usuarios</Text>
        </View>
        <View className="w-[48%] bg-white/5 p-4 rounded-2xl border border-white/10 mb-4 items-center">
          <ListVideo color="#3b82f6" size={24} className="mb-2" />
          <Text className="text-white text-2xl font-black">{channels.length}</Text>
          <Text className="text-white/40 text-xs font-bold uppercase">Canales Activos</Text>
        </View>
      </View>

      {/* Actions */}
      <View className="mb-8">
        <TouchableOpacity 
          onPress={handleSyncPlaylists}
          className="bg-cyan-500/20 border border-cyan-500/30 p-4 rounded-xl flex-row justify-center items-center gap-2"
        >
          <RefreshCw color="#22d3ee" size={20} />
          <Text className="text-cyan-300 font-bold">Sincronizar Listas M3U</Text>
        </TouchableOpacity>
      </View>

      {/* Playlists */}
      <Text className="text-white font-bold text-xl mb-4">Listas Instaladas</Text>
      <View className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 mb-8">
        {playlists.map((pl, i) => (
          <View key={pl.id} className={`p-4 flex-row justify-between items-center ${i !== playlists.length-1 ? 'border-b border-white/5' : ''}`}>
            <View>
              <Text className="text-white font-bold">{pl.name}</Text>
              <Text className="text-white/40 text-xs">{pl._count?.channels || 0} canales</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeletePlaylist(pl.id, pl.name)} className="p-2 bg-red-500/10 rounded-full">
              <Trash2 color="#ef4444" size={20} />
            </TouchableOpacity>
          </View>
        ))}
        {playlists.length === 0 && (
          <View className="p-6 items-center">
            <Text className="text-white/40 font-bold">No hay listas instaladas.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
