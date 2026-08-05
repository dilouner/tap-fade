import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from '@expo-google-fonts/inter';
import { Sora_400Regular, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { ActivityIndicator, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { AuthGate } from './src/modules/auth/AuthGate';
import { AuthProvider } from './src/modules/auth/AuthProvider';
import { colors } from './src/shared/theme';

export default function App() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }));
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

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
