import { Sudoku } from '@/types/sudoku';
import { Colors } from '@/types/theme';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SudokuGridProps {
  sudoku: Sudoku;
  selectedCell: [number, number] | null;
  onCellPress: (row: number, col: number) => void;
}

export default function SudokuGrid({ 
  sudoku, 
  selectedCell, 
  onCellPress 
}: SudokuGridProps) {
  const renderCell = (value: number | number[], row: number, col: number) => {
    const isSelected = selectedCell && selectedCell[0] === row && selectedCell[1] === col;
    const isOriginal = sudoku.initialPuzzle[row][col] !== 0;
    const isInSameRow = selectedCell && selectedCell[0] === row;
    const isInSameCol = selectedCell && selectedCell[1] === col;
    const isInSameBox = selectedCell && 
      Math.floor(selectedCell[0] / 3) === Math.floor(row / 3) && 
      Math.floor(selectedCell[1] / 3) === Math.floor(col / 3);
    const isCorrect = sudoku.puzzle[row][col] === sudoku.solution[row][col];
    const isSameValue = selectedCell && value !== 0 && value === sudoku.puzzle[selectedCell[0]][selectedCell[1]];

    
    const isThirdRowBottomBorder = (row + 1) % 3 === 0;
    const isThirdRowTopBorder = row % 3 === 0;
    const isThirdColRightBorder = (col + 1) % 3 === 0;
    const isThirdColLeftBorder = col % 3 === 0;
    const isTopBorder = row === 0;
    const isBottomBorder = row === 8;
    const isLeftBorder = col === 0;
    const isRightBorder = col === 8;

    const BORDER_WIDTH = 1;
    const BORDER_WIDTH_THIRD = 2;
    const BORDER_WIDTH_EDGE = 3;

    const windowWidth = Dimensions.get('window').width;

    const cellSize = {
      width: Math.floor(windowWidth * 0.1),
      height: Math.floor(windowWidth * 0.1),
    };

    const borderWidth = {
      borderTopWidth: !isThirdRowTopBorder ? BORDER_WIDTH : 
                    isTopBorder ? BORDER_WIDTH_EDGE : BORDER_WIDTH_THIRD,
      borderLeftWidth: !isThirdColLeftBorder ? BORDER_WIDTH : 
                    isLeftBorder ? BORDER_WIDTH_EDGE : BORDER_WIDTH_THIRD,
      borderRightWidth: !isThirdColRightBorder ? BORDER_WIDTH : 
                    isRightBorder ? BORDER_WIDTH_EDGE : BORDER_WIDTH_THIRD,
      borderBottomWidth: !isThirdRowBottomBorder ? BORDER_WIDTH : 
                    isBottomBorder ? BORDER_WIDTH_EDGE : BORDER_WIDTH_THIRD,
    }

    // Render notes (array of numbers) as small numbers in a 3x3 grid
    if (Array.isArray(value)) {
      return (
        <TouchableOpacity
          key={`${row}-${col}`}
          style={[
            borderWidth,
            styles.cell,
            cellSize,
            isSelected && styles.selectedCell,
            !isSelected && (isInSameRow || isInSameCol || isInSameBox) && styles.highlightedCell,
          ]}
          onPress={() => onCellPress(row, col)}
          activeOpacity={0.7}
        >
          <View style={styles.notesGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Text
                key={num}
                style={[
                  styles.noteText,
                  value.includes(num) && styles.noteTextVisible,
                  !value.includes(num) && styles.noteTextHidden,
                  !isSelected && selectedCell && num === sudoku.puzzle[selectedCell[0]][selectedCell[1]] && {
                    ...styles.sameValueCellText,
                    color: Colors.text.primary,
                  },
                ]}
              >
                {value.includes(num) ? num : ''}
              </Text>
            ))}
          </View>
        </TouchableOpacity>
      );
    }

    // Render single number as before
    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          borderWidth,
          styles.cell,
          cellSize,
          isSelected && styles.selectedCell,
          !isSelected && isOriginal && styles.originalCell,
          !isSelected && isSameValue && styles.sameValueCell,
          !isSelected && (isInSameRow || isInSameCol || isInSameBox) && styles.highlightedCell,
        ]}
        onPress={() => onCellPress(row, col)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.cellText,
          isSelected && styles.selectedCellText,
          !isSelected && isOriginal && styles.originalCellText,
          !isSelected && isSameValue && styles.sameValueCellText,
          !isOriginal && isCorrect && styles.correctCellText,
          !isOriginal && !isCorrect && styles.incorrectCellText,
        ]}>
          {value !== 0 ? value : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.boardContainer}>
      <View style={styles.board}>
        {sudoku.puzzle.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Dimensions.get('window').height * 0.02,
  },
  board: {
    backgroundColor: Colors.grid.background,
    borderRadius: 6,
    padding: 3,
    borderWidth: 2,
    borderColor: Colors.border.grid,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: Colors.border.cell,
    backgroundColor: Colors.grid.cell,
  },
  selectedCell: {
    backgroundColor: Colors.grid.selected,
  },
  originalCell: {
    backgroundColor: Colors.grid.original,
  },
  highlightedCell: {
    backgroundColor: Colors.grid.highlighted,
  },
  sameValueCell: {
    backgroundColor: Colors.grid.sameValue,
  },
  cellText: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '400',
  },
  originalCellText: {
    color: Colors.numbers.original,
  },
  selectedCellText: {
    color: Colors.numbers.selected,
  },
  correctCellText: {
    color: Colors.numbers.correct,
    fontWeight: '600',
  },
  incorrectCellText: {
    color: Colors.numbers.incorrect,
    fontWeight: '900',
  },
  sameValueCellText: {
    fontWeight: '900',
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    padding: 2,
  },
  noteText: {
    fontSize: 10,
    fontWeight: '100',
    color: Colors.text.notes,
    textAlign: 'center',
    width: '31%',
    height: '31%',
    textAlignVertical: 'center',
  },
  noteTextVisible: {
    color: Colors.numbers.notes.visible,
    fontWeight: '500',
  },
  noteTextHidden: {
    color: Colors.numbers.notes.hidden,
  },
}); 