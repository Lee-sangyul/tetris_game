import React from 'react';
import { Grid, Point, TetrominoType } from '../types.ts';
import { TETROMINO_COLORS, ROWS, COLS } from '../utils/tetrisLogic.ts';

interface GameBoardProps {
  grid: Grid;
  activePiece: {
    matrix: number[][];
    pos: Point;
    type: TetrominoType;
  } | null;
  ghostY: number | null;
  clearingRows: number[];
}

export const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  activePiece,
  ghostY,
  clearingRows,
}) => {
  // Helper to render individual cell
  const renderCell = (r: number, c: number) => {
    const isClearing = clearingRows.includes(r);
    let cellType: TetrominoType | null = grid[r][c];
    let isGhost = false;
    let isActive = false;

    // Determine if the cell is occupied by the active piece
    if (activePiece && !isClearing) {
      const { matrix, pos, type } = activePiece;
      const pieceRow = r - pos.y;
      const pieceCol = c - pos.x;

      if (
        pieceRow >= 0 &&
        pieceRow < matrix.length &&
        pieceCol >= 0 &&
        pieceCol < matrix[pieceRow].length &&
        matrix[pieceRow][pieceCol] !== 0
      ) {
        cellType = type;
        isActive = true;
      }

      // Check if occupied by ghost piece (if ghost position is calculated and active piece isn't overlapping)
      if (!isActive && ghostY !== null) {
        const ghostRow = r - ghostY;
        if (
          ghostRow >= 0 &&
          ghostRow < matrix.length &&
          pieceCol >= 0 &&
          pieceCol < matrix[ghostRow].length &&
          matrix[ghostRow][pieceCol] !== 0
        ) {
          cellType = type;
          isGhost = true;
        }
      }
    }

    // Styles for cell
    let cellStyle = 'bg-slate-950/40 border border-slate-900/40 rounded-sm';
    let innerContent = null;

    if (isClearing) {
      cellStyle = 'bg-white border-white scale-95 shadow-[0_0_15px_rgba(255,255,255,1)] transition-all duration-100';
    } else if (isActive && cellType) {
      const colors = TETROMINO_COLORS[cellType];
      cellStyle = `${colors.bg} ${colors.border} border-2 rounded-[4px] ${colors.glow}`;
      innerContent = (
        <div className="absolute inset-[1px] bg-white/20 rounded-[2px] pointer-events-none" />
      );
    } else if (isGhost && cellType) {
      const colors = TETROMINO_COLORS[cellType];
      // Ghost piece is an outline with subtle background
      cellStyle = `border-2 border-dashed ${colors.border.replace('border-', 'border-')}/50 ${colors.lightBg} rounded-[4px]`;
    } else if (cellType) {
      const colors = TETROMINO_COLORS[cellType];
      // Locked blocks have a slightly softer glow than active blocks but look solid
      cellStyle = `${colors.bg} ${colors.border} border-2 rounded-[4px] brightness-90 shadow-sm`;
      innerContent = (
        <div className="absolute inset-[1px] bg-black/10 rounded-[2px] pointer-events-none" />
      );
    }

    return (
      <div
        key={`${r}-${c}`}
        id={`cell-${r}-${c}`}
        className={`relative aspect-square w-full select-none ${cellStyle}`}
      >
        {innerContent}
      </div>
    );
  };

  return (
    <div className="relative p-2 bg-slate-900/90 rounded-2xl border-4 border-slate-800 shadow-2xl backdrop-blur-sm overflow-hidden select-none">
      {/* Visual background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10%_5%] pointer-events-none" />

      {/* Grid container */}
      <div className="grid grid-cols-10 gap-[2px] w-[270px] xs:w-[300px] sm:w-[340px] md:w-[380px] lg:w-[430px] xl:w-[480px] 2xl:w-[520px] bg-slate-950/80 p-2 rounded-lg border-2 border-slate-950 select-none">
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => renderCell(r, c))
        )}
      </div>
    </div>
  );
};
