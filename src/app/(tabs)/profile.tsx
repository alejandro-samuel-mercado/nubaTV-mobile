import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useGlobal } from '../../contexts/GlobalContext';
import { LogOut } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import AnimatedBackground from '../../components/AnimatedBackground';
import { useThemeColors } from '../../theme/colors';

export default function ProfileScreen() {
  const { user, logout } = useGlobal();

  const { colorScheme } = useColorScheme();
  const theme = useThemeColors(colorScheme);
  
  const isExpired = user?.expiresAt && new Date(user.expiresAt) < new Date();
  const d = user?.daysRemaining;
  const isAdmin = user?.role === 'admin';

  const fmt = (s?: string | null) => {
    if (!s) return 'Ilimitado';
    return new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const StatBox = ({ label, value, color, borderColor, fullWidth = false }: { label: string, value: string, color: string, borderColor: string, fullWidth?: boolean }) => (
    <View 
      className={`${fullWidth ? 'w-full' : 'w-[47%]'} h-32 mb-4 rounded-3xl items-center justify-center border-2 p-3 shadow-lg`}
      style={{ backgroundColor: color, borderColor: borderColor }}
    >
      <Text className="text-[10px] uppercase tracking-widest font-bold mb-1 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
        {label}
      </Text>
      <Text className="text-white text-base font-black text-center" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );

  return (
    <View className="flex-1">
      <AnimatedBackground />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} className="flex-1 px-6 pt-24" showsVerticalScrollIndicator={false}>
        
        {/* Avatar and Info Header */}
        <View className="items-center mb-10">
          <View 
            className="w-32 h-32 rounded-3xl items-center justify-center mb-6 shadow-2xl border"
            style={{ 
              backgroundColor: theme.bgPanel,
              borderColor: 'rgba(255,255,255,0.1)'
            }}
          >
            <Text className="text-6xl font-light text-white uppercase">
              {user?.username?.charAt(0) || 'U'}
            </Text>
          </View>

          <Text 
            className="text-5xl font-black uppercase tracking-tighter text-center mb-3" 
            style={{ color: theme.textPrimary }}
          >
            {user?.username}
          </Text>

          <View className="flex-row items-center gap-3">
            <View 
              className="px-4 py-1.5 rounded-md" 
              style={{ backgroundColor: isAdmin ? '#f59e0b' : '#333' }}
            >
              <Text className="text-xs font-black uppercase tracking-widest" style={{ color: isAdmin ? '#000' : 'white' }}>
                {isAdmin ? 'Administrador' : 'Premium'}
              </Text>
            </View>
            <View className="px-4 py-1.5 rounded-md border border-white/20 bg-black/50">
              <Text className="text-xs font-mono text-white/70">
                ID: {user?.id?.slice(0, 8) || '---'}
              </Text>
            </View>
          </View>
        </View>

        {/* Days Remaining Big Banner */}
        <View 
          className="w-full h-40 rounded-[40px] items-center justify-center mb-6 border-2"
          style={{ 
            backgroundColor: 'rgba(17, 17, 17, 0.8)', 
            borderColor: '#06b6d4' 
          }}
        >
          <Text className="text-[#06b6d4] text-xs uppercase tracking-[0.15em] font-black mb-2">
            Días Restantes
          </Text>
          <Text className="text-[72px] font-black text-white leading-none">
            {d !== null && d !== undefined ? d : '∞'}
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between">
          <StatBox 
            label="Vencimiento" 
            value={fmt(user?.expiresAt)} 
            color="rgba(10, 15, 22, 0.8)" 
            borderColor="#3b82f6" 
          />
          <StatBox 
            label="Estado" 
            value={user?.isActive ? 'Cuenta Activa' : 'Suspendida'} 
            color={user?.isActive ? 'rgba(5, 22, 13, 0.8)' : 'rgba(26, 5, 5, 0.8)'} 
            borderColor={user?.isActive ? '#10b981' : '#ef4444'} 
          />
          <StatBox 
            label="Miembro Desde" 
            value={fmt(user?.createdAt)} 
            color="rgba(22, 17, 5, 0.8)" 
            borderColor="#f59e0b"
            fullWidth={true}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={() => Alert.alert("Cerrar Sesión", "¿Estás seguro de salir?", [{text: "Cancelar", style: "cancel"}, {text: "Salir", style: "destructive", onPress: logout}])}
          className="mt-6 bg-red-500/20 p-5 rounded-3xl flex-row items-center justify-center border border-red-500/30"
        >
          <LogOut color="#f87171" size={20} className="mr-2" />
          <Text className="text-red-400 font-bold text-lg">Cerrar Sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
