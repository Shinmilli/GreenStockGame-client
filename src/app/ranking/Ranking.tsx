'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../components/lib/api';

interface TeamRanking {
  id: number;
  code: string;
  name: string;
  balance: number;
  portfolioValue: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  esgScore: number;
  quizScore: number;
  totalScore: number;
  rank: number;
}

interface TeamData {
  id: number;
  code: string;
  name: string;
}

interface GameState {
  currentRound: number;
  phase: string;
  isActive: boolean;
  timeRemaining: number;
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState<TeamRanking | null>(null);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentRound: 1,
    phase: 'trading',
    isActive: true,
    timeRemaining: 0
  });
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const router = useRouter();

  useEffect(() => {
    const savedTeamData = localStorage.getItem('teamData');
    if (!savedTeamData) {
      router.push('/login');
      return;
    }
    
    const team = JSON.parse(savedTeamData);
    setTeamData(team);
    fetchData();

    const interval = setInterval(fetchData, 10000); // 10초마다 업데이트
    return () => clearInterval(interval);
  }, [router]);

  const fetchData = async () => {
    try {
      setError('');
      
      // 게임 상태와 랭킹 동시 로드
      const [gameData, rankingData] = await Promise.all([
        api.getGameState(),
        api.getRanking()
      ]);
      
      setGameState(gameData);
      setRankings(rankingData);
      setLastUpdated(new Date());
      
      if (teamData) {
        const myTeamRank = rankingData.find((t: TeamRanking) => t.id === teamData.id);
        setMyTeam(myTeamRank || null);
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈'; 
      case 3: return '🥉';
      default: return `${rank}위`;
    }
  };

  const getRankGradient = (rank: number) => {
    switch(rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500 to-orange-600';
      case 2: return 'bg-gradient-to-r from-gray-400 to-gray-600';
      case 3: return 'bg-gradient-to-r from-orange-400 to-red-500';
      default: return 'bg-gradient-to-r from-blue-500 to-purple-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl font-medium">랭킹을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 🎨 관리자 스타일 헤더 */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="w-10 h-10 rounded-xl bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200"
              >
                ←
              </button>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">실시간 ESG 랭킹</h1>
                <p className="text-gray-400">라운드 <span className="text-yellow-400 font-bold">{gameState.currentRound}</span> • 총 {rankings.length}개 팀 참가</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">마지막 업데이트</div>
                <div className="text-lg font-bold text-yellow-400">
                  {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
              
              <button 
                onClick={fetchData}
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

        {/* 내 팀 순위 (상단 고정) */}
        {myTeam && (
          <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
              <span className="text-2xl mr-3">👑</span>
              내 팀 현재 순위
            </h2>
            
            <div className={`${getRankGradient(myTeam.rank)} p-6 rounded-xl`}>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-3xl">{getRankIcon(myTeam.rank)}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{myTeam.name}</h3>
                    <div className="flex items-center space-x-4 text-white/80">
                      <span>팀 코드: {myTeam.code}</span>
                      <span>•</span>
                      <span>총점: {myTeam.totalScore}점</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold mb-1">{myTeam.rank}위</div>
                  <div className={`text-lg font-bold ${myTeam.profitLoss >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {formatPercent(myTeam.profitLossPercent)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                  <div className="text-sm text-white/80 mb-1">총 자산</div>
                  <div className="text-lg font-bold">{formatCurrency(myTeam.totalValue)}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                  <div className="text-sm text-white/80 mb-1">손익</div>
                  <div className={`text-lg font-bold ${myTeam.profitLoss >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {myTeam.profitLoss >= 0 ? '+' : ''}{formatCurrency(myTeam.profitLoss)}
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                  <div className="text-sm text-white/80 mb-1">ESG 점수</div>
                  <div className="text-lg font-bold text-green-200">{myTeam.esgScore}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                  <div className="text-sm text-white/80 mb-1">퀴즈 점수</div>
                  <div className="text-lg font-bold text-blue-200">{myTeam.quizScore}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 전체 랭킹 목록 */}
        <div className="space-y-6">
          {rankings.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-16 border border-gray-700 text-center">
              <div className="text-6xl mb-6">🏆</div>
              <h3 className="text-2xl font-bold text-white mb-4">랭킹 정보를 불러오는 중입니다.</h3>
              <p className="text-gray-400 text-lg">잠시만 기다려주세요!</p>
            </div>
          ) : (
            rankings.map((team) => (
              <div 
                key={team.id}
                className={`bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-yellow-500/50 transition-all duration-300 ${
                  myTeam?.id === team.id ? 'ring-2 ring-yellow-400/50' : ''
                }`}
              >
                {/* 팀 헤더 */}
                <div className={`${getRankGradient(team.rank)} p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <span className="text-3xl">{getRankIcon(team.rank)}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-2xl font-bold text-white">{team.name}</h3>
                          {myTeam?.id === team.id && (
                            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">내 팀</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-white/80">
                          <span>팀 코드: {team.code}</span>
                          <span>•</span>
                          <span>총점: {team.totalScore}점</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-white">
                      <div className="text-3xl font-bold mb-1">{team.rank}위</div>
                      <div className={`text-lg font-bold ${
                        team.profitLoss >= 0 ? 'text-green-200' : 'text-red-200'
                      }`}>
                        {formatPercent(team.profitLossPercent)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 팀 상세 정보 */}
                <div className="p-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-400 mb-2">총 자산</div>
                      <div className="text-lg font-bold text-white">
                        {formatCurrency(team.totalValue)}
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-400 mb-2">손익</div>
                      <div className={`text-lg font-bold ${
                        team.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {team.profitLoss >= 0 ? '+' : ''}{formatCurrency(team.profitLoss)}
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-400 mb-2">ESG 투자점수</div>
                      <div className="text-lg font-bold text-emerald-400">{team.esgScore}</div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-400 mb-2">퀴즈 점수</div>
                      <div className="text-lg font-bold text-blue-400">{team.quizScore}</div>
                    </div>
                  </div>

                  {/* 순위 특별 표시 */}
                  {team.rank <= 3 && (
                    <div className="mt-4 text-center">
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                        team.rank === 1 
                          ? 'bg-yellow-500 text-yellow-900' 
                          : team.rank === 2 
                          ? 'bg-gray-400 text-gray-900' 
                          : 'bg-orange-400 text-orange-900'
                      }`}>
                        {team.rank === 1 && '🏆 1위 - 최고의 ESG 투자자!'}
                        {team.rank === 2 && '🥈 2위 - 훌륭한 성과!'}
                        {team.rank === 3 && '🥉 3위 - 계속 화이팅!'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <button
            onClick={() => router.push('/stocks')}
            className="bg-gray-800 border border-gray-700 hover:border-emerald-500/50 rounded-xl p-6 text-center transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl">📈</span>
              <span className="text-xl font-bold text-emerald-400">주식 거래하기</span>
            </div>
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-800 border border-gray-700 hover:border-blue-500/50 rounded-xl p-6 text-center transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl">🏠</span>
              <span className="text-xl font-bold text-blue-400">대시보드로</span>
            </div>
          </button>
        </div>

        {/* 점수 계산 설명 */}
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6 mt-8 text-center">
          <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center justify-center">
            <span className="text-2xl mr-3">💡</span>
            점수 계산 방식
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-emerald-400 font-bold mb-2">🌱 ESG 투자점수</div>
              <div className="text-gray-300">환경친화적인 기업에 투자한 비중에 따라 점수 부여</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-blue-400 font-bold mb-2">🧠 퀴즈 점수</div>
              <div className="text-gray-300">환경 퀴즈 정답 시 10점씩 누적</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-yellow-400 font-bold mb-2">💰 투자 성과</div>
              <div className="text-gray-300">수익률에 따른 보너스 점수 추가</div>
            </div>
          </div>
          <p className="text-gray-400 mt-4">
            실시간으로 업데이트되며, 최종 순위는 게임 종료 시 확정됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}