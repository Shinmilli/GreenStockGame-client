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
  const [debugMode, setDebugMode] = useState(false); // 🔥 디버그 모드 추가
  const router = useRouter();

  useEffect(() => {
    const savedTeamData = localStorage.getItem('teamData');
    if (!savedTeamData) {
      router.push('/login');
      return;
    }
    
    setTeamData(JSON.parse(savedTeamData));
    
    // 🔥 개발 모드에서 디버그 활성화
    if (process.env.NODE_ENV === 'development') {
      setDebugMode(true);
    }
    
    // 게임 상태 먼저 확인
    fetchGameState();
  }, [router]);

  const fetchGameState = async () => {
    try {
      const gameStateData = await api.getGameState();
      setGameState(gameStateData);
      
      // 퀴즈 단계가 아니면 경고
      if (!gameStateData.isActive) {
        setError('게임이 진행 중이 아닙니다.');
        return;
      }
      
      if (gameStateData.phase !== 'quiz') {
        setError(`퀴즈 시간이 아닙니다. 현재 단계: ${getPhaseKorean(gameStateData.phase)}`);
        return;
      }
      
      // 게임 상태의 현재 라운드로 퀴즈 조회
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
      setError(''); // 에러 클리어
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

  // 🔥 수정된 submitAnswer 함수 - 강제 제출 지원
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
          // 🔥 일반 제출 시도
          result = await api.submitQuizAnswer(teamData.id, question.id, selectedAnswer);
        } catch (firstError: any) {
          // 🔥 "이미 제출했다" 에러면 강제 제출 시도
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
      
      // 🔥 성공 시 로컬스토리지에 완료 표시
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

  // 🔥 테스트용 가짜 결과 생성 함수
  const createFakeResult = () => {
    if (!teamData || !gameState) return;
    
    const isCorrect = Math.random() > 0.5; // 50% 확률로 정답
    const bonus = isCorrect ? Math.floor(teamData.balance * 0.02) : 0;
    
    const fakeResult: QuizResult = {
      correct: isCorrect,
      correctAnswer: Math.floor(Math.random() * 4), // 랜덤 정답
      bonus: bonus,
      newBalance: teamData.balance + bonus,
      explanation: '테스트 모드로 생성된 결과입니다.'
    };
    
    setQuizResult(fakeResult);
    setShowResult(true);
    setSelectedAnswer(fakeResult.correctAnswer);
    
    // 로컬스토리지에 완료 표시
    localStorage.setItem(`quiz_done_r${gameState.currentRound}`, 'true');
    
    // 팀 데이터 업데이트
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
        ? 'glass-dark border-gold-400 bg-gold-500/10 text-gold-300' 
        : 'glass-dark border-dark-500 text-dark-200 hover:border-gold-400/50 hover:bg-gold-500/5';
    }
    
    if (showResult && quizResult && index === quizResult.correctAnswer) {
      return 'glass-dark border-emerald-400 bg-emerald-500/10 text-emerald-300';
    }
    
    if (index === selectedAnswer && quizResult && !quizResult.correct) {
      return 'glass-dark border-red-400 bg-red-500/10 text-red-300';
    }
    
    return 'glass-dark border-dark-600 text-dark-400';
  };

  // 에러 상태 렌더링
  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="card-dark text-center max-w-md mx-4">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">퀴즈 접근 불가</h2>
          <p className="text-dark-200 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchGameState}
              className="btn-secondary w-full"
            >
              다시 시도
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary w-full"
            >
              대시보드로 돌아가기
            </button>
            
            {/* 🔥 디버그 모드에서만 표시되는 우회 버튼 */}
            {debugMode && (
              <>
                <button
                  onClick={createFakeResult}
                  className="btn-success w-full"
                >
                  🎭 테스트용 가짜 결과
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded w-full text-white font-bold"
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
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-gold w-16 h-16 mx-auto mb-6"></div>
          <p className="text-gold-300 text-xl">퀴즈를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      {/* 배경 애니메이션 */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-blue opacity-10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-purple opacity-10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* 🔥 디버그 모드 버튼들
      {debugMode && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white font-bold text-sm block w-full"
          >
            🚨 완전 초기화
          </button>
          
          <button
            onClick={createFakeResult}
            className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-white font-bold text-sm block w-full"
          >
            🎭 가짜 결과
          </button>
          
          <button
            onClick={() => submitAnswer(true)}
            disabled={selectedAnswer === null || loading}
            className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded text-white font-bold text-sm block w-full disabled:opacity-50"
          >
            🔓 강제 제출
          </button>
        </div>
      )} */}
      {/* 헤더 */}
      <div className="glass-dark border-b border-dark-600 sticky top-0 z-50">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 rounded-xl bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-gold-300 hover:text-gold-200 transition-all duration-200"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gradient-blue">환경 퀴즈</h1>
              <p className="text-dark-200">라운드 <span className="text-blue-400 font-bold">{gameState.currentRound}</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-dark-300 text-sm">팀: <span className="text-gold-300">{teamData.name}</span></p>
            <p className="text-emerald-400 font-bold">
              {teamData.balance.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW', minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      <div className="relative px-4 py-8 max-w-4xl mx-auto">
        {/* 시간 경고 */}
        {gameState.timeRemaining < 30000 && (
          <div className="card-glass border-red-400/50 bg-red-500/10 mb-6 animate-pulse">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="text-red-400 font-bold">시간이 얼마 남지 않았습니다!</p>
                <p className="text-dark-300 text-sm">
                  남은 시간: {Math.ceil(gameState.timeRemaining / 1000)}초
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 퀴즈 카드 */}
        <div className="card-glass glow-blue mb-8">
          <div className="p-8">
            {/* 퀴즈 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-blue rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🧠</span>
                </div>
                <div>
                  <span className="badge-blue">환경 퀴즈</span>
                  <p className="text-dark-300 text-sm mt-1">문제 {gameState.currentRound}/8</p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-dark-900">{gameState.currentRound}</span>
                </div>
              </div>
            </div>
            
            {/* 문제 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gold-300 mb-6 leading-relaxed">
                {question.question}
              </h2>
            </div>
            
            {/* 선택지 */}
            <div className="space-y-4">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showResult && setSelectedAnswer(index)}
                  disabled={showResult}
                  className={`w-full p-6 border-2 rounded-2xl transition-all duration-300 text-left group hover:scale-[1.02] ${getOptionStyle(index)}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-current flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
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
          <div className="card-glass mb-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 text-center">
              <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                quizResult.correct ? 'bg-gradient-emerald glow-emerald' : 'bg-gradient-to-r from-red-400 to-red-600'
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
              
              <p className="text-dark-200 text-lg mb-6">
                {quizResult.correct 
                  ? '투자 자금의 2% 보너스를 받았습니다!' 
                  : '다음 기회에 더 좋은 결과를 얻으세요!'}
              </p>
              
              {quizResult.correct && quizResult.bonus > 0 && (
                <div className="card-glass bg-emerald-500/5 border-emerald-400/30 max-w-md mx-auto">
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-3xl">🎁</span>
                    <div>
                      <p className="text-emerald-400 font-bold text-xl">
                        보너스: +{quizResult.bonus.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW', minimumFractionDigits: 0 })}
                      </p>
                      <p className="text-emerald-300 text-sm">투자 자금이 증가했습니다!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-4">
          {!showResult ? (
            <>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-secondary flex-1 py-4 text-lg"
              >
                대시보드로
              </button>
              <button
                onClick={() => submitAnswer(false)}
                disabled={selectedAnswer === null || loading}
                className="btn-primary flex-1 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
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
              className="btn-success w-full py-4 text-lg font-bold"
            >
              <div className="flex items-center justify-center space-x-3">
                <span>대시보드로 돌아가기</span>
                <span className="text-2xl">📊</span>
              </div>
            </button>
          )}
        </div>

        {/* 진행 상황 */}
        <div className="mt-8 card-glass text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-2xl">🎯</span>
            <span className="text-xl font-bold text-gold-300">퀴즈 진행 상황</span>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  i < gameState.currentRound - 1
                    ? 'bg-gradient-emerald' 
                    : i === gameState.currentRound - 1 
                    ? 'bg-gradient-blue animate-pulse' 
                    : 'bg-dark-600'
                }`}
              />
            ))}
          </div>
          <p className="text-dark-200">
            라운드 <span className="text-blue-400 font-bold">{gameState.currentRound}</span> / 8
          </p>
        </div>
      </div>
    </div>
  );
}