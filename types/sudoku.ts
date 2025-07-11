export interface MoveHistory {
  previousPuzzle: Array<Array<number | Array<number>>>;
  previousSelectedCell: [number, number];
}

export type Sudoku = {
  initialPuzzle: Array<Array<number | Array<number>>>;
  puzzle: Array<Array<number | Array<number>>>;
  solution: number[][];
  puzzleHistory: MoveHistory[];
  difficulty: string;
  id: string;
  createdAt: number;
  elapsedTime?: number;
  mistakes?: number;
}; 