import React from 'react';
import { TetrominoType } from '../types';
import { SHAPES, TETROMINO_COLORS } from '../utils/tetrisLogic';

interface PiecePreviewProps {
  type: TetrominoType | null;
  label: string;
}

export const PiecePreview: React.FC<PiecePreviewProps> = ({ type, label }) => {
  // Center grid dimensions
  const PREVIEW_SIZE = 4;
  
  // Render an empty preview matrix or the tetromino centered
  const getPreviewMatrix = () => {
    const grid = Array.from({ length: PREVIEW_SIZE }, () => Array(PREVIEW_SIZE).fill(0));
    if (!type) return grid;

    const shape = SHAPES[type];
    const shapeRows = shape.length;
    const shapeCols = shape[0].length;

    // Calculate offsets to center the block inside 4x4 preview box
    const rOffset = Math.floor((PREVIEW_SIZE - shapeRows) / 2);
    const cOffset = Math.floor((PREVIEW_SIZE - shapeCols) / 2);

    for (let r = 0; r < shapeRows; r++) {
      for (let c = 0; c < shapeCols; c++) {
        if (shape[r][c] !== 0) {
          // Adjust for I piece offset to make it center perfectly
          const finalR = type === 'I' ? r : r + rOffset;
          const finalC = type === 'I' ? c : c + cOffset;
          if (finalR >= 0 && finalR < PREVIEW_SIZE && finalC >= 0 && finalC < PREVIEW_SIZE) {
            grid[finalR][finalC] = 1;
          }
        }
      }
    }
    return grid;
  };

  const previewMatrix = getPreviewMatrix();
  const colors = type ? TETROMINO_COLORS[type] : null;

  return (
    <div className="flex flex-col items-center bg-slate-900/90 rounded-2xl border-2 border-slate-800 p-3.5 shadow-lg select-none w-full max-w-[130px] min-w-[110px]">
      <span className="text-xs font-mono font-bold tracking-widest text-slate-400 mb-2.5 uppercase">
        {label}
      </span>

      <div className="grid grid-cols-4 gap-[2px] bg-slate-950/80 p-1.5 rounded-lg border border-slate-950">
        {previewMatrix.map((row, r) =>
          row.map((cell, c) => {
            let cellStyle = 'bg-slate-900/30 border border-slate-950/20';
            let innerContent = null;

            if (cell !== 0 && colors) {
              cellStyle = `${colors.bg} ${colors.border} border border-2 shadow-sm rounded-[3px]`;
              innerContent = (
                <div className="absolute inset-[1.5px] bg-white/20 rounded-[1.5px] pointer-events-none" />
              );
            }

            return (
              <div
                key={`${r}-${c}`}
                className={`relative w-6 h-6 rounded-sm transition-all duration-300 ${cellStyle}`}
              >
                {innerContent}
              </div>
            );
          })
        )}
      </div>
      
      {/* Label showing tetromino color description for accessibility/flair */}
      <div className="mt-2.5 text-[10px] font-mono text-slate-500 font-semibold h-4">
        {type ? `${colors?.name} Piece` : 'Empty'}
      </div>
    </div>
  );
};
