// app/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      {/* 배경 애니메이션 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-emerald-500/20 to-green-600/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-cyan-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-yellow-500/20 to-orange-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* 그리드 패턴 배경 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      {/* 메인 컨텐츠 */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center">
        
        {/* 로고 섹션 */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full mb-8 animate-glow shadow-2xl">
            <span className="text-6xl">🌱</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-400 via-green-500 to-blue-500 bg-clip-text text-transparent">
              ESG 투자 게임
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            환경에 좋은 회사에 투자해서<br />
            <span className="text-emerald-400 font-bold">돈도 벌고 지구도 지켜요!</span> 🌍
          </p>
        </div>

        {/* 게임 특징 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
          <div className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="text-5xl mb-4">📰</div>
            <h3 className="text-xl font-bold text-blue-400 mb-3">뉴스 읽기</h3>
            <p className="text-gray-300">
              환경 뉴스를 읽고<br />
              어떤 회사가 좋을지<br />
              생각해보세요!
            </p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-xl font-bold text-purple-400 mb-3">퀴즈 풀기</h3>
            <p className="text-gray-300">
              환경 퀴즈를 맞추면<br />
              보너스 돈을<br />
              받을 수 있어요!
            </p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
            <div className="text-5xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-emerald-400 mb-3">주식 거래</h3>
            <p className="text-gray-300">
              환경에 좋은 회사<br />
              주식을 사서<br />
              돈을 벌어보세요!
            </p>
          </div>
        </div>

        {/* 게임 시작 버튼 */}
        <div className="space-y-6">
          <Link href="/login">
            <button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-6 px-12 rounded-2xl text-xl transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-emerald-500/30 animate-pulse">
              <span className="flex items-center space-x-3">
                <span>게임 시작하기</span>
                <span className="text-2xl">🚀</span>
              </span>
            </button>
          </Link>

          <div className="flex items-center justify-center space-x-6 text-gray-400">
            <Link href="/admin" className="hover:text-emerald-400 transition-colors flex items-center space-x-2">
              <span>⚙️</span>
              <span>관리자 페이지</span>
            </Link>
            <span>•</span>
            <Link href="/ranking" className="hover:text-yellow-400 transition-colors flex items-center space-x-2">
              <span>🏆</span>
              <span>순위 보기</span>
            </Link>
          </div>
        </div>

        {/* 게임 안내 */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-blue-400 mb-6 flex items-center justify-center">
              <span className="text-3xl mr-3">🎮</span>
              게임 방법
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <h4 className="font-bold text-gray-300 mb-1">팀 코드 입력</h4>
                  <p className="text-gray-400 text-sm">관리자가 주신 팀 코드로 로그인하세요</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <h4 className="font-bold text-gray-300 mb-1">뉴스와 퀴즈</h4>
                  <p className="text-gray-400 text-sm">환경 뉴스를 읽고 퀴즈를 풀어요</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <h4 className="font-bold text-gray-300 mb-1">투자하기</h4>
                  <p className="text-gray-400 text-sm">환경에 좋은 회사 주식을 사요</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 승리 조건 */}
        <div className="mt-12 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/30 rounded-2xl p-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-yellow-400 mb-3 flex items-center justify-center">
            <span className="text-2xl mr-2">🏆</span>
            승리 조건
          </h3>
          <p className="text-gray-300 text-lg">
            <span className="text-yellow-400 font-bold">가장 많은 돈을 번 팀</span> + 
            <span className="text-emerald-400 font-bold"> 환경에 가장 많이 투자한 팀</span>이 승리!
          </p>
        </div>
      </div>

      {/* 하단 파티클 효과 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-800/50 to-transparent pointer-events-none"></div>
    </div>
  );
}