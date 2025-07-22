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
  const [gameState, setGameState] = useState({
    currentRound: 1,
    phase: 'trading',
    isActive: true,
    timeRemaining: 0
  });
  const router = useRouter();

  useEffect(() => {
    const savedTeamData = localStorage.getItem('teamData');
    if (!savedTeamData) {
      router.push('/login');
      return;
    }
    
    setTeamData(JSON.parse(savedTeamData));
    fetchStocks();
    fetchGameState();
  }, [router]);

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
      setStocks(data);
    } catch (error) {
      console.error('주식 정보 조회 실패:', error);
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
                onClick={fetchStocks}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg text-white font-bold transition-all duration-200"
              >
                🔄 새로고침
              </button>
            </div>
          </div>
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

        {/* 주식 목록 */}
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
                      className="flex-1 bg-red-600 hover:bg-red-700 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-2"
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
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-xl font-bold"
                    min="1"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-xl bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white font-bold text-xl transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* 거래 요약 */}
              {(() => {
                const { cost, fee, total } = calculateTotalCost(selectedStock.currentPrice, quantity);
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
                      {action === 'buy' && total > teamData.balance && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-center">
                          <span className="text-red-400">⚠️ 잔액이 부족합니다</span>
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
                disabled={loading || (action === 'buy' && calculateTotalCost(selectedStock.currentPrice, quantity).total > teamData.balance)}
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