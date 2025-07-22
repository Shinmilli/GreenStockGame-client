'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../components/lib/api';

interface NewsEvent {
  id: number;
  title: string;
  content?: string | null; // Made optional to match the imported type
  affectedStocks: Record<string, number>;
  roundNumber: number;
  createdAt: string;
}

interface TeamData {
  id: number;
  code: string;
  name: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [currentRound] = useState(4);
  const router = useRouter();

  useEffect(() => {
    const savedTeamData = localStorage.getItem('teamData');
    if (!savedTeamData) {
      router.push('/login');
      return;
    }
    
    const team = JSON.parse(savedTeamData);
    setTeamData(team);
    fetchEvents();
  }, [router, selectedRound]);

  const fetchEvents = async () => {
    try {
      setError('');
      const data = await api.getEvents(selectedRound || undefined);
      setEvents(data);
    } catch (error) {
      console.error('이벤트 조회 실패:', error);
      setError('이벤트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (roundNumber: number) => {
    const icons = {
      1: '🌱', 2: '⚡', 3: '💧', 4: '🏭',
      5: '♻️', 6: '🌍', 7: '🔋', 8: '🎯'
    };
    return icons[roundNumber as keyof typeof icons] || '📰';
  };

  const getEventGradient = (roundNumber: number) => {
    const gradients = {
      1: 'bg-gradient-to-r from-emerald-500 to-green-600',
      2: 'bg-gradient-to-r from-yellow-500 to-orange-600',
      3: 'bg-gradient-to-r from-blue-500 to-cyan-600',
      4: 'bg-gradient-to-r from-gray-500 to-slate-600',
      5: 'bg-gradient-to-r from-emerald-600 to-teal-600',
      6: 'bg-gradient-to-r from-teal-500 to-cyan-600',
      7: 'bg-gradient-to-r from-purple-500 to-violet-600',
      8: 'bg-gradient-to-r from-pink-500 to-rose-600'
    };
    return gradients[roundNumber as keyof typeof gradients] || 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  const getStockImpactStyle = (change: number) => {
    if (change > 0) return 'bg-emerald-500/10 border-emerald-400/30 text-emerald-400';
    if (change < 0) return 'bg-red-500/10 border-red-400/30 text-red-400';
    return 'bg-gray-500/10 border-gray-400/30 text-gray-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const rounds = [1, 2, 3, 4, 5, 6, 7, 8];

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-gold w-20 h-20 mx-auto mb-6"></div>
          <p className="text-gold-300 text-xl font-medium">이벤트를 불러오는 중...</p>
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
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-blue opacity-10 rounded-full blur-3xl animate-float"></div>
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
              <h1 className="text-xl font-bold text-gradient-blue flex items-center space-x-2">
                <span className="text-2xl">📰</span>
                <span>ESG 뉴스 & 이벤트</span>
              </h1>
              <p className="text-dark-200">현재 라운드 <span className="text-blue-400 font-bold">{currentRound}</span></p>
            </div>
          </div>
          <button 
            onClick={fetchEvents}
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

        {/* 라운드 필터 */}
        <div className="card-glass mb-8">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gold-300 mb-6 flex items-center">
              <span className="text-xl mr-3">🎯</span>
              라운드별 필터
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedRound(null)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  selectedRound === null
                    ? 'bg-gradient-gold text-dark-900 glow-gold'
                    : 'bg-dark-700 text-dark-200 hover:bg-dark-600 hover:text-gold-300'
                }`}
              >
                전체
              </button>
              {rounds.map(round => (
                <button
                  key={round}
                  onClick={() => setSelectedRound(round)}
                  disabled={round > currentRound}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                    selectedRound === round
                      ? 'bg-gradient-blue text-white glow-blue'
                      : round <= currentRound
                      ? 'bg-dark-700 text-dark-200 hover:bg-dark-600 hover:text-gold-300'
                      : 'bg-dark-800 text-dark-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span className="text-lg">{getEventIcon(round)}</span>
                  <span>R{round}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 이벤트 목록 */}
        <div className="space-y-6">
          {events.length === 0 ? (
            <div className="card-glass text-center py-16">
              <div className="text-6xl mb-6">📰</div>
              <h3 className="text-2xl font-bold text-gold-300 mb-4">
                {selectedRound 
                  ? `라운드 ${selectedRound}` 
                  : '전체'}에는 아직 이벤트가 없습니다.
              </h3>
              <p className="text-dark-200 text-lg">새로운 ESG 뉴스를 기다려주세요!</p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="card-glass hover:glow-gold transition-all duration-500 group overflow-hidden">
                {/* 이벤트 헤더 */}
                <div className={`${getEventGradient(event.roundNumber)} p-6 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <span className="text-3xl">{getEventIcon(event.roundNumber)}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
                        <div className="flex items-center space-x-4 text-white/80">
                          <span className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-white/60 rounded-full"></span>
                            <span>라운드 {event.roundNumber}</span>
                          </span>
                          <span>•</span>
                          <span>{formatDate(event.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {event.roundNumber === currentRound && (
                      <div className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm animate-pulse">
                        🔴 LIVE
                      </div>
                    )}
                  </div>
                  
                  {/* 데코레이션 */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full opacity-30 group-hover:scale-110 transition-transform duration-700"></div>
                </div>

                {/* 이벤트 내용 */}
                <div className="p-6">
                  {event.content && (
                    <div className="mb-6">
                      <p className="text-dark-200 text-lg leading-relaxed">{event.content}</p>
                    </div>
                  )}

                  {/* 영향받는 주식들 */}
                  <div>
                    <h4 className="text-lg font-bold text-gold-300 mb-4 flex items-center">
                      <span className="text-xl mr-2">📈</span>
                      주가 영향
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(event.affectedStocks).map(([symbol, change]) => (
                        <div 
                          key={symbol}
                          className={`glass-dark rounded-xl p-4 border transition-all duration-300 hover:scale-105 ${getStockImpactStyle(change)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-lg">{symbol}</span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              change > 0 ? 'bg-emerald-500' : change < 0 ? 'bg-red-500' : 'bg-gray-500'
                            }`}>
                              <span className="text-white font-bold text-sm">
                                {change > 0 ? '↗' : change < 0 ? '↘' : '→'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-2xl">
                              {change > 0 ? '+' : ''}{change}%
                            </p>
                            <p className="text-sm opacity-75">
                              {change > 0 ? '상승' : change < 0 ? '하락' : '변동없음'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 투자 인사이트 */}
                  <div className="mt-6 card-dark">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-gold rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">💡</span>
                      </div>
                      <div>
                        <h5 className="font-bold text-gold-300 mb-2">투자 인사이트</h5>
                        <p className="text-dark-200 text-sm">
                          {Object.values(event.affectedStocks).some(change => change > 0)
                            ? '일부 ESG 기업들이 긍정적 영향을 받고 있습니다. 지속가능한 투자 기회를 고려해보세요!'
                            : '시장 변동성이 높아지고 있습니다. 포트폴리오 다각화를 통해 리스크를 관리하세요.'
                          }
                        </p>
                      </div>
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
            <div className="card-glass hover:glow-emerald group cursor-pointer transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-center p-6 space-x-3">
                <span className="text-3xl group-hover:animate-pulse">📈</span>
                <span className="text-xl font-bold text-emerald-400">거래하기</span>
              </div>
            </div>
          </Link>
          <Link href="/ranking">
            <div className="card-glass hover:glow-gold group cursor-pointer transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-center p-6 space-x-3">
                <span className="text-3xl group-hover:animate-pulse">🏆</span>
                <span className="text-xl font-bold text-gold-400">랭킹보기</span>
              </div>
            </div>
          </Link>
        </div>

        {/* 정보 박스 */}
        <div className="mt-8 card-gold text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-3xl">🌍</span>
            <span className="text-xl font-bold text-gradient-gold">ESG 뉴스 가이드</span>
          </div>
          <p className="text-dark-200 mb-2">
            ESG 뉴스는 실제 환경·사회·지배구조 이슈를 반영합니다
          </p>
          <p className="text-dark-400 text-sm">
            이벤트 발생 시 해당 주식의 가격이 즉시 반영되니 주의 깊게 확인하세요!
          </p>
          <div className="mt-4 h-1 w-40 bg-gradient-gold rounded-full mx-auto animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}