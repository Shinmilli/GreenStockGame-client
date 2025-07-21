'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../components/lib/api';
import Link from 'next/link';

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

export default function RankingPage() {
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState<TeamRanking | null>(null);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
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
    fetchRankings();

    const interval = setInterval(fetchRankings, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchRankings = async () => {
    try {
      setError('');
      const data = await api.getRanking();
      setRankings(data);
      setLastUpdated(new Date());
      
      if (teamData) {
        const myTeamRank = data.find((t: TeamRanking) => t.id === teamData.id);
        setMyTeam(myTeamRank || null);
      }
    } catch (error) {
      console.error('랭킹 조회 실패:', error);
      setError('랭킹을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
  };

  const getRankStyle = (rank: number) => {
    switch(rank) {
      case 1: return 'text-gradient-gold';
      case 2: return 'text-gray-400';
      case 3: return 'text-orange-400';
      default: return 'text-dark-200';
    }
  };

  const getRankGlow = (rank: number) => {
    switch(rank) {
      case 1: return 'glow-gold';
      case 2: return 'glow-blue';
      case 3: return 'shadow-lg';
      default: return '';
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
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-gold w-20 h-20 mx-auto mb-6"></div>
          <p className="text-gold-300 text-xl font-medium">랭킹을 불러오는 중...</p>
          <div className="mt-4 w-48 h-2 bg-dark-700 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-gold animate-shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      {/* 배경 애니메이션 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-gold opacity-10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-purple opacity-10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* 헤더 */}
      <div className="glass-dark border-b border-dark-600 sticky top-0 z-50">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard"
              className="w-10 h-10 rounded-xl bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-gold-300 hover:text-gold-200 transition-all duration-200"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gradient-gold">🏆 실시간 랭킹</h1>
              <p className="text-dark-200 text-sm">
                마지막 업데이트: <span className="text-gold-400">{lastUpdated.toLocaleTimeString()}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={fetchRankings}
            disabled={loading}
            className="btn-secondary text-sm px-4 py-2 disabled:opacity-50"
          >
            🔄 새로고침
          </button>
        </div>
      </div>

      <div className="relative px-4 py-6 max-w-6xl mx-auto">
        {error && (
          <div className="card-glass border-red-500/30 bg-red-500/5 mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">❌</span>
              <span className="text-red-400 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* 내 팀 순위 */}
        {myTeam && (
          <div className="card-gold glow-gold mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gradient-gold mb-6 flex items-center">
                <span className="text-2xl mr-3">👑</span>
                내 팀 순위
              </h2>
              
              <div className="bg-dark-800/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-bold ${
                      myTeam.rank <= 3 ? 'bg-gradient-gold' : 'bg-dark-700'
                    } ${getRankGlow(myTeam.rank)}`}>
                      <span className={myTeam.rank <= 3 ? 'text-dark-900' : getRankStyle(myTeam.rank)}>
                        {getRankIcon(myTeam.rank)}
                      </span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gold-300 mb-1">{myTeam.name}</p>
                      <p className="text-dark-200 font-medium">{myTeam.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gradient-gold mb-1">
                      {myTeam.totalScore}점
                    </p>
                    <p className={`text-lg font-medium ${
                      myTeam.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {formatPercent(myTeam.profitLossPercent)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-dark-700/50 rounded-xl p-4 text-center">
                    <p className="text-dark-300 text-sm mb-1">총 자산</p>
                    <p className="text-lg font-bold text-gold-300">{formatCurrency(myTeam.totalValue)}</p>
                  </div>
                  <div className="bg-dark-700/50 rounded-xl p-4 text-center">
                    <p className="text-dark-300 text-sm mb-1">투자점수</p>
                    <p className="text-lg font-bold text-emerald-400">{myTeam.esgScore}</p>
                  </div>
                  <div className="bg-dark-700/50 rounded-xl p-4 text-center">
                    <p className="text-dark-300 text-sm mb-1">퀴즈점수</p>
                    <p className="text-lg font-bold text-blue-400">{myTeam.quizScore}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 전체 랭킹 */}
        <div className="card-glass">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="text-3xl mr-3">🏆</span>
              전체 랭킹
            </h2>
            <p className="text-purple-100 mt-1">총 {rankings.length}개 팀 참가</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {rankings.map((team, index) => (
                <div 
                  key={team.id}
                  className={`glass-dark rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${
                    myTeam?.id === team.id ? 'border-2 border-gold-400 bg-gold-500/5' : 'hover:glow-gold'
                  } ${getRankGlow(team.rank)}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {/* 순위 */}
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${
                        team.rank <= 3 ? 'bg-gradient-gold text-dark-900' : 'bg-dark-700 text-dark-200'
                      }`}>
                        {getRankIcon(team.rank)}
                      </div>
                      
                      {/* 팀 정보 */}
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <p className="text-xl font-bold text-gold-300">{team.name}</p>
                          {myTeam?.id === team.id && (
                            <span className="badge-gold text-xs">내 팀</span>
                          )}
                        </div>
                        <p className="text-dark-200 font-medium">{team.code}</p>
                      </div>
                    </div>
                    
                    {/* 점수 및 수익률 */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gradient-gold mb-1">
                        {team.totalScore}점
                      </p>
                      <p className={`text-lg font-medium ${
                        team.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {formatPercent(team.profitLossPercent)}
                      </p>
                    </div>
                  </div>
                  
                  {/* 상세 정보 */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="bg-dark-800/50 rounded-lg p-3">
                      <span className="block text-dark-400 mb-1">총 자산</span>
                      <span className="text-gold-300 font-bold">
                        {formatCurrency(team.totalValue)}
                      </span>
                    </div>
                    <div className="bg-dark-800/50 rounded-lg p-3">
                      <span className="block text-dark-400 mb-1">손익</span>
                      <span className={`font-bold ${
                        team.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {team.profitLoss >= 0 ? '+' : ''}{formatCurrency(team.profitLoss)}
                      </span>
                    </div>
                    <div className="bg-dark-800/50 rounded-lg p-3">
                      <span className="block text-dark-400 mb-1">투자점수</span>
                      <span className="text-emerald-400 font-bold">{team.esgScore}</span>
                    </div>
                    <div className="bg-dark-800/50 rounded-lg p-3">
                      <span className="block text-dark-400 mb-1">퀴즈점수</span>
                      <span className="text-blue-400 font-bold">{team.quizScore}</span>
                    </div>
                  </div>

                  {/* 순위 뱃지 */}
                  {team.rank <= 3 && (
                    <div className="mt-4 flex justify-center">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                        team.rank === 1 
                          ? 'bg-gradient-gold text-dark-900' 
                          : team.rank === 2 
                          ? 'bg-gray-400 text-white' 
                          : 'bg-orange-400 text-white'
                      }`}>
                        {team.rank === 1 && '🏆 1위 유지 중'}
                        {team.rank === 2 && '🥈 2위 선전 중'}
                        {team.rank === 3 && '🥉 3위 분투 중'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Link href="/dashboard">
            <div className="card-glass hover:glow-blue group cursor-pointer transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-center p-6 space-x-3">
                <span className="text-2xl group-hover:animate-pulse">🏠</span>
                <span className="text-xl font-bold text-blue-400">대시보드로</span>
              </div>
            </div>
          </Link>
          <Link href="/stocks">
            <div className="card-glass hover:glow-emerald group cursor-pointer transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-center p-6 space-x-3">
                <span className="text-2xl group-hover:animate-pulse">📈</span>
                <span className="text-xl font-bold text-emerald-400">거래하기</span>
              </div>
            </div>
          </Link>
        </div>

        {/* 게임 정보 */}
        <div className="mt-8 card-glass text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-2xl">💡</span>
            <span className="text-xl font-bold text-gold-300">점수 계산 방식</span>
          </div>
          <p className="text-dark-200 mb-2">
            총점 = ESG 투자점수 + 퀴즈점수 + 투자비중 가산점
          </p>
          <p className="text-dark-400 text-sm">
            실시간으로 업데이트되며, 최종 순위는 게임 종료 시 확정됩니다.
          </p>
          <div className="mt-4 h-1 w-40 bg-gradient-gold rounded-full mx-auto animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}