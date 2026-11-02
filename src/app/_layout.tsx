import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import MiniTvPlayer from "../components/MiniTvPlayer";
import { GlobalProvider, useGlobal } from "../contexts/GlobalContext";
import { SettingsProvider, useAppTheme } from "../contexts/SettingsContext";
import "../global.css";

function InitialLayout() {
  const { user, token, loading, miniPlayerAllowed, activeChannel } =
    useGlobal();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const theme = useAppTheme();

  const onTvScreen = pathname === "/tv" || pathname.endsWith("/tv");
  const onMoviePlayerScreen =
    pathname === "/player" ||
    pathname.endsWith("/player") ||
    pathname === "/watch" ||
    pathname.endsWith("/watch");
  const miniMounted = miniPlayerAllowed && !!activeChannel;
  const miniVisible = miniMounted && !onTvScreen && !onMoviePlayerScreen;

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAdminGroup = segments[0] === "(admin)";

    if (!token) {
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    } else if (token) {
      if (user?.role === "admin") {
        if (!inAdminGroup) {
          router.replace("/(admin)/dashboard");
        }
      } else {
        if (inAuthGroup || inAdminGroup) {
          router.replace("/(tabs)");
        }
      }
    }
  }, [token, loading, user, segments]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar
        style={theme.statusBar === "dark-content" ? "dark" : "light"}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 280,
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        <Stack.Screen name="(admin)" options={{ animation: "fade" }} />
        <Stack.Screen
          name="detail"
          options={{ animation: "fade_from_bottom" }}
        />
        <Stack.Screen name="player" options={{ animation: "fade" }} />
        <Stack.Screen name="watch" options={{ animation: "fade" }} />
      </Stack>

      {miniMounted && <MiniTvPlayer visible={miniVisible} />}
    </View>
  );
}

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme("dark");
  }, [setColorScheme]);

  return (
    <GlobalProvider>
      <SettingsProvider>
        <InitialLayout />
      </SettingsProvider>
    </GlobalProvider>
  );
}
