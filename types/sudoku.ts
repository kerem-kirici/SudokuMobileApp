export interface MoveHistory {
  previousPuzzle: (number | number[])[][];
  previousSelectedCell: [number, number];
}

export type Sudoku = {
  initialPuzzle: (number | number[])[][];
  puzzle: (number | number[])[][];
  solution: number[][];
  puzzleHistory: MoveHistory[];
  difficulty: string;
  id: string;
  createdAt: number;
  elapsedTime?: number;
  mistakes?: number;
}; 