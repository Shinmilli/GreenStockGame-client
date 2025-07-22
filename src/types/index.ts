// types/index.ts

// 기본 엔티티 타입들
export interface Team {
  id: number;
  code: string;
  name: string;
  balance: number;
  esgScore: number;
  quizScore: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stock {
  id: number;
  symbol: string;
  companyName: string;
  currentPrice: number;
  esgCategory: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Holding {
  id: number;
  teamId: number;
  stockId: number;
  quantity: number;
  avgBuyPrice: number;
  createdAt?: string;
  updatedAt?: string;
  stock?: Stock;
}

export interface Transaction {
  id: number;
  teamId: number;
  stockId: number;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fee: number;
  createdAt: string;
  team?: Pick<Team, 'code' | 'name'>;
  stock?: Pick<Stock, 'symbol' | 'companyName'>;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: number; // 클라이언트에서는 숨김
  roundNumber: number;
  createdAt?: string;
}

export interface QuizSubmission {
  id: number;
  teamId: number;
  questionId: number;
  selectedAnswer: number;
  isCorrect: boolean;
  submittedAt: string;
  roundNumber: number;
  team?: Pick<Team, 'code' | 'name'>;
  question?: Pick<QuizQuestion, 'question' | 'correctAnswer'>;
}

export interface NewsEvent {
  id: number;
  title: string;
  content?: string;
  affectedStocks: Record<string, number>; // { "TSLA": 5.2, "AAPL": -2.1 }
  roundNumber: number;
  isActive: boolean;
  createdAt: string;
}

export interface GameSession {
  id: number;
  startTime: string;
  endTime?: string;
  currentRound: number;
  currentPhase: GamePhase;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoundResult {
  id: number;
  roundNumber: number;
  teamId: number;
  quizScore: number;
  tradingProfit: number;
  esgBonus: number;
  totalScore: number;
  createdAt: string;
  team?: Pick<Team, 'code' | 'name'>;
}

// 게임 관련 타입들
export type GamePhase = 'news' | 'quiz' | 'trading' | 'results' | 'finished';

export interface GameState {
  currentRound: number;
  phase: GamePhase;
  timeRemaining: number;
  isActive: boolean;
  startTime?: string;
  endTime?: string;
  phaseDurations?: Record<GamePhase, number>;
}

export interface GameConfig {
  totalRounds: number;
  phaseDurations: {
    news: number;
    quiz: number;
    trading: number;
    results: number;
  };
  initialBalance: number;
  tradeFeeRate: number;
  quizBonusRate: number;
}

// API 응답 타입들
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  message: string;
  team: Team;
}

export interface QuizResult {
  correct: boolean;
  correctAnswer: number;
  bonus: number;
  newBalance?: number;
  gameState?: Partial<GameState>;
}

export interface TradeResponse {
  message: string;
  action: 'buy' | 'sell';
  teamId: number;
  stockId: number;
  quantity: number;
  gameState?: Partial<GameState>;
  transactionResult?: any;
}

export interface TradeStatus {
  canTrade: boolean;
  gameState: GameState;
  restrictions: {
    gameNotActive: boolean;
    wrongPhase: boolean;
    timeExpired: boolean;
  };
}

// 포트폴리오 관련 타입들
export interface HoldingWithStock extends Holding {
  stock: Stock;
  currentValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface PortfolioData {
  team: Team;
  holdings: HoldingWithStock[];
  portfolioValue: number;
  totalCost: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  balance: number;
  recentTransactions: Transaction[];
}

// 랭킹 관련 타입들
export interface TeamRanking {
  id: number;
  code: string;
  name: string;
  balance: number;
  portfolioValue: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  esgScore: number;
  quizScore: number;
  totalScore: number;
  rank: number;
}

// 통계 관련 타입들
export interface QuizStatistics {
  totalSubmissions: number;
  correctSubmissions: number;
  accuracy: number;
}

export interface TradeStatistics {
  totalTrades: number;
  totalVolume: number;
  buyTrades: number;
  sellTrades: number;
  averageTradeSize: number;
}

export interface RoundQuizResults {
  roundNumber: number;
  question: QuizQuestion | null;
  submissions: QuizSubmission[];
  statistics: QuizStatistics;
}

export interface RoundTradeHistory {
  roundNumber: number;
  trades: Transaction[];
  statistics: TradeStatistics;
}

// 에러 관련 타입들
export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

// 게임 이벤트 타입들
export interface GameEvent {
  type: 'PHASE_CHANGE' | 'ROUND_START' | 'ROUND_END' | 'GAME_START' | 'GAME_END';
  data: any;
  timestamp: string;
}

// 실시간 업데이트 타입들
export interface RealtimeUpdate {
  type: 'GAME_STATE' | 'PORTFOLIO' | 'RANKING' | 'NEWS';
  data: any;
  timestamp: string;
}

// 관리자 인터페이스 타입들
export interface AdminGameControl {
  canStart: boolean;
  canReset: boolean;
  canForceNext: boolean;
  currentState: GameState;
}

// UI 컴포넌트 props 타입들
export interface GamePhaseIndicatorProps {
  gameState: GameState;
  className?: string;
}

export interface ActionButtonProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  disabled: boolean;
  disabledReason?: string;
  color: 'emerald' | 'blue' | 'gold' | 'purple';
}

// 유틸리티 타입들
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 게임 설정 상수들
export const GAME_CONSTANTS = {
  TOTAL_ROUNDS: 8,
  INITIAL_BALANCE: 100000,
  TRADE_FEE_RATE: 0.005,
  QUIZ_BONUS_RATE: 0.02,
  PHASE_DURATIONS: {
    news: 30000,     // 30초
    quiz: 120000,    // 2분
    trading: 300000, // 5분
    results: 30000   // 30초
  }
} as const;

// ESG 카테고리 상수들
export const ESG_CATEGORIES = [
  'Clean Energy',
  'Sustainable Food',
  'Wind Energy',
  'Solar Energy',
  'Waste Management',
  'Water Treatment',
  'Organic Agriculture',
  'Carbon Capture'
] as const;

export type ESGCategory = typeof ESG_CATEGORIES[number];