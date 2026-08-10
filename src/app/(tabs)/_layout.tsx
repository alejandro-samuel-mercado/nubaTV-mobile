import { Tabs } from 'expo-router';
import { Home, Compass, Heart, User as UserIcon } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';
import { useGlobal } from '../../contexts/GlobalContext';
import AnimatedBackground from '../../components/AnimatedBackground';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const { user } = useGlobal();

  return (
    <View style={{ flex: 1 }}>
      
      <Tabs
        sceneContainerStyle={{ backgroundColor: 'transparent' }}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 70,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            borderTopWidth: 0,
            backgroundColor: 'transparent',
            elevation: 0,
            overflow: 'hidden',
          },
          tabBarBackground: () => (
            <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(30, 27, 75, 0.5)', borderColor: 'rgba(217, 248, 76, 0.3)', borderTopWidth: 2, borderRadius: 30 }]} />
          ),
          tabBarActiveTintColor: '#d9f943',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={focused ? { backgroundColor: 'rgba(217, 248, 67, 0.1)', padding: 10, borderRadius: 20 } : { padding: 10 }}>
                <Home color={color} size={size} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explorar',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={focused ? { backgroundColor: 'rgba(217, 248, 67, 0.1)', padding: 10, borderRadius: 20 } : { padding: 10 }}>
                <Compass color={color} size={size} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favoritos',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={focused ? { backgroundColor: 'rgba(217, 248, 67, 0.1)', padding: 10, borderRadius: 20 } : { padding: 10 }}>
                <Heart color={color} size={size} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Mi Perfil',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={focused ? { backgroundColor: 'rgba(217, 248, 67, 0.1)', padding: 10, borderRadius: 20 } : { padding: 10 }}>
                <UserIcon color={color} size={size} />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
