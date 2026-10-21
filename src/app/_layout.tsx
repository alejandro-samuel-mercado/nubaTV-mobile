import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { GlobalProvider, useGlobal } from '../contexts/GlobalContext';
import { SettingsProvider, useAppTheme } from '../contexts/SettingsContext';
import '../global.css';

function InitialLayout() {
  const { user, token, loading } = useGlobal();
  const segments = useSegments();
  const router = useRouter();
  const theme = useAppTheme();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';

    if (!token) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (token) {
      if (user?.role === 'admin') {
        if (!inAdminGroup) {
          router.replace('/(admin)/dashboard');
        }
      } else {
        if (inAuthGroup || inAdminGroup) {
          router.replace('/(tabs)');
        }
      }
    }
  }, [token, loading, user, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={theme.statusBar === 'dark-content' ? 'dark' : 'light'} />
      <Slot />
    </View>
  );
}


export default function RootLayout() {
  const { setColorScheme } = useColorScheme();
  
  useEffect(() => {
    setColorScheme('dark');
  }, [setColorScheme]);

  return (
    <GlobalProvider>
      <SettingsProvider>
        <InitialLayout />
      </SettingsProvider>
    </GlobalProvider>
  );
}
