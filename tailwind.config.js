/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Oficial Inspirada na Igreja Presbiteriana do Brasil (IPB)
        ipb: {
          darkest: '#082517', // Fundo nobre e profundo para projeção
          dark: '#0d5131',    // Verde institucional solene IPB
          primary: '#1b6b45', // Verde principal vibrante
          medium: '#3c816a',  // Verde folha oficial do portal IPB
          light: '#68b193',   // Verde claro para realces e bordas
          glow: '#38af00',    // Verde sarça / destaque luminoso
        },
        // Elementos Dourados (Símbolo da Sarça Ardente e celebração)
        gold: {
          light: '#fde047',
          DEFAULT: '#eab308',
          dark: '#ca8a04',
          glow: '#f59e0b',
        },
        // Equipes da Gincana (Equipe Sarça Verde vs Equipe Dourada/Ouro)
        equipeA: {
          bg: '#0f3f26',
          border: '#34d399',
          text: '#a7f3d0',
        },
        equipeB: {
          bg: '#451a03',
          border: '#fbbf24',
          text: '#fef3c7',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 25px rgba(56, 175, 0, 0.45)',
        'glow-gold': '0 0 25px rgba(245, 158, 11, 0.5)',
        'card-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
};
