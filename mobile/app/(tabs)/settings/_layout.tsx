import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../../constants/Colors';

export default function SettingsLayout() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
