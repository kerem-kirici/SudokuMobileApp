import { EnsurePuzzleCache, GetCurrentPuzzle, GetRandomPuzzle } from '@/api/PuzzleManager';
import { Difficulty, StatisticsManager } from '@/api/StatisticsManager';
import generateSudoku from '@/api/SudokuFetchAPI';
import DifficultySelector from '@/components/DifficultySelector';
import { Sudoku } from '@/types/sudoku';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.8);

  const [previousPuzzleExists, setPreviousPuzzleExists] = useState(false);
  const [previousPuzzleDifficulty, setPreviousPuzzleDifficulty] = useState<Difficulty | null>(null);
  const [previousPuzzleFetched, setPreviousPuzzleFetched] = useState(false);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);

  useEffect(() => {
    if (previousPuzzleFetched) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [previousPuzzleFetched]);

  const fetchPreviousPuzzle: () => Promise<Sudoku | null> = useCallback(async () => {
    try {
      const puzzle = await GetCurrentPuzzle();
      return puzzle || null;
    } catch (error) {
      console.error('Error fetching current puzzle:', error);
      // Don't crash the app if puzzle fetch fails
    }
    return null;
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      const fetchPreviousPuzzleExists = async () => {
        try {
          const puzzle = await GetCurrentPuzzle();
          console.log('Previous puzzle exists:', Boolean(puzzle));
          setPreviousPuzzleExists(Boolean(puzzle));
          setPreviousPuzzleDifficulty(puzzle?.difficulty as Difficulty || null);
        } catch (error) {
          console.error('Error fetching current puzzle:', error);
          // Don't crash the app if puzzle fetch fails
        }
        setPreviousPuzzleFetched(true);
      };

      fetchPreviousPuzzleExists();
    }, [])
  );

  const handleStartGame = () => {
    setShowDifficultySelector(true);
  };

  const checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to test network connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Network connectivity check failed:', error);
      return false;
    }
  };

  const handleDifficultySelect = async (difficulty: Difficulty) => {
    // Check if there's a previous game that will be abandoned
    if (previousPuzzleExists && previousPuzzleDifficulty) {
      // Record the abandoned game with the previous puzzle's difficulty
      await StatisticsManager.recordAbandonedGame(previousPuzzleDifficulty);
    }
    
    // Get a puzzle of the selected difficulty
    let puzzle = await GetRandomPuzzle(difficulty);
    
    if (!puzzle) {
      // Show alert that no puzzle was found for the selected difficulty
      Alert.alert(
        'No Cached Puzzle',
        `There was no ${difficulty} puzzle in the storage, fetching a random puzzle.`,
        [
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
      
      // Check network connectivity before trying to generate a new puzzle
      const isNetworkAvailable = await checkNetworkConnectivity();
      
      if (!isNetworkAvailable) {
        Alert.alert(
          'No Network Connection',
          'There are no puzzles available offline and no network connection to fetch new puzzles. Please check your internet connection and try again.',
          [
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );
        return;
      }
      
      // If network is available, try to generate a new puzzle
      try {
        puzzle = await generateSudoku();
        // Ensure the puzzle cache is maintained
        EnsurePuzzleCache();
      } catch (error) {
        console.error('Failed to generate new puzzle:', error);
        Alert.alert(
          'Error',
          'Failed to fetch a new puzzle. Please check your internet connection and try again.',
          [
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );
        return;
      }
    } else {
      // Ensure puzzle cache is maintained
      EnsurePuzzleCache();
    }
    
    // Navigate to game screen with the selected puzzle
    router.push({
      pathname: '/game', 
      params: {initialSudoku: JSON.stringify(puzzle)}
    });
  };

  const handleRestart = async () => {
    // Navigate to settings screen (you can create this later)
    // router.push('/settings');
    const previousPuzzle = await fetchPreviousPuzzle();
    // Navigate to game screen with the current puzzle
    router.push({
      pathname: '/game', 
      params: {initialSudoku: JSON.stringify(previousPuzzle)}
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        <View style={styles.pageWrapper}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {/* Logo/Icon */}
            <View style={styles.logoContainer}>
              <View style={styles.sudokuGrid}>
                {Array.from({ length: 9 }, (_, i) => (
                  <View key={i} style={styles.gridCell}>
                    <Text style={styles.gridNumber}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9][i]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>SUDOKU</Text>
            <Text style={styles.subtitle}>Welcome back Kerem!
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleStartGame}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={24} color="#fff" />
                <Text style={styles.primaryButtonText}>Start Game</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  !previousPuzzleExists && styles.disabledButton
                ]}
                onPress={handleRestart}
                activeOpacity={0.8}
                disabled={!previousPuzzleExists}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={[
                  styles.secondaryButtonText,
                  !previousPuzzleExists && styles.disabledButtonText
                ]}>Restart</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statsButton}
                onPress={() => router.push('/statistics')}
                activeOpacity={0.8}
              >
                <Ionicons name="stats-chart" size={20} color="#fff" />
                <Text style={styles.statsButtonText}>Statistics</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Made by Kerem Kırıcı</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Difficulty Selector */}
      <DifficultySelector
        visible={showDifficultySelector}
        onClose={() => setShowDifficultySelector(false)}
        onSelectDifficulty={handleDifficultySelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pageWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: Dimensions.get('window').height * 0.05,
  },
  sudokuGrid: {
    width: 120,
    height: 120,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gridCell: {
    width: '33.33%',
    height: '33.33%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridNumber: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Arial',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    fontFamily: 'Arial',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#e94560',
    marginBottom: Dimensions.get('window').height * 0.02,
    fontFamily: 'Arial',
    letterSpacing: 1,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Dimensions.get('window').height * 0.04,
    paddingHorizontal: 20,
    fontFamily: 'Arial',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#e94560',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Arial',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Arial',
  },
  statsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Arial',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: 'Arial',
  },
  disabledButton: {
    opacity: 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  disabledButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
