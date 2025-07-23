'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Team } from '../../types';

export type SimpleGamePhase = 'learning' | 'trading' | 'finished';

interface SimpleGameState {
  currentRound: number;
  phase: SimpleGamePhase;
  timeRemaining: number;
  isActive: boolean;
  team: Team | null;
  
  // 거래 가능 상태
  canTrade: boolean;
  
  // 진행 상태
  hasSeenNews: boolean;
  hasAnsweredQuiz: boolean;
  
  // UI 상태
  isLoading: boolean;
  error: string | null;
  showHelp: boolean;

  // 🔥 서버의 실제 phase 추가
  serverPhase: string;
}

interface SimpleGameContextType {
  gameState: SimpleGameState;
  updateTeam: (team: Team) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  toggleHelp: () => void;
  getNextAction: () => NextAction;
  refreshGameState: () => Promise<void>;
}

interface NextAction {
  type: 'news' | 'quiz' | 'trading' | 'finished' | 'wait';
  title: string;
  description: string;
  buttonText: string;
  route: string;
  color: string;
  icon: string;
  priority: number; // 우선순위 추가
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const SimpleGameContext = createContext<SimpleGameContextType | undefined>(undefined);

export function SimpleGameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<SimpleGameState>({
    currentRound: 1,
    phase: 'learning',
    timeRemaining: 0,
    isActive: false,
    team: null,
    canTrade: false,
    hasSeenNews: false,
    hasAnsweredQuiz: false,
    isLoading: false,
    error: null,
    showHelp: false,
    serverPhase: 'news', // 초기값
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // 🔥 게임 상태 가져오기 - 디버깅 강화
// 개선된 SimpleGameContext - 서버 기반 상태 관리

const fetchGameState = useCallback(async () => {
  try {
    console.log('🔄 API 요청 시작:', `${API_BASE_URL}/game/state`);
    
    const response = await fetch(`${API_BASE_URL}/game/state`);
    
    if (response.ok) {
      const serverState = await response.json();
      console.log('🎮 서버에서 받은 전체 상태:', serverState);
      
      const currentRound = serverState.currentRound;
      const serverPhase = serverState.phase;
      
      // 🔥 방법 2-1: 서버에서 개별 사용자 진행 상태도 받아오기
      let userProgress = null;
      try {
        const teamData = localStorage.getItem('teamData');
        if (teamData) {
          const team = JSON.parse(teamData);
          const progressResponse = await fetch(`${API_BASE_URL}/teams/${team.id}/progress/${currentRound}`);
          if (progressResponse.ok) {
            userProgress = await progressResponse.json();
            console.log('👤 사용자 진행 상태:', userProgress);
          }
        }
      } catch (error) {
        console.warn('⚠️ 사용자 진행 상태 조회 실패:', error);
      }
      
      // 🔥 방법 2-2: 서버 상태 우선, 로컬은 참고용으로만 사용
      let hasSeenNews = false;
      let hasAnsweredQuiz = false;
      
      if (userProgress) {
        // 서버에서 받은 진행 상태 사용
        hasSeenNews = userProgress.hasSeenNews || false;
        hasAnsweredQuiz = userProgress.hasAnsweredQuiz || false;
        console.log('📊 서버 기반 진행 상태 사용:', { hasSeenNews, hasAnsweredQuiz });
      } else {
        // 서버에서 진행 상태를 받을 수 없으면 로컬스토리지 사용
        const currentNewsKey = `news_read_r${currentRound}`;
        const currentQuizKey = `quiz_done_r${currentRound}`;
        
        hasSeenNews = localStorage.getItem(currentNewsKey) === 'true';
        hasAnsweredQuiz = localStorage.getItem(currentQuizKey) === 'true';
        
        console.log('📱 로컬스토리지 기반 진행 상태 사용:', { 
          hasSeenNews, 
          hasAnsweredQuiz,
          currentNewsKey,
          currentQuizKey
        });
      }
      
      // 🔥 방법 2-3: 단계별 강제 검증
      switch (serverPhase) {
        case 'news':
          // 뉴스 단계에서는 아무것도 완료되지 않았어야 함
          hasSeenNews = false;
          hasAnsweredQuiz = false;
          console.log('🔄 뉴스 단계 - 진행 상태 강제 초기화');
          break;
          
        case 'quiz':
          // 퀴즈 단계에서는 뉴스만 완료되었어야 함
          if (!hasSeenNews) {
            console.warn('⚠️ 퀴즈 단계인데 뉴스를 읽지 않았습니다! 동기화 문제 가능성');
            hasSeenNews = false; // 실제 상태 유지
          }
          hasAnsweredQuiz = false; // 퀴즈는 아직 미완료
          console.log('🔄 퀴즈 단계 - 퀴즈 상태 초기화');
          break;
          
        case 'trading':
          // 거래 단계에서는 둘 다 완료되었어야 함
          if (!hasSeenNews || !hasAnsweredQuiz) {
            console.warn('⚠️ 거래 단계인데 완료되지 않은 항목이 있습니다!');
          }
          // 거래 단계면 일단 모두 완료로 간주
          hasSeenNews = true;
          hasAnsweredQuiz = true;
          break;
      }
      
      console.log('📊 최종 결정된 상태:', {
        serverPhase,
        currentRound,
        hasSeenNews,
        hasAnsweredQuiz
      });
      
      setGameState(prev => ({
        currentRound,
        phase: serverPhase === 'trading' ? 'trading' : 'learning' as SimpleGamePhase,
        timeRemaining: serverState.timeRemaining,
        isActive: serverState.isActive,
        team: prev.team,
        canTrade: serverPhase === 'trading' && serverState.isActive,
        hasSeenNews,
        hasAnsweredQuiz,
        isLoading: false,
        error: null,
        showHelp: prev.showHelp,
        serverPhase,
      }));
    }
  } catch (error) {
    console.error('❌ 게임 상태 조회 실패:', error);
  }
}, []);

// 🔥 뉴스 읽기 완료 처리 개선
const markNewsAsRead = useCallback(async () => {
  const currentRound = gameState.currentRound;
  const newsKey = `news_read_r${currentRound}`;
  
  try {
    // 로컬스토리지에 저장
    localStorage.setItem(newsKey, 'true');
    console.log('✅ 로컬 뉴스 읽기 완료:', newsKey);
    
    // 🔥 서버에도 진행 상태 저장 (API가 있다면)
    const teamData = localStorage.getItem('teamData');
    if (teamData) {
      const team = JSON.parse(teamData);
      try {
        await fetch(`${API_BASE_URL}/teams/${team.id}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roundNumber: currentRound,
            type: 'news',
            completed: true
          })
        });
        console.log('✅ 서버 뉴스 진행 상태 저장 완료');
      } catch (error) {
        console.warn('⚠️ 서버 진행 상태 저장 실패:', error);
      }
    }
    
    // 게임 상태 새로고침
    await fetchGameState();
  } catch (error) {
    console.error('❌ 뉴스 읽기 완료 처리 실패:', error);
  }
}, [gameState.currentRound, fetchGameState]);

// 🔥 퀴즈 완료 처리 개선
const markQuizAsCompleted = useCallback(async () => {
  const currentRound = gameState.currentRound;
  const quizKey = `quiz_done_r${currentRound}`;
  
  try {
    localStorage.setItem(quizKey, 'true');
    console.log('✅ 로컬 퀴즈 완료:', quizKey);
    
    // 서버에도 저장
    const teamData = localStorage.getItem('teamData');
    if (teamData) {
      const team = JSON.parse(teamData);
      try {
        await fetch(`${API_BASE_URL}/teams/${team.id}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roundNumber: currentRound,
            type: 'quiz',
            completed: true
          })
        });
        console.log('✅ 서버 퀴즈 진행 상태 저장 완료');
      } catch (error) {
        console.warn('⚠️ 서버 진행 상태 저장 실패:', error);
      }
    }
    
    await fetchGameState();
  } catch (error) {
    console.error('❌ 퀴즈 완료 처리 실패:', error);
  }
}, [gameState.currentRound, fetchGameState]);

  // 🔥 다음 액션 결정 - 로직 완전 개선
  const getNextAction = useCallback((): NextAction => {
    console.log('🎯 액션 결정:', { 
      currentRound: gameState.currentRound, 
      serverPhase: gameState.serverPhase,
      isActive: gameState.isActive, 
      hasSeenNews: gameState.hasSeenNews,
      hasAnsweredQuiz: gameState.hasAnsweredQuiz
    });

    // 1. 게임 완전 종료
    if (gameState.currentRound > 8 || gameState.serverPhase === 'finished') {
      return {
        type: 'finished',
        title: '게임 끝! 🏆',
        description: '모든 라운드가 끝났어요! 최종 순위를 확인해보세요.',
        buttonText: '순위 보기',
        route: '/ranking',
        color: 'bg-gradient-to-r from-purple-500 to-pink-600',
        icon: '🏆',
        priority: 1
      };
    }

    // 2. 게임 비활성화
    if (!gameState.isActive) {
      return {
        type: 'wait',
        title: '게임 시작 대기 중... ⏳',
        description: '관리자가 게임을 시작할 때까지 기다려주세요.',
        buttonText: '새로고침',
        route: '/dashboard',
        color: 'bg-gradient-to-r from-gray-500 to-gray-600',
        icon: '⏳',
        priority: 2
      };
    }

    // 3. 서버 phase 기반 액션 결정 - 🔥 로직 강화
    switch (gameState.serverPhase) {
      case 'trading':
        return {
          type: 'trading',
          title: '주식 사고팔기 💰',
          description: '뉴스를 참고해서 환경에 좋은 회사 주식을 사고팔아요!',
          buttonText: '주식 거래하기',
          route: '/stocks',
          color: 'bg-gradient-to-r from-emerald-500 to-green-600',
          icon: '📈',
          priority: 3
        };

      case 'news':
        if (!gameState.hasSeenNews) {
          return {
            type: 'news',
            title: `라운드 ${gameState.currentRound} 뉴스 읽기 📰`,
            description: `라운드 ${gameState.currentRound}의 환경 뉴스를 읽고 어떤 회사 주식이 오르고 내릴지 생각해보세요!`,
            buttonText: '뉴스 읽기',
            route: '/events',
            color: 'bg-gradient-to-r from-blue-500 to-cyan-600',
            icon: '📰',
            priority: 4
          };
        } else {
          return {
            type: 'wait',
            title: '퀴즈 시작 대기 중... ⏳',
            description: `라운드 ${gameState.currentRound} 뉴스를 다 읽었어요! 관리자가 퀴즈를 시작할 때까지 기다려주세요.`,
            buttonText: '기다리기',
            route: '/dashboard',
            color: 'bg-gradient-to-r from-gray-500 to-gray-600',
            icon: '⏳',
            priority: 5
          };
        }

      case 'quiz':
        if (!gameState.hasAnsweredQuiz) {
          return {
            type: 'quiz',
            title: `라운드 ${gameState.currentRound} 환경 퀴즈 🧠`,
            description: `라운드 ${gameState.currentRound}의 간단한 환경 퀴즈를 풀고 보너스 돈을 받으세요!`,
            buttonText: '퀴즈 풀기',
            route: '/quiz',
            color: 'bg-gradient-to-r from-purple-500 to-violet-600',
            icon: '🧠',
            priority: 4
          };
        } else {
          return {
            type: 'wait',
            title: '거래 시작 대기 중... ⏳',
            description: `라운드 ${gameState.currentRound} 퀴즈를 다 풀었어요! 관리자가 거래를 시작할 때까지 기다려주세요.`,
            buttonText: '기다리기',
            route: '/dashboard',
            color: 'bg-gradient-to-r from-gray-500 to-gray-600',
            icon: '⏳',
            priority: 5
          };
        }

      case 'results':
        return {
          type: 'wait',
          title: `라운드 ${gameState.currentRound} 결과 발표 중... 📊`,
          description: '이번 라운드 결과를 확인하고 다음 라운드를 준비해주세요.',
          buttonText: '순위 확인',
          route: '/ranking',
          color: 'bg-gradient-to-r from-yellow-500 to-orange-600',
          icon: '📊',
          priority: 5
        };

      default:
        return {
          type: 'wait',
          title: '게임 진행 대기 중... ⏳',
          description: '관리자가 다음 단계를 시작할 때까지 기다려주세요.',
          buttonText: '기다리기',
          route: '/dashboard',
          color: 'bg-gradient-to-r from-gray-500 to-gray-600',
          icon: '⏳',
          priority: 6
        };
    }
  }, [gameState]);

  // 초기화 및 주기적 업데이트
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    console.log('🚀 SimpleGameContext 초기화 시작');
    isInitializedRef.current = true;
    
    // 팀 데이터 로드
    const savedTeamData = localStorage.getItem('teamData');
    if (savedTeamData) {
      try {
        const team = JSON.parse(savedTeamData);
        console.log('👥 팀 데이터 로드:', team);
        setGameState(prev => ({ ...prev, team }));
      } catch (error) {
        console.error('❌ 팀 데이터 파싱 실패:', error);
        localStorage.removeItem('teamData');
      }
    }
    
    // 첫 번째 게임 상태 로드
    fetchGameState();
    
    // 🔥 1초마다 업데이트 (관리자와 동일한 주기)
    console.log('⏰ 1초마다 게임 상태 업데이트 시작');
    intervalRef.current = setInterval(() => {
      console.log('🔄 주기적 게임 상태 업데이트');
      fetchGameState();
    }, 1000);
    
    return () => {
      console.log('🛑 SimpleGameContext 정리');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchGameState]);

  // 기본 액션들
  const updateTeam = useCallback((team: Team) => {
    console.log('👥 팀 정보 업데이트:', team);
    setGameState(prev => ({ ...prev, team }));
    localStorage.setItem('teamData', JSON.stringify(team));
  }, []);

  const setError = useCallback((error: string | null) => {
    console.log('❌ 에러 설정:', error);
    setGameState(prev => ({ ...prev, error }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    console.log('⏳ 로딩 상태 변경:', loading);
    setGameState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const toggleHelp = useCallback(() => {
    console.log('💡 도움말 토글');
    setGameState(prev => ({ ...prev, showHelp: !prev.showHelp }));
  }, []);

  const refreshGameState = useCallback(async () => {
    console.log('🔄 수동 게임 상태 새로고침');
    setLoading(true);
    await fetchGameState();
    setLoading(false);
  }, [fetchGameState, setLoading]);

  const contextValue = React.useMemo(() => {
    console.log('🔗 Context 값 업데이트');
    return {
      gameState,
      updateTeam,
      setError,
      setLoading,
      toggleHelp,
      getNextAction,
      refreshGameState,
    };
  }, [
    gameState,
    updateTeam,
    setError,
    setLoading,
    toggleHelp,
    getNextAction,
    refreshGameState,
  ]);

  return (
    <SimpleGameContext.Provider value={contextValue}>
      {children}
    </SimpleGameContext.Provider>
  );
}

export const useSimpleGame = () => {
  const context = useContext(SimpleGameContext);
  if (!context) {
    throw new Error('useSimpleGame must be used within SimpleGameProvider');
  }
  return context;
};

// GameGuide 컴포넌트 - 서버 상태도 표시
export function GameGuide() {
  const { gameState, getNextAction } = useSimpleGame();
  const nextAction = getNextAction();

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
          {nextAction.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{nextAction.title}</h3>
          <p className="text-gray-300">{nextAction.description}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">서버 상태</div>
          <div className="px-2 py-1 bg-gray-700 rounded text-xs font-bold text-yellow-400">
            {gameState.serverPhase.toUpperCase()}
          </div>
        </div>
      </div>
      
      {nextAction.type !== 'wait' && nextAction.type !== 'finished' && (
        <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 text-yellow-400">
            <span className="animate-pulse">✨</span>
            <span className="font-bold">지금 해야 할 일이에요!</span>
            <span className="animate-pulse">✨</span>
          </div>
        </div>
      )}
    </div>
  );
}

// GameHelpModal 컴포넌트
export function GameHelpModal() {
  const { gameState, toggleHelp } = useSimpleGame();
  
  if (!gameState.showHelp) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>💡</span>
            <span>게임 방법</span>
          </h2>
          <button
            onClick={toggleHelp}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🌱</div>
            <h3 className="text-xl font-bold text-white">ESG 투자 게임</h3>
            <p className="text-gray-300">환경에 좋은 회사에 투자해서 돈도 벌고 지구도 지켜요!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📰</div>
              <h4 className="font-bold text-blue-400 mb-2">1. 뉴스 읽기</h4>
              <p className="text-gray-300 text-sm">환경 뉴스를 읽고 어떤 회사가 좋은지 나쁜지 알아보세요</p>
            </div>
            
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🧠</div>
              <h4 className="font-bold text-purple-400 mb-2">2. 퀴즈 풀기</h4>
              <p className="text-gray-300 text-sm">간단한 환경 퀴즈를 맞추면 보너스 돈을 받아요</p>
            </div>
            
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">💰</div>
              <h4 className="font-bold text-emerald-400 mb-2">3. 주식 거래</h4>
              <p className="text-gray-300 text-sm">환경에 좋은 회사 주식을 사서 돈을 벌어요</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/30 rounded-xl p-4 text-center">
            <h4 className="font-bold text-yellow-400 mb-2">승리 조건</h4>
            <p className="text-gray-300">
              💰 가장 많은 돈을 번 팀 + 🌍 환경에 가장 많이 투자한 팀이 승리!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}