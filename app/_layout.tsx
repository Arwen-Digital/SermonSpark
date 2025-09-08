import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, View } from 'react-native';
import 'react-native-reanimated';

import { theme } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { initDb } from '@/services/db';
import authService from '@/services/supabaseAuthService';

import { seriesRepository, sermonRepository } from '@/services/repositories';


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = React.useState(false);
  const [isAuthed, setIsAuthed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const test = async () => {
      try {
        const s = await seriesRepository.create({ title: 'Offline Test Series', status: 'planning', tags: ['offline'] });
        console.log('Created series', s.id);
        const seriesList = await seriesRepository.list();
        console.log('Series count (local):', seriesList.length);
        const s2 = await seriesRepository.update(s.id, { status: 'active' });
        console.log('Updated series status:', s2.status);
        const sermon = await sermonRepository.create({ title: 'Offline Test Sermon', status: 'draft', visibility: 'private', seriesId: s.id });
        console.log('Created sermon', sermon.id);
        const sermons = await sermonRepository.list();
        console.log('Sermons count (local):', sermons.length);
        await seriesRepository.remove(s.id);
        console.log('Series soft-deleted');
      } catch (e) {
        console.warn('Offline repo test failed', e);
      }
    };
    // Uncomment to run once:
    test();
}, []);

  React.useEffect(() => {
    let mounted = true;
    const check = async () => {
      // Initialize local DB (native only; web no-op). Safe to call unconditionally.
      try { await initDb(); console.log('SQLite DB initialized'); } catch (e) { console.warn('DB init failed', e); }
      const ok = await authService.isAuthenticated();
      if (!mounted) return;
      setIsAuthed(ok);
      setAuthChecked(true);
      const onAuthRoute = pathname === '/auth';
      if (!ok && !onAuthRoute) {
        router.replace('/auth');
      } else if (ok && onAuthRoute) {
        router.replace('/(tabs)/home');
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (!loaded || !authChecked) {
    // Async font loading only occurs in development.
    return null;
  }

  const content = (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="sermon/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="sermon/edit/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="sermon/create" options={{ headerShown: false }} />
      <Stack.Screen name="community/[postId]" options={{ headerShown: false }} />
      <Stack.Screen name="community/create" options={{ headerShown: false }} />
      <Stack.Screen name="research/sermon-title-generator" options={{ headerShown: false }} />
      <Stack.Screen
        name="series/index"
        options={{
          headerShown: false,
          // When we call router.replace from My Series back button,
          // animate like a back/pop (slide to the right on iOS)
          animationTypeForReplace: 'pop',
        }}
      />
      <Stack.Screen name="series/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="series/create" options={{ headerShown: false }} />
      <Stack.Screen name="series/[id]/edit" options={{ headerShown: false }} />
      <Stack.Screen name="pulpit/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={Platform.select({
        web: { 
          flex: 1, 
          backgroundColor: theme.colors.background 
        },
        default: { flex: 1 }
      })}>
        {Platform.OS === 'web' ? (
          <View style={{ flex: 1, maxWidth: 1200, alignSelf: 'center', width: '100%' }}>
            {content}
          </View>
        ) : (
          content
        )}
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
