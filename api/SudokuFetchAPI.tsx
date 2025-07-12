import { Sudoku } from "@/types/sudoku";

export default async function generateSudoku() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch("https://sudoku-api.vercel.app/api/dosuku", {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = (await response.json()).newboard.grids[0];
    const transformedData: Sudoku = {
      initialPuzzle: data.value,
      puzzle: data.value,
      solution: data.solution,
      difficulty: data.difficulty,
      id: `${Date.now()}_${data.solution.map((row: number[]) => row.join('')).join('')}`,
      createdAt: Date.now(),
      puzzleHistory: []
    };
    return transformedData;
  } catch (error) {
    console.error('Error fetching Sudoku:', error);
    throw error;
  }
}