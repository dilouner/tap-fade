import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from '@expo-google-fonts/inter';
import { Sora_400Regular, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { ActivityIndicator, View } from 'react-native';

import { AppShell } from './src/shell/AppShell';
import { colors } from './src/shared/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    Sora_400Regular,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: colors.surface,
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    );
  }

  return <AppShell />;
}
