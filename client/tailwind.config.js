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
        neutral: {
          50: '#F6F8F6', // page background (also covers #F7F9F7 / #FAFBFA)
          100: '#F0F3F0', // hover surfaces / progress track (also covers #F1F4F1 / #EDF1ED / #EEF2EE)
          200: '#E7EAE6', // card border / hairline
          300: '#D7DED9', // scrollbar thumb / strong border
          400: '#8A9A93', // secondary/dim text (e.g. role label under a name)
          500: '#7C8C84', // overline / uppercase label text, KPI labels
          600: '#4B5D55', // icon stroke, muted body text
          900: '#10231C', // ink — primary heading & body text
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

        // ---- Saylani admin theme — royal blue / parrot green / white ----
        // Approximated by eye from screenshots of the live admin.saylanimit.com
        // app (no source file to decode this time, unlike the `primary`/`chrome`
        // tokens above). Treat these as a starting point, not verified hex
        // values — re-check against the real app once it's up next to this.
        royal: {
          50: '#EFF5FF', // notification/info tint backgrounds
          500: '#2F6FE4', // primary buttons, links, active form focus (Search, Export, Submit, Login)
          600: '#1D56C4', // primary button hover/pressed
          700: '#173F91',
        },
        parrot: {
          50: '#F1F8E9',
          500: '#7CB342', // logo leaf mark, bright accents
          600: '#5C9427',
        },
        saylani: {
          sidebar: '#1D56C4', // vivid royal blue sidebar surface (was near-black — corrected per feedback)
          'sidebar-active': '#5C9427', // parrot green active nav item background (blue + green pairing)
          'sidebar-hover': 'rgba(255,255,255,0.12)',
          'sidebar-text': '#DCE7FB', // soft blue-white for default nav label
          'sidebar-text-active': '#FFFFFF',
        },
      },

      fontFamily: {
        heading: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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

      // Only two shadows appear in the source file; both carry the
      // brand-dark tint (rgba(16,35,28,*)) rather than pure black.
      boxShadow: {
        card: '0 12px 26px rgba(16,35,28,0.10)', // KPI/list card, on hover
        panel: '-8px 0 30px rgba(16,35,28,0.14)', // right-side slide-over panel
      },
    },
  },
  plugins: [],
};
