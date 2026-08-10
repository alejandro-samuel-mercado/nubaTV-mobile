import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useGlobal } from '../../contexts/GlobalContext';
import { User as UserIcon, LogOut, Settings, CreditCard, HelpCircle } from 'lucide-react-native';
import AnimatedBackground from '../../components/AnimatedBackground';

export default function ProfileScreen() {
  const { user, logout } = useGlobal();

  const isExpired = user?.expiresAt && new Date(user.expiresAt) < new Date();

  return (
    <View className="flex-1">
      <AnimatedBackground />

      <View className="px-6 mt-16 mb-8">
        <Text className="text-4xl font-black text-white tracking-tighter">Mi Perfil</Text>
      </View>

      <View className="px-6">
        <View className="rounded-[30px] overflow-hidden mb-8 bg-white/5 border border-white/10 p-6 items-center">
          <View className="w-24 h-24 rounded-full bg-white/10 items-center justify-center mb-4 border-2 border-[#d9f943]">
            <UserIcon color="white" size={40} />
          </View>
          <Text className="text-white text-2xl font-bold">{user?.username}</Text>
          
          <View className={`mt-4 px-4 py-1.5 rounded-full ${isExpired ? 'bg-red-500/20 border-red-500/30' : 'bg-[#d9f943]/20 border-[#d9f943]/30'} border`}>
            <Text className={`${isExpired ? 'text-red-400' : 'text-[#d9f943]'} font-bold`}>
              {isExpired ? 'Suscripción Expirada' : 'Cuenta Activa'}
            </Text>
          </View>
        </View>

        <Text className="text-white/50 font-bold ml-2 mb-3 uppercase text-xs tracking-wider">Ajustes Generales</Text>
        
        <View className="rounded-[30px] overflow-hidden mb-8 bg-white/5 border border-white/10">
          <TouchableOpacity className="flex-row items-center p-5 border-b border-white/5">
            <Settings color="white" size={20} className="mr-4 opacity-70" />
            <Text className="text-white font-medium text-lg">Configuración de App</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-5 border-b border-white/5">
            <CreditCard color="white" size={20} className="mr-4 opacity-70" />
            <Text className="text-white font-medium text-lg">Suscripción</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-5">
            <HelpCircle color="white" size={20} className="mr-4 opacity-70" />
            <Text className="text-white font-medium text-lg">Ayuda y Soporte</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => Alert.alert("Cerrar Sesión", "¿Estás seguro de salir?", [{text: "Cancelar", style: "cancel"}, {text: "Salir", style: "destructive", onPress: logout}])}
          className="bg-red-500/20 p-5 rounded-[25px] flex-row items-center justify-center border border-red-500/30"
        >
          <LogOut color="#f87171" size={20} className="mr-2" />
          <Text className="text-red-400 font-bold text-lg">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
