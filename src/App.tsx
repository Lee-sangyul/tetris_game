import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Gamepad2, 
  Sliders, Award, Keyboard, Trophy, Star, ChevronRight, Zap
} from 'lucide-react';

import { TetrominoType, Grid, Point, Difficulty, HighScore } from './types.ts';
import { 
  createEmptyGrid, getRandomTetromino, checkCollision, rotateMatrix, 
  getSpeedInterval, calculateLineScore, COLS, ROWS, SHAPES 
} from './utils/tetrisLogic.ts';
import { playSound } from './utils/audio.ts';
import { GameBoard } from './components/GameBoard.tsx';
import { PiecePreview } from './components/PiecePreview.tsx';
import { Leaderboard } from './components/Leaderboard.tsx';
import { MobileControls } from './components/MobileControls.tsx';

const HIGH_SCORES_KEY = 'tetris_high_scores_v1';

export default function App() {
  // Game states
  const [grid, setGrid] = useState<Grid>(createEmptyGrid());
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'game_over'>('menu');
  
  // Active piece properties
  const [activePiece, setActivePiece] = useState<{
    matrix: number[][];
    pos: Point;
    type: TetrominoType;
  } | null>(null);

  const [nextPiece, setNextPiece] = useState<TetrominoType>('I');
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [canSwapHold, setCanSwapHold] = useState<boolean>(true);

  // Stats
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [lines, setLines] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);

  // Settings
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [speedLevel, setSpeedLevel] = useState<number>(1); // Custom speed multiplier (1 to 10)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState<number>(0);

  // Animation states
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [lastScoredPoints, setLastScoredPoints] = useState<number | null>(null);
  const [showLevelUp, setShowLevelUp] = useState<boolean>(false);

  // References for game loop
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const dropCounterRef = useRef<number>(0);

  // Load high score from local storage on mount
  useEffect(() => {
    const scores = localStorage.getItem(HIGH_SCORES_KEY);
    if (scores) {
      try {
        const parsed = JSON.parse(scores) as HighScore[];
        if (parsed.length > 0) {
          const max = Math.max(...parsed.map(h => h.score));
          setHighScore(max);
        }
      } catch (e) {
        console.error('Failed to parse scores', e);
      }
    }
    // Pre-roll a random next piece
    setNextPiece(getRandomTetromino());
  }, []);

  // Play audio wrapper
  const triggerSound = useCallback((type: 'move' | 'rotate' | 'lock' | 'clear' | 'tetris' | 'levelUp' | 'gameOver') => {
    if (soundEnabled) {
      playSound(type);
    }
  }, [soundEnabled]);

  // Calculate Ghost block Y coordinate
  const getGhostY = useCallback(() => {
    if (!activePiece) return null;
    let ghostY = activePiece.pos.y;
    while (!checkCollision(activePiece.matrix, { x: activePiece.pos.x, y: ghostY + 1 }, grid)) {
      ghostY++;
    }
    return ghostY;
  }, [activePiece, grid]);

  const ghostY = getGhostY();

  // Reset the game board and stats
  const startNewGame = () => {
    setGrid(createEmptyGrid());
    setScore(0);
    setLines(0);
    setLevel(1);
    setHoldPiece(null);
    setCanSwapHold(true);
    setClearingRows([]);
    setLastScoredPoints(null);
    setShowLevelUp(false);

    // Initial pieces
    const firstPieceType = getRandomTetromino();
    const nextPieceType = getRandomTetromino();
    
    setNextPiece(nextPieceType);
    spawnPiece(firstPieceType);
    setGameState('playing');
    
    // Resume audio context
    triggerSound('move');
  };

  // Spawns a given tetromino type on top of the grid
  const spawnPiece = (type: TetrominoType) => {
    const matrix = SHAPES[type];
    // Center of board (cols = 10)
    const startX = Math.floor((COLS - matrix[0].length) / 2);
    const startY = 0;

    const newPiece = {
      matrix,
      pos: { x: startX, y: startY },
      type,
    };

    // Check game over on spawn
    if (checkCollision(matrix, newPiece.pos, grid)) {
      setGameState('game_over');
      triggerSound('gameOver');
      saveHighScore();
    } else {
      setActivePiece(newPiece);
    }
  };

  // Saves the final score to high scores
  const saveHighScore = () => {
    const newRecord: HighScore = {
      score,
      level,
      lines,
      date: new Date().toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const scoresString = localStorage.getItem(HIGH_SCORES_KEY);
    let scores: HighScore[] = [];
    if (scoresString) {
      try {
        scores = JSON.parse(scoresString) as HighScore[];
      } catch (e) {
        scores = [];
      }
    }

    scores.push(newRecord);
    // Sort descending and keep top 10
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10);

    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
    
    // Update local high score state
    if (score > highScore) {
      setHighScore(score);
    }
    
    // Trigger leaderboard component refresh
    setLeaderboardRefresh(prev => prev + 1);
  };

  // Rotate clockwise
  const handleRotateCW = useCallback(() => {
    if (!activePiece || gameState !== 'playing') return;
    const rotatedMatrix = rotateMatrix(activePiece.matrix);
    
    // Wall kick system simplified: try rotated at original, left, right, up
    const kicks = [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
    ];

    for (const kick of kicks) {
      const nextPos = {
        x: activePiece.pos.x + kick.x,
        y: activePiece.pos.y + kick.y,
      };
      if (!checkCollision(rotatedMatrix, nextPos, grid)) {
        setActivePiece(prev => prev ? {
          ...prev,
          matrix: rotatedMatrix,
          pos: nextPos,
        } : null);
        triggerSound('rotate');
        return;
      }
    }
  }, [activePiece, grid, gameState, triggerSound]);

  // Rotate counter-clockwise
  const handleRotateCCW = useCallback(() => {
    if (!activePiece || gameState !== 'playing') return;
    // Rotate counter-clockwise by rotating clockwise 3 times
    let rotatedMatrix = rotateMatrix(activePiece.matrix);
    rotatedMatrix = rotateMatrix(rotatedMatrix);
    rotatedMatrix = rotateMatrix(rotatedMatrix);

    const kicks = [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
    ];

    for (const kick of kicks) {
      const nextPos = {
        x: activePiece.pos.x + kick.x,
        y: activePiece.pos.y + kick.y,
      };
      if (!checkCollision(rotatedMatrix, nextPos, grid)) {
        setActivePiece(prev => prev ? {
          ...prev,
          matrix: rotatedMatrix,
          pos: nextPos,
        } : null);
        triggerSound('rotate');
        return;
      }
    }
  }, [activePiece, grid, gameState, triggerSound]);

  // Move left
  const handleMoveLeft = useCallback(() => {
    if (!activePiece || gameState !== 'playing') return;
    const nextPos = { x: activePiece.pos.x - 1, y: activePiece.pos.y };
    if (!checkCollision(activePiece.matrix, nextPos, grid)) {
      setActivePiece(prev => prev ? { ...prev, pos: nextPos } : null);
      triggerSound('move');
    }
  }, [activePiece, grid, gameState, triggerSound]);

  // Move right
  const handleMoveRight = useCallback(() => {
    if (!activePiece || gameState !== 'playing') return;
    const nextPos = { x: activePiece.pos.x + 1, y: activePiece.pos.y };
    if (!checkCollision(activePiece.matrix, nextPos, grid)) {
      setActivePiece(prev => prev ? { ...prev, pos: nextPos } : null);
      triggerSound('move');
    }
  }, [activePiece, grid, gameState, triggerSound]);

  // Handles soft dropping down
  const handleSoftDrop = useCallback(() => {
    if (!activePiece || gameState !== 'playing') return;
    const nextPos = { x: activePiece.pos.x, y: activePiece.pos.y + 1 };
    
    if (!checkCollision(activePiece.matrix, nextPos, grid)) {
      setActivePiece(prev => prev ? { ...prev, pos: nextPos } : null);
      setScore(prev => prev + 1); // Extra point for manual soft drop
      triggerSound('move');
    } else {
      lockPiece();
    }
  }, [activePiece, grid, gameState, triggerSound]);

  // Swap / Hold piece
  const handleHold = useCallback(() => {
    if (!activePiece || !canSwapHold || gameState !== 'playing') return;

    const currentType = activePiece.type;

    if (holdPiece === null) {
      setHoldPiece(currentType);
      spawnPiece(nextPiece);
      setNextPiece(getRandomTetromino());
    } else {
      const prevHold = holdPiece;
      setHoldPiece(currentType);
      spawnPiece(prevHold);
    }

    setCanSwapHold(false);
    triggerSound('rotate');
  }, [activePiece, holdPiece, nextPiece, canSwapHold, gameState, triggerSound]);

  // Instant Hard Drop
  const handleHardDrop = useCallback(() => {
    if (!activePiece || gameState !== 'playing' || ghostY === null) return;

    const dropRows = ghostY - activePiece.pos.y;
    const finalPos = { x: activePiece.pos.x, y: ghostY };

    // Apply the position and lock immediately
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row]);
      const matrix = activePiece.matrix;

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            const gridR = finalPos.y + r;
            const gridC = finalPos.x + c;
            if (gridR >= 0 && gridR < ROWS) {
              newGrid[gridR][gridC] = activePiece.type;
            }
          }
        }
      }

      // Check lines right after locking
      checkAndClearLines(newGrid);
      return newGrid;
    });

    // Add 2 points per row dropped instantly
    setScore(prev => prev + (dropRows * 2));
    setActivePiece(null);
    setCanSwapHold(true);
    triggerSound('lock');
  }, [activePiece, ghostY, gameState, triggerSound]);

  // Core logic to merge piece into grid
  const lockPiece = () => {
    if (!activePiece) return;

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row]);
      const { matrix, pos, type } = activePiece;

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            const gridR = pos.y + r;
            const gridC = pos.x + c;
            if (gridR >= 0 && gridR < ROWS) {
              newGrid[gridR][gridC] = type;
            }
          }
        }
      }

      checkAndClearLines(newGrid);
      return newGrid;
    });

    setActivePiece(null);
    setCanSwapHold(true);
    triggerSound('lock');
  };

  // Inspect and process fully cleared rows
  const checkAndClearLines = (currentGrid: Grid) => {
    const fullRowIndices: number[] = [];

    for (let r = 0; r < ROWS; r++) {
      if (currentGrid[r].every(cell => cell !== null)) {
        fullRowIndices.push(r);
      }
    }

    if (fullRowIndices.length > 0) {
      // 1. Set full rows in state to trigger visual flash in GameBoard
      setClearingRows(fullRowIndices);

      // 2. Play distinct sound based on line count
      if (fullRowIndices.length === 4) {
        triggerSound('tetris');
      } else {
        triggerSound('clear');
      }

      // 3. Pause game flow briefly for visual effect, then actually remove rows
      setTimeout(() => {
        setGrid(prevGrid => {
          // Filter out rows that are cleared
          const keptRows = prevGrid.filter((_, idx) => !fullRowIndices.includes(idx));
          // Prepend empty rows on top
          const newEmptyRows = Array.from({ length: fullRowIndices.length }, () => Array(COLS).fill(null));
          return [...newEmptyRows, ...keptRows];
        });

        // Calculate score
        const pointsGained = calculateLineScore(fullRowIndices.length, level);
        setScore(prev => prev + pointsGained);
        setLastScoredPoints(pointsGained);

        // Clear score text trigger
        setTimeout(() => setLastScoredPoints(null), 2000);

        // Update total lines
        const newLinesTotal = lines + fullRowIndices.length;
        setLines(newLinesTotal);

        // Level Up condition: every 10 lines
        const nextLevel = Math.floor(newLinesTotal / 10) + 1;
        if (nextLevel > level) {
          setLevel(nextLevel);
          setShowLevelUp(true);
          triggerSound('levelUp');
          setTimeout(() => setShowLevelUp(false), 3000);
        }

        // Spawn next piece
        spawnPiece(nextPiece);
        setNextPiece(getRandomTetromino());
        setClearingRows([]);
      }, 300); // Duration matches flash effect
    } else {
      // No lines cleared, just spawn next piece normally
      spawnPiece(nextPiece);
      setNextPiece(getRandomTetromino());
    }
  };

  // Key Down handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          if (gameState === 'paused') {
            setGameState('playing');
          }
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleMoveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleMoveRight();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'x':
        case 'X':
          e.preventDefault();
          handleRotateCW();
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          handleRotateCCW();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleSoftDrop();
          break;
        case ' ':
          e.preventDefault();
          handleHardDrop();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          e.preventDefault();
          handleHold();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          e.preventDefault();
          setGameState('paused');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleMoveLeft, handleMoveRight, handleRotateCW, handleRotateCCW, handleSoftDrop, handleHardDrop, handleHold]);

  // Main game tick mechanism using requestAnimationFrame for pristine speed timing
  useEffect(() => {
    if (gameState !== 'playing' || clearingRows.length > 0) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      return;
    }

    const interval = getSpeedInterval(difficulty, speedLevel + (level - 1));

    const gameLoop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      dropCounterRef.current += deltaTime;

      if (dropCounterRef.current >= interval) {
        handleSoftDrop();
        dropCounterRef.current = 0;
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState, difficulty, speedLevel, level, handleSoftDrop, clearingRows]);

  return (
    <div id="tetris-app" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden select-none font-sans relative pb-4">
      {/* Absolute Neon Glow background decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />

      {/* HEADER BAR */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 select-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.4)]">
              <Gamepad2 className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-mono font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                TETRIS ARCADE
              </h1>
              <p className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                Retro Edition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled 
                  ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:bg-slate-800' 
                  : 'bg-slate-950 border-slate-900 text-slate-600'
              }`}
              title={soundEnabled ? '소리 끄기' : '소리 켜기'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            
            {/* Quick status badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-mono text-slate-400">FPS STABLE</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT CONTAINER */}
      <main className="max-w-6xl mx-auto w-full px-4 py-4 flex-1 flex flex-col justify-center items-center">
        
        {/* LEVEL UP NOTIFICATION */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.8 }}
              className="absolute top-24 z-50 bg-indigo-600 text-white font-mono font-extrabold px-6 py-3.5 rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.6)] border-2 border-indigo-400 flex items-center gap-3"
            >
              <Zap className="w-6 h-6 text-yellow-300 animate-bounce" />
              <div className="text-left">
                <div className="text-xs uppercase tracking-widest text-indigo-200">LEVEL UP!</div>
                <div className="text-lg">레벨 {level} 달성!</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. MENU STATE SCREEN */}
        {gameState === 'menu' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg flex flex-col gap-6 my-auto select-none py-4"
          >
            {/* Hero Card */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 text-center shadow-xl backdrop-blur-sm">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full" />
                <Gamepad2 className="w-14 h-14 mx-auto text-pink-500 relative" />
              </div>
              <h2 className="text-2xl font-mono font-black text-white tracking-widest uppercase">
                TETRIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-400">CHALLENGE</span>
              </h2>
              <p className="text-slate-400 text-xs font-mono max-w-sm mx-auto mt-2 leading-relaxed">
                반응형 레이아웃과 8비트 사운드 이펙트가 포함된 고화질 테트리스 게임입니다. 난이도와 시작 속도를 조절하여 최고 점수에 도전해 보세요!
              </p>
            </div>

            {/* Config Box */}
            <div className="bg-slate-900/80 border-2 border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
                <Sliders className="w-4 h-4" />
                게임 설정 (Game Settings)
              </div>

              {/* Difficulty Selection */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 font-semibold mb-2 block">
                  난이도 선택 (Difficulty Mode)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['easy', 'normal', 'hard', 'expert'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 px-1 text-center font-mono text-[10px] font-bold rounded-xl uppercase transition-all duration-200 border ${
                        difficulty === diff
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                          : 'bg-slate-950/60 text-slate-500 border-slate-900 hover:text-slate-300 hover:bg-slate-900/60'
                      }`}
                    >
                      {diff === 'easy' && '쉬움'}
                      {diff === 'normal' && '보통'}
                      {diff === 'hard' && '어려움'}
                      {diff === 'expert' && '극한'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed Level Adjuster */}
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 font-semibold mb-1.5">
                  <span>시작 속도 조절 (Speed Adjust)</span>
                  <span className="text-indigo-400 font-bold">Level {speedLevel}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={speedLevel}
                  onChange={(e) => setSpeedLevel(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-950 rounded-lg cursor-pointer h-2 border border-slate-900"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                  <span>Level 1 (가장 느림 - 1000ms)</span>
                  <span>Level 10 (가장 빠름)</span>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={startNewGame}
              className="py-4 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-mono font-black tracking-widest text-sm uppercase rounded-2xl shadow-[0_4px_20px_rgba(244,63,94,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              GAME START (게임 시작)
            </button>

            {/* High score list in main menu */}
            <Leaderboard scoreKey={HIGH_SCORES_KEY} refreshTrigger={leaderboardRefresh} />
          </motion.div>
        )}

        {/* 2. PLAYING / PAUSED GAME PLAY STATE */}
        {(gameState === 'playing' || gameState === 'paused') && (
          <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 items-stretch py-2">
            
            {/* DESKTOP LEFT SIDEBAR: Stats & Hold Box */}
            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 lg:w-1/4">
              
              {/* Score / Level Indicators */}
              <div className="flex-1 w-full bg-slate-900/90 border-2 border-slate-800 rounded-2xl p-4 shadow-lg font-mono flex flex-col justify-between lg:justify-start gap-3 min-w-[140px]">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  STATISTICS
                </div>
                
                {/* Score */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-950 relative overflow-hidden">
                  <div className="text-[9px] text-slate-500 uppercase font-semibold">SCORE (점수)</div>
                  <div className="text-xl font-black text-indigo-300 tracking-wider">
                    {score.toLocaleString()}
                  </div>
                  {/* Plus score pop text */}
                  <AnimatePresence>
                    {lastScoredPoints !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: -5 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-3 bottom-2 text-xs font-black text-emerald-400"
                      >
                        +{lastScoredPoints}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Level / Lines double row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-950">
                    <div className="text-[9px] text-slate-500 uppercase font-semibold">LEVEL</div>
                    <div className="text-sm font-bold text-slate-200">Lv.{level}</div>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-950">
                    <div className="text-[9px] text-slate-500 uppercase font-semibold">LINES</div>
                    <div className="text-sm font-bold text-slate-200">{lines}</div>
                  </div>
                </div>

                {/* Local High Score */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-950">
                  <div className="text-[9px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-yellow-500" /> BEST
                  </div>
                  <div className="text-xs font-bold text-yellow-500/90">
                    {highScore.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Hold Box */}
              <div className="w-auto lg:w-full flex justify-center">
                <PiecePreview type={holdPiece} label="HOLD (보관)" />
              </div>
            </div>

            {/* CENTRAL PLAYING BOARD column */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
              <GameBoard 
                grid={grid} 
                activePiece={activePiece} 
                ghostY={ghostY}
                clearingRows={clearingRows}
              />

              {/* Pause Screen Overlay */}
              <AnimatePresence>
                {gameState === 'paused' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center gap-4 z-20 backdrop-blur-sm border-4 border-slate-800 m-2"
                  >
                    <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400">
                      <Pause className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-mono font-black text-white tracking-widest uppercase">
                      GAME PAUSED (일시정지)
                    </h3>
                    <p className="text-xs font-mono text-slate-400 max-w-xs text-center px-4">
                      ESC 키 또는 아래 버튼을 눌러 계속 진행할 수 있습니다.
                    </p>
                    <button
                      onClick={() => setGameState('playing')}
                      className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold tracking-widest rounded-xl uppercase transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                      RESUME (이어하기)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* DESKTOP RIGHT SIDEBAR: Next Box & Action Guides */}
            <div className="flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-4 lg:w-1/4">
              
              {/* Next Box */}
              <div className="w-auto lg:w-full flex justify-center lg:justify-start">
                <PiecePreview type={nextPiece} label="NEXT (다음)" />
              </div>

              {/* Pause, Settings and Control manual panel */}
              <div className="flex-1 w-full bg-slate-900/90 border-2 border-slate-800 rounded-2xl p-4 shadow-lg font-mono flex flex-col gap-2.5 min-w-[140px]">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 border-b border-slate-800 pb-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-pink-400" />
                  CONTROLS
                </div>

                {/* Keyboard Layout Helper */}
                <div className="hidden lg:flex flex-col gap-2 text-[10px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>방향 이동</span>
                    <span className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 font-bold">← / → / A / D</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>우회전 (Rotate CW)</span>
                    <span className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 font-bold">↑ / W / X</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>좌회전 (Rotate CCW)</span>
                    <span className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 font-bold">Z</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>부드러운 하강</span>
                    <span className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 font-bold">↓ / S</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>즉시 하강 (Hard Drop)</span>
                    <span className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 font-bold">Space</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>블럭 교체 (Hold)</span>
                    <span className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 font-bold">C / Shift</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-1.5">
                    <span>일시정지</span>
                    <span className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 font-bold">Esc / P</span>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-col gap-2 w-full mt-1">
                  <button
                    onClick={() => setGameState(gameState === 'playing' ? 'paused' : 'playing')}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5"
                  >
                    {gameState === 'playing' ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-slate-400" />
                        PAUSE (일시정지)
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                        RESUME (이어하기)
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('정말 게임을 포기하고 처음으로 돌아가시겠습니까?')) {
                        saveHighScore();
                        setGameState('menu');
                        if (requestRef.current) {
                          cancelAnimationFrame(requestRef.current);
                        }
                      }
                    }}
                    className="w-full py-2 bg-red-950/30 hover:bg-red-900 border border-red-900/40 rounded-xl text-[10px] font-bold text-red-300 uppercase transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    RESTART (포기/처음으로)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. GAME OVER OVERLAY SCREEN */}
        {gameState === 'game_over' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900/95 border-4 border-red-900 rounded-3xl p-6 shadow-2xl text-center backdrop-blur-md select-none my-auto"
          >
            <div className="w-14 h-14 bg-red-950/50 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500 mb-4 animate-bounce">
              🏆
            </div>
            <h2 className="text-2xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 tracking-widest uppercase">
              GAME OVER
            </h2>
            <p className="text-slate-400 text-xs font-mono mt-1">
              아쉽게도 게임이 종료되었습니다!
            </p>

            {/* Score Summary Box */}
            <div className="bg-slate-950/80 rounded-2xl border border-slate-900 p-4 font-mono my-5 grid grid-cols-3 gap-2">
              <div>
                <div className="text-[9px] text-slate-500 uppercase font-semibold">SCORE</div>
                <div className="text-base font-black text-white">{score.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase font-semibold">LEVEL</div>
                <div className="text-base font-black text-indigo-400">Lv.{level}</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase font-semibold">LINES</div>
                <div className="text-base font-black text-emerald-400">{lines}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={startNewGame}
                className="py-3.5 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-mono font-black tracking-widest text-xs uppercase rounded-xl shadow-lg transition-all active:scale-95"
              >
                TRY AGAIN (재도전)
              </button>
              
              <button
                onClick={() => setGameState('menu')}
                className="py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono font-bold tracking-widest text-xs uppercase rounded-xl transition-all"
              >
                MAIN MENU (메인 메뉴)
              </button>
            </div>

            {/* Top Scores preview immediately below Game Over card */}
            <div className="mt-6 border-t border-slate-800 pt-4 text-left">
              <Leaderboard scoreKey={HIGH_SCORES_KEY} refreshTrigger={leaderboardRefresh} />
            </div>
          </motion.div>
        )}

        {/* 4. ON-SCREEN CONTROLS ON MOBILE DEVICE VIEWS */}
        {(gameState === 'playing' || gameState === 'paused') && (
          <div className="w-full block lg:hidden">
            <MobileControls
              onMoveLeft={handleMoveLeft}
              onMoveRight={handleMoveRight}
              onRotateCW={handleRotateCW}
              onRotateCCW={handleRotateCCW}
              onSoftDropStart={handleSoftDrop}
              onSoftDropEnd={() => {}}
              onHardDrop={handleHardDrop}
              onHold={handleHold}
              disabled={gameState !== 'playing'}
            />
          </div>
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="px-4 text-center select-none mt-2">
        <p className="text-[9px] font-mono text-slate-600">
          TETRIS ARCADE Retro © 2026. Made with high precision React, TypeScript & Tailwind.
        </p>
      </footer>
    </div>
  );
}
