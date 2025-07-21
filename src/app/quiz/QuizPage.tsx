'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../components/lib/api';
import { Team, QuizQuestion, QuizResult } from '../../types';

export default function Quiz() {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const savedTeamData = localStorage.getItem('teamData');
    if (!savedTeamData) {
      router.push('/login');
      return;
    }
    
    setTeamData(JSON.parse(savedTeamData));
    
    const savedRound = localStorage.getItem('currentRound');
    if (savedRound) {
      setCurrentRound(parseInt(savedRound));
    }
    
    fetchQuizQuestion();
  }, [router]);

  const fetchQuizQuestion = async () => {
    try {
      const data = await api.getQuizByRound(currentRound);
      setQuestion(data);
      setSelectedAnswer(null);
    } catch (error) {
      console.error('퀴즈 조회 실패:', error);
    }
  };

  const submitAnswer = async () => {
    if (!question || selectedAnswer === null || !teamData) return;
    
    setLoading(true);
    try {
      const result: QuizResult = await api.submitQuizAnswer(teamData.id, question.id, selectedAnswer);
      setQuizResult(result);
      setShowResult(true);
      
      if (result.correct && result.newBalance) {
        const updatedTeam: Team = {
          ...teamData,
          balance: result.newBalance,
        };
        setTeamData(updatedTeam);
        localStorage.setItem('teamData', JSON.stringify(updatedTeam));
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.push('/stocks');
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

  if (!teamData || !question) {
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

      {/* 헤더 */}
      <div className="glass-dark border-b border-dark-600 sticky top-0 z-50">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-gold-300 hover:text-gold-200 transition-all duration-200"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gradient-blue">환경 퀴즈</h1>
              <p className="text-dark-200">라운드 <span className="text-blue-400 font-bold">{currentRound}</span></p>
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
                  <p className="text-dark-300 text-sm mt-1">문제 {currentRound}/8</p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-dark-900">{currentRound}</span>
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
                나중에 하기
              </button>
              <button
                onClick={submitAnswer}
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
                <span>주식 거래하러 가기</span>
                <span className="text-2xl">📈</span>
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
                  i < currentRound 
                    ? 'bg-gradient-gold' 
                    : i === currentRound - 1 
                    ? 'bg-gradient-blue animate-pulse' 
                    : 'bg-dark-600'
                }`}
              />
            ))}
          </div>
          <p className="text-dark-200">
            라운드 <span className="text-blue-400 font-bold">{currentRound}</span> / 8
          </p>
        </div>
      </div>
    </div>
  );
}