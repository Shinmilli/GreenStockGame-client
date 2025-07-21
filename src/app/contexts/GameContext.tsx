'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Team } from '../../types';

interface GameState {
  currentRound: number;
  maxRounds: number;
  hasCompletedQuiz: boolean[];
  team: Team | null;
}

interface GameContextType {
  gameState: GameState;
  setCurrentRound: (round: number) => void;
  completeQuiz: (round: number) => void;
  updateTeam: (team: Team) => void;
  resetGame: () => void;
  canAccessQuiz: (round: number) => boolean;
  getNextAction: () => { route: string; message: string };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>({
    currentRound: 1,
    maxRounds: 8,
    hasCompletedQuiz: Array(8).fill(false),
    team: null,
  });

  useEffect(() => {
    // 로컬 스토리지에서 게임 상태 복원
    const savedState = localStorage.getItem('gameState');
    const savedTeam = localStorage.getItem('teamData');
    
    if (savedState) {
      setGameState(JSON.parse(savedState));
    }
    if (savedTeam) {
      setGameState(prev => ({ ...prev, team: JSON.parse(savedTeam) }));
    }
  }, []);

  useEffect(() => {
    // 게임 상태 저장 (team 제외)
    const { team, ...stateToSave } = gameState;
    localStorage.setItem('gameState', JSON.stringify(stateToSave));
  }, [gameState]);

  const setCurrentRound = (round: number) => {
    setGameState(prev => ({ ...prev, currentRound: round }));
  };

  const completeQuiz = (round: number) => {
    setGameState(prev => {
      const newCompletedQuiz = [...prev.hasCompletedQuiz];
      newCompletedQuiz[round - 1] = true;
      return { ...prev, hasCompletedQuiz: newCompletedQuiz };
    });
  };

  const updateTeam = (team: Team) => {
    setGameState(prev => ({ ...prev, team }));
    localStorage.setItem('teamData', JSON.stringify(team));
  };

  const resetGame = () => {
    setGameState({
      currentRound: 1,
      maxRounds: 8,
      hasCompletedQuiz: Array(8).fill(false),
      team: null,
    });
    localStorage.removeItem('gameState');
  };

  const canAccessQuiz = (round: number) => {
    // 현재 라운드이고 아직 풀지 않은 퀴즈만 접근 가능
    return round === gameState.currentRound && !gameState.hasCompletedQuiz[round - 1];
  };

  const getNextAction = () => {
    const { currentRound, hasCompletedQuiz } = gameState;
    
    // 현재 라운드 퀴즈를 아직 안 풀었다면
    if (!hasCompletedQuiz[currentRound - 1]) {
      return { 
        route: '/quiz', 
        message: '퀴즈를 먼저 풀어주세요!' 
      };
    }
    
    // 모든 라운드가 끝났다면
    if (currentRound >= gameState.maxRounds && hasCompletedQuiz[gameState.maxRounds - 1]) {
      return { 
        route: '/ranking', 
        message: '게임이 종료되었습니다! 최종 순위를 확인하세요.' 
      };
    }
    
    // 퀴즈를 풀었다면 주식 거래로
    return { 
      route: '/stocks', 
      message: '주식 거래를 진행하세요!' 
    };
  };

  return (
    <GameContext.Provider value={{
      gameState,
      setCurrentRound,
      completeQuiz,
      updateTeam,
      resetGame,
      canAccessQuiz,
      getNextAction,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};