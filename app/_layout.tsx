import { EnsurePuzzleCache } from '@/api/PuzzleManager';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import 'react-native-reanimated';

export default function RootLayout() {
  // Initialize puzzle cache on app startup
  useEffect(() => {
    const initializePuzzleCache = async () => {
      try {
        await EnsurePuzzleCache();
      } catch (error) {
        console.error('Failed to initialize puzzle cache:', error);
        // Don't crash the app if puzzle cache fails
      }
    };

    // Run in background without blocking the UI
    initializePuzzleCache();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="game" options={{ headerShown: false }} />
      <Stack.Screen name="statistics" options={{ headerShown: false }} />
    </Stack>
  );
}
