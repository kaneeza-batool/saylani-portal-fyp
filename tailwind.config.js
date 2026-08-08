/**
 * TITAN design system — Tailwind config
 *
 * Tokens extracted from the three source artifacts:
 *   1. TITAN — Visual Identity & Design System (foundation)
 *   2. TITAN — Super Admin Dashboard
 *   3. TITAN — Student Dashboard
 *
 * Palettes below are the LIGHT-mode values — the canonical static Tailwind
 * scale. All three source artifacts also define a DARK-mode remap of these
 * same tokens (brighter green/gold on dark surfaces, never a naive invert).
 * Static hex classes can't auto-swap per theme, so dark mode is handled via
 * CSS variables — see the "Dark mode" section in components-reference.md
 * for the exact snippet and the *_dark hex values to pair with each ramp.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'], // Tailwind >=3.4.1. On older versions use: darkMode: 'class', and toggle a `dark` class alongside data-theme.
  theme: {
    extend: {
      colors: {
        // ---- Primary — Titan Green (brand, primary actions) ----
        primary: {
          50: '#F1F6F3',
          100: '#E7F0EA',
          200: '#B1D7C1',
          300: '#73C59C',
          400: '#3AAF7E',
          500: '#1F7A5C', // progress fills, success text
          600: '#19654D',
          700: '#13503E',
          800: '#0E3B2E', // primary buttons, wordmark, brand base
          900: '#0A2C22', // pressed / hover
        },

        // ---- Accent — Signal Gold (spend sparingly: milestones, certificates, offers) ----
        accent: {
          50: '#FEF8EC',
          100: '#FBEED2',
          200: '#F6DDAA',
          300: '#F0CC84',
          400: '#E9B95E',
          500: '#E0A63A', // the accent
          600: '#B9781A',
          700: '#996017',
          800: '#7A4A14',
          900: '#5C3610',
        },

        // ---- Neutral — Paper & Ink (slight green-grey hue bias, not pure gray) ----
        neutral: {
          50: '#F5F6F1', // paper / page background
          100: '#EEF0EA', // paper-sunken
          200: '#DEE3DC', // line / hairline borders
          300: '#C7CDC0', // line-strong
          400: '#7C8880', // ink-faint
          500: '#4B5750', // ink-muted / secondary text
          600: '#384A41',
          700: '#273B32',
          800: '#182923',
          900: '#0B1613', // ink / primary text
        },
        // `gray` mirrors `neutral` 1:1 so either name works without surprises.
        gray: {
          50: '#F5F6F1',
          100: '#EEF0EA',
          200: '#DEE3DC',
          300: '#C7CDC0',
          400: '#7C8880',
          500: '#4B5750',
          600: '#384A41',
          700: '#273B32',
          800: '#182923',
          900: '#0B1613',
        },

        // ---- Semantic status — reserved, never reused as decoration ----
        // success reuses the primary ramp (badge bg = primary-100, text = primary-500)
        success: {
          50: '#F1F6F3',
          100: '#E7F0EA',
          500: '#1F7A5C',
          600: '#19654D',
        },
        // warning reuses the accent ramp (badge bg = accent-100, text = accent-600)
        warning: {
          50: '#FEF8EC',
          100: '#FBEED2',
          500: '#E0A63A',
          600: '#B9781A',
        },
        danger: {
          50: '#FDF1EF',
          100: '#FBE7E3',
          200: '#F4C5BC',
          300: '#ECA396',
          400: '#E38172',
          500: '#D8604F',
          600: '#C24B3F', // badge text / icon
          700: '#A73B30',
          800: '#8A2D23',
          900: '#6B2018',
        },
        info: {
          50: '#F0F5F9',
          100: '#E4EDF3',
          200: '#BED3E2',
          300: '#97B8D0',
          400: '#719EBE',
          500: '#4E82AA',
          600: '#3E6E93', // badge text / icon
          700: '#335A79',
          800: '#29465F',
          900: '#1E3345',
        },

        // ---- Chart series (dataviz-validated pair, distinct from UI accent) ----
        chart: {
          a: '#128A63', // Enrolled / primary series
          b: '#E0A63A', // Placed / secondary series
        },

        // ---- Fixed dark chrome (Super Admin sidebar — stays dark in both themes) ----
        chrome: {
          bg: '#0A2015',
          'bg-active': '#173D2C',
          'bg-hover': '#122A1D',
          text: '#CFE0D6',
          'text-dim': '#75907F',
          gold: '#E7B455',
        },
      },

      fontFamily: {
        // Headings, KPI figures, section marks
        heading: ['"Cabinet Grotesk"', '"Segoe UI"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Everything read: forms, tables, feedback, body copy
        body: ['"General Sans"', '"Segoe UI"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"General Sans"', '"Segoe UI"', 'ui-sans-serif', 'system-ui', 'sans-serif'], // overrides Tailwind's default sans
      },

      // [fontSize, { lineHeight, fontWeight, letterSpacing }]
      fontSize: {
        overline: ['0.75rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.09em' }], // 12px, uppercase in use
        caption: ['0.8125rem', { lineHeight: '1.5', fontWeight: '500' }], // 13px
        'body-sm': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }], // 14px
        body: ['1rem', { lineHeight: '1.65', fontWeight: '400' }], // 16px
        'body-lg': ['1.125rem', { lineHeight: '1.65', fontWeight: '400' }], // 18px
        h6: ['1.25rem', { lineHeight: '1.3', fontWeight: '700' }], // 20px
        h5: ['1.5rem', { lineHeight: '1.2', fontWeight: '700' }], // 24px
        h4: ['2rem', { lineHeight: '1.15', fontWeight: '800', letterSpacing: '-0.01em' }], // 32px
        h3: ['2.75rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.015em' }], // 44px
        h2: ['3.5rem', { lineHeight: '1.08', fontWeight: '800', letterSpacing: '-0.02em' }], // 56px
        h1: ['4.5rem', { lineHeight: '1.04', fontWeight: '900', letterSpacing: '-0.02em' }], // 72px
      },

      letterSpacing: {
        eyebrow: '0.09em', // overline / section-mark tracking
      },

      borderRadius: {
        sm: '6px', // inputs, table cells, chips
        md: '10px', // buttons, small cards, nav items
        lg: '16px', // panels, modals, feature cards
        pill: '9999px', // badges, avatars, the theme switch — alias of `rounded-full`
      },

      boxShadow: {
        sm: '0 1px 2px rgba(11,22,19,.07)', // resting cards, table row hover
        DEFAULT: '0 10px 24px -10px rgba(11,22,19,.20)',
        md: '0 10px 24px -10px rgba(11,22,19,.20)', // dropdowns, toasts, raised cards
        lg: '0 24px 56px -16px rgba(11,22,19,.30)', // modals, the dashboard frame
        focus: '0 0 0 3px rgba(31,122,92,.28)', // prefer `focus:ring-2 focus:ring-primary-500/30` in practice
      },

      // Half-steps used repeatedly for card padding/gaps that fall outside
      // Tailwind's default 0.25rem scale. Anything else, use arbitrary
      // values (e.g. p-[18px]) rather than growing this list.
      spacing: {
        4.5: '18px',
        5.5: '22px',
        6.5: '26px',
        7.5: '30px',
        13: '52px',
        15: '60px',
      },
    },
  },
  plugins: [],
};
