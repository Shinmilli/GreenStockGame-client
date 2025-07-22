// components/GamePhaseIndicator.tsx
'use client';

import { useEffect, useState } from 'react';

interface GameState {
  currentRound: number;
  phase: 'news' | 'quiz' | 'trading' | 'results' | 'finished';
  timeRemaining: number;
  isActive: boolean;
}

interface GamePhaseIndicatorProps {
  gameState: GameState;
  className?: string;
}

const PHASE_INFO = {
  news: { 
    title: '뉴스 발표', 
    icon: '📰', 
    color: 'bg-gradient-blue',
    description: 'ESG 뉴스가 발표되고 주가에 즉시 반영됩니다'
  },
  quiz: { 
    title: '환경 퀴즈', 
    icon: '🧠', 
    color: 'bg-gradient-purple',
    description: '정답을 맞추면 투자금의 2% 보너스를 획득합니다'
  },
  trading: { 
    title: '거래 시간', 
    icon: '💼', 
    color: 'bg-gradient-emerald',
    description: '주식을 매수/매도할 수 있는 시간입니다'
  },
  results: { 
    title: '결과 발표', 
    icon: '📊', 
    color: 'bg-gradient-gold',
    description: '이번 라운드 결과를 확인하세요'
  },
  finished: { 
    title: '게임 종료', 
    icon: '🏁', 
    color: 'bg-gradient-to-r from-purple-500 to-pink-600',
    description: '최종 순위가 발표되었습니다'
  }
};

export default function GamePhaseIndicator({ gameState, className = '' }: GamePhaseIndicatorProps) {
  const [timeDisplay, setTimeDisplay] = useState('');

  useEffect(() => {
    const formatTime = (ms: number) => {
      const totalSeconds = Math.ceil(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    setTimeDisplay(formatTime(gameState.timeRemaining));
  }, [gameState.timeRemaining]);

  if (!gameState.isActive && gameState.phase !== 'finished') {
    return (
      <div className={`card-glass text-center ${className}`}>
        <div className="p-6">
          <div className="text-4xl mb-3">⏸️</div>
          <h3 className="text-xl font-bold text-gold-300 mb-2">게임 대기 중</h3>
          <p className="text-dark-200">게임이 시작되기를 기다리고 있습니다</p>
        </div>
      </div>
    );
  }

  const phaseInfo = PHASE_INFO[gameState.phase];
  const isUrgent = gameState.timeRemaining < 30000; // 30초 미만

  return (
    <div className={`card-glass ${className} ${isUrgent ? 'animate-pulse border-red-400 border-2' : ''}`}>
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${phaseInfo.color} rounded-xl flex items-center justify-center text-2xl`}>
              {phaseInfo.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gold-300">{phaseInfo.title}</h3>
              <p className="text-dark-200 text-sm">라운드 {gameState.currentRound}/8</p>
            </div>
          </div>
          
          {/* 타이머 */}
          {gameState.phase !== 'finished' && (
            <div className={`text-right ${isUrgent ? 'text-red-400' : 'text-gold-300'}`}>
              <div className="text-3xl font-bold font-mono">
                {timeDisplay}
              </div>
              <div className="text-sm opacity-75">남은 시간</div>
            </div>
          )}
        </div>

        {/* 설명 */}
        <p className="text-dark-200 text-center mb-4">
          {phaseInfo.description}
        </p>

        {/* 진행 바 */}
        <div className="bg-dark-700 rounded-full h-2 mb-4 overflow-hidden">
          <div 
            className={`h-full ${phaseInfo.color} transition-all duration-1000 ease-linear`}
            style={{ 
              width: gameState.phase === 'finished' ? '100%' : 
                     gameState.timeRemaining > 0 ? 
                     `${100 - (gameState.timeRemaining / getPhaseDuration(gameState.phase)) * 100}%` : '100%' 
            }}
          />
        </div>

        {/* 상태별 액션 */}
        {gameState.phase === 'quiz' && (
          <div className="text-center">
            <span className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm">
              🚀 퀴즈 페이지로 이동하여 참여하세요!
            </span>
          </div>
        )}

        {gameState.phase === 'trading' && (
          <div className="text-center">
            <span className="bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full text-sm">
              📈 거래 페이지에서 주식을 사고팔 수 있습니다!
            </span>
          </div>
        )}

        {gameState.phase === 'results' && (
          <div className="text-center">
            <span className="bg-gold-500/20 text-gold-300 px-4 py-2 rounded-full text-sm">
              📊 랭킹 페이지에서 이번 라운드 결과를 확인하세요!
            </span>
          </div>
        )}

        {gameState.phase === 'finished' && (
          <div className="text-center">
            <span className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm">
              🏆 최종 순위가 발표되었습니다!
            </span>
          </div>
        )}
      </div>

      {/* 긴급 알림 */}
      {isUrgent && gameState.phase !== 'finished' && (
        <div className="bg-red-500/10 border-t border-red-500/30 p-3">
          <div className="flex items-center justify-center space-x-2 text-red-400">
            <span className="animate-pulse">⚠️</span>
            <span className="font-bold text-sm">시간이 얼마 남지 않았습니다!</span>
          </div>
        </div>
      )}
    </div>
  );
}

function getPhaseDuration(phase: string): number {
  const durations = {
    news: 30000,
    quiz: 120000,
    trading: 300000,
    results: 30000
  };
  return durations[phase as keyof typeof durations] || 30000;
}