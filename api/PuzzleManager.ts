import { Sudoku } from '@/types/sudoku';
import AsyncStorage from '@react-native-async-storage/async-storage';
import generateSudoku from './SudokuFetchAPI';

const ALL_PUZZLES_STORAGE_KEY = 'all_sudoku_puzzles';
const CURRENT_PUZZLE_STORAGE_KEY = 'current_sudoku_puzzle';
const MIN_PUZZLES = 15;

export async function EnsurePuzzleCache() {
  try {
    // Get existing puzzles from storage
    const storedPuzzlesJson = await AsyncStorage.getItem(ALL_PUZZLES_STORAGE_KEY);
    const existingPuzzles: Sudoku[] = storedPuzzlesJson 
      ? JSON.parse(storedPuzzlesJson) 
      : [];

    // Filter to only keep hard difficulty puzzles
    const hardPuzzles = existingPuzzles.filter(puzzle => puzzle.difficulty === 'Hard');
    
    // Check if we need more puzzles
    if (hardPuzzles.length < MIN_PUZZLES) {
      const puzzlesNeeded = MIN_PUZZLES - hardPuzzles.length;
      let puzzlesFound = 0;
      console.log(`Fetching ${puzzlesNeeded} new hard puzzles...`);
      
      const newPuzzles: Sudoku[] = [];
      
      // Fetch new puzzles
      while (puzzlesFound < puzzlesNeeded) {
        try {
          const puzzleData = await generateSudoku();
          
          // Only store hard difficulty puzzles
          if (puzzleData.difficulty === 'Hard') {
            newPuzzles.push(puzzleData);
            puzzlesFound++;
              
            // Combine existing and new puzzles
            const allPuzzles = [...hardPuzzles, ...newPuzzles];
            
            // Store updated puzzle cache
            await AsyncStorage.setItem(ALL_PUZZLES_STORAGE_KEY, JSON.stringify(allPuzzles));
          }
        
        } catch (error) {
          console.error(`Failed to fetch puzzle: `, error);
        }
        
        // Add small delay between requests to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Combine existing and new puzzles
      const allPuzzles = [...hardPuzzles, ...newPuzzles];
      
      // Store updated puzzle cache
      await AsyncStorage.setItem(ALL_PUZZLES_STORAGE_KEY, JSON.stringify(allPuzzles));
      
      console.log(`Puzzle cache updated: ${allPuzzles.length} hard puzzles available`);
    } else {
      console.log(`Puzzle cache sufficient: ${hardPuzzles.length} puzzles available`);
    }
    
    return true;
  } catch (error) {
    console.error('Error managing puzzle cache:', error);
    return false;
  }
}

export async function GetRandomPuzzle(): Promise<Sudoku | null> {
  try {
    const storedPuzzlesJson = await AsyncStorage.getItem(ALL_PUZZLES_STORAGE_KEY);
    const puzzles: Sudoku[] = storedPuzzlesJson 
      ? JSON.parse(storedPuzzlesJson) 
      : [];
    
    if (puzzles.length === 0) {
      return null;
    }
    
    // Return a random puzzle and remove it from cache
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    const selectedPuzzle = puzzles[randomIndex];
    
    // Remove the selected puzzle from the array
    puzzles.splice(randomIndex, 1);
    
    // Update the cache with the remaining puzzles
    await AsyncStorage.setItem(ALL_PUZZLES_STORAGE_KEY, JSON.stringify(puzzles));
    await AsyncStorage.setItem(CURRENT_PUZZLE_STORAGE_KEY, JSON.stringify(selectedPuzzle));
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