'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSimpleGame, GameGuide, GameHelpModal } from '../contexts/SimpleGameContext';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  href: string;
  disabled?: boolean;
  disabledReason?: string;
}

function QuickActionCard({ title, description, icon, color, href, disabled, disabledReason }: QuickActionCardProps) {
  if (disabled) {
    return (
      <div className="relative">
        <div className="card-glass opacity-50 cursor-not-allowed">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-dark-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl grayscale">{icon}</span>
            </div>
            <h3 className="text-lg font-bold text-dark-400 mb-2">{title}</h3>
            <p className="text-dark-500 text-sm">{description}</p>
            {disabledReason && (
              <p className="text-red-400 text-xs mt-2">🔒 {disabledReason}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={href}>
      <div className={`card-glass hover:glow-gold group cursor-pointer transition-all duration-300 transform hover:scale-105 ${color}`}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse backdrop-blur-sm">
            <span className="text-3xl">{icon}</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-white/80 text-sm">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export default function SimpleDashboard() {
  const { gameState, updateTeam, getNextAction, toggleHelp, refreshGameState } = useSimpleGame();
  const router = useRouter();
  const nextAction = getNextAction();

  useEffect(() => {
    const savedTeamData = localStorage.getItem('teamData');
    if (!savedTeamData) {
      router.push('/login');
      return;
    }
    
    const team = JSON.parse(savedTeamData);
    updateTeam(team);
  }, [router, updateTeam]);

  const handleLogout = () => {
    localStorage.removeItem('teamData');
    router.push('/login');
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!gameState.team) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gold-300 text-xl">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* 헤더 - admin 스타일 적용 */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🌱</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ESG 투자 게임</h1>
                <p className="text-gray-400">
                  {gameState.team.name} <span className="text-emerald-400">({gameState.team.code})</span>
                </p>
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
                onClick={toggleHelp}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-bold"
              >
                💡 도움말
              </button>
              
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-bold"
              >
                🚪 나가기
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* 에러 표시 */}
        {gameState.error && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚠️</span>
              <span className="text-red-400 font-medium">{gameState.error}</span>
            </div>
          </div>
        )}

        {/* 게임 가이드 */}
        <GameGuide />

        {/* 다음 액션 버튼 */}
        <div className="mb-8">
          <Link href={nextAction.route}>
            <div className={`${nextAction.color} p-8 rounded-2xl text-white text-center hover:scale-105 transform transition-all duration-300 cursor-pointer shadow-2xl`}>
              <div className="text-6xl mb-4">{nextAction.icon}</div>
              <h2 className="text-3xl font-bold mb-4">{nextAction.title}</h2>
              <p className="text-xl mb-6 opacity-90">{nextAction.description}</p>
              <div className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-full inline-block">
                <span className="text-xl font-bold">{nextAction.buttonText}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* 내 정보 카드 */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center text-white">
            <span className="text-2xl mr-3">💰</span>
            내 정보
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-3xl">💵</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                {formatMoney(gameState.team.balance)}
              </p>
              <p className="text-gray-400 font-medium">보유 현금</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-3xl">🧠</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{gameState.team.quizScore}점</p>
              <p className="text-gray-400 font-medium">퀴즈 점수</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-3xl">🌍</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{gameState.team.esgScore}점</p>
              <p className="text-gray-400 font-medium">환경 점수</p>
            </div>
          </div>
        </div>

        {/* 퀵 액션 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <QuickActionCard
            title="뉴스 보기"
            description="환경 뉴스 확인하기"
            icon="📰"
            color="bg-gradient-to-br from-blue-500 to-blue-700"
            href="/events"
          />
          
          <QuickActionCard
            title="퀴즈 풀기"
            description="환경 퀴즈로 돈 벌기"
            icon="🧠"
            color="bg-gradient-to-br from-purple-500 to-purple-700"
            href="/quiz"
            disabled={!gameState.isActive || gameState.phase !== 'learning'}
            disabledReason={!gameState.isActive ? "게임이 시작되지 않았어요" : "퀴즈 시간이 아니에요"}
          />
          
          <QuickActionCard
            title="주식 거래"
            description="환경 회사 주식 사기"
            icon="📈"
            color="bg-gradient-to-br from-emerald-500 to-emerald-700"
            href="/stocks"
            disabled={!gameState.canTrade}
            disabledReason="거래 시간이 아니에요"
          />
          
          <QuickActionCard
            title="순위 보기"
            description="내 순위 확인하기"
            icon="🏆"
            color="bg-gradient-to-br from-yellow-500 to-orange-600"
            href="/ranking"
          />
        </div>

        {/* 게임 진행률 */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="text-xl mr-2">🎯</span>
            게임 진행률
          </h3>
          <div className="flex items-center justify-center space-x-3 mb-4">
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

        {/* 도움말 팁 */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-400/30 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <span className="text-2xl">💡</span>
            <span className="text-emerald-400 font-bold text-lg">게임 팁</span>
          </div>
          <p className="text-gray-300 mb-2">
            환경에 좋은 회사에 투자하면 더 많은 점수를 받을 수 있어요!
          </p>
          <p className="text-gray-400 text-sm">
            뉴스를 잘 읽고 퀴즈도 맞춰서 보너스 돈을 받아보세요! 🌟
          </p>
        </div>
      </div>

      {/* 도움말 모달 */}
      <GameHelpModal />
    </div>
  );
}