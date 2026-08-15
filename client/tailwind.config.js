/**
 * TITAN Super Admin — Tailwind config
 *
 * Tokens extracted directly from the exported design file
 * `TITAN Super Admin Portal.html` (inline styles + the STATUS_STYLE /
 * PAYMENT_STYLE / KPI data objects embedded in its script). Every hex
 * value below was pulled verbatim from that file — nothing here is
 * guessed or carried over from an earlier draft.
 *
 * Two consolidations were made for sanity, both noted inline:
 *   - `neutral.50` folds in near-identical off-whites (#F7F9F7, #FAFBFA)
 *     the export used interchangeably for page/row backgrounds.
 *   - `neutral.100` folds in near-identical hover surfaces (#F1F4F1,
 *     #EDF1ED, #EEF2EE) used for button-hover / row-hover / track bg.
 *
 * No dark-mode variant is defined — the source file doesn't express one
 * (the sidebar chrome is a fixed dark surface in all cases, see `chrome`).
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ---- Primary — Titan Green (brand, primary actions) ----
        primary: {
          50: '#E4F2EA', // success/primary-tinted badge & icon backgrounds
          400: '#2E9463', // gradient light stop — logo mark, chart bars, progress fill
          500: '#1B6B45', // primary button fill, links, brand base
          600: '#14532D', // primary button hover/pressed, "Completed"/"Paid" text
          900: '#0B2A20', // sidebar chrome background (darkest — see `chrome` below)
        },

        // ---- Accent — Signal Gold (spend sparingly: secondary chart series, alerts) ----
        accent: {
          500: '#F0A93A', // only shade observed in the source file
        },

        // ---- Neutral — Paper & Ink ----
        // Values are CSS custom properties (see index.css :root / .dark) so
        // every existing bg-neutral-*/text-neutral-* class in the app
        // automatically responds to the dark-mode toggle with zero
        // per-component edits — that's the whole point of routing through
        // vars instead of static hex here.
        neutral: {
          50: 'var(--neutral-50)', // page background
          100: 'var(--neutral-100)', // hover surfaces / progress track
          200: 'var(--neutral-200)', // card border / hairline
          300: 'var(--neutral-300)', // scrollbar thumb / strong border
          400: 'var(--neutral-400)', // secondary/dim text (e.g. role label under a name)
          500: 'var(--neutral-500)', // overline / uppercase label text, KPI labels
          600: 'var(--neutral-600)', // icon stroke, muted body text
          900: 'var(--neutral-900)', // ink — primary heading & body text
        },
        // Card/panel/modal/topbar backgrounds — was literal `white`, split
        // out so button/badge text can stay literally white in both themes
        // while surfaces themselves go dark.
        surface: 'var(--surface)',

        // Enrollment bar/legend color for the dashboard trend chart — a
        // fixed navy hex was nearly invisible against the dark-mode card
        // surface, so this is themed too (lighter blue in dark mode).
        chart: {
          enrollment: 'var(--chart-enrollment)',
        },

        // ---- Semantic status — bg/text pairs, reused verbatim across
        // student status, payment status, quiz status, and approval badges ----
        success: {
          bg: '#E4F2EA',
          text: '#14532D',
        },
        warning: {
          bg: '#FBF1DD',
          text: '#9A6B10',
        },
        danger: {
          50: '#FBE9E7', // badge/button background
          200: '#E2C7C4', // outline-button border (Reject)
          600: '#C0392B', // text/icon
        },
        info: {
          bg: '#E7F0FB',
          text: '#2557A6',
        },

        // ---- Fixed dark sidebar chrome ----
        chrome: {
          bg: '#0B2A20', // sidebar surface
          text: '#B9CFC3', // nav item label, default state
          'text-hover': '#FFFFFF', // nav item label, hover state
          hover: 'rgba(255,255,255,0.06)', // nav item background, hover state
          subtext: '#9CB8AA', // wordmark subtitle ("Super Admin") under the logo
        },

        // ---- TITAN theme — navy / gold / white ----
        // Taj Institute of Technology & Applied Networks. Sourced from the
        // crest logo: deep navy shield, gold heraldic outline/wordmark,
        // white book+globe mark. Supersedes the earlier Saylani royal/
        // parrot palette (kept nowhere — fully replaced).
        navy: {
          50: '#EEF1F7',
          100: '#D7DEEA',
          200: '#A9B8D2',
          300: '#7A91BA',
          400: '#4C6AA2',
          500: '#2C4680',
          600: '#1A2F5E',
          700: '#12234A',
          800: '#0D1935', // sidebar / crest shield surface
          900: '#080F22', // deepest — text on gold
        },
        gold: {
          50: '#FBF3DF',
          100: '#F5E6BE',
          200: '#EAD08A',
          300: '#DFBB5C',
          400: '#D4AF37', // heraldic gold accent
          500: '#C9A227', // primary gold — CTAs, active states
          600: '#A9821C', // button hover/pressed (best contrast w/ white text)
          700: '#8A6816',
          800: '#6B4F10',
          900: '#4D390A',
        },
        titan: {
          sidebar: '#0D1935', // navy-800 — sidebar surface
          'sidebar-hover': 'rgba(255,255,255,0.08)',
          'sidebar-active': '#C9A227', // gold-500 — solid pill for the selected nav item
          'sidebar-text': '#AAB7D6', // muted navy-white, default nav label
          'sidebar-text-hover': '#FFFFFF',
          'sidebar-text-active': '#080F22', // navy-900 — dark text on the gold active pill
        },
      },

      fontFamily: {
        // Manrope for headings/KPI figures — a sharper, more institutional
        // geometric sans than Sora's rounder startup feel, better suited to
        // an academic institute's admin tooling. Inter stays for body text —
        // still the industry-standard professional UI font (GitHub, Linear,
        // Stripe) and already excellent at the small sizes used throughout.
        heading: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      // [fontSize, { fontWeight, letterSpacing }] — named for the role each
      // size plays in the file, not just its pixel value.
      fontSize: {
        micro: ['11px', { fontWeight: '700' }], // alert-type eyebrow label
        badge: ['11.5px', { fontWeight: '700' }], // status pill/badge text
        overline: ['11.5px', { fontWeight: '700', letterSpacing: '0.04em' }], // uppercase KPI/column labels
        caption: ['12px', { fontWeight: '600' }], // small inline buttons, helper text
        'body-sm': ['13px', { fontWeight: '400' }], // search/input text, muted table text
        body: ['13.5px', { fontWeight: '500' }], // buttons, nav items, default UI text
        h6: ['15px', { fontWeight: '700' }], // card/section titles
        h5: ['16px', { fontWeight: '700' }], // larger section headings
        brand: ['17px', { fontWeight: '700', letterSpacing: '0.01em' }], // sidebar wordmark only
        h4: ['18px', { fontWeight: '700' }], // page/view title
        h3: ['30px', { fontWeight: '800' }], // KPI figures
      },

      borderRadius: {
        sm: '8px', // icon buttons (30x30 edit/close controls)
        DEFAULT: '9px', // buttons, inputs, nav items, logo mark
        md: '9px',
        lg: '12px', // settings/list rows
        xl: '16px', // cards, panels
        pill: '9999px', // status badges, progress bar, avatars
      },

      // Shadows carry a navy tint (rgba(13,25,53,*) = navy-800) rather than
      // pure black, matching the crest theme.
      boxShadow: {
        card: '0 12px 26px rgba(13,25,53,0.10)', // KPI/list card, on hover
        panel: '-8px 0 30px rgba(13,25,53,0.16)', // right-side slide-over panel
        gold: '0 8px 24px rgba(201,162,39,0.35)', // gold glow — primary CTAs, active states
      },
    },
  },
  plugins: [],
};
