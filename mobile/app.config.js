module.exports = () => {
  const environment = process.env.TAPFADE_ENV || 'staging';
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (environment === 'production' && (!projectId || projectId === 'tapfade-dev')) {
    throw new Error('Una compilación production debe usar un proyecto Firebase distinto de tapfade-dev.');
  }

  return {
    name: environment === 'development' ? 'TapFade Dev' : 'TapFade',
    slug: 'tapfade',
    version: '1.1.0',
    orientation: 'portrait',
    platforms: ['ios', 'android'],
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: { bundleIdentifier: environment === 'development' ? 'com.tapfade.mobile.dev' : 'com.tapfade.mobile', supportsTablet: true },
    android: {
      package: environment === 'development' ? 'com.tapfade.mobile.dev' : 'com.tapfade.mobile',
      versionCode: 2,
      adaptiveIcon: {
        backgroundColor: '#11151C', foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png', monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: { favicon: './assets/favicon.png' },
    plugins: [
      '@react-native-google-signin/google-signin', 'expo-asset', 'expo-font', 'expo-image', '@react-native-community/datetimepicker',
      ['expo-location', { locationWhenInUsePermission: 'TapFade usa tu ubicación solo mientras exploras para ordenar barberías cercanas.' }],
      ['expo-notifications', { defaultChannel: 'appointments' }],
    ],
    extra: { environment },
  };
};
