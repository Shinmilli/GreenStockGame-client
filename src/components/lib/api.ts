// components/lib/api.ts
import { 
  Team, 
  Stock, 
  QuizQuestion, 
  QuizResult, 
  NewsEvent, 
  TeamRanking, 
  PortfolioData,
  GameState,
  TradeStatus,
  RoundQuizResults,
  RoundTradeHistory,
  LoginResponse,
  TradeResponse
} from '../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status, 
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('API 요청 오류:', error);
    throw new ApiError(500, '네트워크 오류가 발생했습니다.');
  }
}

export const api = {
  // ===== 인증 =====
  async login(teamCode: string): Promise<LoginResponse> {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ teamCode }),
    });
  },

  // ===== 게임 상태 관리 =====
  async getGameState(): Promise<GameState> {
    return fetchApi('/game/state');
  },

  async startGame(): Promise<{ message: string; gameState: GameState }> {
    return fetchApi('/game/start', {
      method: 'POST',
    });
  },

  async resetGame(): Promise<{ message: string; gameState: GameState }> {
    return fetchApi('/game/reset', {
      method: 'POST',
    });
  },

  async forceNextPhase(): Promise<{ message: string; gameState: GameState }> {
    return fetchApi('/game/next-phase', {
      method: 'POST',
    });
  },

  // ===== 주식 =====
  async getStocks(): Promise<Stock[]> {
    return fetchApi('/stocks');
  },

  async getStockHistory(stockId: number): Promise<any[]> {
    return fetchApi(`/stocks/${stockId}/history`);
  },

  // ===== 거래 =====
  async executeTrade(
    teamId: number, 
    stockId: number, 
    quantity: number, 
    action: 'buy' | 'sell'
  ): Promise<TradeResponse> {
    return fetchApi('/trade', {
      method: 'POST',
      body: JSON.stringify({ teamId, stockId, quantity, action }),
    });
  },

  async getTradeStatus(): Promise<TradeStatus> {
    return fetchApi('/game/trade/status');
  },

  async getRoundTradeHistory(round: number): Promise<RoundTradeHistory> {
    return fetchApi(`/game/trade/history/${round}`);
  },

  // ===== 포트폴리오 =====
  async getPortfolio(teamId: number): Promise<PortfolioData> {
    return fetchApi(`/portfolio/${teamId}`);
  },

  // ===== 퀴즈 =====
  async getQuizByRound(round: number): Promise<QuizQuestion> {
    return fetchApi(`/quiz/${round}`);
  },

  async submitQuizAnswer(
    teamId: number, 
    questionId: number, 
    selectedAnswer: number
  ): Promise<QuizResult> {
    return fetchApi('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ teamId, questionId, selectedAnswer }),
    });
  },

  async getQuizResults(round: number): Promise<RoundQuizResults> {
    return fetchApi(`/game/quiz/results/${round}`);
  },

  // ===== 랭킹 =====
  async getRanking(): Promise<TeamRanking[]> {
    return fetchApi('/ranking');
  },

  // ===== 이벤트/뉴스 =====
  async getEvents(round?: number): Promise<NewsEvent[]> {
    const params = round ? `?round=${round}` : '';
    return fetchApi(`/events${params}`);
  },

  async triggerEvent(
    eventId: number, 
    action: 'trigger' | 'activate' | 'deactivate'
  ): Promise<{ message: string; affectedStocks?: Record<string, number> }> {
    return fetchApi('/events/trigger', {
      method: 'POST',
      body: JSON.stringify({ eventId, action }),
    });
  },

  // ===== 헬스 체크 =====
  async healthCheck(): Promise<{ status: string; timestamp: string; environment: string }> {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    if (!response.ok) {
      throw new ApiError(response.status, 'Health check failed');
    }
    return response.json();
  },

  // ===== 관리자 기능 =====
  async getAdminInfo(): Promise<any> {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/admin`);
    if (!response.ok) {
      throw new ApiError(response.status, 'Admin info fetch failed');
    }
    return response.json();
  },
};

// ===== 에러 핸들링 헬퍼 =====
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return '알 수 없는 오류가 발생했습니다.';
}

// ===== 실시간 업데이트를 위한 폴링 헬퍼 =====
export function createPollingSubscription<T>(
  apiCall: () => Promise<T>,
  onUpdate: (data: T) => void,
  onError: (error: string) => void,
  interval: number = 5000
) {
  let timeoutId: NodeJS.Timeout;
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      const data = await apiCall();
      onUpdate(data);
    } catch (error) {
      onError(handleApiError(error));
    }

    if (isActive) {
      timeoutId = setTimeout(poll, interval);
    }
  };

  // 즉시 첫 번째 호출
  poll();

  // 구독 해제 함수 반환
  return () => {
    isActive = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

// ===== 게임 상태 실시간 감시 =====
export function useGameStatePolling(
  onGameStateUpdate: (gameState: GameState) => void,
  onError?: (error: string) => void,
  enabled: boolean = true,
  interval: number = 1000
) {
  if (typeof window === 'undefined' || !enabled) {
    return () => {};
  }

  return createPollingSubscription(
    api.getGameState,
    onGameStateUpdate,
    onError || ((error) => console.error('게임 상태 폴링 오류:', error)),
    interval
  );
}

// ===== 포트폴리오 실시간 감시 =====
export function usePortfolioPolling(
  teamId: number,
  onPortfolioUpdate: (portfolio: PortfolioData) => void,
  onError?: (error: string) => void,
  enabled: boolean = true,
  interval: number = 10000
) {
  if (typeof window === 'undefined' || !enabled) {
    return () => {};
  }

  return createPollingSubscription(
    () => api.getPortfolio(teamId),
    onPortfolioUpdate,
    onError || ((error) => console.error('포트폴리오 폴링 오류:', error)),
    interval
  );
}

// ===== 랭킹 실시간 감시 =====
export function useRankingPolling(
  onRankingUpdate: (rankings: TeamRanking[]) => void,
  onError?: (error: string) => void,
  enabled: boolean = true,
  interval: number = 30000
) {
  if (typeof window === 'undefined' || !enabled) {
    return () => {};
  }

  return createPollingSubscription(
    api.getRanking,
    onRankingUpdate,
    onError || ((error) => console.error('랭킹 폴링 오류:', error)),
    interval
  );
}

// ===== 게임 상태 확인 헬퍼 =====
export async function checkGameStatus(): Promise<{
  isOnline: boolean;
  gameState?: GameState;
  error?: string;
}> {
  try {
    await api.healthCheck();
    const gameState = await api.getGameState();
    return { isOnline: true, gameState };
  } catch (error) {
    return { 
      isOnline: false, 
      error: handleApiError(error) 
    };
  }
}

// ===== 배치 API 호출 =====
export async function fetchDashboardData(teamId: number): Promise<{
  gameState: GameState;
  portfolio: PortfolioData;
  rankings: TeamRanking[];
  events: NewsEvent[];
}> {
  const [gameState, portfolio, rankings, events] = await Promise.all([
    api.getGameState(),
    api.getPortfolio(teamId),
    api.getRanking(),
    api.getEvents()
  ]);

  return { gameState, portfolio, rankings, events };
}

// ===== 게임 관리자 도구 =====
export const adminApi = {
  async startGame() {
    return api.startGame();
  },

  async resetGame() {
    return api.resetGame();
  },

  async forceNextPhase() {
    return api.forceNextPhase();
  },

  async triggerNewsEvent(eventId: number) {
    return api.triggerEvent(eventId, 'trigger');
  },

  async activateEvent(eventId: number) {
    return api.triggerEvent(eventId, 'activate');
  },

  async deactivateEvent(eventId: number) {
    return api.triggerEvent(eventId, 'deactivate');
  },

  async getSystemStatus() {
    return api.healthCheck();
  },

  async getAdminInfo() {
    return api.getAdminInfo();
  }
};

// ===== 타입 내보내기 =====
export { ApiError };
export type { ApiResponse };