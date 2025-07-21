const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = {
  // Auth
  login: async (teamCode: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamCode }),
    });
    if (!response.ok) {
      throw new Error('Login failed');
    }
    return response.json();
  },

  // Stocks
  getStocks: async () => {
    const response = await fetch(`${API_BASE_URL}/stocks`);
    if (!response.ok) {
      throw new Error('Failed to fetch stocks');
    }
    return response.json();
  },

  getStockHistory: async (stockId: number) => {
    const response = await fetch(`${API_BASE_URL}/stocks/${stockId}/history`);
    if (!response.ok) {
      throw new Error('Failed to fetch stock history');
    }
    return response.json();
  },

  // Trade
  executeTrade: async (teamId: number, stockId: number, quantity: number, action: 'buy' | 'sell') => {
    const response = await fetch(`${API_BASE_URL}/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, stockId, quantity, action }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Trade failed');
    }
    return response.json();
  },

  // Portfolio
  getPortfolio: async (teamId: number) => {
    const response = await fetch(`${API_BASE_URL}/portfolio/${teamId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch portfolio');
    }
    return response.json();
  },

  // Quiz
  getQuizByRound: async (round: number) => {
    const response = await fetch(`${API_BASE_URL}/quiz/${round}`);
    if (!response.ok) {
      throw new Error('Failed to fetch quiz');
    }
    return response.json();
  },

  submitQuizAnswer: async (teamId: number, questionId: number, selectedAnswer: number) => {
    const response = await fetch(`${API_BASE_URL}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, questionId, selectedAnswer }),
    });
    if (!response.ok) {
      throw new Error('Failed to submit answer');
    }
    return response.json();
  },

  // Ranking
  getRanking: async () => {
    const response = await fetch(`${API_BASE_URL}/ranking`);
    if (!response.ok) {
      throw new Error('Failed to fetch ranking');
    }
    return response.json();
  },

  // Events
  getEvents: async (round?: number) => {
    const url = round ? `${API_BASE_URL}/events?round=${round}` : `${API_BASE_URL}/events`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    return response.json();
  },

  triggerEvent: async (eventId: number, action: string) => {
    const response = await fetch(`${API_BASE_URL}/events/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, action }),
    });
    if (!response.ok) {
      throw new Error('Failed to trigger event');
    }
    return response.json();
  },
};