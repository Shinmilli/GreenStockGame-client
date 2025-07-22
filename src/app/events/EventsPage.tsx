'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../components/lib/api';

interface NewsEvent {
  id: number;
  title: string;
  content?: string | null;
  affectedStocks: Record<string, number>;
  roundNumber: number;
  createdAt: string;
}

interface TeamData {
  id: number;
  code: string;
  name: string;
}

// 🔥 수정: GameState 인터페이스에 serverPhase 추가
interface GameState {
  currentRound: number;
  isActive: boolean;
  phase: string;
  serverPhase?: string; // 🔥 추가
  timeRemaining: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    currentRound: 1,
    isActive: false,
    phase: 'news',
    serverPhase: 'news', // 🔥 추가
    timeRemaining: 0
  });
  
  const router = useRouter();

  useEffect(() => {
    const savedTeamData = localStorage.getItem('teamData');
    if (!savedTeamData) {
      router.push('/login');
      return;
    }
    
    const team = JSON.parse(savedTeamData);
    setTeamData(team);
    
    loadGameData();
  }, [router, selectedRound]);

  const loadGameData = async () => {
    try {
      const gameData = await api.getGameState();
      setGameState(prev => ({
        ...prev,
        ...gameData,
        serverPhase: gameData.phase // 🔥 serverPhase 설정
      }));
      
      await fetchEvents();
    } catch (error) {
      console.error('게임 데이터 로드 실패:', error);
      setError('게임 데이터를 불러오는데 실패했습니다.');
    }
  };

  const fetchEvents = async () => {
    try {
      setError('');
      
      // selectedRound가 null이면 현재 라운드만 가져오기
      const roundToFetch = selectedRound || gameState.currentRound;
      
      console.log('📰 이벤트 요청:', {
        selectedRound,
        currentRound: gameState.currentRound,
        roundToFetch
      });
      
      const data = await api.getEvents(roundToFetch);
      
      // 현재 라운드보다 높은 라운드의 이벤트 제거
      const filteredData = data.filter(event => 
        event.roundNumber <= gameState.currentRound
      );
      
      console.log('📊 필터링된 이벤트:', {
        전체: data.length,
        필터링후: filteredData.length,
        currentRound: gameState.currentRound
      });
      
      setEvents(filteredData);
    } catch (error) {
      console.error('이벤트 조회 실패:', error);
      setError('이벤트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 헬퍼 함수들
  function getEventIcon(roundNumber: number) {
    const icons: Record<number, string> = {
      1: '🌱', 2: '⚡', 3: '💧', 4: '🏭',
      5: '♻️', 6: '🌍', 7: '🔋', 8: '🎯'
    };
    return icons[roundNumber] || '📰';
  }

  function getEventGradient(roundNumber: number) {
    const gradients: Record<number, string> = {
      1: 'bg-gradient-to-r from-emerald-500 to-green-600',
      2: 'bg-gradient-to-r from-yellow-500 to-orange-600',
      3: 'bg-gradient-to-r from-blue-500 to-cyan-600',
      4: 'bg-gradient-to-r from-gray-500 to-slate-600',
      5: 'bg-gradient-to-r from-emerald-600 to-teal-600',
      6: 'bg-gradient-to-r from-teal-500 to-cyan-600',
      7: 'bg-gradient-to-r from-purple-500 to-violet-600',
      8: 'bg-gradient-to-r from-pink-500 to-rose-600'
    };
    return gradients[roundNumber] || 'bg-gradient-to-r from-gray-500 to-gray-600';
  }

  function getStockImpactStyle(change: number) {
    if (change > 0) return 'border-emerald-400/30';
    if (change < 0) return 'border-red-400/30';
    return 'border-gray-400/30';
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 현재 라운드까지의 라운드 배열 생성
  const rounds = Array.from({length: gameState.currentRound}, (_, i) => i + 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl font-medium">이벤트를 불러오는 중...</p>
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
              <Link 
                href="/dashboard"
                className="w-10 h-10 rounded-xl bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200"
              >
                ←
              </Link>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📰</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ESG 뉴스 & 이벤트</h1>
                <p className="text-gray-400">현재 라운드 <span className="text-blue-400 font-bold">{gameState.currentRound}</span></p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-full flex items-center space-x-2 ${
                gameState.isActive ? 'bg-green-600' : 'bg-red-600'
              }`}>
                <span className="text-xl">🎮</span>
                <span className="font-bold text-white">
                  라운드 {gameState.currentRound}/8
                </span>
              </div>
              
              <button 
                onClick={loadGameData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg text-white font-bold transition-all duration-200"
              >
                🔄 새로고침
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-6xl mx-auto">
        {error && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">❌</span>
              <span className="text-red-400 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* 라운드 필터 */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="text-2xl mr-3">🎯</span>
            라운드별 필터
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedRound(null)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                selectedRound === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              현재 라운드 ({gameState.currentRound})
            </button>
            
            {/* 현재 라운드까지만 표시 */}
            {rounds.map(round => (
              <button
                key={round}
                onClick={() => setSelectedRound(round)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                  selectedRound === round
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                <span className="text-lg">{getEventIcon(round)}</span>
                <span>R{round}</span>
              </button>
            ))}
            
            {/* 미래 라운드들을 비활성화 상태로 표시 */}
            {gameState.currentRound < 8 && (
              <>
                {Array.from({length: 8 - gameState.currentRound}, (_, i) => gameState.currentRound + i + 1).map(round => (
                  <button
                    key={round}
                    disabled
                    className="px-4 py-2 rounded-xl font-medium bg-gray-800 text-gray-500 cursor-not-allowed opacity-50 flex items-center space-x-2"
                  >
                    <span className="text-lg">🔒</span>
                    <span>R{round}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* 이벤트 목록 */}
        <div className="space-y-6">
          {events.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-16 border border-gray-700 text-center">
              <div className="text-6xl mb-6">📰</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {selectedRound 
                  ? `라운드 ${selectedRound}` 
                  : `현재 라운드 (${gameState.currentRound})`}에는 아직 이벤트가 없습니다.
              </h3>
              <p className="text-gray-400 text-lg">새로운 ESG 뉴스를 기다려주세요!</p>
              
              {/* 🔥 뉴스 읽기 완료 처리 버튼 추가 */}
              {!selectedRound && gameState.serverPhase === 'news' && (
                <button
                  onClick={() => {
                    const newsKey = `news_read_r${gameState.currentRound}`;
                    localStorage.setItem(newsKey, 'true');
                    console.log('✅ 뉴스 읽기 완료 처리:', newsKey);
                    // 게임 상태 새로고침
                    loadGameData();
                  }}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl text-white font-bold transition-all duration-200"
                >
                  뉴스 읽기 완료로 표시
                </button>
              )}
              
              {/* 🔥 디버깅 버튼들 추가 */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => {
                    const currentRound = gameState.currentRound;
                    const newsKey = `news_read_r${currentRound}`;
                    const quizKey = `quiz_done_r${currentRound}`;
                    
                    console.log('🔍 로컬스토리지 디버깅:', {
                      currentRound,
                      newsKey,
                      quizKey,
                      newsValue: localStorage.getItem(newsKey),
                      quizValue: localStorage.getItem(quizKey),
                      모든키들: Object.keys(localStorage).filter(key => key.startsWith('news_') || key.startsWith('quiz_'))
                    });
                    
                    alert(`라운드 ${currentRound}:\n뉴스: ${localStorage.getItem(newsKey)}\n퀴즈: ${localStorage.getItem(quizKey)}`);
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-white text-sm font-bold"
                >
                  🔍 디버그
                </button>
                
                <button
                  onClick={() => {
                    const currentRound = gameState.currentRound;
                    const newsKey = `news_read_r${currentRound}`;
                    const quizKey = `quiz_done_r${currentRound}`;
                    
                    localStorage.removeItem(newsKey);
                    localStorage.removeItem(quizKey);
                    
                    console.log('🗑️ 현재 라운드 상태 초기화:', {currentRound, newsKey, quizKey});
                    loadGameData();
                  }}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white text-sm font-bold"
                >
                  🗑️ 초기화
                </button>
              </div>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-blue-500/50 transition-all duration-300">
                {/* 이벤트 헤더 */}
                <div className={`${getEventGradient(event.roundNumber)} p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <span className="text-3xl">{getEventIcon(event.roundNumber)}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
                        <div className="flex items-center space-x-4 text-white/80">
                          <span>라운드 {event.roundNumber}</span>
                          <span>•</span>
                          <span>{formatDate(event.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {event.roundNumber === gameState.currentRound && (
                      <div className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm animate-pulse">
                        🔴 LIVE
                      </div>
                    )}
                  </div>
                </div>

                {/* 이벤트 내용 */}
                <div className="p-6">
                  {event.content && (
                    <div className="mb-6">
                      <p className="text-gray-300 text-lg leading-relaxed">{event.content}</p>
                      
                      {/* 🔥 뉴스 읽기 완료 처리 버튼 - 개별 이벤트에서 */}
                      {event.roundNumber === gameState.currentRound && gameState.serverPhase === 'news' && (
                        <div className="mt-4 p-4 bg-blue-600/10 border border-blue-400/30 rounded-lg">
                          <button
                            onClick={() => {
                              const newsKey = `news_read_r${gameState.currentRound}`;
                              localStorage.setItem(newsKey, 'true');
                              console.log('✅ 뉴스 읽기 완료 처리:', newsKey);
                              loadGameData();
                            }}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-bold transition-all duration-200"
                          >
                            ✅ 이 뉴스를 읽었어요
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 영향받는 주식들 */}
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                      <span className="text-xl mr-2">📈</span>
                      주가 영향
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(event.affectedStocks).map(([symbol, change]) => (
                        <div 
                          key={symbol}
                          className={`bg-gray-700 rounded-xl p-4 border transition-all duration-300 hover:scale-105 ${getStockImpactStyle(change)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-lg text-white">{symbol}</span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              change > 0 ? 'bg-emerald-500' : change < 0 ? 'bg-red-500' : 'bg-gray-500'
                            }`}>
                              <span className="text-white font-bold text-sm">
                                {change > 0 ? '↗' : change < 0 ? '↘' : '→'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-2xl text-white">
                              {change > 0 ? '+' : ''}{change}%
                            </p>
                            <p className="text-sm text-gray-400">
                              {change > 0 ? '상승' : change < 0 ? '하락' : '변동없음'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Link href="/stocks">
            <div className="bg-gray-800 border border-gray-700 hover:border-emerald-500/50 rounded-xl p-6 text-center cursor-pointer transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-3xl">📈</span>
                <span className="text-xl font-bold text-emerald-400">거래하기</span>
              </div>
            </div>
          </Link>
          <Link href="/ranking">
            <div className="bg-gray-800 border border-gray-700 hover:border-yellow-500/50 rounded-xl p-6 text-center cursor-pointer transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-3xl">🏆</span>
                <span className="text-xl font-bold text-yellow-400">랭킹보기</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}