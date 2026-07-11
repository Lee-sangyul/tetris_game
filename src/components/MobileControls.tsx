import React from 'react';
import { ArrowLeft, ArrowRight, ArrowDown, RotateCw, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react';

interface MobileControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onSoftDropStart: () => void;
  onSoftDropEnd: () => void;
  onHardDrop: () => void;
  onHold: () => void;
  disabled: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveLeft,
  onMoveRight,
  onRotateCW,
  onRotateCCW,
  onSoftDropStart,
  onSoftDropEnd,
  onHardDrop,
  onHold,
  disabled,
}) => {
  // Utility to handle triggers safely on mobile touch
  const handleTouch = (e: React.TouchEvent | React.MouseEvent, callback: () => void) => {
    e.preventDefault();
    if (!disabled) {
      callback();
    }
  };

  return (
    <div className="w-full max-w-[360px] md:max-w-md mx-auto bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-sm select-none mt-2">
      {/* Upper row: Hold & Hard Drop */}
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <button
          onTouchStart={(e) => handleTouch(e, onHold)}
          onMouseDown={(e) => handleTouch(e, onHold)}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 py-3 px-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-45 text-slate-300 disabled:text-slate-600 border border-slate-800/80 rounded-xl font-mono text-xs font-bold uppercase transition-all duration-150 active:scale-95 shadow-md active:bg-slate-800"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          HOLD (보관)
        </button>

        <button
          onTouchStart={(e) => handleTouch(e, onHardDrop)}
          onMouseDown={(e) => handleTouch(e, onHardDrop)}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 py-3 px-4 bg-indigo-950/60 hover:bg-indigo-900 disabled:opacity-45 text-indigo-300 disabled:text-indigo-800 border border-indigo-900/50 rounded-xl font-mono text-xs font-bold uppercase transition-all duration-150 active:scale-95 shadow-[0_0_10px_rgba(99,102,241,0.2)] active:bg-indigo-900"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
          HARD DROP (낙하)
        </button>
      </div>

      {/* Main joystick grids */}
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: D-Pad (Directions) */}
        <div className="grid grid-cols-3 gap-2 w-1/2 max-w-[170px]">
          {/* Top Row - Spacer */}
          <div />
          {/* Top Button (Not used, or could be Hold. We put hold on top) */}
          <div className="aspect-square bg-slate-950/25 rounded-xl border border-slate-800/20 opacity-30 flex items-center justify-center text-[8px] font-mono font-black text-slate-700">D</div>
          <div />

          {/* Middle Row: Left, Center (Blank/Spacer), Right */}
          <button
            onTouchStart={(e) => handleTouch(e, onMoveLeft)}
            onMouseDown={(e) => handleTouch(e, onMoveLeft)}
            disabled={disabled}
            className="aspect-square flex items-center justify-center bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-white rounded-xl border border-slate-800 transition-all duration-150 active:scale-90 shadow-md active:bg-slate-800"
            aria-label="Move Left"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>

          <div className="aspect-square flex items-center justify-center bg-slate-950/40 rounded-xl text-slate-700 text-xs font-mono font-bold select-none border border-slate-800/10">
            🕹️
          </div>

          <button
            onTouchStart={(e) => handleTouch(e, onMoveRight)}
            onMouseDown={(e) => handleTouch(e, onMoveRight)}
            disabled={disabled}
            className="aspect-square flex items-center justify-center bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-white rounded-xl border border-slate-800 transition-all duration-150 active:scale-90 shadow-md active:bg-slate-800"
            aria-label="Move Right"
          >
            <ArrowRight className="w-5 h-5 text-slate-300" />
          </button>

          {/* Bottom Row: Spacer, Soft Drop, Spacer */}
          <div />
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (!disabled) onSoftDropStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onSoftDropEnd();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              if (!disabled) onSoftDropStart();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              onSoftDropEnd();
            }}
            onMouseLeave={() => {
              onSoftDropEnd();
            }}
            disabled={disabled}
            className="aspect-square flex items-center justify-center bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-white rounded-xl border border-slate-800 transition-all duration-150 active:scale-90 shadow-md active:bg-slate-800"
            aria-label="Soft Drop"
          >
            <ArrowDown className="w-5 h-5 text-slate-300" />
          </button>
          <div />
        </div>

        {/* Right Side: Rotation Buttons (A / B Style Action Pad) */}
        <div className="flex flex-col justify-center gap-2.5 w-1/2 max-w-[150px]">
          {/* Rotate CCW (Left turn) */}
          <button
            onTouchStart={(e) => handleTouch(e, onRotateCCW)}
            onMouseDown={(e) => handleTouch(e, onRotateCCW)}
            disabled={disabled}
            className="flex items-center justify-between px-3.5 py-3.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-pink-300 border border-slate-800 rounded-xl transition-all duration-150 active:scale-90 shadow-md active:bg-slate-800"
          >
            <span className="text-[10px] font-mono font-bold">TURN L</span>
            <RotateCcw className="w-4 h-4 text-pink-400" />
          </button>

          {/* Rotate CW (Right turn) */}
          <button
            onTouchStart={(e) => handleTouch(e, onRotateCW)}
            onMouseDown={(e) => handleTouch(e, onRotateCW)}
            disabled={disabled}
            className="flex items-center justify-between px-3.5 py-3.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-cyan-300 border border-slate-800 rounded-xl transition-all duration-150 active:scale-90 shadow-md active:bg-slate-800"
          >
            <span className="text-[10px] font-mono font-bold">TURN R</span>
            <RotateCw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Quick instructions for mobile layout */}
      <div className="text-[9px] text-slate-500 font-mono text-center mt-2.5">
        화면의 버튼을 눌러 부드럽게 조작할 수 있습니다.
      </div>
    </div>
  );
};
