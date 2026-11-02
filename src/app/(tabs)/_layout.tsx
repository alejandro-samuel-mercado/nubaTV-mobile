import { BlurView } from "expo-blur";
import { Tabs, usePathname } from "expo-router";
import { Bookmark, Compass, Home, Settings, Tv2 } from "lucide-react-native";
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import AmbientEffects from "../../components/AmbientEffects";
import { ScreenTransition } from "../../components/Motion";
import { useGlobal } from "../../contexts/GlobalContext";
import { useSettings } from "../../contexts/SettingsContext";
import { isLightBackground } from "../../services/appSettings";

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { settings } = useSettings();
  const isLight = isLightBackground(settings.backgroundColor);
  const accent = settings.accentColor;
  const inactiveColor = isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)";

  return (
    <View style={styles.tabBarContainer}>
      <BlurView
        intensity={Platform.OS === "ios" ? 40 : 50}
        tint={isLight ? "light" : "dark"}
        blurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.tabBarRow}>
        {state.routes.map((route: any, index: number) => {
          if (route.name === "favorites") return null;
          const { options } = descriptors[route.key];
          if (options?.href === null) return null;

          const isFocused = state.index === index;
          const label =
            options.title !== undefined ? options.title : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const IconComponent =
            route.name === "index"
              ? Home
              : route.name === "tv"
                ? Tv2
                : route.name === "explore"
                  ? Compass
                  : route.name === "profile"
                    ? Bookmark
                    : Settings;

          const iconColor = isFocused ? accent : inactiveColor;
          const textColor = isFocused ? accent : inactiveColor;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabBtn}
            >
              <View
                style={[
                  styles.iconBox,
                  isFocused && { backgroundColor: `${accent}28` },
                ]}
              >
                <IconComponent size={24} color={iconColor} />
              </View>
              <Text style={[styles.tabLabel, { color: textColor }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { settings } = useSettings();
  const { miniPlayerAllowed, activeChannel } = useGlobal();
  const pathname = usePathname();
  const onTv = pathname === "/tv" || pathname.endsWith("/tv");
  // Mount the player as soon as the user has visited TV + has a channel.
  // We keep it mounted (pre-buffering) and only toggle visibility.
  const miniMounted =
    settings.miniPlayerEnabled && miniPlayerAllowed && !!activeChannel;
  const miniVisible = miniMounted && !onTv;
  return (
    <View style={{ flex: 1, backgroundColor: settings.backgroundColor }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenLayout={({ children }) => (
          <ScreenTransition>{children}</ScreenTransition>
        )}
        screenOptions={{
          headerShown: false,
          animation: "fade",
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            borderTopWidth: 0,
            backgroundColor: "transparent",
          },
        }}
      >
        {/* INICIO */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
          }}
        />

        {/* TV – canales IPTV */}
        <Tabs.Screen
          name="tv"
          options={{
            title: "Tv",
          }}
        />

        {/* EXPLORAR – VOD (no visible en tab bar, se accede desde menú hamburguesa) */}
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />

        {/* FAVORITOS (Oculto de la barra inferior) */}
        <Tabs.Screen
          name="favorites"
          options={{
            href: null,
          }}
        />

        {/* MI LISTA */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Mi lista",
          }}
        />

        {/* AJUSTES */}
        <Tabs.Screen
          name="settings"
          options={{
            title: "Ajustes",
          }}
        />
      </Tabs>
      <AmbientEffects />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    backgroundColor: "rgba(18, 18, 24, 0.45)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        } as any)
      : {}),
  },
  tabBarBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBarRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  iconBox: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxActive: {
    backgroundColor: "rgba(229,9,20,0.22)",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: 5,
    textAlign: "center",
  },
});
