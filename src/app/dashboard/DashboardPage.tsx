'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// GamePhaseIndicator 컴포넌트를 인라인으로 포함
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

function GamePhaseIndicator({ gameState, className = '' }: GamePhaseIndicatorProps) {
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
  const isUrgent = gameState.timeRemaining < 30000;

  return (
    <div className={`card-glass ${className} ${isUrgent ? 'animate-pulse border-red-400 border-2' : ''}`}>
      <div className="p-6">
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
          
          {gameState.phase !== 'finished' && (
            <div className={`text-right ${isUrgent ? 'text-red-400' : 'text-gold-300'}`}>
              <div className="text-3xl font-bold font-mono">
                {timeDisplay}
              </div>
              <div className="text-sm opacity-75">남은 시간</div>
            </div>
          )}
        </div>

        <p className="text-dark-200 text-center mb-4">
          {phaseInfo.description}
        </p>

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
      </div>

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

// 메인 타입 정의들
interface TeamData {
  id: number;
  code: string;
  name: string;
  balance: number;
  esgScore: number;
  quizScore: number;
}

interface GameState {
  currentRound: number;
  phase: 'news' | 'quiz' | 'trading' | 'results' | 'finished';
  timeRemaining: number;
  isActive: boolean;
}

interface PortfolioData {
  team: TeamData;
  holdings: HoldingData[];
  portfolioValue: number;
  totalCost: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  balance: number;
  recentTransactions: TransactionData[];
}

interface HoldingData {
  id: number;
  stockId: number;
  quantity: number;
  avgBuyPrice: number;
  currentValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
  stock: {
    symbol: string;
    companyName: string;
    currentPrice: number;
    esgCategory: string;
  };
}

interface TransactionData {
  id: number;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fee: number;
  createdAt: string;
  stock: {
    symbol: string;
    companyName: string;
  };
}

interface NewsEvent {
  id: number;
  title: string;
  content: string;
  roundNumber: number;
  createdAt: string;
}

export default function GameDashboard() {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentRound: 1,
    phase: 'news',
    timeRemaining: 0,
    isActive: false
  });
  const [recentNews, setRecentNews] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const savedTeamData = localStorage.getItem('teamData');
    if (!savedTeamData) {
      router.push('/login');
      return;
    }
    
    const team = JSON.parse(savedTeamData);
    setTeamData(team);
    
    // 초기 데이터 로드
    Promise.all([
      fetchGameState(),
      fetchPortfolio(team.id),
      fetchRecentNews()
    ]).finally(() => {
      setLoading(false);
    });

    // 게임 상태는 1초마다, 포트폴리오는 10초마다 갱신
    const gameStateInterval = setInterval(fetchGameState, 1000);
    const portfolioInterval = setInterval(() => fetchPortfolio(team.id), 10000);
    const newsInterval = setInterval(fetchRecentNews, 15000);

    return () => {
      clearInterval(gameStateInterval);
      clearInterval(portfolioInterval);
      clearInterval(newsInterval);
    };
  }, [router]);

  const fetchGameState = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/game/state`);
      if (response.ok) {
        const data = await response.json();
        setGameState(data);
      }
    } catch (error) {
      console.error('게임 상태 조회 실패:', error);
    }
  };

  const fetchPortfolio = async (teamId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio/${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data);
        
        if (data.team) {
          setTeamData(data.team);
          localStorage.setItem('teamData', JSON.stringify(data.team));
        }
      }
    } catch (error) {
      console.error('포트폴리오 조회 실패:', error);
      setError('포트폴리오를 불러오는데 실패했습니다.');
    }
  };

  const fetchRecentNews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events?round=${gameState.currentRound}`);
      if (response.ok) {
        const data = await response.json();
        setRecentNews(data.slice(0, 3));
      }
    } catch (error) {
      console.error('뉴스 조회 실패:', error);
    }
  };

  const handlePhaseAction = () => {
    switch (gameState.phase) {
      case 'quiz':
        router.push('/quiz');
        break;
      case 'trading':
        router.push('/stocks');
        break;
      case 'results':
        router.push('/ranking');
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teamData');
    router.push('/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryStyle = (category: string) => {
    const styles = {
      'Clean Energy': 'badge-emerald',
      'Sustainable Food': 'bg-yellow-400 text-dark-900',
      'Wind Energy': 'badge-blue',
      'Solar Energy': 'bg-orange-400 text-white',
      'Waste Management': 'badge-purple',
      'Water Treatment': 'bg-cyan-400 text-dark-900',
      'Organic Agriculture': 'bg-lime-400 text-dark-900',
      'Carbon Capture': 'bg-gray-400 text-white',
    };
    return `${styles[category as keyof typeof styles] || 'bg-gray-400 text-white'} px-2 py-1 rounded-full text-xs font-bold`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-gold w-16 h-16 mx-auto mb-6"></div>
          <p className="text-gold-300 text-xl font-medium">데이터를 불러오는 중...</p>
          <div className="mt-4 w-48 h-2 bg-dark-700 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-gold animate-shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!teamData || !portfolio) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="card-dark text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <p className="text-gold-300 text-xl mb-6">데이터를 불러올 수 없습니다.</p>
          <button
            onClick={() => router.push('/login')}
            className="btn-primary"
          >
            로그인 페이지로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* 헤더 */}
      <div className="glass-dark border-b border-dark-600 sticky top-0 z-50">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-gold rounded-xl flex items-center justify-center">
              <span className="text-2xl">🌱</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-gold">ESG INVEST</h1>
              <p className="text-dark-200 text-sm">
                {teamData.name} <span className="text-gold-400">({teamData.code})</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="badge-gold">R{gameState.currentRound}</span>
            <button
              onClick={handleLogout}
              className="text-dark-300 hover:text-gold-300 transition-colors p-2 rounded-lg hover:bg-dark-700"
            >
              <span className="text-sm">🚪</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {error && (
          <div className="card-glass border-red-500/30 bg-red-500/5 mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">❌</span>
              <span className="text-red-400 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* 게임 상태 인디케이터 */}
        <GamePhaseIndicator gameState={gameState} className="mb-6" />

        {/* 페이즈별 액션 버튼 */}
        {gameState.isActive && gameState.phase !== 'news' && gameState.phase !== 'finished' && (
          <div className="mb-6">
            <button
              onClick={handlePhaseAction}
              className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                gameState.phase === 'quiz' ? 'bg-gradient-purple text-white glow-purple' :
                gameState.phase === 'trading' ? 'btn-success' :
                gameState.phase === 'results' ? 'bg-gradient-gold text-dark-900 glow-gold' : 'btn-secondary'
              }`}
            >
              {gameState.phase === 'quiz' && '🧠 퀴즈 참여하기'}
              {gameState.phase === 'trading' && '📈 주식 거래하기'}
              {gameState.phase === 'results' && '📊 결과 확인하기'}
            </button>
          </div>
        )}

        {/* 모바일 탭 네비게이션 */}
        <div className="glass-dark rounded-2xl p-2 mb-6 sm:hidden">
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'overview', label: '개요', icon: '📊' },
              { id: 'portfolio', label: '포트폴리오', icon: '💼' },
              { id: 'actions', label: '액션', icon: '⚡' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-gold text-dark-900 glow-gold' 
                    : 'text-dark-200 hover:text-gold-300 hover:bg-dark-700'
                }`}
              >
                <span className="block text-lg mb-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 메인 대시보드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 자산 현황 카드 */}
          <div className={`${activeTab === 'overview' || activeTab === 'all' ? 'block' : 'hidden'} sm:block lg:col-span-2`}>
            <div className="card-gold glow-gold">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gradient-gold flex items-center">
                  <span className="text-3xl mr-3">💰</span>
                  자산 현황
                </h2>
                <div className="text-xs text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full">
                  실시간
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="glass-dark rounded-xl p-6 text-center">
                  <p className="text-4xl font-bold text-gradient-emerald mb-2">
                    {formatCurrency(portfolio.totalValue)}
                  </p>
                  <p className="text-dark-200 font-medium">총 자산</p>
                  <div className="mt-2 h-1 bg-gradient-emerald rounded-full w-20 mx-auto"></div>
                </div>
                <div className="glass-dark rounded-xl p-6 text-center">
                  <p className={`text-4xl font-bold mb-2 ${
                    portfolio.profitLoss >= 0 ? 'text-gradient-emerald' : 'text-red-400'
                  }`}>
                    {formatPercent(portfolio.profitLossPercent)}
                  </p>
                  <p className="text-dark-200 font-medium">수익률</p>
                  <div className={`mt-2 h-1 rounded-full w-20 mx-auto ${
                    portfolio.profitLoss >= 0 ? 'bg-gradient-emerald' : 'bg-red-400'
                  }`}></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-dark-800/50 rounded-lg p-4">
                  <p className="text-dark-300 text-sm font-medium mb-1">💵 현금</p>
                  <p className="text-xl font-bold text-gold-300">{formatCurrency(portfolio.balance)}</p>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-4">
                  <p className="text-dark-300 text-sm font-medium mb-1">📈 투자자산</p>
                  <p className="text-xl font-bold text-gold-300">{formatCurrency(portfolio.portfolioValue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ESG 점수 카드 */}
          <div className={`${activeTab === 'overview' || activeTab === 'all' ? 'block' : 'hidden'} sm:block`}>
            <div className="card-dark h-full">
              <h2 className="text-xl font-bold text-gold-300 mb-6 flex items-center">
                <span className="text-2xl mr-3">🌍</span>
                ESG 스코어
              </h2>
              
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-emerald rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-white">{teamData.esgScore}</span>
                  </div>
                  <p className="text-emerald-400 font-medium">투자점수</p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-blue rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-white">{teamData.quizScore}</span>
                  </div>
                  <p className="text-blue-400 font-medium">퀴즈점수</p>
                </div>
                
                <div className="text-center pt-4 border-t border-dark-600">
                  <div className="w-24 h-24 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-3 glow-gold">
                    <span className="text-3xl font-bold text-dark-900">
                      {teamData.esgScore + teamData.quizScore}
                    </span>
                  </div>
                  <p className="text-gold-400 font-bold text-lg">총점</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 포트폴리오 및 거래 내역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          
          {/* 보유 주식 */}
          <div className={`${activeTab === 'portfolio' || activeTab === 'all' ? 'block' : 'hidden'} sm:block`}>
            <div className="card-dark h-full">
              <h2 className="text-xl font-bold text-gold-300 mb-6 flex items-center">
                <span className="text-2xl mr-3">📈</span>
                보유 주식
              </h2>
              
              {portfolio.holdings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-dark-200 text-lg mb-4">보유 중인 주식이 없습니다.</p>
                  {(gameState.phase === 'trading' && gameState.isActive) ? (
                    <button
                      onClick={() => router.push('/stocks')}
                      className="btn-success"
                    >
                      투자하러 가기 🚀
                    </button>
                  ) : (
                    <p className="text-dark-400 text-sm">거래 시간에 투자할 수 있습니다</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto scroll-smooth">
                  {portfolio.holdings.map((holding) => (
                    <div key={holding.id} className="glass-dark rounded-lg p-4 hover:glow-gold transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl font-bold text-gold-300">
                            {holding.stock.symbol}
                          </span>
                          <span className={getCategoryStyle(holding.stock.esgCategory)}>
                            {holding.stock.esgCategory}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gold-300">
                            {formatCurrency(holding.currentValue)}
                          </p>
                          <p className={`text-sm font-medium ${
                            holding.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {formatPercent(holding.profitLossPercent)}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-dark-200">
                        <p className="mb-1">{holding.stock.companyName}</p>
                        <p>
                          {holding.quantity}주 × {formatCurrency(holding.stock.currentPrice)} 
                          <span className="text-dark-300 ml-2">
                            (평균 {formatCurrency(holding.avgBuyPrice)})
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 최근 거래 내역 */}
          <div className={`${activeTab === 'portfolio' || activeTab === 'all' ? 'block' : 'hidden'} sm:block`}>
            <div className="card-dark h-full">
              <h2 className="text-xl font-bold text-gold-300 mb-6 flex items-center">
                <span className="text-2xl mr-3">📋</span>
                최근 거래
              </h2>
              
              {portfolio.recentTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-dark-200">거래 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto scroll-smooth">
                  {portfolio.recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="glass-dark rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            transaction.type === 'BUY' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {transaction.type === 'BUY' ? '매수' : '매도'}
                          </span>
                          <span className="font-semibold text-gold-300">
                            {transaction.stock.symbol}
                          </span>
                        </div>
                        <div className="text-right text-xs text-dark-300">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>
                      <div className="text-sm text-dark-200">
                        <p>{transaction.quantity}주 × {formatCurrency(transaction.price)}</p>
                        <p className="text-xs text-dark-400 mt-1">
                          수수료: {formatCurrency(transaction.fee)}
                        </p>
                      </div>
                    </div>
                 ))}
               </div>
             )}
           </div>
         </div>
       </div>

       {/* 현재 라운드 뉴스 */}
       <div className={`${activeTab === 'overview' || activeTab === 'all' ? 'block' : 'hidden'} sm:block mt-6`}>
         <div className="card-dark">
           <h2 className="text-xl font-bold text-gold-300 mb-6 flex items-center">
             <span className="text-2xl mr-3">📰</span>
             라운드 {gameState.currentRound} ESG 뉴스
           </h2>
           
           {recentNews.length === 0 ? (
             <div className="text-center py-8">
               <div className="text-5xl mb-4">📰</div>
               <p className="text-dark-200">아직 발표된 뉴스가 없습니다.</p>
               {gameState.phase === 'news' && (
                 <p className="text-gold-400 text-sm mt-2">뉴스가 곧 발표됩니다!</p>
               )}
             </div>
           ) : (
             <div className="space-y-4">
               {recentNews.map((news) => (
                 <div key={news.id} className="glass-dark rounded-lg p-4 border-l-4 border-blue-400">
                   <h3 className="font-bold text-gold-300 mb-2">{news.title}</h3>
                   <p className="text-dark-200 text-sm mb-3 line-clamp-2">{news.content}</p>
                   <div className="flex items-center justify-between text-xs">
                     <span className="badge-blue">라운드 {news.roundNumber}</span>
                     <span className="text-dark-400">{formatDate(news.createdAt)}</span>
                   </div>
                 </div>
               ))}
               <Link href="/events">
                 <span className="block text-center text-blue-400 hover:text-blue-300 font-medium mt-4 transition-colors">
                   모든 뉴스 보기 →
                 </span>
               </Link>
             </div>
           )}
         </div>
       </div>

       {/* 퀵 액션 버튼들 */}
       <div className={`${activeTab === 'actions' || activeTab === 'all' ? 'block' : 'hidden'} sm:block mt-6`}>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           <ActionButton
             href="/stocks"
             icon="📈"
             title="주식 거래"
             description="ESG 기업 투자하기"
             disabled={gameState.phase !== 'trading' || !gameState.isActive}
             disabledReason="거래 시간이 아닙니다"
             color="emerald"
           />
           
           <ActionButton
             href="/quiz"
             icon="🧠"
             title="환경 퀴즈"
             description="보너스 획득하기"
             disabled={gameState.phase !== 'quiz' || !gameState.isActive}
             disabledReason="퀴즈 시간이 아닙니다"
             color="blue"
           />
           
           <ActionButton
             href="/ranking"
             icon="🏆"
             title="실시간 랭킹"
             description="순위 확인하기"
             disabled={false}
             disabledReason=""
             color="gold"
           />
           
           <ActionButton
             href="/events"
             icon="📰"
             title="ESG 뉴스"
             description="시장 동향 확인"
             disabled={false}
             disabledReason=""
             color="purple"
           />
         </div>
       </div>

       {/* 하단 정보 */}
       <div className="mt-8 card-glass text-center">
         <div className="flex items-center justify-center space-x-3 mb-3">
           <span className="text-2xl">💡</span>
           <span className="text-gold-300 font-bold">게임 팁</span>
         </div>
         <p className="text-dark-200 mb-2">
           각 단계마다 제한 시간이 있으니 시간을 잘 활용하세요!
         </p>
         <p className="text-dark-400 text-sm">
           ESG 점수가 높을수록 최종 순위에 유리합니다.
         </p>
         <div className="mt-4 h-1 w-32 bg-gradient-gold rounded-full mx-auto animate-shimmer"></div>
       </div>

       {/* 게임 진행 상황 */}
       <div className="mt-6 card-dark">
         <h3 className="text-lg font-bold text-gold-300 mb-4 flex items-center">
           <span className="text-xl mr-2">🎯</span>
           게임 진행 상황
         </h3>
         <div className="flex items-center justify-center space-x-2 mb-4">
           {[...Array(8)].map((_, i) => (
             <div
               key={i}
               className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                 i < gameState.currentRound - 1 
                   ? 'bg-gradient-emerald text-white' 
                   : i === gameState.currentRound - 1 
                   ? 'bg-gradient-gold text-dark-900 animate-pulse' 
                   : 'bg-dark-600 text-dark-400'
               }`}
             >
               {i + 1}
             </div>
           ))}
         </div>
         <div className="text-center">
           <p className="text-dark-200">
             라운드 <span className="text-gold-400 font-bold">{gameState.currentRound}</span> / 8
           </p>
           {gameState.isActive && (
             <p className="text-dark-400 text-sm mt-1">
               현재 단계: <span className="text-gold-300">{PHASE_INFO[gameState.phase]?.title}</span>
             </p>
           )}
         </div>
       </div>
     </div>
   </div>
 );
}

// 액션 버튼 컴포넌트
interface ActionButtonProps {
 href: string;
 icon: string;
 title: string;
 description: string;
 disabled: boolean;
 disabledReason: string;
 color: 'emerald' | 'blue' | 'gold' | 'purple';
}

function ActionButton({ href, icon, title, description, disabled, disabledReason, color }: ActionButtonProps) {
 const colorClasses = {
   emerald: 'hover:glow-emerald',
   blue: 'hover:glow-blue', 
   gold: 'hover:glow-gold',
   purple: 'hover:glow-purple'
 };

 const iconColors = {
   emerald: 'bg-gradient-emerald',
   blue: 'bg-gradient-blue',
   gold: 'bg-gradient-gold', 
   purple: 'bg-gradient-purple'
 };

 const textColors = {
   emerald: 'text-emerald-400',
   blue: 'text-blue-400',
   gold: 'text-gold-400',
   purple: 'text-purple-400'
 };

 if (disabled) {
   return (
     <div className="card-glass opacity-50 cursor-not-allowed relative">
       <div className="flex flex-col items-center text-center p-6">
         <div className="w-16 h-16 bg-dark-600 rounded-2xl flex items-center justify-center mb-4">
           <span className="text-3xl grayscale">{icon}</span>
         </div>
         <h3 className="text-lg font-bold text-dark-400 mb-2">{title}</h3>
         <p className="text-dark-500 text-sm mb-2">{description}</p>
         <p className="text-xs text-red-400">{disabledReason}</p>
       </div>
       <div className="absolute inset-0 bg-dark-900/20 rounded-2xl flex items-center justify-center">
         <span className="text-4xl">🔒</span>
       </div>
     </div>
   );
 }

 return (
   <Link href={href}>
     <div className={`card-glass ${colorClasses[color]} group cursor-pointer transition-all duration-300 transform hover:scale-105`}>
       <div className="flex flex-col items-center text-center p-6">
         <div className={`w-16 h-16 ${iconColors[color]} rounded-2xl flex items-center justify-center mb-4 group-hover:animate-pulse`}>
           <span className="text-3xl">{icon}</span>
         </div>
         <h3 className={`text-lg font-bold ${textColors[color]} mb-2`}>{title}</h3>
         <p className="text-dark-200 text-sm">{description}</p>
       </div>
     </div>
   </Link>
 );
}