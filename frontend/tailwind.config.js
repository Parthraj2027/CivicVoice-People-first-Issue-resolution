module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#534AB7',
        social: '#0F6E56',
        alert: '#D85A30',
        page: '#F7F6F2',
        surface: '#FFFFFF',
        textPrimary: '#1A1A1A',
        textSecondary: '#6B6A64',
      },
      borderRadius: {
        card: '12px',
        control: '8px',
        pill: '24px',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'DM Sans', 'system-ui', 'serif'],
      },
    },
  },
  plugins: [],
};
