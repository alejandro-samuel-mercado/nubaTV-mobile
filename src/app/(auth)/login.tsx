import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useGlobal, API_URL } from '../../contexts/GlobalContext';
import axios from 'axios';
import * as SecureStore from '../../utils/storage';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setToken, setUser } = useGlobal();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Por favor, ingresa tu usuario y contraseña.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      if (response.data.token) {
        await SecureStore.setItemAsync('token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error de conexión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#02050a] items-center justify-center p-8">
      {/* Background gradients */}
      <View className="absolute inset-0 z-0">
        <View className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] rounded-full opacity-30 bg-cyan-600 blur-[100px]" />
        <View className="absolute bottom-[-20%] right-[-20%] w-[100%] h-[100%] rounded-full opacity-30 bg-purple-700 blur-[100px]" />
      </View>

      <View className="z-10 w-full max-w-sm">
        <View className="items-center mb-10">
          <Text className="text-4xl font-black tracking-tighter text-transparent" style={{ color: 'white' }}>
            Nuba<Text className="text-cyan-500">TV</Text>
          </Text>
          <Text className="text-text-base/50 font-bold mt-2 text-center text-sm">
            Disfruta del mejor contenido en tu celular
          </Text>
        </View>

        <View className="bg-bg-panel p-6 rounded-3xl border border-border-subtle">
          {error ? (
            <View className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl mb-4">
              <Text className="text-red-300 font-bold text-center text-xs">{error}</Text>
            </View>
          ) : null}

          <View className="space-y-4">
            <View>
              <Text className="text-text-base text-xs font-bold uppercase tracking-widest mb-2">Usuario</Text>
              <TextInput
                className="w-full bg-black/40 border border-border-subtle rounded-xl py-3 px-4 text-text-base font-bold"
                placeholder="Tu usuario"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View className="mt-4">
              <Text className="text-text-base text-xs font-bold uppercase tracking-widest mb-2">Contraseña</Text>
              <TextInput
                className="w-full bg-black/40 border border-border-subtle rounded-xl py-3 px-4 text-text-base font-bold"
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="w-full mt-6 bg-cyan-500 py-3 rounded-xl flex items-center justify-center"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-text-base font-black text-lg">Ingresar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
