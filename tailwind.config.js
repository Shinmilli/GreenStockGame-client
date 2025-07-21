/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 커스텀 컬러
      colors: {
        // 다크 테마 컬러
        dark: {
          900: '#0a0a0a',
          800: '#1a1a1a',
          700: '#2a2a2a',
          600: '#3a3a3a',
          500: '#4a4a4a',
          400: '#5a5a5a',
          300: '#6a6a6a',
          200: '#8a8a8a',
          100: '#aaaaaa',
        },
        // 골드 컬러
        gold: {
          500: '#d4af37',
          400: '#e6c547',
          300: '#f2d55a',
          200: '#fde68a',
          100: '#fef3c7',
          50: '#fffbeb',
        },
        // 에메랄드 확장
        emerald: {
          600: '#059669',
          500: '#10b981',
          400: '#34d399',
          300: '#6ee7b7',
          200: '#a7f3d0',
          100: '#d1fae5',
        },
        // 블루 확장
        blue: {
          600: '#2563eb',
          500: '#3b82f6',
          400: '#60a5fa',
          300: '#93c5fd',
          200: '#bfdbfe',
          100: '#dbeafe',
        },
        // 퍼플 확장
        purple: {
          600: '#9333ea',
          500: '#a855f7',
          400: '#c084fc',
          300: '#d8b4fe',
          200: '#e9d5ff',
          100: '#f3e8ff',
        },
        // 레드 확장
        red: {
          600: '#dc2626',
          500: '#ef4444',
          400: '#f87171',
          300: '#fca5a5',
          200: '#fecaca',
          100: '#fee2e2',
        },
      },
      
      // 그라데이션
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #d4af37 0%, #f2d55a 50%, #ca8a04 100%)',
        'gradient-dark-gold': 'linear-gradient(135deg, #1a1a1a 0%, #d4af37 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
        'gradient-blue': 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
        'gradient-purple': 'linear-gradient(135deg, #9333ea 0%, #c084fc 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0a0a0a 0%, #2a2a2a 50%, #1a1a1a 100%)',
        'grid-pattern': 'linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px)',
      },
      
      // 배경 사이즈
      backgroundSize: {
        'grid': '50px 50px',
      },
      
      // 폰트 패밀리
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      
      // 박스 섀도우
      boxShadow: {
        'gold': '0 0 20px rgba(212, 175, 55, 0.3), 0 0 40px rgba(212, 175, 55, 0.1)',
        'gold-lg': '0 0 25px rgba(212, 175, 55, 0.4), 0 0 50px rgba(212, 175, 55, 0.15)',
        'emerald': '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.1)',
        'emerald-lg': '0 0 25px rgba(16, 185, 129, 0.4), 0 0 50px rgba(16, 185, 129, 0.15)',
        'blue': '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)',
        'blue-lg': '0 0 25px rgba(59, 130, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.15)',
        'purple': '0 0 20px rgba(147, 51, 234, 0.3), 0 0 40px rgba(147, 51, 234, 0.1)',
        'purple-lg': '0 0 25px rgba(147, 51, 234, 0.4), 0 0 50px rgba(147, 51, 234, 0.15)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-lg': '0 12px 48px rgba(0, 0, 0, 0.4)',
      },
      
      // 애니메이션
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in': 'slideInFromBottom 0.3s ease-out',
      },
      
      // 키프레임
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          from: { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          to: { boxShadow: '0 0 30px rgba(212, 175, 55, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInFromBottom: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      
      // 블러
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      
      // 보더 반지름
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },
      
      // 스페이싱
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // 최대 너비
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      
      // 최소 높이
      minHeight: {
        '1/2': '50vh',
        '3/4': '75vh',
      },
      
      // Z-인덱스
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      
      // 변형 원점
      transformOrigin: {
        'center-bottom': 'center bottom',
        'center-top': 'center top',
      },
      
      // 변환
      scale: {
        '102': '1.02',
        '103': '1.03',
        '110': '1.10',
      },
      
      // 트랜지션
      transitionDelay: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
        '2000': '2000ms',
        '3000': '3000ms',
        '4000': '4000ms',
      },
      
      // 트랜지션 지속 시간
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1200': '1200ms',
      },
      
      // 커서
      cursor: {
        'grab': 'grab',
        'grabbing': 'grabbing',
      },
    },
  },
  plugins: [
    // 커스텀 플러그인들
    function({ addUtilities, addComponents, theme }) {
      // 글래스모피즘 유틸리티
      addUtilities({
        '.glass-dark': {
          background: 'rgba(26, 26, 26, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
        },
        '.glass-gold': {
          background: 'rgba(212, 175, 55, 0.1)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
        },
      })
      
      // 글로우 효과 유틸리티
      addUtilities({
        '.glow-gold': {
          boxShadow: '0 0 20px rgba(212, 175, 55, 0.3), 0 0 40px rgba(212, 175, 55, 0.1)',
        },
        '.glow-emerald': {
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.1)',
        },
        '.glow-blue': {
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)',
        },
        '.glow-purple': {
          boxShadow: '0 0 20px rgba(147, 51, 234, 0.3), 0 0 40px rgba(147, 51, 234, 0.1)',
        },
      })
      
      // 텍스트 그라데이션 유틸리티
      addUtilities({
        '.text-gradient-gold': {
          background: 'linear-gradient(135deg, #d4af37 0%, #f2d55a 50%, #ca8a04 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-emerald': {
          background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-blue': {
          background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
      })
    },
  ],
}