import { ClearCurrentPuzzleCache, SetCurrentPuzzle } from '@/api/PuzzleManager';
import { Difficulty, StatisticsManager } from '@/api/StatisticsManager';
import { MoveHistory, Sudoku } from '@/types/sudoku';
import { Colors } from '@/types/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  BackHandler,
  Dimensions,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import NumberPad from '../components/NumberPad';
import SudokuGrid from '../components/SudokuGrid';
import { CompletionModal, GameOverModal, PauseModal } from '../components/modals';

// Responsive font scaling helper (must be outside the component for use in StyleSheet)
const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const scale = (size: number) => (windowWidth / 450) * size;

// Action types for the queue
type ActionType = 
  | { type: 'CELL_PRESS'; payload: { row: number; col: number } }
  | { type: 'NUMBER_PRESS'; payload: { number: number } }
  | { type: 'UNDO' }
  | { type: 'TOGGLE_NOTES' }
  | { type: 'CLUE' };

export default function GameScreen() {
  const router = useRouter();
  const { initialSudoku } = useLocalSearchParams();
  const initialSudokuObj = JSON.parse(initialSudoku as string) as Sudoku;
  const [sudoku, setSudoku] = useState(initialSudokuObj);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [currentMoveHistory, setCurrentMoveHistory] = useState<MoveHistory[]>(sudoku.puzzleHistory || []);
  const [elapsedTime, setElapsedTime] = useState(initialSudokuObj.elapsedTime || 0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [mistakes, setMistakes] = useState(initialSudokuObj.mistakes || 0);
  const timerRef = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isClueAllNotesGiven, setIsClueAllNotesGiven] = useState(false);

  // --- Move numberCounter and initialNumberCounter here ---
  const initialNumberCounter = useMemo(() => {
    const flatPuzzle = initialSudokuObj.puzzle.flat();
    return {
      [1]: flatPuzzle.filter(num => num === 1).length,
      [2]: flatPuzzle.filter(num => num === 2).length,
      [3]: flatPuzzle.filter(num => num === 3).length,
      [4]: flatPuzzle.filter(num => num === 4).length,
      [5]: flatPuzzle.filter(num => num === 5).length,
      [6]: flatPuzzle.filter(num => num === 6).length,
      [7]: flatPuzzle.filter(num => num === 7).length,
      [8]: flatPuzzle.filter(num => num === 8).length,
      [9]: flatPuzzle.filter(num => num === 9).length,
    };
  }, [initialSudokuObj.puzzle]);
  const [numberCounter, setNumberCounter] = useState<{ [key: number]: number }>(initialNumberCounter);

  // Action queue system
  const actionQueue = useRef<ActionType[]>([]);
  const isProcessingQueue = useRef(false);

  // Process action queue
  const processActionQueue = useCallback(async () => {
    if (isProcessingQueue.current || actionQueue.current.length === 0) {
      return;
    }

    isProcessingQueue.current = true;

    // --- TEMP VARIABLES ---
    let tempSudoku = { ...sudoku, puzzle: sudoku.puzzle.map(row => [...row]) };
    let tempSelectedCell: [number, number] | null = selectedCell ? [selectedCell[0], selectedCell[1]] : null;
    let tempMoveHistory = [...currentMoveHistory];
    let tempMistakes = mistakes;
    let tempNumberCounter = { ...numberCounter };
    let moveHistoryToAppend: MoveHistory[] = [];
    let tempIsNotesMode = isNotesMode;
    let tempIsClueAllNotesGiven = isClueAllNotesGiven;

    // Helper for clearNotesOnOverlap (uses tempSudoku)
    const tempClearNotesOnOverlap = (puzzle: Array<Array<number | Array<number>>>, row: number, col: number, number: number) => {
      // Clear notes for this number in the same row
      for (let c = 0; c < 9; c++) {
        if (c !== col) {
          const cellValue = puzzle[row][c];
          if (Array.isArray(cellValue) && cellValue.includes(number)) {
            puzzle[row][c] = cellValue.filter((n: number) => n !== number);
          }
        }
      }
      // Clear notes for this number in the same column
      for (let r = 0; r < 9; r++) {
        if (r !== row) {
          const cellValue = puzzle[r][col];
          if (Array.isArray(cellValue) && cellValue.includes(number)) {
            puzzle[r][col] = cellValue.filter((n: number) => n !== number);
          }
        }
      }
      // Clear notes for this number in the same 3x3 block
      const blockRow = Math.floor(row / 3) * 3;
      const blockCol = Math.floor(col / 3) * 3;
      for (let r = blockRow; r < blockRow + 3; r++) {
        for (let c = blockCol; c < blockCol + 3; c++) {
          if (r !== row || c !== col) {
            const cellValue = puzzle[r][c];
            if (Array.isArray(cellValue) && cellValue.includes(number)) {
              puzzle[r][c] = cellValue.filter((n: number) => n !== number);
            }
          }
        }
      }
    };

    const tempGiveAllNotesClueOptimized = (puzzle: Array<Array<number | Array<number>>>) => {
      // Precompute used numbers for each row, column, and block
      const n = 9;
      const usedInRow: Set<number>[] = Array.from({ length: n }, () => new Set<number>());
      const usedInCol: Set<number>[] = Array.from({ length: n }, () => new Set<number>());
      const usedInBlock: Set<number>[][] = Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => new Set<number>())
      );

      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          const cellValue = puzzle[row][col];
          if (typeof cellValue === 'number' && cellValue !== 0) {
            usedInRow[row].add(cellValue);
            usedInCol[col].add(cellValue);
            usedInBlock[Math.floor(row / 3)][Math.floor(col / 3)].add(cellValue);
          }
        }
      }

      // Now fill possible notes for each empty cell
      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          if (puzzle[row][col] === 0 || Array.isArray(puzzle[row][col])) {
            const possible = [];
            for (let num = 1; num <= 9; num++) {
              if (
                !usedInRow[row].has(num) &&
                !usedInCol[col].has(num) &&
                !usedInBlock[Math.floor(row / 3)][Math.floor(col / 3)].has(num)
              ) {
                possible.push(num);
              }
            }
            puzzle[row][col] = possible;
          }
        }
      }
    };
    // Add helper functions for each action type above processActionQueue
    // --- Action Handlers for Queue ---
    function handleCellPressActionQueue(row: number, col: number, tempSelectedCell: [number, number] | null) {
      return [row, col] as [number, number];
    }

    function handleNumberPressActionQueue(
      actionNumber: number,
      tempSelectedCell: [number, number] | null,
      tempSudoku: Sudoku,
      tempIsNotesMode: boolean,
      tempNumberCounter: { [key: number]: number },
      tempMistakes: number,
      moveHistoryToAppend: MoveHistory[]
    ) {
      if (
        tempSelectedCell &&
        tempSudoku.initialPuzzle[tempSelectedCell[0]][tempSelectedCell[1]] === 0
      ) {
        // Add to move history
        const newMove: MoveHistory = {
          previousPuzzle: tempSudoku.puzzle.map(row => [...row]),
          previousSelectedCell: tempSelectedCell ? [tempSelectedCell[0], tempSelectedCell[1]] : [0, 0],
        };
        moveHistoryToAppend.push(newMove);

        const [row, col] = tempSelectedCell;
        const currentPuzzle = tempSudoku.puzzle;

        if (tempIsNotesMode) {
          // Notes mode: add number to array or create new array
          const currentCellValue = currentPuzzle[row][col];
          if (Array.isArray(currentCellValue)) {
            if (currentCellValue.includes(actionNumber)) {
              currentPuzzle[row][col] = currentCellValue.filter((n: number) => n !== actionNumber);
            } else {
              currentPuzzle[row][col] = [...currentCellValue, actionNumber];
            }
          } else {
            currentPuzzle[row][col] = [actionNumber];
          }
        } else if (currentPuzzle[row][col] === actionNumber) {
          currentPuzzle[row][col] = 0;
          tempNumberCounter[actionNumber] = (tempNumberCounter[actionNumber] || 0) - 1;
        } else {
          currentPuzzle[row][col] = actionNumber;
          if (actionNumber !== tempSudoku.solution[row][col]) {
            tempMistakes += 1;
          } else {
            tempNumberCounter[actionNumber] = (tempNumberCounter[actionNumber] || 0) + 1;
          }
          tempClearNotesOnOverlap(currentPuzzle, row, col, actionNumber);
        }
      }
      return { tempNumberCounter, tempMistakes };
    }

    function handleUndoActionQueue(
      tempMoveHistory: MoveHistory[],
      moveHistoryToAppend: MoveHistory[],
      tempSudoku: Sudoku
    ) {
      let tempSelectedCell: [number, number] | null = null;
      if (tempMoveHistory.length > 0 || moveHistoryToAppend.length > 0) {
        // Combine all move history for undo
        const allHistory = [...tempMoveHistory, ...moveHistoryToAppend];
        const lastMove = allHistory[allHistory.length - 1];
        if (lastMove) {
          tempSudoku.puzzle = lastMove.previousPuzzle.map(row => [...row]);
          tempSelectedCell = lastMove.previousSelectedCell ? [lastMove.previousSelectedCell[0], lastMove.previousSelectedCell[1]] : null;
          // Remove last move from move history
          if (moveHistoryToAppend.length > 0) {
            moveHistoryToAppend.pop();
          } else {
            tempMoveHistory.pop();
          }
        }
      }
      return tempSelectedCell;
    }

    function handleToggleNotesActionQueue(tempIsNotesMode: boolean) {
      return !tempIsNotesMode;
    }

    function handleClueActionQueue(
      tempSudoku: Sudoku,
      tempSelectedCell: [number, number] | null,
      moveHistoryToAppend: MoveHistory[],
      tempNumberCounter: { [key: number]: number },
      tempIsClueAllNotesGiven: boolean
    ) {
      // If all notes are clued, do nothing
      if (tempIsClueAllNotesGiven) {
        // Find all empty cells (cells that are 0 in initial puzzle and still empty in current puzzle)
        const emptyCells: [number, number][] = [];
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (
              tempSudoku.initialPuzzle[row][col] === 0 &&
              (tempSudoku.puzzle[row][col] === 0 ||
                tempSudoku.puzzle[row][col] !== tempSudoku.solution[row][col] ||
                Array.isArray(tempSudoku.puzzle[row][col]))
            ) {
              emptyCells.push([row, col]);
            }
          }
        }
        let newSelectedCell = tempSelectedCell;
        if (emptyCells.length > 0) {
          const randomIndex = Math.floor(Math.random() * emptyCells.length);
          const [row, col] = emptyCells[randomIndex];
          const correctNumber = tempSudoku.solution[row][col];
          const newMove: MoveHistory = {
            previousPuzzle: tempSudoku.puzzle.map(row => [...row]),
            previousSelectedCell: tempSelectedCell ? [tempSelectedCell[0], tempSelectedCell[1]] : [0, 0],
          };
          moveHistoryToAppend.push(newMove);
          tempSudoku.puzzle[row][col] = correctNumber;
          tempNumberCounter[correctNumber] = (tempNumberCounter[correctNumber] || 0) + 1;
          tempClearNotesOnOverlap(tempSudoku.puzzle, row, col, correctNumber);
          newSelectedCell = [row, col];
        }
        return {newSelectedCell, newIsClueAllNotesGiven: tempIsClueAllNotesGiven};
      } else {
        tempGiveAllNotesClueOptimized(tempSudoku.puzzle);
        return {newSelectedCell: null, newIsClueAllNotesGiven: true};
      }
    }

    while (actionQueue.current.length > 0) {
      const action = actionQueue.current.shift();
      if (!action) continue;

      try {
        switch (action.type) {
          case 'CELL_PRESS': {
            tempSelectedCell = handleCellPressActionQueue(action.payload.row, action.payload.col, tempSelectedCell);
            break;
          }
          case 'NUMBER_PRESS': {
            const result = handleNumberPressActionQueue(
              action.payload.number,
              tempSelectedCell,
              tempSudoku,
              tempIsNotesMode,
              tempNumberCounter,
              tempMistakes,
              moveHistoryToAppend
            );
            tempNumberCounter = result.tempNumberCounter;
            tempMistakes = result.tempMistakes;
            break;
          }
          case 'UNDO': {
            const newSelectedCell = handleUndoActionQueue(
              tempMoveHistory,
              moveHistoryToAppend,
              tempSudoku
            );
            tempSelectedCell = newSelectedCell !== null ? newSelectedCell : tempSelectedCell;
            break;
          }
          case 'TOGGLE_NOTES': {
            tempIsNotesMode = handleToggleNotesActionQueue(tempIsNotesMode);
            break;
          }
          case 'CLUE': {
            const {newSelectedCell, newIsClueAllNotesGiven} = handleClueActionQueue(
              tempSudoku,
              tempSelectedCell,
              moveHistoryToAppend,
              tempNumberCounter,
              tempIsClueAllNotesGiven
            );
            tempSelectedCell = newSelectedCell ? newSelectedCell : tempSelectedCell;
            tempIsClueAllNotesGiven = newIsClueAllNotesGiven;
            break;
          }
        }
      } catch (error) {
        console.error('Error processing action:', action, error);
      }
    }

    // --- BATCH STATE UPDATES ---
    setSudoku(tempSudoku);
    setSelectedCell(tempSelectedCell as [number, number] | null);
    setCurrentMoveHistory([...tempMoveHistory, ...moveHistoryToAppend]);
    setMistakes(tempMistakes);
    setNumberCounter(tempNumberCounter);
    setIsNotesMode(tempIsNotesMode);
    setIsClueAllNotesGiven(tempIsClueAllNotesGiven);

    isProcessingQueue.current = false;
  }, [sudoku, selectedCell, currentMoveHistory, mistakes, numberCounter, isNotesMode, isClueAllNotesGiven]);

  // Add action to queue and trigger processing
  const queueAction = useCallback((action: ActionType) => {
    actionQueue.current.push(action);
    
    // Trigger processing on next frame to ensure UI updates
    requestAnimationFrame(() => {
      processActionQueue();
    });
  }, [processActionQueue]);

  const sudokuRef = useRef(sudoku);
  const isCompleteRef = useRef(isComplete);
  const isGameOverRef = useRef(isGameOver);
  const elapsedTimeRef = useRef(elapsedTime);
  const mistakesRef = useRef(mistakes);

  // Save puzzle when component unmounts or user navigates away
  const savePuzzleOnExit = useCallback(async () => {
    try {
      if (sudokuRef.current && !isCompleteRef.current && !isGameOverRef.current) {
        await SetCurrentPuzzle({ ...sudokuRef.current, elapsedTime: elapsedTimeRef.current, mistakes: mistakesRef.current });
      } else if (isCompleteRef.current || isGameOverRef.current) {
        await ClearCurrentPuzzleCache();
      }
    } catch (error) {
      console.error('Error saving puzzle on exit:', error);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Updated handler functions that use the action queue
  const handleCellPress = useCallback((row: number, col: number) => {
    queueAction({ type: 'CELL_PRESS', payload: { row, col } });
  }, [queueAction]);

  const handleNumberPress = useCallback((number: number) => {
    queueAction({ type: 'NUMBER_PRESS', payload: { number } });
  }, [queueAction]);

  const handleUndo = useCallback(() => {
    queueAction({ type: 'UNDO' });
  }, [queueAction]);

  const toggleNotesMode = useCallback(() => {
    queueAction({ type: 'TOGGLE_NOTES' });
  }, [queueAction]);

  const handleClue = useCallback(() => {
    queueAction({ type: 'CLUE' });
  }, [queueAction]);

  const isPuzzleComplete = (currentPuzzle: Array<Array<number | Array<number>>>) => {
    // Check if all cells are filled
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cellValue = currentPuzzle[row][col];
        if (typeof cellValue !== 'number' || cellValue !== sudoku.solution[row][col]) 
          return false;
      }
    }
    return true;
  };

  const restartGame = () => {
    setSudoku(JSON.parse(initialSudoku as string) as Sudoku);
    setSelectedCell(null);
    setIsComplete(false);
    setIsGameOver(false);
    setCurrentMoveHistory([]);
    setIsNotesMode(false);
    setElapsedTime(0);
    setIsTimerRunning(true);
    setMistakes(0);
    setNumberCounter(initialNumberCounter);
  };

  const handleBackToMenu = async () => {
    try {
      if (sudoku && !isComplete && !isGameOver) {
        await SetCurrentPuzzle({ ...sudoku, elapsedTime, mistakes });
        console.log('Puzzle saved before navigation');
      } else if (isComplete || isGameOver) {
        await ClearCurrentPuzzleCache();
        console.log('Puzzle cleared before navigation');
      }
    } catch (error) {
      console.error('Error saving puzzle:', error);
    }
    router.back();
  };

  const handleBackgroundPress = useCallback(() => {
    // Unselect cell when touching outside grid and number pad
    setSelectedCell(null);
  }, []);

  const handlePauseGame = useCallback(() => {
    setIsPaused(true);
    setIsTimerRunning(false);
  }, []);

  const handleResumeGame = useCallback(() => {
    setIsPaused(false);
    setIsTimerRunning(true);
  }, []);

  useEffect(() => { sudokuRef.current = sudoku; }, [sudoku]);
  useEffect(() => { isCompleteRef.current = isComplete; }, [isComplete]);
  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);
  useEffect(() => { elapsedTimeRef.current = elapsedTime; }, [elapsedTime]);
  useEffect(() => { mistakesRef.current = mistakes; }, [mistakes]);

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      savePuzzleOnExit();
      return false; // Let the default back behavior continue
    });

    // Cleanup function runs when component unmounts
    return () => {
      savePuzzleOnExit();
      backHandler.remove();
    };
  }, [savePuzzleOnExit]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && !isComplete && !isPaused && !isGameOver) {
      const updateTimer = () => {
        setElapsedTime(prev => prev + 1);
      };
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsTimerRunning(false);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, isComplete, isPaused, isGameOver]);

  // Add app state change listener
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState.match(/inactive|background/)) {
        // App is going to background - auto pause
        setIsPaused(true);
        setIsTimerRunning(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  // Check for puzzle completion
  useEffect(() => {
    if (!isComplete && isPuzzleComplete(sudoku.puzzle)) {
      setIsComplete(true);
      // Record completed game statistics
      StatisticsManager.recordCompletedGame(elapsedTime, sudoku.difficulty as Difficulty);
    }
  }, [sudoku.puzzle, isComplete, elapsedTime]);

  // Check for game over (3 mistakes)
  useEffect(() => {
    if (mistakes >= 3 && !isGameOver) {
      setIsGameOver(true);
      
      // Record lost game statistics
      StatisticsManager.recordLostGame(elapsedTime, sudoku.difficulty as Difficulty);
    }
  }, [mistakes, isGameOver, elapsedTime]);

  // Add useEffect for pause/resume animations
  useEffect(() => {
    if (!isPaused && !isGameOver) {
      // Reset and restart animations when resuming
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }, 50);
    }
  }, [isPaused, isGameOver]); // Run when pause state changes

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />
      
      <LinearGradient
        colors={[Colors.background.primary, Colors.background.secondary, Colors.background.tertiary]}
        style={styles.gradient}
      >
      
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToMenu}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.icon.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sudoku Game</Text>
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={handlePauseGame}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isPaused ? "play" : "pause"} 
                size={24} 
                color={Colors.icon.primary} 
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.touchableBackground}
            activeOpacity={1}
            onPress={handleBackgroundPress}
            delayPressIn={0}
            delayLongPress={0}
          >
            {/* Sudoku Board with Timer */}
            <View style={styles.boardContainer}>
              {/* Timer positioned above top right */}
              <View style={styles.infoContainer}>
                <View style={styles.difficultySection}>
                  <Ionicons name="beer" size={18} color={Colors.icon.secondary} />
                  <Text style={styles.difficultyText}>{sudoku.difficulty.charAt(0).toUpperCase() + sudoku.difficulty.slice(1)}</Text>
                </View>
                <View style={styles.mistakesSection}>
                  <Ionicons name="close-circle" size={18} color={Colors.icon.error} />
                  <Text style={styles.mistakesText}>{mistakes}/3</Text>
                </View>
                <View style={styles.timerSection}>
                  <Ionicons name="time-outline" size={18} color={Colors.icon.secondary} />
                  <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
                </View>
              </View>
              <SudokuGrid
                sudoku={sudoku}
                selectedCell={selectedCell}
                onCellPress={handleCellPress}
              />
             
              {/* Control Row */}
              <View style={styles.controlRow}>
                <TouchableOpacity
                  style={[styles.controlButton, currentMoveHistory.length === 0 && styles.disabledButton]}
                  onPress={handleUndo}
                  disabled={currentMoveHistory.length === 0}
                  activeOpacity={0.7}
                  delayPressIn={0}
                  delayLongPress={0}
                >
                  <Ionicons name="arrow-undo" size={22} color={Colors.icon.primary} />
                  <Text style={styles.controlButtonText}>Undo</Text>
                </TouchableOpacity>

                <View style={styles.notesToggle}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Switch
                    value={isNotesMode}
                    onValueChange={toggleNotesMode}
                    trackColor={{ false: Colors.switch.track.false, true: Colors.switch.track.true }}
                    thumbColor={isNotesMode ? Colors.switch.thumb.true : Colors.switch.thumb.false}
                    style={styles.notesSwitch}
                  />
                </View>
                
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleClue}
                  activeOpacity={0.7}
                  delayPressIn={0}
                  delayLongPress={0}
                >
                  <Ionicons name="bulb-outline" size={22} color={Colors.icon.primary} />
                  <Text style={styles.controlButtonText}>Clue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>

          {/* Number Pad */}
          <View style={styles.numberPadContainer}>
            <NumberPad onNumberPress={handleNumberPress} numberCounter={numberCounter} isNotesMode={isNotesMode} />
          </View>

          {/* Pause Modal */}
          <PauseModal
            visible={isPaused}
            elapsedTime={elapsedTime}
            onResume={handleResumeGame}
            formatTime={formatTime}
          />

          {/* Game Over Modal */}
          <GameOverModal
            visible={isGameOver}
            elapsedTime={elapsedTime}
            onRestart={restartGame}
            onBackToMenu={handleBackToMenu}
            formatTime={formatTime}
          />
         
         {/* Completion Modal */}
         <CompletionModal
           visible={isComplete}
           elapsedTime={elapsedTime}
           onRestart={restartGame}
           onBackToMenu={handleBackToMenu}
           formatTime={formatTime}
         />
         
         {/* Backdrop blur when paused */}
         {isPaused && (
           <View style={styles.backdropBlur} />
         )}
         
         {/* Backdrop blur when game over */}
         {isGameOver && (
           <View style={styles.backdropBlur} />
         )}
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: windowHeight * 0.06,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: windowHeight * 0.05,
  },
  backButton: {
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    fontFamily: 'Arial',
  },
  pauseButton: {
    paddingHorizontal: 10,
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flex: 1,
    paddingHorizontal: 20,
  }, 
  numberPadContainer: {
    width: '100%',
    alignItems: 'center',
    minHeight: scale(60),
    marginBottom: windowHeight * 0.08, 
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  touchableBackground: {
    flex: 1,
    width: '100%',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    paddingVertical: scale(12),
    backgroundColor: Colors.surface.primary,
    borderRadius: scale(25),
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  controlButtonText: {
    color: Colors.text.primary,
    fontSize: scale(16),
    fontFamily: 'Arial',
    fontWeight: 'bold',
    marginLeft: scale(8),
  },
  disabledButton: {
    backgroundColor: Colors.button.disabled.background,
    opacity: 0.5,
  },
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesLabel: {
    color: Colors.text.tertiary,
    fontSize: scale(16),
    fontFamily: 'Arial',
    marginRight: scale(12),
  },
  notesSwitch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: Colors.surface.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  timerText: {
    color: Colors.text.primary,
    fontSize: scale(18),
    fontFamily: 'Arial',
    fontWeight: 'bold',
    marginLeft: scale(6),
  },
  difficultyText: {
    color: Colors.text.tertiary,
    fontSize: scale(18),
    fontWeight: 'bold',
    fontFamily: 'Arial',
    marginLeft: scale(6),
  },
  mistakesText: {
    color: Colors.icon.error,
    fontSize: scale(18),
    fontFamily: 'Arial',
    fontWeight: 'bold',
    marginLeft: scale(6),
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mistakesSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultySection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backdropBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface.overlay,
    zIndex: 1,
  },
  spacer: {
    height: 60,
  },
});
