"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../components/lib/api';
import { Stock, Team } from '../../types';

export default function Stocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const savedTeamData = localStorage.getItem('teamData');
    if (!savedTeamData) {
      router.push('/login');
      return;
    }
    
    setTeamData(JSON.parse(savedTeamData));
    fetchStocks();
    const savedRound = localStorage.getItem('currentRound');
    if (savedRound) {
      setCurrentRound(parseInt(savedRound));
    }
  }, [router]);

  const fetchStocks = async () => {
    try {
      const data = await api.getStocks();
      setStocks(data);
    } catch (error) {
      console.error('주식 정보 조회 실패:', error);
    }
  };

  const handleNextRound = () => {
    const nextRound = currentRound + 1;
    
    if (nextRound <= 8) {
      localStorage.setItem('currentRound', nextRound.toString());
      router.push('/quiz');
    } else {
      router.push('/ranking');
    }
  };

  const handleTrade = async () => {
    if (!selectedStock || !teamData) return;
    
    setLoading(true);
    try {
      await api.executeTrade(teamData.id, selectedStock.id, quantity, action);
      setShowModal(false);
      
      const portfolioData = await api.getPortfolio(teamData.id);
      const updatedTeam: Team = {
        ...teamData,
        balance: portfolioData.team.balance,
      };
      setTeamData(updatedTeam);
      localStorage.setItem('teamData', JSON.stringify(updatedTeam));
      
      fetchStocks();
    } catch (error: any) {
      alert(error.message || '거래 실패');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryStyle = (category: string) => {
    const styles = {
      'Clean Energy': 'bg-gradient-to-r from-emerald-400 to-emerald-600',
      'Sustainable Food': 'bg-gradient-to-r from-yellow-400 to-orange-500',
      'Wind Energy': 'bg-gradient-to-r from-blue-400 to-cyan-500',
      'Solar Energy': 'bg-gradient-to-r from-orange-400 to-red-500',
      'Waste Management': 'bg-gradient-to-r from-purple-400 to-pink-500',
      'Water Treatment': 'bg-gradient-to-r from-cyan-400 to-teal-500',
      'Organic Agriculture': 'bg-gradient-to-r from-lime-400 to-green-500',
      'Carbon Capture': 'bg-gradient-to-r from-gray-400 to-slate-600',
    };
    return styles[category as keyof typeof styles] || 'bg-gradient-to-r from-gray-400 to-gray-600';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(price);
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

  if (!teamData) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-gold w-16 h-16 mx-auto mb-4"></div>
          <p className="text-gold-300">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* 헤더 */}
      <div className="glass-dark border-b border-dark-600 sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-gold-300 hover:text-gold-200 transition-all duration-200"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gradient-gold">주식 거래소</h1>
              <p className="text-dark-200">
                보유 현금: <span className="text-emerald-400 font-bold">{formatPrice(teamData.balance)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={fetchStocks}
            className="btn-secondary text-sm px-4 py-2"
          >
            🔄 새로고침
          </button>
        </div>
      </div>

      {/* 주식 리스트 */}
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {stocks.map((stock) => (
            <div 
              key={stock.id} 
              className="card-glass hover:glow-gold group transition-all duration-500 transform hover:scale-[1.02] overflow-hidden"
            >
              <div className="p-6">
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-2xl font-bold text-gold-300">{stock.symbol}</h3>
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getCategoryStyle(stock.esgCategory)}`}
                      >
                        {stock.esgCategory}
                      </span>
                    </div>
                    <p className="text-dark-200 font-medium mb-2">{stock.companyName}</p>
                    <p className="text-sm text-dark-300 line-clamp-2 leading-relaxed">{stock.description}</p>
                  </div>
                </div>
                
                {/* 가격 */}
                <div className="bg-dark-800/50 rounded-xl p-4 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gradient-gold mb-1">
                      {formatPrice(stock.currentPrice)}
                    </p>
                    <p className="text-dark-300 text-sm">현재가</p>
                  </div>
                </div>
                
                {/* 거래 버튼 */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setSelectedStock(stock);
                      setAction('buy');
                      setQuantity(1);
                      setShowModal(true);
                    }}
                    className="btn-success py-3 flex items-center justify-center space-x-2 group-hover:scale-105 transition-transform"
                  >
                    <span>📈</span>
                    <span>매수</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStock(stock);
                      setAction('sell');
                      setQuantity(1);
                      setShowModal(true);
                    }}
                    className="btn-danger py-3 flex items-center justify-center space-x-2 group-hover:scale-105 transition-transform"
                  >
                    <span>📉</span>
                    <span>매도</span>
                  </button>
                </div>
              </div>
              
              {/* 데코레이션 */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-emerald rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ))}
        </div>
      </div>

      {/* 다음 라운드 진행 */}
      <div className="px-4 pb-6 max-w-7xl mx-auto">
        <div className="card-gold text-center glow-gold">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-3xl">🎯</span>
            <span className="text-xl font-bold text-gradient-gold">
              라운드 진행
            </span>
          </div>
          <p className="text-dark-200 mb-6">
            현재 라운드 <span className="text-gold-400 font-bold">{currentRound}/8</span>
          </p>
          <button
            onClick={handleNextRound}
            className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
          >
            {currentRound < 8 
              ? `다음 라운드 (${currentRound + 1}) 퀴즈 풀러 가기 🚀` 
              : '게임 종료 - 최종 순위 확인하기 🏆'}
          </button>
        </div>
      </div>

      {/* 거래 모달 */}
      {showModal && selectedStock && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-glass max-w-md w-full glow-gold animate-in slide-in-from-bottom-4 duration-300">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-dark-600">
              <div>
                <h2 className="text-xl font-bold text-gold-300 flex items-center space-x-2">
                  <span>{action === 'buy' ? '📈' : '📉'}</span>
                  <span>{action === 'buy' ? '매수' : '매도'}</span>
                </h2>
                <p className="text-dark-200 mt-1">{selectedStock.symbol} - {selectedStock.companyName}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-dark-300 hover:text-gold-300 transition-colors"
              >
                ×
              </button>
            </div>
            
            {/* 컨텐츠 */}
            <div className="p-6 space-y-6">
              <div className="bg-dark-800/50 rounded-xl p-4 text-center">
                <p className="text-dark-300 text-sm mb-1">현재가</p>
                <p className="text-2xl font-bold text-gold-300">{formatPrice(selectedStock.currentPrice)}</p>
              </div>
              
              {/* 수량 선택 */}
              <div>
                <label className="block text-gold-300 font-medium mb-3">수량</label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-xl bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-gold-300 font-bold text-xl transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input-dark flex-1 text-center text-xl py-3 font-bold"
                    min="1"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-xl bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-gold-300 font-bold text-xl transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* 거래 요약 */}
              {(() => {
                const { cost, fee, total } = calculateTotalCost(selectedStock.currentPrice, quantity);
                return (
                  <div className="glass-dark rounded-xl p-4">
                    <h3 className="text-gold-300 font-medium mb-3">거래 요약</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-dark-300">거래 금액:</span>
                        <span className="font-semibold text-gold-200">{formatPrice(cost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-300">수수료 (0.5%):</span>
                        <span className="text-red-400">{formatPrice(fee)}</span>
                      </div>
                      <div className="border-t border-dark-600 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-gold-200">총 금액:</span>
                          <span className="font-bold text-xl text-gradient-gold">{formatPrice(total)}</span>
                        </div>
                      </div>
                      {action === 'buy' && total > teamData.balance && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                          <span className="text-red-400 text-sm">⚠️ 잔액이 부족합니다</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* 액션 버튼 */}
            <div className="p-6 border-t border-dark-600 flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1 py-3"
              >
                취소
              </button>
              <button
                onClick={handleTrade}
                disabled={loading || (action === 'buy' && calculateTotalCost(selectedStock.currentPrice, quantity).total > teamData.balance)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  action === 'buy' 
                    ? 'btn-success' 
                    : 'btn-danger'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
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