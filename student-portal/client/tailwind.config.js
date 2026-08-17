/**
 * TITAN Student Portal — design tokens
 *
 * `primary` (navy) and `accent` (gold) are full 50-900 tint/shade ramps —
 * every step (including neutral.50/200, background, and border) now
 * mirrors client/tailwind.config.js exactly, which is the source of truth
 * across all three TITAN properties. `primary`/`accent` were already
 * identical to the main app's navy/gold ramps; neutral.50/200 and the
 * background/border aliases were moved off the public website's warmer
 * Ivory tone (#F7F5F0/#E4E1DA) to the main app's cooler
 * --neutral-50/--neutral-200 (#F6F8F6/#E7EAE6) — this is a deliberate
 * divergence from the public website, not an oversight; see the public
 * website's src/index.css @theme block if reconciling that too.
 * `primary`/`accent` are interpolated from their anchor colors, not picked
 * by eye — with the given "hover" and "soft highlight" colors placed
 * verbatim at the ramp position that matches their intended use
 * (primary-700 = hover, accent-200 = soft highlight).
 *
 * `neutral` 100/300-900 are still the original ivory/border/slate/
 * charcoal-derived ramp, untouched by this pass — only 50/200 (and their
 * background/border aliases) were in scope.
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
        // 50/200 realigned to match client/tailwind.config.js's light-mode
        // --neutral-50/--neutral-200 (the main app is the reference now —
        // see background/surface/border aliases below). 100/300-900 left
        // untouched — not part of this change.
        neutral: {
          50: '#F6F8F6', // background — matches main app's --neutral-50 (light)
          100: '#EDEAE4',
          200: '#E7EAE6', // border — matches main app's --neutral-200 (light)
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
        background: '#F6F8F6',
        surface: '#FFFFFF',
        border: '#E7EAE6',

        // Sage — decorative "positive/verified" accent, distinct from the
        // success status pill colors below. Use sparingly (e.g. a verified
        // checkmark glyph), not as a status background.
        'accent-positive': '#71806A',

        // ---- Semantic status — {bg, text} pairs, matched to
        // client/tailwind.config.js (the shared source of truth across all
        // three TITAN properties) rather than this app's earlier muted set ----
        success: { bg: '#E4F2EA', text: '#14532D' },
        warning: { bg: '#FBF1DD', text: '#9A6B10' },
        danger: { bg: '#FBE9E7', text: '#C0392B' },
        info: { bg: '#E7F0FB', text: '#2557A6' },
      },

      fontFamily: {
        // Confident, slightly geometric — matches the crest's bold blocky wordmark
        heading: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // High-legibility body copy at small sizes (tables, forms, dense stat cards)
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      // Matched to client/tailwind.config.js's sm/DEFAULT/md/lg/xl/pill steps
      // (the shared source of truth) — 2xl has no client equivalent, kept
      // as-is for this app's full-bleed hero/banner sections.
      borderRadius: {
        sm: '8px', // inputs, badges, small chips
        DEFAULT: '9px',
        md: '9px', // buttons, table cells
        lg: '12px', // standard cards
        xl: '16px', // hero banners, celebratory cards (certificate, streak)
        '2xl': '28px', // full-bleed hero/banner sections
        pill: '9999px', // badges, avatars, streak/progress pills
      },

      // Tint matched to client/tailwind.config.js's navy-800 rgba(19,35,69,*)
      // (was primary-900's rgba(15,25,48,*)) — same navy family, now the
      // exact same tint as the shared source of truth.
      boxShadow: {
        sm: '0 1px 2px rgba(19,35,69,0.06)', // resting cards, row hover
        card: '0 8px 24px -6px rgba(19,35,69,0.12)', // default card
        'card-hover': '0 16px 32px -8px rgba(19,35,69,0.18)', // hover lift
        modal: '0 24px 64px -12px rgba(19,35,69,0.28)', // centered modals
        panel: '-12px 0 32px rgba(19,35,69,0.16)', // slide-over panels
        // celebratory gold glow — streak counters, certificate/achievement cards
        glow: '0 0 0 6px rgba(206,164,92,0.18), 0 8px 20px -4px rgba(206,164,92,0.35)',
      },
    },
  },
  plugins: [],
};
