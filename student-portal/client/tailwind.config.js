/**
 * TITAN Student Portal — design tokens
 *
 * Aligned to the refined palette used on the public website (Titan
 * Midnight / Antique Gold / Ivory) so both properties read as one brand.
 * `primary` and `accent` are full 50-900 tint/shade ramps generated from
 * the two exact anchor colors — every other step is interpolated, not
 * picked by eye — with the given "hover" and "soft highlight" colors
 * placed verbatim at the ramp position that matches their intended use
 * (primary-700 = hover, accent-200 = soft highlight).
 *
 * `neutral` is generated the same way from the four ivory/border/slate/
 * charcoal anchors, so every existing `text-neutral-*` / `border-neutral-*`
 * / `bg-neutral-*` usage across the app picks up the refined palette
 * without needing a per-component rename.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ---- Primary — Titan Midnight ----
        primary: {
          50: '#F3F4F6',
          100: '#E5E7EB',
          200: '#C6CAD2',
          300: '#A1A7B5',
          400: '#767F93',
          500: '#505C75',
          600: '#2F3D5B',
          700: '#1D3557', // Titan Blue — hover states on primary-800 surfaces
          800: '#132345', // Titan Midnight — anchor, main brand navy
          900: '#0F1930',
        },

        // ---- Accent — Antique Gold ----
        accent: {
          50: '#F7F0E3',
          100: '#EEE2C6',
          200: '#E7D5AE', // Soft Gold — subtle highlights, sparingly
          300: '#DDC18D',
          400: '#D5B273',
          500: '#CEA45C', // Antique Gold — anchor
          600: '#9F7D46',
          700: '#7D6136',
          800: '#5E4727',
          900: '#43311A',
        },

        // ---- Neutral — Ivory/Charcoal ramp (background, border, text) ----
        neutral: {
          50: '#F7F5F0', // background — Ivory
          100: '#EDEAE4',
          200: '#E4E1DA', // border
          300: '#BEBFC1',
          400: '#969BA5',
          500: '#667085', // text-secondary — Muted Slate
          600: '#4E576A',
          700: '#3B4455',
          800: '#2B3444',
          900: '#202938', // text-primary — Charcoal
        },

        // ---- Convenience aliases for the exact named tokens (identical
        // values to the ramp steps above — same colors, semantic names for
        // call sites that read better as `bg-background`/`border-border`
        // than `bg-neutral-50`/`border-neutral-200`) ----
        background: '#F7F5F0',
        surface: '#FFFFFF',
        border: '#E4E1DA',

        // Sage — decorative "positive/verified" accent, distinct from the
        // success status pill colors below. Use sparingly (e.g. a verified
        // checkmark glyph), not as a status background.
        'accent-positive': '#71806A',

        // ---- Semantic status — muted, not bright — {bg, text} pairs ----
        success: { bg: '#EDF0EC', text: '#4F7A5A' },
        warning: { bg: '#FBF1E4', text: '#B78335' },
        danger: { bg: '#FBEBEA', text: '#B84A4A' },
        info: { bg: '#E8EEF3', text: '#416A8A' },
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
        sm: '0 1px 2px rgba(15,25,48,0.06)', // resting cards, row hover
        card: '0 8px 24px -6px rgba(15,25,48,0.12)', // default card
        'card-hover': '0 16px 32px -8px rgba(15,25,48,0.18)', // hover lift
        modal: '0 24px 64px -12px rgba(15,25,48,0.28)', // centered modals
        panel: '-12px 0 32px rgba(15,25,48,0.16)', // slide-over panels
        // celebratory gold glow — streak counters, certificate/achievement cards
        glow: '0 0 0 6px rgba(206,164,92,0.18), 0 8px 20px -4px rgba(206,164,92,0.35)',
      },
    },
  },
  plugins: [],
};
