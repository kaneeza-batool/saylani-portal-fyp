export default function PlaceholderPage({ title }) {
  return (
    <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-2">
      <div className="font-heading font-bold text-h6 text-neutral-900">{title}</div>
      <div className="text-body-sm text-neutral-400">This view hasn't been built yet.</div>
    </div>
  );
}
