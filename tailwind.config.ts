import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        paper: '#ffffff',
        'paper-raised': '#f8f8fb',
        blue: { DEFAULT: '#005a9c', dark: '#002a56' },
        yellow: '#f9dc4a',
        line: '#cac9c9',
        error: '#a82615'
      },
      fontFamily: {
        display: ['"Noto Sans"', '"Trebuchet MS"', 'Geneva', 'sans-serif'],
        body: ['"Noto Sans"', '"Trebuchet MS"', 'Geneva', 'sans-serif'],
        mono: ['Monaco', '"Lucida Console"', '"Courier New"', 'monospace']
      }
    }
  },
  plugins: []
}
