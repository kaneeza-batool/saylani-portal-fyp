// Trainer-portal-local copy of ../../components/formFieldStyles.js — kept
// separate so its focus ring can use the trainer portal's accent
// (navy-800 in light mode, a lighter blue in dark mode via
// --trainer-blue) without changing the shared gold-focused version
// super-admin's form modals still rely on.
//
// Uses the arbitrary-value bracket syntax (var(--trainer-blue)) instead
// of a `trainer-blue` Tailwind color-token class — a newly added
// tailwind.config.js color key didn't reliably show up without a dev
// server restart, whereas an inline var() reference is picked up by
// Tailwind's content scan immediately.
export const inputClass =
  'border border-neutral-200 rounded px-3 py-[10px] text-body-sm font-sans outline-none focus:border-[var(--trainer-blue)] transition-colors';
export const labelClass = 'text-caption font-semibold text-neutral-600';
