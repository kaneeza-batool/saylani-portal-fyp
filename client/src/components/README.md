# TITAN Student Portal — Component Reference

Copy-paste Tailwind class combinations for this portal. Every class below
resolves through `client/tailwind.config.js` — `primary` (navy, sampled
from the crest logo), `accent` (gold, sampled from the crest logo),
`neutral`, and the `success`/`warning`/`danger`/`info` `{bg, text}` pairs.
Reference this file instead of picking new colors/spacing per page.

Structure, spacing rhythm, and the warm/personal component feel (rounded
hero banners, celebratory streak/certificate cards) come from the
`TITAN_Student_Portal.html` mockup — recolored here to navy/gold instead of
its original emerald/cream.

---

## Buttons

Base shape is shared; variant classes carry the color. Each already
includes its own `hover:`/`disabled:` states.

**Primary** — the one filled action per view ("Submit assignment", "Log in")

```html
<button class="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold bg-primary-800 text-white transition-colors hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-800">
  Submit assignment
</button>
```

**Accent** — the "earned/celebratory" action (rare — certificate download, claim a reward)

```html
<button class="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold bg-accent-500 text-primary-900 transition-colors hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed">
  Download certificate
</button>
```

**Secondary** — bordered, next-most-important action

```html
<button class="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold bg-white text-neutral-800 border border-neutral-300 transition-colors hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed">
  Cancel
</button>
```

**Ghost** — lowest emphasis / dismissive actions

```html
<button class="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold bg-transparent text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed">
  Skip for now
</button>
```

Never introduce a fourth filled color. A destructive action is the
**ghost** button with `text-danger-text hover:bg-danger-bg` substituted in.

---

## Cards

**Standard card** — stat cards, list containers, form panels

```html
<div class="bg-white border border-neutral-200 rounded-lg shadow-card p-5">
  <!-- content -->
</div>
```

**Hover-lift card** — clickable cards (course cards, quiz cards)

```html
<div class="bg-white border border-neutral-200 rounded-lg shadow-card p-5 transition-all hover:shadow-card-hover hover:-translate-y-0.5">
  <!-- content -->
</div>
```

**Hero / banner card** — dashboard hero, welcome banner, active-course spotlight. Bigger radius, navy field, gold accents — this is where the brand crest colors get to be loud.

```html
<div class="bg-primary-800 text-white rounded-2xl p-8 shadow-card">
  <p class="text-accent-400 text-sm font-semibold uppercase tracking-wide">Welcome back</p>
  <h2 class="font-heading text-2xl font-bold mt-1">Ready for today's class?</h2>
</div>
```

**Celebratory card** — streak counter, certificate, achievement unlock. Gold glow, warm feel.

```html
<div class="bg-white border border-accent-200 rounded-xl p-6 shadow-glow">
  <!-- content -->
</div>
```

Card header pattern (title + optional trailing link):

```html
<div class="flex items-baseline justify-between gap-3 mb-4">
  <div>
    <h3 class="font-heading text-lg font-bold text-neutral-900">Card title</h3>
    <p class="text-sm text-neutral-500 mt-0.5">Optional subcopy</p>
  </div>
  <a href="#" class="text-sm font-semibold text-primary-500">View all</a>
</div>
```

---

## Badges / status pills

One base shape, four semantic color pairs plus a neutral fallback.

**Base** (combine with exactly one status suffix below):

```
inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current
```

| Status | Add these classes | Use for |
|---|---|---|
| Success | `bg-success-bg text-success-text` | Present, Approved, Paid |
| Warning | `bg-warning-bg text-warning-text` | Pending, Fee due, Not submitted |
| Danger | `bg-danger-bg text-danger-text` | Absent, Not approved, Overdue |
| Info | `bg-info-bg text-info-text` | System notice, Beta |
| Neutral | `bg-neutral-100 text-neutral-500` | Draft, N/A |

Full example:

```html
<span class="inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current bg-success-bg text-success-text">
  Approved
</span>
```

**Gold "earned" badge** — distinct from the status pills above, for milestones/achievements (not a status, so it doesn't follow the success/warning/danger/info pattern):

```html
<span class="inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-bold bg-accent-100 text-accent-800">
  🔥 7-day streak
</span>
```

---

## Sidebar nav item

Sidebar container: `bg-white border-r border-neutral-200` — light chrome, matching the portal's warm/personal tone (not a dark operational sidebar).

```html
<!-- default -->
<a class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900" href="#">
  Dashboard
</a>

<!-- active -->
<a class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-white bg-primary-800" href="#">
  Dashboard
</a>
```

Icon sizing: `w-5 h-5`, `stroke-width="1.5"` on all nav icons, no exceptions.

---

## Fonts

`font-heading` → Sora (600/700/800), `font-sans`/`font-body` → Inter
(400–700). Loaded via Google Fonts `@import` in `src/index.css` for now —
swap for self-hosted `.woff2` files under `/public/fonts` before
production if we want to drop the external request.

Usage: `font-heading` on headings, KPI figures, and the "TITAN" wordmark
treatment; everything else inherits `font-sans`.

---

## Shadows & radius quick reference

| Token | Value | Use for |
|---|---|---|
| `shadow-sm` | subtle | resting rows, table hover |
| `shadow-card` | default | standard/hero cards |
| `shadow-card-hover` | lift | hover state on clickable cards |
| `shadow-modal` | deep | centered modals |
| `shadow-panel` | side-anchored | slide-over panels |
| `shadow-glow` | gold halo | streak/certificate/achievement cards |
| `rounded-sm` / `md` | 8–10px | inputs, buttons, table cells |
| `rounded-lg` | 14px | standard cards |
| `rounded-xl` / `2xl` | 20–28px | hero banners, celebratory cards |
| `rounded-pill` | full | badges, avatars, streak pills |

---

## What's not in scope here

Form field styles, tables, skeleton loaders, and the quiz-taking flow's
timer/progress components aren't documented yet — add them here the same
way once those pages get built.

---

## Modal

Centered overlay modal (`components/Modal.jsx`) — the shared shell used by
Assignment Info / Submit Assignment and any future dialog. **Goes
full-width, bottom-sheet style on mobile** (`rounded-t-xl`, no side
margin) and a centered card from `sm:` up (`sm:max-w-lg sm:rounded-lg`).
Backdrop click and the header's `X` both close it.

```jsx
<Modal open={isOpen} onClose={handleClose} title="Submit Assignment" footer={<>...buttons...</>}>
  {/* body content, scrolls internally if tall */}
</Modal>
```

Use the same header/body/footer structure for every modal — don't
hand-roll a one-off overlay.

## Responsive rules (standing, applies to every page)

- **Sidebar**: fixed 260px, always visible at `lg:` (1024px) and up.
  Below that it's a fixed drawer (`Sidebar` takes `open`/`onClose` props),
  triggered by the hamburger button in `TopBar`, with a click-to-close
  backdrop. `StudentLayout` owns the `sidebarOpen` state and auto-closes
  it on route change.
- **Stat card rows**: `grid-cols-2 lg:grid-cols-4` — 2-up on mobile/tablet,
  4-up at desktop. Use the shared `StatCard`/`StatCardSkeleton` from
  `components/StatCard.jsx`, don't redefine them per page.
- **Tables**: render two variants — a `sm:hidden` stacked-card layout for
  mobile, and a `hidden sm:block` table (wrapped in `overflow-x-auto` with
  a `min-w-[...]` inner container) for tablet/desktop. See
  `AttendancePage`/`AssignmentPage` for the pattern. Keep both variants'
  interactive elements in sync (same action buttons, same data) since
  only one is visible at a time via CSS, not conditional rendering.
- **Modals**: always via the shared `Modal` component above — full-width
  on mobile is automatic, don't override it per modal.
- Verify every page at **375px / 768px / 1440px** with Playwright before
  calling it done.
