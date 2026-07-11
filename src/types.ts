export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type CellValue = null | TetrominoType;

export type Grid = CellValue[][];

export type Point = {
  x: number;
  y: number;
};

export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';

export interface HighScore {
  score: number;
  level: number;
  lines: number;
  date: string;
}

export interface GameSettings {
  difficulty: Difficulty;
  speedLevel: number; // 1 to 10
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}
