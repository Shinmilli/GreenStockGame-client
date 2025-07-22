'use client';
import React, { useState, useEffect } from 'react';

// 타입 정의
interface GameState {
  currentRound: number;
  phase: 'news' | 'quiz' | 'trading' | 'results' | 'finished';
  timeRemaining: number;
  isActive: boolean;
  startTime?: string;
  endTime?: string;
}

interface Team {
  id: number;
  code: string;
  name: string;
  balance: number;
  esgScore: number;
  quizScore: number;
}

interface NewsEvent {
  id: number;
  title: string;
  content: string;
  roundNumber: number;
  isActive: boolean;
  createdAt: string;
  affectedStocks: Record<string, number>;
}

interface DebugInfo {
  총키개수: number;
  게임관련키: number;
  상세내역: Array<{
    키: string;
    값: string | null;
    타입: string;
  }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function AdminDashboard() {
  // 🔥 모든 useState를 최상위에 선언
  const [gameState, setGameState] = useState<GameState>({
    currentRound: 1,
    phase: 'news',
    timeRemaining: 0,
    isActive: false
  });
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('control');
  const [logs, setLogs] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null); // 🔥 타입 지정 및 최상위 이동

  // 로그 추가 함수
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  // 🔥 로컬스토리지 분석 함수
  const analyzeLocalStorage = () => {
    const allKeys = Object.keys(localStorage);
    const gameKeys = allKeys.filter(key => 
      key.startsWith('news_') || key.startsWith('quiz_') || key.startsWith('team')
    );
    
    const analysis: DebugInfo = {
      총키개수: allKeys.length,
      게임관련키: gameKeys.length,
      상세내역: gameKeys.map(key => ({
        키: key,
        값: localStorage.getItem(key),
        타입: key.startsWith('news_') ? '뉴스' : key.startsWith('quiz_') ? '퀴즈' : '기타'
      }))
    };
    
    setDebugInfo(analysis);
    console.log('🔍 로컬스토리지 분석:', analysis);
    addLog(`🔍 로컬스토리지 분석 완료: ${analysis.게임관련키}개 항목 발견`);
    return analysis;
  };

  // 데이터 페칭 함수들
  const fetchGameState = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/game/state`);
      if (response.ok) {
        const data = await response.json();
        setGameState(data);
      }
    } catch (error) {
      addLog('게임 상태 조회 실패: ' + (error as Error).message);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      addLog('이벤트 조회 실패: ' + (error as Error).message);
    }
  };

  // 게임 컨트롤 함수들
  const startGame = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/game/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        addLog('✅ 게임 시작: ' + data.message);
        await fetchGameState();
      } else {
        const error = await response.json();
        addLog('❌ 게임 시작 실패: ' + error.message);
      }
    } catch (error) {
      addLog('❌ 게임 시작 오류: ' + (error as Error).message);
    }
  };

  const resetGame = async () => {
    if (!confirm('정말로 게임을 초기화하시겠습니까? 모든 데이터가 삭제됩니다.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/game/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        addLog('🔄 게임 리셋: ' + data.message);
        await fetchGameState();
      } else {
        const error = await response.json();
        addLog('❌ 게임 리셋 실패: ' + error.message);
      }
    } catch (error) {
      addLog('❌ 게임 리셋 오류: ' + (error as Error).message);
    }
  };

  const forceNextPhase = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/game/next-phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        addLog('⏭️ 페이즈 강제 이동: ' + data.message);
        await fetchGameState();
      } else {
        const error = await response.json();
        addLog('❌ 페이즈 이동 실패: ' + error.message);
      }
    } catch (error) {
      addLog('❌ 페이즈 이동 오류: ' + (error as Error).message);
    }
  };

  const triggerEvent = async (eventId: number, action: 'trigger' | 'activate' | 'deactivate') => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, action })
      });
      
      if (response.ok) {
        const data = await response.json();
        addLog(`📰 이벤트 ${action}: ${data.message}`);
        await fetchEvents();
      } else {
        const error = await response.json();
        addLog(`❌ 이벤트 ${action} 실패: ${error.message}`);
      }
    } catch (error) {
      addLog(`❌ 이벤트 ${action} 오류: ` + (error as Error).message);
    }
  };

  // 🔥 게임 데이터 정리 함수
  const clearAllGameData = () => {
    const gameKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('news_') || key.startsWith('quiz_')
    );
    
    const confirmation = confirm(
      `⚠️ 정말로 ${gameKeys.length}개의 게임 진행 데이터를 모두 삭제하시겠습니까?\n\n` +
      `이 작업은 되돌릴 수 없으며, 모든 학생들의 뉴스/퀴즈 진행 상태가 초기화됩니다.`
    );
    
    if (confirmation) {
      console.log('🗑️ 정리할 키들:', gameKeys);
      gameKeys.forEach(key => {
        console.log('삭제:', key, '=', localStorage.getItem(key));
        localStorage.removeItem(key);
      });
      addLog(`✅ ${gameKeys.length}개의 게임 데이터를 정리했습니다!`);
      alert(`✅ ${gameKeys.length}개의 게임 데이터를 정리했습니다!`);
      analyzeLocalStorage();
    }
  };

  // 초기 데이터 로드 및 실시간 업데이트
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchGameState(), fetchEvents()]);
      setLoading(false);
      addLog('🚀 관리자 대시보드 로드됨');
    };

    loadInitialData();
    
    // 게임 상태를 1초마다 업데이트
    const interval = setInterval(fetchGameState, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 시간 포맷 함수
  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 페이즈 정보
  const PHASE_INFO = {
    news: { title: '뉴스 발표', icon: '📰', color: 'bg-blue-500' },
    quiz: { title: '환경 퀴즈', icon: '🧠', color: 'bg-purple-500' },
    trading: { title: '거래 시간', icon: '💼', color: 'bg-green-500' },
    results: { title: '결과 발표', icon: '📊', color: 'bg-yellow-500' },
    finished: { title: '게임 종료', icon: '🏁', color: 'bg-gray-500' }
  };

  const currentPhase = PHASE_INFO[gameState.phase];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">관리자 대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚙️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ESG 게임 관리자</h1>
                <p className="text-gray-400">실시간 게임 제어 및 모니터링</p>
              </div>
            </div>
            
            {/* 게임 상태 표시 */}
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-full flex items-center space-x-2 ${currentPhase.color}`}>
                <span className="text-xl">{currentPhase.icon}</span>
                <span className="font-bold">{currentPhase.title}</span>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold font-mono">
                  {gameState.isActive ? formatTime(gameState.timeRemaining) : '--:--'}
                </div>
                <div className="text-sm text-gray-400">R{gameState.currentRound}/8</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex space-x-1">
          {[
            { id: 'control', label: '게임 제어', icon: '🎮' },
            { id: 'debug', label: '데이터 관리', icon: '🛠️' },
            { id: 'events', label: '이벤트 관리', icon: '📰' },
            { id: 'logs', label: '로그', icon: '📋' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-8">
        {/* 게임 제어 탭 */}
        {activeTab === 'control' && (
          <div className="space-y-8">
            {/* 게임 상태 카드 */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <span className="text-2xl mr-3">📊</span>
                현재 게임 상태
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center ${
                    gameState.isActive ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    <span className="text-3xl">{gameState.isActive ? '▶' : '||'}</span>
                  </div>
                  <p className="text-lg font-bold">
                    {gameState.isActive ? '게임 진행 중' : '게임 정지'}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className={`w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center ${currentPhase.color}`}>
                    <span className="text-3xl">{currentPhase.icon}</span>
                  </div>
                  <p className="text-lg font-bold">{currentPhase.title}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="text-2xl font-bold">{gameState.currentRound}</span>
                  </div>
                  <p className="text-lg font-bold">라운드 {gameState.currentRound}/8</p>
                </div>
              </div>
            </div>

            {/* 게임 컨트롤 버튼들 */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <span className="text-2xl mr-3">🎮</span>
                게임 컨트롤
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={startGame}
                  disabled={gameState.isActive}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span className="text-2xl">🚀</span>
                  <span>게임 시작</span>
                </button>
                
                <button
                  onClick={forceNextPhase}
                  disabled={!gameState.isActive || gameState.phase === 'finished'}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span className="text-2xl">⏭️</span>
                  <span>다음 단계</span>
                </button>
                
                <button
                  onClick={resetGame}
                  className="bg-red-600 hover:bg-red-700 px-6 py-4 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span className="text-2xl">🔄</span>
                  <span>게임 리셋</span>
                </button>
              </div>
            </div>

            {/* 진행 상황 */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <span className="text-2xl mr-3">🎯</span>
                게임 진행 상황
              </h2>
              
              <div className="flex items-center justify-center space-x-3 mb-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                      i < gameState.currentRound - 1
                        ? 'bg-green-600 text-white'
                        : i === gameState.currentRound - 1
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-gray-600 text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-700 rounded-full h-4 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${(gameState.currentRound / 8) * 100}%`
                  }}
                />
              </div>
              
              <p className="text-center text-gray-400">
                전체 진행률: {Math.round((gameState.currentRound / 8) * 100)}%
              </p>
            </div>
          </div>
        )}

        {/* 🔥 데이터 관리 탭 추가 */}
        {activeTab === 'debug' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <span className="text-2xl mr-3">🛠️</span>
                게임 데이터 관리
              </h2>
              
              {/* 빠른 액션 버튼들 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <button
                  onClick={clearAllGameData}
                  className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg text-white font-bold transition-all"
                >
                  🗑️ 모든 게임 데이터 정리
                </button>

                <button
                  onClick={() => {
                    const newsKeys = [];
                    for (let i = 1; i <= 8; i++) {
                      newsKeys.push(`news_read_r${i}`);
                    }
                    
                    const confirmation = confirm(
                      `모든 라운드의 뉴스 읽기 상태를 초기화하시겠습니까?\n(퀴즈 데이터는 유지됩니다)`
                    );
                    
                    if (confirmation) {
                      newsKeys.forEach(key => localStorage.removeItem(key));
                      addLog('📰 뉴스 데이터만 정리 완료');
                      alert('뉴스 읽기 상태를 모두 초기화했습니다!');
                      analyzeLocalStorage();
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg text-white font-bold transition-all"
                >
                  📰 뉴스 데이터만 정리
                </button>

                <button
                  onClick={() => {
                    const quizKeys = [];
                    for (let i = 1; i <= 8; i++) {
                      quizKeys.push(`quiz_done_r${i}`);
                    }
                    
                    const confirmation = confirm(
                      `모든 라운드의 퀴즈 완료 상태를 초기화하시겠습니까?\n(뉴스 데이터는 유지됩니다)`
                    );
                    
                    if (confirmation) {
                      quizKeys.forEach(key => localStorage.removeItem(key));
                      addLog('🧠 퀴즈 데이터만 정리 완료');
                      alert('퀴즈 완료 상태를 모두 초기화했습니다!');
                      analyzeLocalStorage();
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg text-white font-bold transition-all"
                >
                  🧠 퀴즈 데이터만 정리
                </button>

                <button
                  onClick={analyzeLocalStorage}
                  className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg text-white font-bold transition-all"
                >
                  🔍 상태 분석
                </button>
              </div>

              {/* 🔥 서버 데이터 관리 섹션 추가 */}
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-6">
                <h4 className="text-red-400 font-bold mb-4 flex items-center">
                  <span className="text-xl mr-2">🗄️</span>
                  서버 데이터 관리 (위험)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={async () => {
                      const confirmation = confirm(
                        '⚠️ 서버의 모든 퀴즈 제출 기록을 삭제하시겠습니까?\n\n' +
                        '이 작업은 데이터베이스의 퀴즈 답안 및 보상 기록을 모두 삭제합니다.'
                      );
                      
                      if (confirmation) {
                        try {
                          const response = await fetch(`${API_BASE_URL}/quiz/admin/clear-all`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            addLog(`🗑️ 서버 퀴즈 기록 삭제: ${result.message}`);
                            alert(result.message);
                          } else {
                            const error = await response.json();
                            addLog('❌ 서버 퀴즈 삭제 실패: ' + error.message);
                            alert('서버 데이터 삭제 실패: ' + error.message);
                          }
                        } catch (error) {
                          addLog('❌ 서버 통신 오류: ' + error.message);
                          alert('서버 통신 오류: ' + error.message);
                        }
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg text-white font-bold transition-all"
                  >
                    🗄️ 서버 퀴즈 기록 삭제
                  </button>

                  <button
                    onClick={async () => {
                      const teamId = prompt('삭제할 팀 ID를 입력하세요:');
                      const round = prompt('삭제할 라운드를 입력하세요 (1-8):');
                      
                      if (teamId && round && !isNaN(parseInt(teamId)) && !isNaN(parseInt(round))) {
                        const confirmation = confirm(
                          `팀 ${teamId}의 라운드 ${round} 퀴즈 기록을 삭제하시겠습니까?`
                        );
                        
                        if (confirmation) {
                          try {
                            const response = await fetch(`${API_BASE_URL}/quiz/admin/teams/${teamId}/quiz/${round}`, {
                              method: 'DELETE'
                            });
                            
                            if (response.ok) {
                              const result = await response.json();
                              addLog(`🗑️ 특정 팀 퀴즈 삭제: ${result.message}`);
                              alert(result.message);
                            } else {
                              const error = await response.json();
                              addLog('❌ 팀 퀴즈 삭제 실패: ' + error.message);
                              alert('삭제 실패: ' + error.message);
                            }
                          } catch (error) {
                            addLog('❌ 서버 통신 오류: ' + error.message);
                            alert('서버 통신 오류: ' + error.message);
                          }
                        }
                      } else {
                        alert('올바른 팀 ID와 라운드를 입력해주세요.');
                      }
                    }}
                    className="bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded-lg text-white font-bold transition-all"
                  >
                    👤 특정 팀 퀴즈 삭제
                  </button>
                </div>
              </div>

              {/* 분석 결과 표시 */}
              {debugInfo && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-white mb-4">📊 분석 결과</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-600 rounded p-3">
                      <div className="text-gray-300 text-sm">전체 로컬스토리지 키</div>
                      <div className="text-white text-2xl font-bold">{debugInfo.총키개수}개</div>
                    </div>
                    <div className="bg-gray-600 rounded p-3">
                      <div className="text-gray-300 text-sm">게임 관련 키</div>
                      <div className="text-yellow-400 text-2xl font-bold">{debugInfo.게임관련키}개</div>
                    </div>
                  </div>
                  
                  {debugInfo.상세내역.length > 0 && (
                    <div>
                      <h5 className="text-white font-bold mb-2">상세 내역:</h5>
                      <div className="max-h-40 overflow-y-auto">
                        {debugInfo.상세내역.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-1 border-b border-gray-600 text-sm">
                            <span className="text-gray-300 font-mono">{item.키}</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              item.타입 === '뉴스' ? 'bg-blue-600' : 
                              item.타입 === '퀴즈' ? 'bg-purple-600' : 'bg-gray-600'
                            }`}>
                              {item.타입}
                            </span>
                            <span className="text-white">{item.값}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 이벤트 관리 탭 */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <span className="text-2xl mr-3">📰</span>
                ESG 뉴스 이벤트 관리
              </h2>
              
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📰</div>
                  <p className="text-gray-400 text-lg">등록된 이벤트가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            event.isActive ? 'bg-green-600' : 'bg-red-600'
                          }`}>
                            R{event.roundNumber}
                          </span>
                          <h3 className="text-lg font-bold text-white">{event.title}</h3>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => triggerEvent(event.id, 'trigger')}
                            disabled={!event.isActive}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm font-bold"
                          >
                            적용
                          </button>
                          <button
                            onClick={() => triggerEvent(event.id, event.isActive ? 'deactivate' : 'activate')}
                            className={`px-3 py-1 rounded text-sm font-bold ${
                              event.isActive
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {event.isActive ? '비활성화' : '활성화'}
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-3">{event.content}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(event.affectedStocks).map(([symbol, change]) => (
                          <span
                            key={symbol}
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              change > 0 ? 'bg-green-600' : 'bg-red-600'
                            }`}
                          >
                            {symbol}: {change > 0 ? '+' : ''}{change}%
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 로그 탭 */}
        {activeTab === 'logs' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <span className="text-2xl mr-3">📋</span>
                시스템 로그
              </h2>
              <button
                onClick={() => setLogs([])}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold"
              >
                로그 지우기
              </button>
            </div>
            
            <div className="bg-black rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-400">로그가 없습니다.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-green-400 mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}