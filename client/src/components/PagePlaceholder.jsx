export default function PagePlaceholder({ title }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-16 flex flex-col items-center justify-center text-center">
      <h2 className="font-heading text-xl font-bold text-neutral-900">{title}</h2>
      <p className="text-sm text-neutral-500 mt-1">Page content coming soon.</p>
    </div>
  );
}
