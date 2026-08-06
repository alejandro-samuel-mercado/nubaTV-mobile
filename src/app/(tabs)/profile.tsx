import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useGlobal } from '../../contexts/GlobalContext';
import { LogOut, User as UserIcon, Calendar, Smartphone } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useGlobal();

  const isExpired = user?.expiresAt && new Date(user.expiresAt) < new Date();

  return (
    <View className="flex-1 bg-[#02050a] pt-12">
      <View className="px-6 mb-8">
        <Text className="text-3xl font-black text-white">Mi Perfil</Text>
      </View>

      <View className="px-6 flex-1">
        <View className="bg-white/5 p-6 rounded-3xl border border-white/10 items-center mb-8">
          <View className="w-24 h-24 bg-cyan-500/20 rounded-full items-center justify-center mb-4 border border-cyan-500/50">
            <UserIcon color="#22d3ee" size={40} />
          </View>
          <Text className="text-white text-2xl font-black mb-1">{user?.username}</Text>
          <View className="bg-cyan-500/20 px-3 py-1 rounded-full mb-6">
            <Text className="text-cyan-300 font-bold text-xs uppercase">{user?.role === 'admin' ? 'Administrador' : 'Usuario Pro'}</Text>
          </View>

          <View className="w-full space-y-4">
            <View className="flex-row items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
              <Calendar color="rgba(255,255,255,0.4)" size={20} />
              <View>
                <Text className="text-white/40 text-xs font-bold uppercase">Vencimiento del Plan</Text>
                <Text className={`font-bold ${isExpired ? 'text-red-400' : 'text-white'}`}>
                  {user?.expiresAt ? new Date(user.expiresAt).toLocaleDateString() : 'Nunca'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
              <Smartphone color="rgba(255,255,255,0.4)" size={20} />
              <View>
                <Text className="text-white/40 text-xs font-bold uppercase">Dispositivos Permitidos</Text>
                <Text className="text-white font-bold">
                  {user?.maxDevices || 1} pantallas simultáneas
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          onPress={logout}
          className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex-row items-center justify-center gap-2"
        >
          <LogOut color="#f87171" size={20} />
          <Text className="text-red-400 font-bold text-lg">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
