import { Slot, useRouter, useSegments } from 'expo-router';
import { GlobalProvider, useGlobal } from '../contexts/GlobalContext';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import '../global.css';
import { StatusBar } from 'expo-status-bar';

function InitialLayout() {
  const { user, token, loading } = useGlobal();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';

    if (!token) {
      // If not signed in and not in the auth group, redirect to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (token) {
      if (user?.role === 'admin') {
        // Admins go to admin panel
        if (!inAdminGroup) {
          router.replace('/(admin)/dashboard');
        }
      } else {
        // Users go to tabs
        if (inAuthGroup || inAdminGroup) {
          router.replace('/(tabs)');
        }
      }
    }
  }, [token, loading, user, segments]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#02050a] items-center justify-center">
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GlobalProvider>
      <StatusBar style="light" />
      <InitialLayout />
    </GlobalProvider>
  );
}
