'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 타입 정의는 동일하게 유지
interface TeamData {
  id: number;
  code: string;
  name: string;
  balance: number;
  esgScore: number;
  quizScore: number;
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

export default function DashboardPage() {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [recentNews, setRecentNews] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentRound, setCurrentRound] = useState(1);
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
    
    Promise.all([
      fetchPortfolio(team.id),
      fetchRecentNews()
    ]).finally(() => {
      setLoading(false);
    });

    const interval = setInterval(() => {
      fetchPortfolio(team.id);
      fetchRecentNews();
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

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
      const response = await fetch(`${API_BASE_URL}/events`);
      if (response.ok) {
        const data = await response.json();
        setRecentNews(data.slice(0, 3));
      }
    } catch (error) {
      console.error('뉴스 조회 실패:', error);
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
            <span className="badge-gold">R{currentRound}</span>
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
                  <Link href="/stocks">
                    <span className="btn-success">투자하러 가기 🚀</span>
                  </Link>
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

        {/* 최근 뉴스 */}
        <div className={`${activeTab === 'overview' || activeTab === 'all' ? 'block' : 'hidden'} sm:block mt-6`}>
          <div className="card-dark">
            <h2 className="text-xl font-bold text-gold-300 mb-6 flex items-center">
              <span className="text-2xl mr-3">📰</span>
              최근 ESG 뉴스
            </h2>
            
            {recentNews.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">📰</div>
                <p className="text-dark-200">최근 뉴스가 없습니다.</p>
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
            <Link href="/stocks">
              <div className="card-glass hover:glow-emerald group cursor-pointer transition-all duration-300 transform hover:scale-105">
                <div className="flex flex-col items-center text-center p-6">
                  <div className="w-16 h-16 bg-gradient-emerald rounded-2xl flex items-center justify-center mb-4 group-hover:animate-pulse">
                    <span className="text-3xl">📈</span>
                  </div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-2">주식 거래</h3>
                  <p className="text-dark-200 text-sm">ESG 기업 투자하기</p>
                </div>
              </div>
            </Link>
            
            <Link href="/quiz">
              <div className="card-glass hover:glow-blue group cursor-pointer transition-all duration-300 transform hover:scale-105">
                <div className="flex flex-col items-center text-center p-6">
                  <div className="w-16 h-16 bg-gradient-blue rounded-2xl flex items-center justify-center mb-4 group-hover:animate-pulse">
                    <span className="text-3xl">🧠</span>
                  </div>
                  <h3 className="text-lg font-bold text-blue-400 mb-2">환경 퀴즈</h3>
                  <p className="text-dark-200 text-sm">보너스 획득하기</p>
                </div>
              </div>
            </Link>
            
            <Link href="/ranking">
              <div className="card-glass hover:glow-gold group cursor-pointer transition-all duration-300 transform hover:scale-105">
                <div className="flex flex-col items-center text-center p-6">
                  <div className="w-16 h-16 bg-gradient-gold rounded-2xl flex items-center justify-center mb-4 group-hover:animate-pulse">
                    <span className="text-3xl">🏆</span>
                  </div>
                  <h3 className="text-lg font-bold text-gold-400 mb-2">실시간 랭킹</h3>
                  <p className="text-dark-200 text-sm">순위 확인하기</p>
                </div>
              </div>
            </Link>
            
            <Link href="/events">
              <div className="card-glass hover:glow-purple group cursor-pointer transition-all duration-300 transform hover:scale-105">
                <div className="flex flex-col items-center text-center p-6">
                  <div className="w-16 h-16 bg-gradient-purple rounded-2xl flex items-center justify-center mb-4 group-hover:animate-pulse">
                    <span className="text-3xl">📰</span>
                  </div>
                  <h3 className="text-lg font-bold text-purple-400 mb-2">ESG 뉴스</h3>
                  <p className="text-dark-200 text-sm">시장 동향 확인</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="mt-8 card-glass text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <span className="text-2xl">💡</span>
            <span className="text-gold-300 font-bold">게임 팁</span>
          </div>
          <p className="text-dark-200 mb-2">
            ESG 점수가 높을수록 최종 순위에 유리합니다!
          </p>
          <p className="text-dark-400 text-sm">
            데이터는 30초마다 자동으로 업데이트됩니다.
          </p>
          <div className="mt-4 h-1 w-32 bg-gradient-gold rounded-full mx-auto animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}