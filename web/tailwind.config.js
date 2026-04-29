/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // 天津版主色: 海河蓝绿 + 科技青
        brand: {
          50:  '#EAF8FA',
          100: '#D3F0F4',
          200: '#A6DFE8',
          300: '#72C8D6',
          400: '#3CAABD',
          500: '#208CA2',
          600: '#167188',
          700: '#135A70',
          800: '#11495D',
          900: '#0B3142',
        },
        // 点缀: 津门暖金 (奖章/认证/重点提示)
        gold: {
          50:  '#FFF7E8',
          100: '#FDEBC6',
          200: '#F8D685',
          300: '#EDB84F',
          400: '#D99A2B',
          500: '#B9771D',
          600: '#935716',
        },
        // 中性: 冷灰蓝，弱化传统商会感
        ink: {
          50:  '#F6F8FA',
          100: '#E8EDF1',
          200: '#D4DDE5',
          300: '#AEBCC8',
          400: '#8294A3',
          500: '#607584',
          600: '#485C6B',
          700: '#314552',
          800: '#20323E',
          900: '#14232E',
        },
      },
      boxShadow: {
        card:       '0 1px 2px rgba(16,24,32,0.04), 0 2px 8px rgba(16,24,32,0.05)',
        'card-hover':'0 2px 4px rgba(16,24,32,0.06), 0 8px 24px rgba(16,24,32,0.08)',
        chip:       '0 1px 2px rgba(16,24,32,0.05)',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Helvetica Neue"',
          '"Microsoft YaHei"', 'Arial', 'sans-serif',
        ],
        serif: ['"Noto Serif SC"', '"Songti SC"', 'serif'],
      },
      borderRadius: {
        xl:  '12px',
        '2xl':'16px',
        '3xl':'20px',
      },
    },
  },
  plugins: [],
}
