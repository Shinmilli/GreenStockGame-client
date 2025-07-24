"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../components/lib/api';
import { Stock, Team } from '../../types';

interface Holding {
  id: number;
  stockId: number;
  quantity: number;
  averagePrice: number;
  stock: Stock;
  currentValue: number;
  profit: number;
  profitPercent: number;
}

interface Portfolio {
  team: Team;
  holdings: Holding[];
  totalValue: number;
  totalInvestment: number;
  totalProfit: number;
  profitPercent: number;
}

export default function Stocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio'>('market');
  const [gameState, setGameState] = useState({
    currentRound: 1,
    phase: 'trading',
    isActive: true,
    timeRemaining: 0
  });
  
  // 🔥 Hydration 오류 방지를 위한 마운트 상태 추가
  const [isMounted, setIsMounted] = useState(false);
  
  const router = useRouter();

  // 🔥 기본 팀 데이터 생성 함수
  const createDefaultTeam = (): Team => ({
    id: 0,
    name: 'Unknown Team',
    balance: 0,
    code: '',
    esgScore: 0,
    quizScore: 0
  });

  // 🔥 Team 타입 검증 함수
  const isValidTeam = (data: any): data is Team => {
    return data && 
           typeof data === 'object' &&
           typeof data.id === 'number' &&
           typeof data.name === 'string' &&
           typeof data.balance === 'number' &&
           typeof data.code === 'string' &&
           typeof data.esgScore === 'number' &&
           typeof data.quizScore === 'number';
  };

  // 🔥 컴포넌트 마운트 후에만 로컬스토리지 접근
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100); // 짧은 지연으로 hydration 완료 대기

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
  // 마운트되지 않았으면 실행하지 않음
  if (!isMounted) return;
  
  const savedTeamData = localStorage.getItem('teamData');
  if (!savedTeamData) {
    router.push('/login');
    return;
  }
  
  try {
    const parsedTeam = JSON.parse(savedTeamData);
    // 🔥 Team 타입 검증 후 설정
    if (isValidTeam(parsedTeam)) {
      setTeamData(parsedTeam);
    } else {
      console.warn('유효하지 않은 팀 데이터:', parsedTeam);
      // 필수 속성이 누락된 경우 기본값으로 보완
      const safeTeam: Team = {
        id: parsedTeam.id || 0,
        name: parsedTeam.name || 'Unknown Team',
        balance: parsedTeam.balance || 0,
        code: parsedTeam.code || '',
        esgScore: parsedTeam.esgScore || 0,
        quizScore: parsedTeam.quizScore || 0
      };
      setTeamData(safeTeam);
      localStorage.setItem('teamData', JSON.stringify(safeTeam));
    }
  } catch (error) {
    console.error('팀 데이터 파싱 오류:', error);
    router.push('/login');
    return;
  }
  
  // 🔥 즉시 데이터 로드
  fetchStocks();
  fetchGameState();
}, [router, isMounted]); // teamData 의존성 제거

// 🔥 새로 추가: teamData 변경 시 포트폴리오 로드
useEffect(() => {
  if (teamData && teamData.id > 0) {
    console.log('🔄 팀 데이터 설정됨, 포트폴리오 로드:', teamData.id);
    fetchPortfolio(teamData.id);
  }
}, [teamData]); // teamData 변경될 때만 실행

  const fetchGameState = async () => {
    try {
      const data = await api.getGameState();
      setGameState(data);
    } catch (error) {
      console.error('게임 상태 조회 실패:', error);
    }
  };

  const fetchStocks = async () => {
    try {
      const data = await api.getStocks();
      // 🔥 주식 데이터 검증
      if (data && Array.isArray(data)) {
        const validStocks = data.filter(stock => 
          stock && 
          typeof stock === 'object' &&
          typeof stock.id === 'number' &&
          typeof stock.symbol === 'string' &&
          typeof stock.companyName === 'string' &&
          typeof stock.currentPrice === 'number' &&
          !isNaN(stock.currentPrice) &&
          isFinite(stock.currentPrice)
        );
        setStocks(validStocks);
      } else {
        setStocks([]);
      }
    } catch (error) {
      console.error('주식 정보 조회 실패:', error);
      setStocks([]);
    }
  };

 // 🔥 완전히 수정된 fetchPortfolio 함수
const fetchPortfolio = async (teamId: number) => {
  console.log('🔄 fetchPortfolio 시작:', teamId);
  
  if (!teamId || teamId <= 0) {
    console.error('❌ 유효하지 않은 teamId:', teamId);
    return;
  }
  
  try {
    console.log('📡 API 호출:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/portfolio/${teamId}`);
    
    const data = await api.getPortfolio(teamId);
    console.log('📊 서버에서 받은 포트폴리오 데이터:', data);
    
    // 🔥 서버 응답 구조 확인 및 처리
    if (data && typeof data === 'object') {
      console.log('✅ 포트폴리오 데이터 유효성 확인됨');
      
      // 🔥 서버 응답에서 올바른 필드 찾기
      let holdings = [];
      
      // 여러 가능한 필드명 시도
      if (data.holdings && Array.isArray(data.holdings)) {
        holdings = data.holdings;
        console.log('📋 holdings 필드 사용');
      } else if (data.portfolio && Array.isArray(data.portfolio)) {
        holdings = data.portfolio;
        console.log('📋 portfolio 필드 사용');
      } else if (Array.isArray(data)) {
        holdings = data;
        console.log('📋 직접 배열 사용');
      }
      
      console.log('📊 원본 holdings:', holdings);
      
      // holdings 검증 및 필터링
      const validHoldings = holdings
        .filter(holding => {
          const isValid = holding && 
            typeof holding === 'object' && 
            holding.stock && 
            typeof holding.stock === 'object' &&
            typeof holding.quantity === 'number' &&
            holding.quantity > 0; // 🔥 0보다 큰 수량만
          
          if (!isValid) {
            console.warn('❌ 유효하지 않은 holding:', holding);
          }
          return isValid;
        })
        .map(holding => ({
          ...holding,
          // 🔥 필요한 계산 필드들 추가/검증
          currentValue: (holding.stock.currentPrice || 0) * (holding.quantity || 0),
          profit: ((holding.stock.currentPrice || 0) * (holding.quantity || 0)) - ((holding.averagePrice || 0) * (holding.quantity || 0)),
          profitPercent: holding.averagePrice > 0 
            ? (((holding.stock.currentPrice || 0) - (holding.averagePrice || 0)) / (holding.averagePrice || 0)) * 100 
            : 0
        }));
      
      console.log('✅ 검증된 holdings:', validHoldings);
      console.log('📊 보유 주식 수:', validHoldings.length);
      
      // 🔥 포트폴리오 요약 계산
      const totalValue = validHoldings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
      const totalInvestment = validHoldings.reduce((sum, h) => sum + ((h.averagePrice || 0) * (h.quantity || 0)), 0);
      const totalProfit = totalValue - totalInvestment;
      const profitPercent = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
      
      // 🔥 최종 포트폴리오 데이터 생성
      const portfolioData: Portfolio = {
        team: data.team || teamData || createDefaultTeam(),
        holdings: validHoldings,
        totalValue,
        totalInvestment,
        totalProfit,
        profitPercent
      };
      
      console.log('✅ 최종 포트폴리오 데이터:', {
        holdingsCount: portfolioData.holdings.length,
        totalValue: portfolioData.totalValue,
        totalInvestment: portfolioData.totalInvestment,
        totalProfit: portfolioData.totalProfit,
        teamBalance: portfolioData.team?.balance,
        holdings: portfolioData.holdings.map(h => `${h.stock?.symbol}: ${h.quantity}주`)
      });
      
      setPortfolio(portfolioData);
      
      // 🔥 성공 메시지
      if (portfolioData.holdings.length > 0) {
        console.log(`🎉 포트폴리오 업데이트 성공! ${portfolioData.holdings.length}개 주식 보유 중`);
      } else {
        console.log('📝 포트폴리오가 비어있습니다 (보유 주식 없음)');
      }
      
    } else {
      console.error('❌ 포트폴리오 데이터가 유효하지 않음:', data);
      throw new Error('유효하지 않은 포트폴리오 데이터');
    }
  } catch (error) {
    console.error('❌ 포트폴리오 조회 실패:', error);
    
    // 🔥 오류 시 빈 포트폴리오로 초기화
    const emptyPortfolio: Portfolio = {
      team: teamData || createDefaultTeam(),
      holdings: [],
      totalValue: 0,
      totalInvestment: 0,
      totalProfit: 0,
      profitPercent: 0
    };
    
    console.log('🔄 빈 포트폴리오로 초기화');
    setPortfolio(emptyPortfolio);
  }
};

  const handleTrade = async () => {
  if (!selectedStock || !teamData) return;
  
  setLoading(true);
  try {
    console.log('🔄 거래 시작:', { 
      teamId: teamData.id,
      stockId: selectedStock.id,
      symbol: selectedStock.symbol,
      action, 
      quantity 
    });
    
    // 1. 거래 실행
    await api.executeTrade(teamData.id, selectedStock.id, quantity, action);
    console.log('✅ 거래 완료');
    
    setShowModal(false);
    
    // 2. 짧은 지연 후 데이터 새로고침 (서버 DB 업데이트 대기)
    console.log('⏳ 서버 처리 대기 중...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. 포트폴리오 데이터 새로고침
    console.log('🔄 포트폴리오 데이터 새로고침 시작');
    const portfolioData = await api.getPortfolio(teamData.id);
    console.log('📊 새로 받은 포트폴리오:', portfolioData);
    
    // 4. 팀 잔액 업데이트
    const updatedTeam: Team = {
      ...teamData,
      balance: portfolioData.team.balance,
    };
    console.log('💰 팀 잔액 업데이트:', teamData.balance, '→', updatedTeam.balance);
    
    setTeamData(updatedTeam);
    localStorage.setItem('teamData', JSON.stringify(updatedTeam));
    
    // 5. 모든 데이터 강제 새로고침
    await Promise.all([
      fetchStocks(),
      fetchPortfolio(teamData.id)
    ]);
    
    console.log('🎉 모든 데이터 새로고침 완료');
    
    // 6. 매수 시 포트폴리오 탭으로 자동 전환
    if (action === 'buy') {
      setTimeout(() => {
        console.log('📂 포트폴리오 탭으로 자동 전환');
        setActiveTab('portfolio');
      }, 500);
    }
    
    // 7. 성공 알림
    alert(`✅ ${action === 'buy' ? '매수' : '매도'} 완료!\n${selectedStock.symbol} ${quantity}주`);
    
  } catch (error: any) {
    console.error('❌ 거래 실패:', error);
    alert(`❌ 거래 실패: ${error.message || '알 수 없는 오류'}`);
  } finally {
    setLoading(false);
  }
};

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Clean Energy': '⚡',
      'Sustainable Food': '🥬',
      'Wind Energy': '💨',
      'Solar Energy': '☀️',
      'Waste Management': '♻️',
      'Water Treatment': '💧',
      'Organic Agriculture': '🌱',
      'Carbon Capture': '🌍',
    };
    return icons[category as keyof typeof icons] || '📈';
  };

  const getCategoryGradient = (category: string) => {
    const gradients = {
      'Clean Energy': 'bg-gradient-to-r from-emerald-500 to-green-600',
      'Sustainable Food': 'bg-gradient-to-r from-yellow-500 to-orange-600',
      'Wind Energy': 'bg-gradient-to-r from-blue-500 to-cyan-600',
      'Solar Energy': 'bg-gradient-to-r from-orange-500 to-red-600',
      'Waste Management': 'bg-gradient-to-r from-purple-500 to-violet-600',
      'Water Treatment': 'bg-gradient-to-r from-cyan-500 to-teal-600',
      'Organic Agriculture': 'bg-gradient-to-r from-green-500 to-emerald-600',
      'Carbon Capture': 'bg-gradient-to-r from-gray-500 to-slate-600',
    };
    return gradients[category as keyof typeof gradients] || 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  const formatPrice = (price: number | undefined | null) => {
    // 🔥 완전한 안전 체크
    if (price === undefined || 
        price === null || 
        typeof price !== 'number' || 
        isNaN(price) || 
        !isFinite(price)) {
      return '₩0';
    }
    
    // 숫자로 변환 후 재검증
    const safePrice = Number(price);
    if (isNaN(safePrice) || !isFinite(safePrice)) {
      return '₩0';
    }
    
    try {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        minimumFractionDigits: 0,
      }).format(safePrice);
    } catch (error) {
      console.error('formatPrice 오류:', error, 'price:', price);
      return '₩0';
    }
  };

  const formatPercent = (percent: number | undefined | null) => {
    // 🔥 완전한 안전 체크 - 모든 경우의 수 처리
    if (percent === undefined || 
        percent === null || 
        typeof percent !== 'number' || 
        isNaN(percent) || 
        !isFinite(percent)) {
      return { text: '0.0%', color: 'text-gray-400' };
    }
    
    // 숫자로 변환 후 재검증
    const safePercent = Number(percent);
    if (isNaN(safePercent) || !isFinite(safePercent)) {
      return { text: '0.0%', color: 'text-gray-400' };
    }
    
    const color = safePercent > 0 ? 'text-emerald-400' : safePercent < 0 ? 'text-red-400' : 'text-gray-400';
    const sign = safePercent > 0 ? '+' : '';
    
    try {
      return { text: `${sign}${safePercent.toFixed(1)}%`, color };
    } catch (error) {
      console.error('formatPercent 오류:', error, 'percent:', percent);
      return { text: '0.0%', color: 'text-gray-400' };
    }
  };

  const calculateTotalCost = (price: number, qty: number) => {
    const cost = price * qty;
    const fee = cost * 0.005;
    return {
      cost,
      fee,
      total: cost + fee
    };
  };

  // 🔥 마운트되지 않았으면 로딩 화면 표시
  if (!isMounted || !teamData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl font-medium">주식 정보를 불러오는 중...</p>
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
              <button 
                onClick={() => router.push('/dashboard')}
                className="w-10 h-10 rounded-xl bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200"
              >
                ←
              </button>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ESG 주식 거래소</h1>
                <p className="text-gray-400">라운드 <span className="text-emerald-400 font-bold">{gameState.currentRound}</span> • 거래 시간</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">보유 현금</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {formatPrice(teamData.balance)}
                </div>
              </div>
              
              <button 
                onClick={() => {
                  fetchStocks();
                  if (teamData) fetchPortfolio(teamData.id);
                }}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg text-white font-bold transition-all duration-200"
              >
                🔄 새로고침
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('market')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'market'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span>🏪</span>
            <span>주식 시장</span>
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'portfolio'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span>💼</span>
            <span>내 보유주식</span>
            {portfolio && portfolio.holdings.length > 0 && (
              <span className="bg-emerald-500 text-white text-xs rounded-full px-2 py-1 ml-1">
                {portfolio.holdings.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* 게임 상태 표시 */}
        {gameState.timeRemaining > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="text-emerald-400 font-bold">거래 시간이 진행 중입니다!</p>
                <p className="text-gray-300 text-sm">
                  남은 시간: {Math.ceil(gameState.timeRemaining / 1000)}초
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 포트폴리오 요약 (항상 표시) */}
        {portfolio && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="text-2xl mr-3">💰</span>
              포트폴리오 요약
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">보유 현금</div>
                <div className="text-xl font-bold text-emerald-400">
                  {formatPrice(portfolio.team.balance)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">주식 가치</div>
                <div className="text-xl font-bold text-blue-400">
                  {formatPrice(portfolio.totalValue)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">총 자산</div>
                <div className="text-xl font-bold text-white">
                  {formatPrice(portfolio.team.balance + portfolio.totalValue)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">수익률</div>
                <div className={`text-xl font-bold ${formatPercent(portfolio.profitPercent).color}`}>
                  {formatPercent(portfolio.profitPercent).text}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 주식 시장 탭 */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            {stocks.length === 0 ? (
              <div className="bg-gray-800 rounded-xl p-16 border border-gray-700 text-center">
                <div className="text-6xl mb-6">📈</div>
                <h3 className="text-2xl font-bold text-white mb-4">주식 정보를 불러오는 중입니다.</h3>
                <p className="text-gray-400 text-lg">잠시만 기다려주세요!</p>
              </div>
            ) : (
              stocks.map((stock) => (
                <div key={stock.id} className="bg-gray-700 rounded-xl border border-gray-700 overflow-hidden hover:border-emerald-500/50 transition-all duration-300">
                  {/* 주식 헤더 */}
                  <div className={`${getCategoryGradient(stock.esgCategory)} p-6`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                          <span className="text-3xl">{getCategoryIcon(stock.esgCategory)}</span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">{stock.symbol}</h3>
                          <div className="flex items-center space-x-4 text-white/80">
                            <span className="font-medium">{stock.companyName}</span>
                            <span>•</span>
                            <span>{stock.esgCategory}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white mb-1">
                          {formatPrice(stock.currentPrice)}
                        </div>
                        <div className="text-sm text-white/80">현재가</div>
                      </div>
                    </div>
                  </div>

                  {/* 주식 내용 */}
                  <div className="p-6">
                    <div className="mb-6">
                      <p className="text-gray-300 text-lg leading-relaxed">{stock.description}</p>
                    </div>

                    {/* 보유 정보 표시 */}
                    {portfolio && portfolio.holdings.find(h => h.stock.symbol === stock.symbol) && (
                      <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-blue-400 font-bold">보유 중: </span>
                            <span className="text-white">
                              {portfolio.holdings.find(h => h.stock.symbol === stock.symbol)?.quantity}주
                            </span>
                          </div>
                          <div className="text-right">
                            {(() => {
                              const holding = portfolio.holdings.find(h => h.stock.symbol === stock.symbol);
                              if (!holding) return null;
                              const profitPercent = formatPercent(holding.profitPercent);
                              return (
                                <div className={`font-bold ${profitPercent.color}`}>
                                  {formatPrice(holding.profit)} ({profitPercent.text})
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 거래 버튼들 */}
                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          setSelectedStock(stock);
                          setAction('buy');
                          setQuantity(1);
                          setShowModal(true);
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <span className="text-xl">📈</span>
                        <span>매수하기</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedStock(stock);
                          setAction('sell');
                          setQuantity(1);
                          setShowModal(true);
                        }}
                        disabled={!portfolio?.holdings || !portfolio.holdings.find(h => h.stock && h.stock.symbol === stock.symbol)}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <span className="text-xl">📉</span>
                        <span>매도하기</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        
        {activeTab === 'portfolio' && (
          <div className="space-y-6">

            {/* 포트폴리오 내용 */}
            {!portfolio || !portfolio.holdings || portfolio.holdings.length === 0 ? (
              <div className="bg-gray-800 rounded-xl p-16 border border-gray-700 text-center">
                <div className="text-6xl mb-6">💼</div>
                <h3 className="text-2xl font-bold text-white mb-4">보유한 주식이 없습니다</h3>
                
                {/* 🔥 상세한 상태 메시지 */}
                <div className="mb-6">
                  {!portfolio ? (
                    <p className="text-red-400 text-lg">⚠️ 포트폴리오 데이터를 불러올 수 없습니다</p>
                  ) : !portfolio.holdings ? (
                    <p className="text-yellow-400 text-lg">⚠️ holdings 데이터가 없습니다</p>
                  ) : portfolio.holdings.length === 0 ? (
                    <p className="text-gray-400 text-lg">주식 시장에서 ESG 기업에 투자해보세요!</p>
                  ) : (
                    <p className="text-yellow-400 text-lg">⚠️ 주식 데이터에 문제가 있습니다</p>
                  )}
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={() => setActiveTab('market')}
                    className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg font-bold transition-all duration-200 mr-4"
                  >
                    📈 주식 시장 보기
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (teamData?.id) {
                        console.log('🔄 다시 시도하기');
                        await fetchPortfolio(teamData.id);
                      }
                    }}
                    disabled={!teamData || loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-bold transition-all duration-200"
                  >
                    {loading ? '🔄 확인 중...' : '🔄 다시 확인하기'}
                  </button>
                </div>
              </div>
            ) : (
              // 🔥 실제 포트폴리오 표시 - 완전히 수정됨
              <>
                <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-400/30 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-emerald-400">
                        {portfolio.holdings.length}
                      </div>
                      <div className="text-sm text-gray-400">보유 종목</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">
                        {formatPrice(portfolio.totalValue)}
                      </div>
                      <div className="text-sm text-gray-400">총 주식 가치</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${formatPercent(portfolio.profitPercent).color}`}>
                        {formatPercent(portfolio.profitPercent).text}
                      </div>
                      <div className="text-sm text-gray-400">총 수익률</div>
                    </div>
                  </div>
                </div>

                {/* 🔥 보유 주식 목록 - 완전히 수정됨 */}
                <div className="space-y-4">
                  {portfolio.holdings
                    .filter(holding => holding && holding.stock && holding.quantity > 0)
                    .map((holding) => (
                    <div key={holding.id} className="bg-gray-700 rounded-xl border border-gray-700 overflow-hidden">
                      {/* 주식 헤더 */}
                      <div className={`${getCategoryGradient(holding.stock.esgCategory)} p-6`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                              <span className="text-3xl">{getCategoryIcon(holding.stock.esgCategory)}</span>
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-2">{holding.stock.symbol}</h3>
                              <div className="flex items-center space-x-4 text-white/80">
                                <span className="font-medium">{holding.stock.companyName}</span>
                                <span>•</span>
                                <span>{holding.stock.esgCategory}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-3xl font-bold text-white mb-1">
                              {formatPrice(holding.stock.currentPrice)}
                            </div>
                            <div className="text-sm text-white/80">현재가</div>
                          </div>
                        </div>
                      </div>

                      {/* 보유 정보 */}
                      <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center">
                            <div className="text-sm text-gray-400 mb-1">보유 수량</div>
                            <div className="text-xl font-bold text-white">{holding.quantity || 0}주</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-gray-400 mb-1">평균 단가</div>
                            <div className="text-xl font-bold text-blue-400">{formatPrice(holding.averagePrice)}</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-gray-400 mb-1">현재 가치</div>
                            <div className="text-xl font-bold text-emerald-400">{formatPrice(holding.currentValue)}</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-gray-400 mb-1">수익률</div>
                            <div className={`text-xl font-bold ${formatPercent(holding.profitPercent).color}`}>
                              {formatPercent(holding.profitPercent).text}
                            </div>
                          </div>
                        </div>

                        {/* 🔥 매도 버튼 - 수정됨 (stock -> holding.stock) */}
                        <button
                          onClick={() => {
                            setSelectedStock(holding.stock); // 🔥 stock -> holding.stock
                            setAction('sell');
                            setQuantity(1);
                            setShowModal(true);
                          }}
                          disabled={!holding.stock || holding.quantity <= 0}
                          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <span className="text-xl">📉</span>
                          <span>매도하기</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 하단 액션 버튼 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <button
            onClick={() => router.push('/ranking')}
            className="bg-gray-800 border border-gray-700 hover:border-yellow-500/50 rounded-xl p-6 text-center transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl">🏆</span>
              <span className="text-xl font-bold text-yellow-400">현재 순위 보기</span>
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
      </div>

      {/* 거래 모달 */}
      {showModal && selectedStock && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl max-w-md w-full shadow-2xl">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <span className="text-2xl">{action === 'buy' ? '📈' : '📉'}</span>
                <span>{action === 'buy' ? '매수' : '매도'} 주문</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            
            {/* 모달 내용 */}
            <div className="p-6 space-y-6">
              {/* 주식 정보 */}
              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedStock.symbol}</h3>
                    <p className="text-gray-300">{selectedStock.companyName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">{formatPrice(selectedStock.currentPrice)}</div>
                    <div className="text-sm text-gray-400">현재가</div>
                  </div>
                </div>
              </div>

              {/* 매도 시 보유량 표시 */}
              {action === 'sell' && portfolio && (
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-blue-400">보유 수량:</span>
                    <span className="text-white font-bold">
                      {portfolio.holdings.find(h => h.stock && h.stock.symbol === selectedStock.symbol)?.quantity || 0}주
                    </span>
                  </div>
                </div>
              )}
              
              {/* 수량 선택 */}
              <div>
                <label className="block text-white font-medium mb-3">거래 수량</label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-xl bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white font-bold text-xl transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                      const maxQuantity = action === 'sell' && portfolio 
                        ? (portfolio.holdings.find(h => h.stock && h.stock.symbol === selectedStock.symbol)?.quantity || 1)
                        : 999;
                      setQuantity(Math.min(newQuantity, maxQuantity));
                    }}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-xl font-bold"
                    min="1"
                    max={action === 'sell' && portfolio 
                      ? (portfolio.holdings.find(h => h.stock && h.stock.symbol === selectedStock.symbol)?.quantity || 1)
                      : undefined}
                  />
                  <button
                    onClick={() => {
                      const maxQuantity = action === 'sell' && portfolio 
                        ? (portfolio.holdings.find(h => h.stock && h.stock.symbol === selectedStock.symbol)?.quantity || 1)
                        : quantity + 1;
                      setQuantity(action === 'sell' ? maxQuantity : quantity + 1);
                    }}
                    className="w-12 h-12 rounded-xl bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white font-bold text-xl transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* 거래 요약 */}
              {(() => {
                const { cost, fee, total } = calculateTotalCost(selectedStock.currentPrice, quantity);
                const hasInsufficientBalance = action === 'buy' && teamData && total > teamData.balance;
                const hasInsufficientShares = action === 'sell' && portfolio && 
                  quantity > (portfolio.holdings.find(h => h.stock && h.stock.symbol === selectedStock.symbol)?.quantity || 0);
                
                return (
                  <div className="bg-gray-700/50 rounded-xl p-4">
                    <h4 className="text-white font-bold mb-3">거래 요약</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">거래 금액:</span>
                        <span className="text-white font-bold">{formatPrice(cost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">수수료 (0.5%):</span>
                        <span className="text-red-400 font-bold">{formatPrice(fee)}</span>
                      </div>
                      <div className="border-t border-gray-600 pt-2">
                        <div className="flex justify-between">
                          <span className="text-white font-bold">총 {action === 'buy' ? '지불' : '수취'} 금액:</span>
                          <span className="text-2xl font-bold text-emerald-400">{formatPrice(total)}</span>
                        </div>
                      </div>
                      
                      {/* 오류 메시지 */}
                      {hasInsufficientBalance && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-center">
                          <span className="text-red-400">⚠️ 잔액이 부족합니다</span>
                        </div>
                      )}
                      {hasInsufficientShares && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-center">
                          <span className="text-red-400">⚠️ 보유 수량이 부족합니다</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* 모달 액션 버튼 */}
            <div className="p-6 border-t border-gray-700 flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-xl text-white font-bold transition-all duration-200"
              >
                취소
              </button>
              <button
                onClick={handleTrade}
                disabled={loading || 
                  (action === 'buy' && teamData && calculateTotalCost(selectedStock.currentPrice, quantity).total > teamData.balance) ||
                  (action === 'sell' && portfolio && quantity > (portfolio.holdings.find(h => h.stock && h.stock.symbol === selectedStock.symbol)?.quantity || 0))
                }
                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  action === 'buy' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>처리 중...</span>
                  </div>
                ) : (
                  `${action === 'buy' ? '매수' : '매도'} 확인`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}