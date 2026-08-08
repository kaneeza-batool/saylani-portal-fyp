# TITAN Super Admin — Component Reference

Class combinations extracted from the exported design file
`TITAN Super Admin Portal.html`. Every combination below pairs with the
custom tokens in [`tailwind.config.js`](../../tailwind.config.js) — no
class here relies on Tailwind's stock palette, and every padding/gap/size
is the exact pixel value found in the source (spelled out as an arbitrary
value, e.g. `py-[7px]`, wherever it doesn't land on Tailwind's default
0.25rem scale).

Where the source file didn't define something (noted per-section), the
suggestion is marked **(not in source)** rather than presented as if it
were extracted.

---

## Buttons

**Primary** — filled brand green, one per view/modal (e.g. "Add student", "Save")

```html
<button class="inline-flex items-center gap-2 rounded px-4 py-[10px] text-body font-semibold bg-primary-500 text-white transition-colors hover:bg-primary-600">
  Add student
</button>
```

**Primary — small/inline** — same fill, tighter padding (e.g. "Approve" in the approvals queue)

```html
<button class="inline-flex items-center gap-2 rounded px-3 py-[7px] text-caption font-semibold bg-primary-500 text-white transition-colors hover:bg-primary-600">
  Approve
</button>
```

**Secondary — neutral outline** — bordered, for "Cancel" / dismiss actions

```html
<button class="inline-flex items-center gap-2 rounded px-4 py-[10px] text-body font-semibold bg-white text-neutral-600 border border-neutral-200 transition-colors hover:bg-neutral-100">
  Cancel
</button>
```
> Hover fill **(not in source)** — the Cancel button in the file has no `style-hover`. `hover:bg-neutral-100` is added here only for consistency with the other neutral-bordered controls below (icon buttons use exactly this hover).

**Secondary — danger outline** — bordered, for destructive inline actions (e.g. "Reject")

```html
<button class="inline-flex items-center gap-2 rounded px-3 py-[7px] text-caption font-semibold bg-white text-danger-600 border border-danger-200 transition-colors hover:bg-danger-50">
  Reject
</button>
```

**Icon button** — 30×30, square controls (row edit, panel close)

```html
<button class="w-[30px] h-[30px] flex items-center justify-center rounded-sm bg-white border border-neutral-200 transition-colors hover:bg-neutral-100">
  <!-- icon -->
</button>
```
Panel-close variant drops the border and sits directly on the filled neutral-100 background:
```html
<button class="w-[30px] h-[30px] flex items-center justify-center rounded-sm bg-neutral-100">
  <!-- icon -->
</button>
```

Never hand-roll a fourth button color — the two "secondary" variants above (neutral vs. danger outline) are the only bordered pattern the file uses; swap the color pair, not the shape.

---

## Card

One shared shell — `bg-white`, `border-neutral-200`, `rounded-xl` (16px) — used for KPI cards, chart panels, and table/list containers alike. Only the padding and hover behavior change per context.

**KPI card** (interactive, lifts on hover)

```html
<div class="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-card">
  <!-- content -->
</div>
```

**Panel/chart card** (static, no hover lift)

```html
<div class="bg-white border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3.5">
  <!-- content -->
</div>
```

**Table/list container** (no padding — rows carry their own)

```html
<div class="bg-white border border-neutral-200 rounded-xl overflow-hidden">
  <!-- header row, then rows each with their own border-b border-neutral-200 px-[18px] py-[13px] -->
</div>
```

---

## Badges / status pills

The file drives every status pill — student status, payment status, quiz status, and approval-resolution badges — off the same four bg/text pairs (`STATUS_STYLE`, `PAYMENT_STYLE`, and matching inline ternaries elsewhere). Swap the pair; never introduce a fifth color.

```html
<span class="inline-flex items-center rounded-pill px-2.5 py-1 text-badge bg-{state}-bg text-{state}-text">
  Label
</span>
```

| Meaning | Classes | Used for |
|---|---|---|
| Success | `bg-success-bg text-success-text` | Completed, Paid, Approved |
| Warning | `bg-warning-bg text-warning-text` | Pending (status or payment), Scheduled quiz |
| Danger | `bg-danger-50 text-danger-600` | Dropout, Overdue, Rejected |
| Info | `bg-info-bg text-info-text` | Enrolled, Live quiz |

**Delta chip** — smaller pill for KPI deltas ("+3.2%"), same color pairs, tighter padding:

```html
<span class="inline-flex items-center rounded-pill px-2 py-0.5 text-badge bg-success-bg text-success-text">
  +3.2%
</span>
```

---

## Sidebar nav item

Fixed dark chrome (`chrome-*` tokens) — this sidebar does not re-theme in light/dark mode, it's always the dark surface.

```html
<div class="flex items-center gap-[11px] rounded px-3 py-[9px] text-body font-medium text-chrome-text cursor-pointer transition-colors duration-150 hover:bg-chrome-hover hover:text-chrome-text-hover">
  <span class="w-[18px] h-[18px] flex items-center justify-center shrink-0"><!-- icon --></span>
  Dashboard
</div>
```

**Section label** (group heading above a set of nav items, e.g. "Overview")

```html
<div class="text-overline text-neutral-500 px-3">
  Overview
</div>
```

> **No active/current-page state in source** — the file only styles the default and `:hover` states of a nav item; there's no visual distinction for "you are here." If you add one, `bg-chrome-hover text-chrome-text-hover` (the hover treatment, held permanently) is the closest fit already in the palette — but that's an addition, not something pulled from the export.
