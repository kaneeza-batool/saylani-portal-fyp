/**
 * TITAN Student Portal — design tokens
 *
 * `primary` (navy) and `accent` (gold) are sampled directly from
 * client/public/images/logo/titan-logo.jpeg (the TITAN crest):
 *   - primary-800 (#162346) = the shield's navy fill, sampled and averaged
 *     across every navy-ish pixel in the crest.
 *   - accent-500 (#D0A35B) = the wreath/lettering gold, sampled and
 *     averaged across every gold-ish pixel in the crest.
 * The rest of each ramp is generated from that anchor's hue/saturation so
 * every shade stays a true tint/shade of the actual logo color, not a
 * generic navy or gold picked by eye.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ---- Primary — Titan Navy (sampled from logo shield) ----
        primary: {
          50: '#F2F3F8',
          100: '#E1E5EF',
          200: '#B6C2E2',
          300: '#7790D4',
          400: '#3B5DBA',
          500: '#273E7C',
          600: '#1D2F5D',
          700: '#18274E',
          800: '#162346', // sampled: logo shield navy
          900: '#0F172F',
        },

        // ---- Accent — Titan Gold (sampled from logo wreath/lettering) ----
        accent: {
          50: '#F8F6F2',
          100: '#EEE7DD',
          200: '#E3D1B5',
          300: '#DDBC88',
          400: '#D4AA68',
          500: '#D0A35B', // sampled: logo wreath/lettering gold
          600: '#AE7F32',
          700: '#8F6829',
          800: '#6F5120',
          900: '#4F3A17',
        },

        // ---- Neutral — cool grays, same hue family as primary for cohesion ----
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D0D4DC',
          400: '#A2A8B9',
          500: '#79829A',
          600: '#5C647A',
          700: '#464C5D',
          800: '#303440',
          900: '#1D1F26',
        },

        // ---- Semantic status — {bg, text} pairs, used together ----
        success: { bg: '#E6F6EC', text: '#1A7F42' },
        warning: { bg: '#FFF4E5', text: '#B45309' },
        danger: { bg: '#FDECEA', text: '#C0392B' },
        info: { bg: '#E8F1FD', text: '#1D5FB8' },
      },

      fontFamily: {
        // Confident, slightly geometric — matches the crest's bold blocky wordmark
        heading: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // High-legibility body copy at small sizes (tables, forms, dense stat cards)
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        sm: '8px', // inputs, badges, small chips
        md: '10px', // buttons, table cells
        lg: '14px', // standard cards
        xl: '20px', // hero banners, celebratory cards (certificate, streak)
        '2xl': '28px', // full-bleed hero/banner sections
        pill: '9999px', // badges, avatars, streak/progress pills
      },

      boxShadow: {
        sm: '0 1px 2px rgba(13,21,46,0.06)', // resting cards, row hover
        card: '0 8px 24px -6px rgba(13,21,46,0.12)', // default card
        'card-hover': '0 16px 32px -8px rgba(13,21,46,0.18)', // hover lift
        modal: '0 24px 64px -12px rgba(13,21,46,0.28)', // centered modals
        panel: '-12px 0 32px rgba(13,21,46,0.16)', // slide-over panels
        // celebratory gold glow — streak counters, certificate/achievement cards
        glow: '0 0 0 6px rgba(208,163,91,0.18), 0 8px 20px -4px rgba(208,163,91,0.35)',
      },
    },
  },
  plugins: [],
};
