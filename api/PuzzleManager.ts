import { Sudoku } from '@/types/sudoku';
import AsyncStorage from '@react-native-async-storage/async-storage';
import generateSudoku from './SudokuFetchAPI';

const ALL_PUZZLES_STORAGE_KEY = 'all_sudoku_puzzles';
const CURRENT_PUZZLE_STORAGE_KEY = 'current_sudoku_puzzle';
const MIN_PUZZLES_PER_DIFFICULTY = 20;

interface PuzzleCache {
  hard: Sudoku[];
  medium: Sudoku[];
  easy: Sudoku[];
}

export async function EnsurePuzzleCache() {
  try {
    // Get existing puzzles from storage
    const storedPuzzlesJson = await AsyncStorage.getItem(ALL_PUZZLES_STORAGE_KEY);
    let existingPuzzleCache: PuzzleCache;
    
    if (storedPuzzlesJson) {
      const parsed = JSON.parse(storedPuzzlesJson);
      // Ensure all difficulty arrays exist
      existingPuzzleCache = {
        hard: parsed.hard || [],
        medium: parsed.medium || [],
        easy: parsed.easy || [],
      };
    } else {
      existingPuzzleCache = { hard: [], medium: [], easy: [] };
    }

    console.log('Current cache state:', {
      hard: existingPuzzleCache.hard.length,
      medium: existingPuzzleCache.medium.length,
      easy: existingPuzzleCache.easy.length,
    });
    
    // Check if we need more puzzles for each difficulty
    const difficulties = ['hard', 'medium', 'easy'] as const;
    let totalPuzzlesNeeded = 0;
    
    difficulties.forEach(difficulty => {
      const currentCount = existingPuzzleCache[difficulty].length;
      if (currentCount < MIN_PUZZLES_PER_DIFFICULTY) {
        totalPuzzlesNeeded += MIN_PUZZLES_PER_DIFFICULTY - currentCount;
      }
    });
    
    if (totalPuzzlesNeeded > 0) {
      console.log(`Fetching ${totalPuzzlesNeeded} new puzzles across all difficulties...`);
      
      // Fetch new puzzles
      while (totalPuzzlesNeeded > 0) {
        try {
          const puzzleData = await generateSudoku();
          const difficulty = puzzleData.difficulty.toLowerCase() as keyof PuzzleCache;
              
          // Check if we need more puzzles of this difficulty
          if (existingPuzzleCache[difficulty].length < MIN_PUZZLES_PER_DIFFICULTY) {
            existingPuzzleCache[difficulty].push(puzzleData);
            
            // Store updated puzzle cache after each successful addition
            await AsyncStorage.setItem(ALL_PUZZLES_STORAGE_KEY, JSON.stringify(existingPuzzleCache));
            console.log(`Added ${difficulty} puzzle. Total ${difficulty}: ${existingPuzzleCache[difficulty].length}`);
          }
        
        } catch (error) {
          console.error(`Failed to fetch puzzle: `, error);
        }
        
        // Recalculate totalPuzzlesNeeded from current storage state
        const currentStoredPuzzlesJson = await AsyncStorage.getItem(ALL_PUZZLES_STORAGE_KEY);
        if (currentStoredPuzzlesJson) {
          const currentPuzzleCache = JSON.parse(currentStoredPuzzlesJson);
          // Ensure all difficulty arrays exist
          const updatedPuzzleCache = {
            hard: currentPuzzleCache.hard || [],
            medium: currentPuzzleCache.medium || [],
            easy: currentPuzzleCache.easy || [],
          };
          
          // Update local cache reference to match storage
          existingPuzzleCache = updatedPuzzleCache;
          
          // Recalculate total puzzles needed
          totalPuzzlesNeeded = 0;
          difficulties.forEach(difficulty => {
            const currentCount = existingPuzzleCache[difficulty].length;
            if (currentCount < MIN_PUZZLES_PER_DIFFICULTY) {
              totalPuzzlesNeeded += MIN_PUZZLES_PER_DIFFICULTY - currentCount;
            }
          });
        }
        
        // Add small delay between requests to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`Puzzle cache updated: ${existingPuzzleCache.hard.length} hard, ${existingPuzzleCache.medium.length} medium, ${existingPuzzleCache.easy.length} easy puzzles available`);
    } else {
      console.log(`Puzzle cache sufficient: ${existingPuzzleCache.hard.length} hard, ${existingPuzzleCache.medium.length} medium, ${existingPuzzleCache.easy.length} easy puzzles available`);
    }
    
    return true;
  } catch (error) {
    console.error('Error managing puzzle cache:', error);
    return false;
  }
}

export async function GetRandomPuzzle(difficulty?: 'Hard' | 'Medium' | 'Easy'): Promise<Sudoku | null> {
  try {
    const storedPuzzlesJson = await AsyncStorage.getItem(ALL_PUZZLES_STORAGE_KEY);
    let puzzleCache: PuzzleCache;
    
    if (storedPuzzlesJson) {
      const parsed = JSON.parse(storedPuzzlesJson);
      // Ensure all difficulty arrays exist
      puzzleCache = {
        hard: parsed.hard || [],
        medium: parsed.medium || [],
        easy: parsed.easy || [],
      };
    } else {
      puzzleCache = { hard: [], medium: [], easy: [] };
    }
    
    let availablePuzzles: Sudoku[] = [];
    
    if (difficulty) {
      // Get puzzles of specific difficulty
      const difficultyKey = difficulty.toLowerCase() as keyof PuzzleCache;
      availablePuzzles = puzzleCache[difficultyKey];
    } else {
      // Get puzzles from all difficulties
      availablePuzzles = [
        ...puzzleCache.hard,
        ...puzzleCache.medium,
        ...puzzleCache.easy
      ];
    }
    
    if (availablePuzzles.length === 0) {
      console.log(`No puzzles available for difficulty: ${difficulty || 'any'}`);
      return null;
    }
    
    // Return a random puzzle and remove it from cache
    const randomIndex = Math.floor(Math.random() * availablePuzzles.length);
    const selectedPuzzle = availablePuzzles[randomIndex];
    
    // Remove the selected puzzle from the appropriate difficulty array
    const difficultyKey = selectedPuzzle.difficulty.toLowerCase() as keyof PuzzleCache;
    const puzzleIndex = puzzleCache[difficultyKey].findIndex(p => p.id === selectedPuzzle.id);
    if (puzzleIndex !== -1) {
      puzzleCache[difficultyKey].splice(puzzleIndex, 1);
    }
    
    // Update the cache with the remaining puzzles
    await AsyncStorage.setItem(ALL_PUZZLES_STORAGE_KEY, JSON.stringify(puzzleCache));
    await AsyncStorage.setItem(CURRENT_PUZZLE_STORAGE_KEY, JSON.stringify(selectedPuzzle));
    
    console.log(`Selected puzzle: ${selectedPuzzle.difficulty}, Remaining: ${puzzleCache.hard.length}H, ${puzzleCache.medium.length}M, ${puzzleCache.easy.length}E`);
    return selectedPuzzle;
  } catch (error) {
    console.error('Error getting random puzzle:', error);
    return null;
  }
}

export async function GetCurrentPuzzle(): Promise<Sudoku | null> {
  try {
    const storedPuzzleJson = await AsyncStorage.getItem(CURRENT_PUZZLE_STORAGE_KEY);
    return storedPuzzleJson ? JSON.parse(storedPuzzleJson) : null;
  } catch (error) {
    console.error('Error getting current puzzle:', error);
    return null;
  }
}

export async function SetCurrentPuzzle(puzzle: Sudoku) {
  try {
    await AsyncStorage.setItem(CURRENT_PUZZLE_STORAGE_KEY, JSON.stringify(puzzle));
    console.log('Current puzzle saved successfully');
  } catch (error) {
    console.error('Error setting current puzzle:', error);
  }
}

export async function ClearCurrentPuzzleCache() {
  try {
    await AsyncStorage.removeItem(CURRENT_PUZZLE_STORAGE_KEY);
    console.log('Puzzle cache cleared');
  } catch (error) {
    console.error('Error clearing puzzle cache:', error);
  }
} 

export async function ClearStoredPuzzleCache() {
  try {
    await AsyncStorage.removeItem(ALL_PUZZLES_STORAGE_KEY);
    console.log('All puzzle cache cleared');
  } catch (error) {
    console.error('Error clearing all puzzle cache:', error);
  }
}