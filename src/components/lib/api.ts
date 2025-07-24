// lib/simpleApi.ts - 퀴즈 강제 제출 기능 추가

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// 기본 fetch 래퍼 - 에러 처리 포함
async function apiCall<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '서버 오류' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API 호출 실패 (${endpoint}):`, error);
    throw error;
  }
}

// 기존 코드 호환용 api 객체 (수정됨)
export const api = {
  // 이벤트/뉴스 관련
  getEvents: (round?: number) => {
    const url = round ? `/events?round=${round}` : '/events';
    return apiCall(url);
  },

  // 인증 관련
  login: (teamCode: string) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ teamCode }),
  }),

  // 게임 상태
  getGameState: () => apiCall('/game/state'),

  // 퀴즈 관련 (🔥 force 파라미터 추가)
  getQuizByRound: (round: number) => apiCall(`/quiz/${round}`),
  
  submitQuizAnswer: (
    teamId: number, 
    questionId: number, 
    selectedAnswer: number,
    options: { force?: boolean } = {}
  ) => {
    const endpoint = options.force ? '/quiz/submit?force=true' : '/quiz/submit';
    return apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify({ 
        teamId, 
        questionId, 
        selectedAnswer,
        force: options.force || false 
      }),
    });
  },

  // 🔥 새로 추가: 관리자용 퀴즈 데이터 정리
  clearQuizSubmissions: () => apiCall('/admin/clear-quiz-submissions', {
    method: 'DELETE',
  }),

  clearTeamQuizSubmission: (teamId: number, round: number) => 
    apiCall(`/admin/teams/${teamId}/quiz/${round}`, {
      method: 'DELETE',
    }),

  // 주식 관련
  getStocks: () => apiCall('/stocks'),
  
  executeTrade: (teamId: number, stockId: number, quantity: number, action: 'buy' | 'sell') => 
    apiCall('/trade', {
      method: 'POST',
      body: JSON.stringify({ teamId, stockId, quantity, action }),
    }),

  debug: {
    getStockPrices: () => apiCall('/debug/stocks'),
    forceUpdatePrice: (symbol: string, newPrice: number) => 
      apiCall('/admin/force-price', {
        method: 'POST',
        body: JSON.stringify({ symbol, newPrice }),
      }),
    reapplyEvents: () => apiCall('/game/reapply-events', { method: 'POST' }),
  },
  
  // 🔥 수정된 포트폴리오 함수
  getPortfolio: (teamId: number) => {
    console.log('📡 포트폴리오 API 호출:', teamId);
    return apiCall(`/portfolio/${teamId}`);
  },

  // 랭킹
  getRanking: () => apiCall('/ranking'),
};

// 나머지 코드는 동일하게 유지...
export const simpleApi = {
  // 🎮 게임 관련
  game: {
    getStatus: () => apiCall('/game/state'),
    start: () => apiCall('/game/start', { method: 'POST' }),
    reset: () => apiCall('/game/reset', { method: 'POST' }),
    nextStep: () => apiCall('/game/next-phase', { method: 'POST' }),
  },

  // 👥 팀 관련
  team: {
    login: (teamCode: string) => apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ teamCode }),
    }),
    getInfo: (teamId: number) => apiCall(`/portfolio/${teamId}`),
    getRanking: () => apiCall('/ranking'),
  },

  // 📰 뉴스 관련
  news: {
    getAll: () => apiCall('/events'),
    getByRound: (round: number) => apiCall(`/events?round=${round}`),
  },

  // 🧠 퀴즈 관련 (🔥 수정됨)
  quiz: {
    getQuestion: (round: number) => apiCall(`/quiz/${round}`),
    submitAnswer: (teamId: number, questionId: number, answer: number, force: boolean = false) => 
      api.submitQuizAnswer(teamId, questionId, answer, { force }),
    
    // 🔥 새로 추가: 강제 제출
    forceSubmit: (teamId: number, questionId: number, answer: number) => 
      api.submitQuizAnswer(teamId, questionId, answer, { force: true }),
  },

  // 📈 주식 관련
  stocks: {
    getAll: () => apiCall('/stocks'),
    buy: (teamId: number, stockId: number, quantity: number) => 
      apiCall('/trade', {
        method: 'POST',
        body: JSON.stringify({ teamId, stockId, quantity, action: 'buy' }),
      }),
    sell: (teamId: number, stockId: number, quantity: number) => 
      apiCall('/trade', {
        method: 'POST',
        body: JSON.stringify({ teamId, stockId, quantity, action: 'sell' }),
      }),
  },

  // 🔥 새로 추가: 관리자 기능
  admin: {
    clearAllQuizData: () => api.clearQuizSubmissions(),
    clearTeamQuiz: (teamId: number, round: number) => api.clearTeamQuizSubmission(teamId, round),
  },
};

// 나머지 헬퍼 함수들은 그대로 유지
export const gameHelper = {
  translatePhase: (phase: string): string => {
    const phases: Record<string, string> = {
      'news': '뉴스 읽기 📰',
      'quiz': '퀴즈 풀기 🧠',
      'trading': '주식 거래 📈',
      'results': '결과 보기 📊',
      'finished': '게임 끝 🏆',
    };
    return phases[phase] || '알 수 없음';
  },

  formatTime: (milliseconds: number): string => {
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  formatMoney: (amount: number): string => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억원`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만원`;
    } else {
      return `${amount.toLocaleString()}원`;
    }
  },

  formatProfit: (profit: number, isPercent: boolean = false): { text: string, color: string } => {
    const value = isPercent ? `${profit.toFixed(1)}%` : gameHelper.formatMoney(profit);
    const color = profit > 0 ? 'text-emerald-400' : profit < 0 ? 'text-red-400' : 'text-gray-400';
    const sign = profit > 0 ? '+' : '';
    
    return {
      text: `${sign}${value}`,
      color: color
    };
  },

  formatCategory: (category: string): string => {
    const categories: Record<string, string> = {
      'Clean Energy': '⚡ 청정에너지',
      'Sustainable Food': '🥬 지속가능 식품',
      'Wind Energy': '💨 풍력발전',
      'Solar Energy': '☀️ 태양광발전',
      'Waste Management': '♻️ 재활용',
      'Water Treatment': '💧 수질정화',
      'Organic Agriculture': '🌱 유기농업',
      'Carbon Capture': '🌍 탄소포집',
    };
    return categories[category] || category;
  },
};

export const storage = {
  saveTeam: (team: any) => {
    localStorage.setItem('teamData', JSON.stringify(team));
  },
  
  getTeam: () => {
    const data = localStorage.getItem('teamData');
    return data ? JSON.parse(data) : null;
  },
  
  markNewsRead: (round: number) => {
    localStorage.setItem(`news_read_r${round}`, 'true');
  },
  
  hasReadNews: (round: number): boolean => {
    return localStorage.getItem(`news_read_r${round}`) === 'true';
  },
  
  markQuizDone: (round: number) => {
    localStorage.setItem(`quiz_done_r${round}`, 'true');
  },
  
  hasFinishedQuiz: (round: number): boolean => {
    return localStorage.getItem(`quiz_done_r${round}`) === 'true';
  },
  
  clear: () => {
    localStorage.clear();
  },

  // 🔥 새로 추가: 게임 데이터만 정리
  clearGameData: () => {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('news_') || key.startsWith('quiz_')
    );
    keys.forEach(key => localStorage.removeItem(key));
    return keys.length;
  },
};

export const errorHandler = {
  getSimpleMessage: (error: any): string => {
    const message = error?.message || error || '알 수 없는 오류';
    
    const translations: Record<string, string> = {
      'Network Error': '인터넷 연결을 확인해주세요 🌐',
      'fetch failed': '서버에 연결할 수 없어요 🔌',
      '404': '요청한 정보를 찾을 수 없어요 🔍',
      '500': '서버에 문제가 생겼어요. 관리자에게 말씀드려주세요 🚨',
      '잔액이 부족합니다': '돈이 부족해요! 더 저렴한 주식을 사보세요 💰',
      '보유 주식이 부족합니다': '가지고 있는 주식이 없어요! 먼저 주식을 사야해요 📈',
      '게임이 진행 중이 아닙니다': '게임이 아직 시작되지 않았어요. 관리자를 기다려주세요 ⏳',
      '거래 시간이 아닙니다': '지금은 주식을 사고팔 수 없어요. 거래 시간을 기다려주세요 ⏰',
      '퀴즈 시간이 아닙니다': '지금은 퀴즈를 풀 수 없어요. 퀴즈 시간을 기다려주세요 🧠',
      '이미 퀴즈를 제출': '이미 퀴즈를 풀었어요! 다음 라운드를 기다려주세요 ✅',
    };
    
    for (const [key, translation] of Object.entries(translations)) {
      if (message.includes(key)) {
        return translation;
      }
    }
    
    return message;
  },
};

export const gameFlow = {
  getNextAction: (gameState: any, teamState: any) => {
    if (!gameState?.isActive || gameState?.currentRound > 8) {
      return {
        title: '게임 끝! 🎉',
        description: '수고했어요! 최종 순위를 확인해보세요.',
        action: '순위 보기',
        route: '/ranking',
        color: 'bg-purple-600',
      };
    }

    if (!gameState?.isActive) {
      return {
        title: '게임 준비 중... ⏳',
        description: '관리자가 게임을 시작할 때까지 기다려주세요.',
        action: '기다리기',
        route: '/dashboard',
        color: 'bg-gray-600',
      };
    }

    switch (gameState?.phase) {
      case 'news':
        return {
          title: '뉴스 읽기 📰',
          description: '환경 뉴스를 읽고 어떤 회사가 좋을지 생각해보세요!',
          action: '뉴스 보기',
          route: '/events',
          color: 'bg-blue-600',
        };
      
      case 'quiz':
        return {
          title: '퀴즈 시간 🧠',
          description: '환경 퀴즈를 풀고 보너스 돈을 받으세요!',
          action: '퀴즈 풀기',
          route: '/quiz',
          color: 'bg-purple-600',
        };
      
      case 'trading':
        return {
          title: '주식 거래 📈',
          description: '뉴스를 참고해서 환경에 좋은 회사 주식을 사보세요!',
          action: '주식 거래',
          route: '/stocks',
          color: 'bg-emerald-600',
        };
      
      case 'results':
        return {
          title: '결과 확인 📊',
          description: '이번 라운드 결과를 확인하고 순위를 봐요!',
          action: '순위 보기',
          route: '/ranking',
          color: 'bg-yellow-600',
        };
      
      default:
        return {
          title: '잠시만요... 🤔',
          description: '게임 상황을 확인하고 있어요.',
          action: '새로고침',
          route: '/dashboard',
          color: 'bg-gray-600',
        };
    }
  },
};