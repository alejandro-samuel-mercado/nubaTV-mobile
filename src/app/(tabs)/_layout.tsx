import { Tabs } from 'expo-router';
import { Home, Compass, Heart, User as UserIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { useGlobal } from '../../contexts/GlobalContext';

export default function TabLayout() {
  const { user } = useGlobal();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(2, 5, 10, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor: '#22d3ee',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Mi Perfil',
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
