import { Stack } from 'expo-router';
import { useGlobal } from '../../contexts/GlobalContext';
import { View, TouchableOpacity, Text } from 'react-native';
import { LogOut } from 'lucide-react-native';

export default function AdminLayout() {
  const { logout } = useGlobal();

  return (
    <Stack>
      <Stack.Screen 
        name="dashboard" 
        options={{
          title: 'Panel de Admin',
          headerStyle: { backgroundColor: '#02050a' },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity onPress={logout} className="p-2">
              <LogOut color="white" size={20} />
            </TouchableOpacity>
          )
        }} 
      />
    </Stack>
  );
}
