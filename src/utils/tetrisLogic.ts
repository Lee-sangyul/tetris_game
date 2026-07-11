import { TetrominoType, Grid, Point, CellValue, Difficulty } from '../types';

export const COLS = 10;
export const ROWS = 20;

export const SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

// Vibrant, glowing colors for each Tetromino block
export const TETROMINO_COLORS: Record<TetrominoType, {
  name: string;
  bg: string;
  border: string;
  glow: string;
  lightBg: string;
}> = {
  I: {
    name: 'Cyan',
    bg: 'bg-cyan-500',
    border: 'border-cyan-300',
    glow: 'shadow-[0_0_6px_rgba(6,182,212,0.4)]',
    lightBg: 'bg-cyan-500/20',
  },
  O: {
    name: 'Yellow',
    bg: 'bg-yellow-500',
    border: 'border-yellow-300',
    glow: 'shadow-[0_0_6px_rgba(234,179,8,0.4)]',
    lightBg: 'bg-yellow-500/20',
  },
  T: {
    name: 'Purple',
    bg: 'bg-purple-500',
    border: 'border-purple-300',
    glow: 'shadow-[0_0_6px_rgba(168,85,247,0.4)]',
    lightBg: 'bg-purple-500/20',
  },
  S: {
    name: 'Green',
    bg: 'bg-emerald-500',
    border: 'border-emerald-300',
    glow: 'shadow-[0_0_6px_rgba(16,185,129,0.4)]',
    lightBg: 'bg-emerald-500/20',
  },
  Z: {
    name: 'Red',
    bg: 'bg-red-500',
    border: 'border-red-300',
    glow: 'shadow-[0_0_6px_rgba(239,68,68,0.4)]',
    lightBg: 'bg-red-500/20',
  },
  J: {
    name: 'Blue',
    bg: 'bg-blue-600',
    border: 'border-blue-400',
    glow: 'shadow-[0_0_6px_rgba(37,99,235,0.4)]',
    lightBg: 'bg-blue-600/20',
  },
  L: {
    name: 'Orange',
    bg: 'bg-orange-500',
    border: 'border-orange-300',
    glow: 'shadow-[0_0_6px_rgba(249,115,22,0.4)]',
    lightBg: 'bg-orange-500/20',
  },
};

export function createEmptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function getRandomTetromino(): TetrominoType {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const randomIndex = Math.floor(Math.random() * types.length);
  return types[randomIndex];
}

/**
 * Checks if a piece placement at the given position is valid.
 */
export function checkCollision(
  matrix: number[][],
  pos: Point,
  grid: Grid
): boolean {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] !== 0) {
        const nextX = pos.x + c;
        const nextY = pos.y + r;

        // Check if out of bounds horizontally or below the bottom
        if (nextX < 0 || nextX >= COLS || nextY >= ROWS) {
          return true;
        }

        // Check if overlapping with occupied cells (only if within vertical bounds)
        if (nextY >= 0 && grid[nextY][nextX] !== null) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Rotates a 2D matrix 90 degrees clockwise.
 */
export function rotateMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  // Create a new matrix filled with 0s
  const rotated = Array.from({ length: n }, () => Array(n).fill(0));

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      rotated[c][n - 1 - r] = matrix[r][c];
    }
  }

  return rotated;
}

/**
 * Returns the speed interval in milliseconds based on difficulty and manual level adjustment (1 to 10).
 */
export function getSpeedInterval(difficulty: Difficulty, level: number): number {
  // Base intervals for each difficulty
  let baseInterval = 1000;
  let decrement = 80;

  switch (difficulty) {
    case 'easy':
      baseInterval = 1000;
      decrement = 80; // 1000ms down to 280ms
      break;
    case 'normal':
      baseInterval = 700;
      decrement = 60; // 700ms down to 160ms
      break;
    case 'hard':
      baseInterval = 450;
      decrement = 40; // 450ms down to 90ms
      break;
    case 'expert':
      baseInterval = 250;
      decrement = 20; // 250ms down to 70ms
      break;
  }

  // Speed level determines the adjustment multiplier (1 to 10)
  const currentInterval = baseInterval - (level - 1) * decrement;
  
  // Enforce a sensible minimum speed (50ms) to ensure the game remains humanly playable but fast!
  return Math.max(50, currentInterval);
}

/**
 * Calculates score based on lines cleared and current level
 */
export function calculateLineScore(linesCleared: number, level: number): number {
  const lineValues = [0, 100, 300, 500, 800]; // 1, 2, 3, 4 lines cleared
  const baseValue = lineValues[Math.min(linesCleared, 4)] || 800;
  return baseValue * level;
}
