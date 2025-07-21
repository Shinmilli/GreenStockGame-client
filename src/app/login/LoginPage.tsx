"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../components/lib/api';

export default function Login() {
  const [teamCode, setTeamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.login(teamCode);
      localStorage.setItem('teamData', JSON.stringify(data.team));
      localStorage.setItem('currentRound', '1');
      router.push('/dashboard');
    } catch (error) {
      setError('로그인에 실패했습니다. 팀 코드를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      {/* 배경 애니메이션 요소들 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-gold opacity-20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-emerald opacity-15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-blue opacity-10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* 그리드 패턴 배경 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="glass-dark rounded-3xl p-8 sm:p-12 w-full max-w-md transform hover:scale-[1.02] transition-all duration-500 glow-gold">
          {/* 로고 영역 */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-gold rounded-full mb-6 animate-glow">
              <span className="text-5xl">🌱</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gradient-gold mb-3">
              ESG INVEST
            </h1>
            <p className="text-dark-200 text-lg font-medium">지속가능한 미래를 위한 투자 게임</p>
            <div className="mt-4 h-1 w-20 bg-gradient-gold mx-auto rounded-full"></div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-gold-300 text-sm font-bold uppercase tracking-wider">
                팀 코드
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  className="input-dark w-full text-xl py-4 pl-6 pr-14 rounded-xl focus:glow-gold transition-all duration-300"
                  placeholder="TEAM-001"
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-5">
                  <span className="text-3xl group-focus-within:animate-pulse">🎮</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-gold transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
              </div>
            </div>
            
            {error && (
              <div className="card-glass border-red-500/30 bg-red-500/5">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚠️</span>
                  <span className="text-red-400 font-medium">{error}</span>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading || !teamCode.trim()}
              className="btn-primary w-full text-xl py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-3">
                  <div className="spinner-gold w-6 h-6"></div>
                  <span>로그인 중...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-3">
                  <span>게임 시작하기</span>
                  <span className="text-2xl">🚀</span>
                </span>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <div className="card-glass bg-blue-500/5 border-blue-400/20">
              <div className="flex items-center justify-center space-x-3 text-blue-300">
                <span className="text-xl">💡</span>
                <span className="text-sm font-medium">화면을 가로로 회전하면 더 편리해요</span>
              </div>
            </div>
          </div>

          {/* 데코레이션 요소 */}
          <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-gold rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-gradient-emerald rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      {/* 하단 파티클 효과 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-800/50 to-transparent pointer-events-none"></div>
    </div>
  );
}