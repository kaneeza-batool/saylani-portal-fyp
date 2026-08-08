# TITAN Component Reference

Copy-paste Tailwind class combinations extracted from the TITAN design
system (foundation doc, Super Admin dashboard, Student dashboard). Pair
with `tailwind.config.js` in this repo — every class below resolves through
that config, nothing here relies on Tailwind's stock palette.

Two sidebar chrome variants exist by design: **dark chrome** for
operational screens (Super Admin, Trainer) and **light chrome** for
personal screens (Student). Pick the one matching the surface you're
building, not by preference.

---

## Buttons

Base shape is shared; variant classes carry the color. All three include
their own `hover:` and `disabled:` states — nothing else to add.

**Primary** — the one filled action per view (e.g. "Enrol now", "Submit")

```html
<button class="inline-flex items-center gap-2 rounded-md px-4.5 py-[11px] text-body-sm font-semibold bg-primary-800 text-neutral-50 transition-colors hover:bg-primary-900 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-800 disabled:hover:shadow-none">
  Enrol now
</button>
```

**Secondary** — bordered, for the next-most-important action

```html
<button class="inline-flex items-center gap-2 rounded-md px-4.5 py-[11px] text-body-sm font-semibold bg-white text-neutral-900 border border-neutral-300 transition-colors hover:bg-neutral-100 hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-neutral-300">
  View syllabus
</button>
```

**Ghost** — lowest emphasis, dismissive actions ("Cancel", "Skip for now")

```html
<button class="inline-flex items-center gap-2 rounded-md px-4.5 py-[11px] text-body-sm font-semibold bg-transparent text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
  Skip for now
</button>
```

Never hand-roll a fourth button color. A destructive action is the
**ghost** button with `text-danger-600 hover:bg-danger-100 hover:text-danger-600`
substituted in — not a new variant.

---

## Card

The one card shell used everywhere — KPI cards, course cards, list
containers. Compose padding/gap on top of it; don't change the base three
(surface, border, radius).

```html
<div class="bg-white border border-neutral-200 rounded-lg p-5.5">
  <!-- content -->
</div>
```

Card header pattern (title + optional trailing action), used inside the
shell above:

```html
<div class="flex items-baseline justify-between gap-3 mb-4">
  <div>
    <h2 class="text-h6 font-heading">Card title</h2>
    <p class="text-body-sm text-neutral-500 mt-0.5">Optional subcopy</p>
  </div>
  <a href="#" class="text-body-sm font-semibold text-primary-500">View all</a>
</div>
```

Dark surfaces (e.g. the Super Admin chrome) use `bg-chrome-bg` instead of
`bg-white` — see **Sidebar nav item** below for the full dark-chrome token set.

---

## Badges / status pills

One base shape, five color pairs. The leading dot is part of the base
class (`before:`), not something you add per instance.

**Base** (combine with exactly one status suffix below):

```
inline-flex items-center gap-1.5 rounded-pill px-[11px] py-1.5 text-[0.75rem] font-semibold before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current
```

| Status | Add these classes | Use for |
|---|---|---|
| Success | `bg-success-100 text-success-500` | Enrolled, Approved, Present |
| Warning | `bg-warning-100 text-warning-600` | Pending, Fee due, At risk |
| Danger | `bg-danger-100 text-danger-600` | Not approved, Absent |
| Info | `bg-info-100 text-info-600` | System notices, Beta |
| Neutral | `bg-neutral-100 text-neutral-500` | Draft, Not submitted |

Full example:

```html
<span class="inline-flex items-center gap-1.5 rounded-pill px-[11px] py-1.5 text-[0.75rem] font-semibold before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current bg-success-100 text-success-500">
  Enrolled
</span>
```

The accent color (`accent-*`) is **never** a badge color — gold means
"earned," not "warning." Reach for `warning-*` even though it's the same
hue family.

---

## Sidebar nav item

### Dark chrome — Super Admin / Trainer (operational)

Sidebar container: `bg-chrome-bg` (fixed dark — does **not** respond to
the light/dark toggle; it's a deliberate chrome choice, not a theme state).

```html
<!-- default -->
<a class="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[0.8125rem] font-medium text-chrome-text border-l-2 border-transparent hover:bg-chrome-bg-hover hover:text-white" href="#">
  Dashboard
</a>

<!-- active -->
<a class="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[0.8125rem] font-semibold text-white bg-chrome-bg-active border-l-2 border-chrome-gold" href="#">
  Dashboard
</a>
```

### Light chrome — Student (personal)

Sidebar container: `bg-neutral-100` — this one *does* follow the
light/dark toggle along with the rest of the page.

```html
<!-- default -->
<a class="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[0.8438rem] font-medium text-neutral-500 hover:bg-white hover:text-neutral-900" href="#">
  Dashboard
</a>

<!-- active -->
<a class="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[0.8438rem] font-semibold text-neutral-50 bg-primary-800" href="#">
  Dashboard
</a>
```

Both variants use the same icon sizing — `w-4 h-4` (dark chrome) — and
`stroke-width="1.3"` on all nav icons, no exceptions.

---

## Fonts

`heading` → Cabinet Grotesk (700/800/900), `body`/`sans` → General Sans
(400/500/600). Both are Fontshare families — self-host the `.woff2` files
under `/public/fonts` and register them with `@font-face` in your global
stylesheet; don't link Fontshare's CDN CSS directly (adds a render-blocking
request and an external dependency for something this small). Typical
usage: `font-heading` on headings/KPI figures, everything else inherits
`font-sans`.

---

## Dark mode

The three source artifacts drive dark mode from CSS variables that swap
under `[data-theme="dark"]` (and `prefers-color-scheme` as a fallback) —
brighter green/gold on dark surfaces, never a flat invert. Tailwind's
static hex classes can't reproduce that swap on their own, so pair the
config with a small variables layer in your global CSS:

```css
:root {
  --tw-primary-800: #0E3B2E;
  --tw-primary-500: #1F7A5C;
  --tw-accent-600: #B9781A;
  --tw-accent-500: #E0A63A;
}
[data-theme='dark'] {
  --tw-primary-800: #2E9A73;
  --tw-primary-500: #3FB588;
  --tw-accent-600: #E0993B;
  --tw-accent-500: #F0B94E;
}
```

then reference the variable from an arbitrary-value utility where a token
needs to react to theme, e.g. `bg-[var(--tw-primary-800)]`. Reserve this
for the handful of surfaces that actually flip (primary/accent, and
`neutral-50`↔`neutral-900` for page background/text) — most of the
UI (badges, danger/info) keeps the same literal shade in both themes, so
leave those as plain `bg-danger-100` etc.

---

## What's not in scope here

Inputs, dropdowns, tables, KPI/stat cards, modals, toasts, and the
avatar+role combo all exist in the foundation design system artifact with
the same level of state detail (default/hover/focus/error/disabled) — they
just weren't part of this request. Pull them the same way if/when needed:
inspect the artifact's `<style>` block and translate each rule the way
this document does.
