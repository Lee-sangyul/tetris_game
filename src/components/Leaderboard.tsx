import React, { useEffect, useState } from 'react';
import { HighScore } from '../types';
import { Trophy, Calendar, Zap, ListOrdered, Trash2 } from 'lucide-react';

interface LeaderboardProps {
  scoreKey: string;
  refreshTrigger: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ scoreKey, refreshTrigger }) => {
  const [highScores, setHighScores] = useState<HighScore[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(scoreKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as HighScore[];
        // Sort highest first
        const sorted = parsed.sort((a, b) => b.score - a.score).slice(0, 5);
        setHighScores(sorted);
      } catch (e) {
        console.error('Error parsing high scores', e);
      }
    }
  }, [scoreKey, refreshTrigger]);

  const clearLeaderboard = () => {
    if (window.confirm('정말로 모든 최고 기록을 삭제하시겠습니까?')) {
      localStorage.removeItem(scoreKey);
      setHighScores([]);
    }
  };

  return (
    <div className="bg-slate-900/95 border-2 border-slate-800 rounded-3xl p-5 shadow-xl select-none w-full max-w-[340px] md:max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          <h2 className="text-sm font-mono font-bold tracking-widest text-white uppercase">
            HALL OF FAME (최고 기록)
          </h2>
        </div>
        {highScores.length > 0 && (
          <button
            onClick={clearLeaderboard}
            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
            title="기록 초기화"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {highScores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/40">
          <Trophy className="w-10 h-10 text-slate-700 mb-2" />
          <p className="text-xs font-mono text-slate-500">
            기록된 점수가 없습니다.
          </p>
          <p className="text-[10px] font-mono text-slate-600 mt-1">
            첫 번째 플레이를 완료하여 기록을 세워보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {highScores.map((record, index) => {
            const isTop = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            let rankColor = 'text-slate-500';
            let bgStyle = 'bg-slate-950/30 border-slate-950/20';

            if (isTop) {
              rankColor = 'text-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]';
              bgStyle = 'bg-yellow-500/5 border-yellow-500/20';
            } else if (isSecond) {
              rankColor = 'text-slate-300';
              bgStyle = 'bg-slate-400/5 border-slate-400/20';
            } else if (isThird) {
              rankColor = 'text-amber-600';
              bgStyle = 'bg-amber-700/5 border-amber-700/20';
            }

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-xl border font-mono transition-all duration-300 ${bgStyle}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 text-center font-black text-sm ${rankColor}`}>
                    {isTop ? '🏆' : index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-200">
                      {record.score.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">pts</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-semibold mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 text-indigo-400" />
                        Lv.{record.level}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <ListOrdered className="w-2.5 h-2.5 text-emerald-400" />
                        {record.lines} lines
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[9px] text-slate-500 bg-slate-950/50 px-2 py-1 rounded-md">
                  <Calendar className="w-2.5 h-2.5 text-slate-600" />
                  {record.date}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
