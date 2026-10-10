import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useGlobal } from '../../contexts/GlobalContext';
import { User as UserIcon, LogOut, Settings, CreditCard, HelpCircle, Moon, Sun } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import AnimatedBackground from '../../components/AnimatedBackground';
import { useThemeColors } from '../../theme/colors';

export default function ProfileScreen() {
  const { user, logout } = useGlobal();

  const { colorScheme, toggleColorScheme } = useColorScheme();
  const theme = useThemeColors(colorScheme);
  const isDark = colorScheme !== 'light';
  const isExpired = user?.expiresAt && new Date(user.expiresAt) < new Date();

  return (
    <View className="flex-1">
      <AnimatedBackground />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} className="flex-1 px-6 pt-16">
        <Text className="text-4xl font-black tracking-tighter mb-8" style={{ color: theme.textPrimary }}>Mi Perfil</Text>

        <View className="rounded-[30px] overflow-hidden mb-8 p-6 items-center shadow-xl border" style={{ backgroundColor: theme.bgPanel, borderColor: theme.borderSubtle }}>
          <View className="w-24 h-24 rounded-full items-center justify-center mb-4 border-2" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: theme.accent }}>
            <UserIcon color={theme.textPrimary} size={40} />
          </View>
          <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>{user?.username}</Text>
          
          <View className={`mt-4 px-4 py-1.5 rounded-full border ${isExpired ? 'bg-red-500/20 border-red-500/30' : ''}`} style={!isExpired ? { backgroundColor: theme.accentGlow, borderColor: theme.accent } : {}}>
            <Text className="font-bold" style={{ color: isExpired ? '#f87171' : theme.accent }}>
              {isExpired ? 'Suscripción Expirada' : 'Cuenta Activa'}
            </Text>
          </View>
        </View>

        <Text className="font-bold ml-2 mb-3 uppercase text-xs tracking-wider" style={{ color: theme.textSecondary }}>Ajustes Generales</Text>
        
        <View className="rounded-[30px] overflow-hidden mb-8 shadow-lg border" style={{ backgroundColor: theme.bgPanel, borderColor: theme.borderSubtle }}>
          <TouchableOpacity 
            onPress={toggleColorScheme}
            className="flex-row items-center justify-between p-5 border-b"
            style={{ borderColor: theme.borderSubtle }}
          >
            <View className="flex-row items-center">
              {isDark ? (
                <Moon color={theme.textPrimary} size={20} className="mr-4 opacity-70" />
              ) : (
                <Sun color={theme.textPrimary} size={20} className="mr-4 opacity-70" />
              )}
              <Text className="font-medium text-lg" style={{ color: theme.textPrimary }}>
                Modo {isDark ? 'Oscuro' : 'Claro'}
              </Text>
            </View>
            <View className="w-12 h-6 rounded-full flex-row items-center px-1" style={{ backgroundColor: theme.accentGlow }}>
              <View className={`w-4 h-4 rounded-full transition-all ${!isDark ? 'ml-auto' : 'mr-auto'}`} style={{ backgroundColor: theme.accent }} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-5 border-b" style={{ borderColor: theme.borderSubtle }}>
            <Settings color={theme.textPrimary} size={20} className="mr-4 opacity-70" />
            <Text className="font-medium text-lg" style={{ color: theme.textPrimary }}>Configuración de App</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-5 border-b" style={{ borderColor: theme.borderSubtle }}>
            <CreditCard color={theme.textPrimary} size={20} className="mr-4 opacity-70" />
            <Text className="font-medium text-lg" style={{ color: theme.textPrimary }}>Suscripción</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-5">
            <HelpCircle color={theme.textPrimary} size={20} className="mr-4 opacity-70" />
            <Text className="font-medium text-lg" style={{ color: theme.textPrimary }}>Ayuda y Soporte</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => Alert.alert("Cerrar Sesión", "¿Estás seguro de salir?", [{text: "Cancelar", style: "cancel"}, {text: "Salir", style: "destructive", onPress: logout}])}
          className="bg-red-500/20 p-5 rounded-[25px] flex-row items-center justify-center border border-red-500/30"
        >
          <LogOut color="#f87171" size={20} className="mr-2" />
          <Text className="text-red-400 font-bold text-lg">Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
