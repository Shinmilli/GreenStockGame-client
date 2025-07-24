'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../components/lib/api';
import { Team, QuizQuestion, QuizResult, GameState } from '../../types';

export default function Quiz() {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [debugMode, setDebugMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedTeamData = localStorage.getItem('teamData');
    if (!savedTeamData) {
      router.push('/login');
      return;
    }
    
    setTeamData(JSON.parse(savedTeamData));
    
    if (process.env.NODE_ENV === 'development') {
      setDebugMode(true);
    }
    
    fetchGameState();
  }, [router]);

  const fetchGameState = async () => {
    try {
      const gameStateData = await api.getGameState();
      setGameState(gameStateData);
      
      if (!gameStateData.isActive) {
        setError('게임이 진행 중이 아닙니다.');
        return;
      }
      
      if (gameStateData.phase !== 'quiz') {
        setError(`퀴즈 시간이 아닙니다. 현재 단계: ${getPhaseKorean(gameStateData.phase)}`);
        return;
      }
      
      fetchQuizQuestion(gameStateData.currentRound);
    } catch (error) {
      console.error('게임 상태 조회 실패:', error);
      setError('게임 상태를 확인할 수 없습니다.');
    }
  };

  const fetchQuizQuestion = async (round: number) => {
    try {
      const data = await api.getQuizByRound(round);
      setQuestion(data);
      setSelectedAnswer(null);
      setError('');
    } catch (error: any) {
      console.error('퀴즈 조회 실패:', error);
      if (error.message?.includes('현재 라운드')) {
        setError(`라운드가 일치하지 않습니다. 현재 라운드: ${gameState?.currentRound || '알 수 없음'}`);
      } else if (error.message?.includes('퀴즈 단계가 아닙니다')) {
        setError('퀴즈 시간이 아닙니다. 대시보드로 돌아가서 게임 진행 상황을 확인하세요.');
      } else {
        setError('퀴즈를 불러올 수 없습니다: ' + error.message);
      }
    }
  };

  const submitAnswer = async (forceMode: boolean = false) => {
    if (!question || selectedAnswer === null || !teamData || !gameState) return;
    
    setLoading(true);
    try {
      let result: QuizResult;
      
      if (forceMode) {
        console.log('🔓 강제 제출 모드 사용');
        result = await api.submitQuizAnswer(teamData.id, question.id, selectedAnswer, { force: true });
      } else {
        try {
          result = await api.submitQuizAnswer(teamData.id, question.id, selectedAnswer);
        } catch (firstError: any) {
          if (firstError.message?.includes('이미 퀴즈를 제출')) {
            console.log('⚠️ 이미 제출 오류 감지 - 강제 제출 모드로 재시도');
            result = await api.submitQuizAnswer(teamData.id, question.id, selectedAnswer, { force: true });
            console.log('✅ 강제 제출 성공');
          } else {
            throw firstError;
          }
        }
      }
      
      setQuizResult(result);
      setShowResult(true);
      
      localStorage.setItem(`quiz_done_r${gameState.currentRound}`, 'true');
      
      if (result.correct && result.newBalance) {
        const updatedTeam: Team = {
          ...teamData,
          balance: result.newBalance,
        };
        setTeamData(updatedTeam);
        localStorage.setItem('teamData', JSON.stringify(updatedTeam));
      }
      
    } catch (error: any) {
      console.error('퀴즈 제출 최종 실패:', error);
      if (error.message?.includes('이미 퀴즈를 제출')) {
        setError('이미 이 라운드의 퀴즈를 제출했습니다.');
      } else if (error.message?.includes('시간이 초과')) {
        setError('퀴즈 제출 시간이 초과되었습니다.');
      } else {
        setError('퀴즈 제출에 실패했습니다: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const createFakeResult = () => {
    if (!teamData || !gameState) return;
    
    const isCorrect = Math.random() > 0.5;
    const bonus = isCorrect ? Math.floor(teamData.balance * 0.02) : 0;
    
    const fakeResult: QuizResult = {
      correct: isCorrect,
      correctAnswer: Math.floor(Math.random() * 4),
      bonus: bonus,
      newBalance: teamData.balance + bonus,
      explanation: '테스트 모드로 생성된 결과입니다.'
    };
    
    setQuizResult(fakeResult);
    setShowResult(true);
    setSelectedAnswer(fakeResult.correctAnswer);
    
    localStorage.setItem(`quiz_done_r${gameState.currentRound}`, 'true');
    
    if (isCorrect) {
      const updatedTeam: Team = {
        ...teamData,
        balance: fakeResult.newBalance,
      };
      setTeamData(updatedTeam);
      localStorage.setItem('teamData', JSON.stringify(updatedTeam));
    }
    
    console.log('🎭 가짜 퀴즈 결과 생성:', fakeResult);
  };

  const handleContinue = () => {
    router.push('/dashboard');
  };

  const getPhaseKorean = (phase: string): string => {
    const phaseMap: Record<string, string> = {
      'news': '뉴스 발표',
      'quiz': '퀴즈 단계',
      'trading': '거래 단계',
      'results': '결과 발표',
      'finished': '게임 종료'
    };
    return phaseMap[phase] || phase;
  };

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index 
        ? 'bg-gray-700 border-purple-500 text-purple-300' 
        : 'bg-gray-700 border-gray-600 text-gray-200 hover:border-purple-500/50 hover:bg-purple-500/10';
    }
    
    if (showResult && quizResult && index === quizResult.correctAnswer) {
      return 'bg-gray-700 border-emerald-400 text-emerald-300';
    }
    
    if (index === selectedAnswer && quizResult && !quizResult.correct) {
      return 'bg-gray-700 border-red-400 text-red-300';
    }
    
    return 'bg-gray-700 border-gray-600 text-gray-400';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // 에러 상태 렌더링
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center max-w-md mx-4">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">퀴즈 접근 불가</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchGameState}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white font-bold w-full transition-all duration-200"
            >
              다시 시도
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-bold w-full transition-all duration-200"
            >
              대시보드로 돌아가기
            </button>
            
            {debugMode && (
              <>
                <button
                  onClick={createFakeResult}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white font-bold w-full transition-all duration-200"
                >
                  🎭 테스트용 가짜 결과
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-bold w-full transition-all duration-200"
                >
                  🚨 완전 초기화
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!teamData || !question || !gameState) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl font-medium">퀴즈를 불러오는 중...</p>
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
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🧠</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ESG 환경 퀴즈</h1>
                <p className="text-gray-400">라운드 <span className="text-purple-400 font-bold">{gameState.currentRound}</span> • 퀴즈 시간</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">팀: {teamData.name}</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {formatPrice(teamData.balance)}
                </div>
              </div>
              
              <button 
                onClick={fetchGameState}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg text-white font-bold transition-all duration-200"
              >
                🔄 새로고침
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-4xl mx-auto">
        {/* 시간 경고 */}
        {gameState.timeRemaining < 30000 && gameState.timeRemaining > 0 && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mb-6 animate-pulse">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="text-red-400 font-bold">시간이 얼마 남지 않았습니다!</p>
                <p className="text-gray-300 text-sm">
                  남은 시간: {Math.ceil(gameState.timeRemaining / 1000)}초
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 퀴즈 메인 카드 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden mb-6">
          {/* 퀴즈 헤더 */}
          <div className="bg-gradient-to-r from-purple-500 to-violet-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-3xl">🧠</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">환경 퀴즈</h2>
                  <div className="flex items-center space-x-4 text-white/80">
                    <span className="font-medium">라운드 {gameState.currentRound}</span>
                    <span>•</span>
                    <span>문제 {gameState.currentRound} / 8</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl font-bold text-white">{gameState.currentRound}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 퀴즈 내용 */}
          <div className="p-6">
            {/* 문제 */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 leading-relaxed">
                {question.question}
              </h3>
            </div>
            
            {/* 선택지 */}
            <div className="space-y-4">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showResult && setSelectedAnswer(index)}
                  disabled={showResult}
                  className={`w-full p-4 border-2 rounded-xl transition-all duration-300 text-left hover:scale-[1.02] ${getOptionStyle(index)}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-current flex items-center justify-center font-bold text-lg">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1 text-lg leading-relaxed">{option}</span>
                    <div className="flex-shrink-0">
                      {showResult && quizResult && index === quizResult.correctAnswer && (
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">✓</span>
                        </div>
                      )}
                      {showResult && index === selectedAnswer && quizResult && !quizResult.correct && (
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">✗</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 결과 카드 */}
        {showResult && quizResult && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
            <div className="text-center">
              <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                quizResult.correct 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                  : 'bg-gradient-to-r from-red-500 to-red-600'
              }`}>
                <span className="text-4xl">
                  {quizResult.correct ? '🎉' : '😅'}
                </span>
              </div>
              
              <h3 className={`text-3xl font-bold mb-4 ${
                quizResult.correct ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {quizResult.correct ? '정답입니다!' : '아쉽네요!'}
              </h3>
              
              <p className="text-gray-300 text-lg mb-6">
                {quizResult.correct 
                  ? '투자 자금의 2% 보너스를 받았습니다!' 
                  : '다음 기회에 더 좋은 결과를 얻으세요!'}
              </p>
              
              {quizResult.correct && quizResult.bonus > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-4 max-w-md mx-auto">
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-3xl">🎁</span>
                    <div>
                      <p className="text-emerald-400 font-bold text-xl">
                        보너스: {formatPrice(quizResult.bonus)}
                      </p>
                      <p className="text-emerald-300 text-sm">투자 자금이 증가했습니다!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 진행 상황 카드 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <div className="text-center">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center justify-center space-x-2">
              <span className="text-2xl">🎯</span>
              <span>퀴즈 진행 상황</span>
            </h4>
            
            <div className="flex items-center justify-center space-x-2 mb-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    i < gameState.currentRound - 1
                      ? 'bg-emerald-500' 
                      : i === gameState.currentRound - 1 
                      ? 'bg-purple-500 animate-pulse' 
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            
            <p className="text-gray-300">
              라운드 <span className="text-purple-400 font-bold">{gameState.currentRound}</span> / 8
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4">
          {!showResult ? (
            <>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-6 py-4 rounded-xl text-white font-bold text-lg transition-all duration-200"
              >
                대시보드로
              </button>
              <button
                onClick={() => submitAnswer(false)}
                disabled={selectedAnswer === null || loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-4 rounded-xl text-white font-bold text-lg transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>제출 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>답안 제출</span>
                    <span className="text-xl">🚀</span>
                  </div>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleContinue}
              className="w-full bg-emerald-600 hover:bg-emerald-700 px-6 py-4 rounded-xl text-white font-bold text-lg transition-all duration-200"
            >
              <div className="flex items-center justify-center space-x-3">
                <span>대시보드로 돌아가기</span>
                <span className="text-2xl">📊</span>
              </div>
            </button>
          )}
        </div>

        {/* 하단 액션 버튼들 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <button
            onClick={() => router.push('/stocks')}
            className="bg-gray-800 border border-gray-700 hover:border-emerald-500/50 rounded-xl p-6 text-center transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl">📈</span>
              <span className="text-xl font-bold text-emerald-400">주식 거래</span>
            </div>
          </button>
          <button
            onClick={() => router.push('/ranking')}
            className="bg-gray-800 border border-gray-700 hover:border-yellow-500/50 rounded-xl p-6 text-center transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl">🏆</span>
              <span className="text-xl font-bold text-yellow-400">현재 순위</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}