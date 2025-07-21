export interface Team {
  id: number;
  code: string;
  name: string;
  balance: number;
  esgScore: number;
  quizScore: number;
}

export interface Stock {
  id: number;
  symbol: string;
  companyName: string;
  currentPrice: number;
  esgCategory: string;
  description: string;
}

export interface Holding {
  id: number;
  stockId: number;
  quantity: number;
  avgBuyPrice: number;
  currentValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
  stock: Stock;
}

export interface Portfolio {
  team: Team;
  holdings: Holding[];
  portfolioValue: number;
  totalCost: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  balance: number;
  recentTransactions: Transaction[];
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
  stock: {
    symbol: string;
    companyName: string;
  };
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  roundNumber: number;
  correctAnswer?: number; // 서버에서는 제출 후에만 반환
}

export interface QuizResult {
  correct: boolean;
  correctAnswer: number;
  bonus: number;
  newBalance: number | null;
}

export interface NewsEvent {
  id: number;
  title: string;
  content: string | null;
  affectedStocks: Record<string, number>;
  roundNumber: number;
  isActive: boolean;
  createdAt: string;
}

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